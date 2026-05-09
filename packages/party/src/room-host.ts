import type { DataConnection, Peer } from "peerjs";

import { RateLimiter } from "./rate-limiter";
import { makeRoomCode, peerIdFromCode } from "./room-code";
import type { PartyMessage, RoomCode, RoomHostStatus } from "./types";

/** Hard cap on inbound message size — generous for any real Mutation payload. */
export const MAX_MESSAGE_BYTES = 32_768;
/** Max simultaneous peers (Hegemony has 4 factions; cap leaves slack for spectators). */
export const MAX_PEERS = 8;
/** Token-bucket: 20 msg/sec sustained, 40-msg burst. */
const RATE_BURST = 40;
const RATE_REFILL_PER_SEC = 20;
/** Drop the connection after this many consecutive rate-limit hits. */
const MAX_RATE_VIOLATIONS = 3;

/**
 * Owns a PeerJS Peer instance bound to the namespaced ID derived from a
 * generated room code. Tracks peer connections, rebroadcasts state snapshots,
 * and surfaces inbound messages from peers (mutation requests, faction picks).
 */
export class RoomHost {
  readonly code: RoomCode;
  private peer: Peer;
  private connections = new Map<string, DataConnection>();
  private statusListeners = new Set<(s: RoomHostStatus) => void>();
  private messageListeners = new Set<(peerId: string, msg: PartyMessage) => void>();
  private connectionListeners = new Set<(peerId: string, kind: "open" | "close") => void>();
  private latestState: PartyMessage | null = null;
  private latestLobby: PartyMessage | null = null;
  private destroyed = false;
  private rateLimiter = new RateLimiter({
    burst: RATE_BURST,
    refillPerSecond: RATE_REFILL_PER_SEC,
  });
  private rateViolations = new Map<string, number>();

  private constructor(peer: Peer, code: RoomCode) {
    this.peer = peer;
    this.code = code;
  }

  static async create(): Promise<RoomHost> {
    const { default: PeerCtor } = await import("peerjs");
    const code = makeRoomCode();
    const id = peerIdFromCode(code);
    const peer = new PeerCtor(id);

    await new Promise<void>((resolve, reject) => {
      const onOpen = () => {
        peer.off("open", onOpen);
        peer.off("error", onError);
        resolve();
      };
      const onError = (err: Error) => {
        peer.off("open", onOpen);
        peer.off("error", onError);
        reject(err);
      };
      peer.on("open", onOpen);
      peer.on("error", onError);
    });

    const host = new RoomHost(peer, code);
    peer.on("connection", (conn) => host.attach(conn));
    return host;
  }

  private attach(conn: DataConnection) {
    conn.on("open", () => {
      // Reject new peers above MAX_PEERS — host's tab can't shoulder unbounded
      // connections, and any Hegemony game tops out well below the cap.
      if (this.connections.size >= MAX_PEERS) {
        try {
          conn.close();
        } catch {
          /* ignore */
        }
        return;
      }
      this.connections.set(conn.peer, conn);
      // Send the current lobby + latest state so the new peer is in sync.
      if (this.latestLobby) this.sendTo(conn, this.latestLobby);
      if (this.latestState) this.sendTo(conn, this.latestState);
      for (const cb of this.connectionListeners) cb(conn.peer, "open");
      this.notifyStatus();
    });
    conn.on("data", (data) => {
      // Payload size cap: serialise to estimate, drop if oversize.
      try {
        const size = JSON.stringify(data ?? "").length;
        if (size > MAX_MESSAGE_BYTES) {
          this.dropPeer(conn, "payload-too-large");
          return;
        }
      } catch {
        this.dropPeer(conn, "unserializable-payload");
        return;
      }
      // Token-bucket rate limit: drop overflow, close after MAX_RATE_VIOLATIONS.
      if (!this.rateLimiter.tryConsume(conn.peer)) {
        const next = (this.rateViolations.get(conn.peer) ?? 0) + 1;
        this.rateViolations.set(conn.peer, next);
        if (next >= MAX_RATE_VIOLATIONS) {
          this.dropPeer(conn, "rate-limit-exceeded");
        }
        return;
      }
      this.rateViolations.delete(conn.peer);

      const msg = data as PartyMessage | null;
      if (!msg || typeof msg.type !== "string") return;
      for (const cb of this.messageListeners) cb(conn.peer, msg);
    });
    conn.on("close", () => {
      this.connections.delete(conn.peer);
      this.rateLimiter.reset(conn.peer);
      this.rateViolations.delete(conn.peer);
      for (const cb of this.connectionListeners) cb(conn.peer, "close");
      this.notifyStatus();
    });
    conn.on("error", () => {
      this.connections.delete(conn.peer);
      this.rateLimiter.reset(conn.peer);
      this.rateViolations.delete(conn.peer);
      for (const cb of this.connectionListeners) cb(conn.peer, "close");
      this.notifyStatus();
    });
  }

