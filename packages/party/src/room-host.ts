import type { DataConnection, Peer } from "peerjs";

import { makeRoomCode, peerIdFromCode } from "./room-code";
import type { PartyMessage, RoomCode, RoomHostStatus } from "./types";

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
      this.connections.set(conn.peer, conn);
      // Send the current lobby + latest state so the new peer is in sync.
      if (this.latestLobby) this.sendTo(conn, this.latestLobby);
      if (this.latestState) this.sendTo(conn, this.latestState);
      for (const cb of this.connectionListeners) cb(conn.peer, "open");
      this.notifyStatus();
    });
    conn.on("data", (data) => {
      const msg = data as PartyMessage | null;
      if (!msg || typeof msg.type !== "string") return;
      for (const cb of this.messageListeners) cb(conn.peer, msg);
    });
    conn.on("close", () => {
      this.connections.delete(conn.peer);
      for (const cb of this.connectionListeners) cb(conn.peer, "close");
      this.notifyStatus();
    });
    conn.on("error", () => {
      this.connections.delete(conn.peer);
      for (const cb of this.connectionListeners) cb(conn.peer, "close");
      this.notifyStatus();
    });
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
    this.peer.destroy();
    this.statusListeners.clear();
    this.messageListeners.clear();
    this.connectionListeners.clear();
  }
}
