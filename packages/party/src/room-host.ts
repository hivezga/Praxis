import type { DataConnection, Peer } from "peerjs";

import { makeRoomCode, peerIdFromCode } from "./room-code";
import type { PartyMessage, RoomCode, RoomHostStatus } from "./types";

/**
 * Owns a PeerJS Peer instance bound to the namespaced ID derived from a
 * generated room code. Tracks peer connections and rebroadcasts each `state`
 * snapshot to all of them.
 */
export class RoomHost {
  readonly code: RoomCode;
  private peer: Peer;
  private connections = new Map<string, DataConnection>();
  private listeners = new Set<(s: RoomHostStatus) => void>();
  private latest: PartyMessage | null = null;

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
      // Send latest snapshot immediately so the new peer is in sync.
      if (this.latest) conn.send(this.latest);
      this.notify();
    });
    conn.on("close", () => {
      this.connections.delete(conn.peer);
      this.notify();
    });
    conn.on("error", () => {
      this.connections.delete(conn.peer);
      this.notify();
    });
  }

  /** Broadcast a fresh state snapshot to every peer. */
  broadcastState(payload: unknown) {
    const msg: PartyMessage = { type: "state", payload, ts: Date.now() };
    this.latest = msg;
    for (const conn of this.connections.values()) {
      try {
        conn.send(msg);
      } catch {
        // Drop silently — connection will be cleaned up on close/error.
      }
    }
  }

  onStatus(cb: (s: RoomHostStatus) => void) {
    this.listeners.add(cb);
    cb(this.status());
    return () => {
      this.listeners.delete(cb);
    };
  }

  status(): RoomHostStatus {
    return { code: this.code, peerCount: this.connections.size };
  }

  private notify() {
    const s = this.status();
    for (const cb of this.listeners) cb(s);
  }

  destroy() {
    for (const conn of this.connections.values()) conn.close();
    this.connections.clear();
    this.peer.destroy();
    this.listeners.clear();
  }
}