  private dropPeer(conn: DataConnection, _reason: string): void {
    try {
      conn.close();
    } catch {
      /* ignore */
    }
    this.connections.delete(conn.peer);
    this.rateLimiter.reset(conn.peer);
    this.rateViolations.delete(conn.peer);
    for (const cb of this.connectionListeners) cb(conn.peer, "close");
    this.notifyStatus();
  }

  /** Broadcast a fresh state snapshot to every peer. */
  broadcastState(payload: unknown) {
    const msg: PartyMessage = { type: "state", payload, ts: Date.now() };
    this.latestState = msg;
    this.broadcast(msg);
  }

  /** Broadcast a lobby snapshot. Cached and replayed to fresh joiners. */
  broadcastLobby(payload: unknown) {
    const msg: PartyMessage = { type: "lobby", payload, ts: Date.now() };
    this.latestLobby = msg;
    this.broadcast(msg);
  }

  /** Send a free-form envelope to all peers. */
  broadcast(msg: PartyMessage) {
    for (const conn of this.connections.values()) {
      this.sendTo(conn, msg);
    }
  }

  /** Send a free-form envelope to a single peer. */
  sendToPeer(peerId: string, msg: PartyMessage) {
    const conn = this.connections.get(peerId);
    if (conn) this.sendTo(conn, msg);
  }

  private sendTo(conn: DataConnection, msg: PartyMessage) {
    try {
      conn.send(msg);
    } catch {
      // Drop silently — connection cleaned up on close/error.
    }
  }

  onStatus(cb: (s: RoomHostStatus) => void) {
    this.statusListeners.add(cb);
    cb(this.status());
    return () => {
      this.statusListeners.delete(cb);
    };
  }

  onMessage(cb: (peerId: string, msg: PartyMessage) => void) {
    this.messageListeners.add(cb);
    return () => {
      this.messageListeners.delete(cb);
    };
  }

  onConnection(cb: (peerId: string, kind: "open" | "close") => void) {
    this.connectionListeners.add(cb);
    return () => {
      this.connectionListeners.delete(cb);
    };
  }

  /** Underlying PeerJS ID for the host — used as the lobby's host_peer_id. */
  get hostPeerId(): string {
    return this.peer.id;
  }

  status(): RoomHostStatus {
    return {
      code: this.code,
      peerCount: this.connections.size,
      peerIds: Array.from(this.connections.keys()),
    };
  }

  private notifyStatus() {
    const s = this.status();
    for (const cb of this.statusListeners) cb(s);
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    // Politely tell peers we're leaving so they can promote.
    const farewell: PartyMessage = { type: "host_leaving", ts: Date.now() };
    this.broadcast(farewell);
    for (const conn of this.connections.values()) conn.close();
    this.connections.clear();
    this.rateLimiter.clear();
    this.rateViolations.clear();
    this.peer.destroy();
    this.statusListeners.clear();
    this.messageListeners.clear();
    this.connectionListeners.clear();
  }
}
