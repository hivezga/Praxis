import type { DataConnection, Peer } from "peerjs";

import { isValidRoomCode, peerIdFromCode } from "./room-code";
import type {
  PartyMessage,
  RoomCode,
  RoomPeerConnectionState,
  RoomPeerStatus,
} from "./types";

/**
 * Connects to a host identified by a 6-character room code. Receives state
 * snapshots, lobby updates, and host_leaving signals; can send free-form
 * envelopes back to the host (mutation requests, faction picks).
 *
 * Auto-reconnects with exponential backoff (1s → 2s → 4s → 8s → 16s, capped
 * at 30s) for up to 8 attempts. The peer reports its connection state so the
 * UI can surface "Reconnecting…" banners and host-disconnect modals.
 */
const RECONNECT_DELAYS_MS = [1000, 2000, 4000, 8000, 16000, 30000, 30000, 30000];

export class RoomPeer {
  readonly code: RoomCode;
  private peer: Peer;
  private conn: DataConnection;
  private messageListeners = new Set<(msg: PartyMessage) => void>();
  private statusListeners = new Set<(s: RoomPeerStatus) => void>();
  private hostLeavingListeners = new Set<() => void>();
  private state: RoomPeerConnectionState = "connecting";
  private attempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  /** This peer's own peerjs id (used to look up our seat in the lobby). */
  get peerId(): string {
    return this.peer.id;
  }

  private constructor(peer: Peer, conn: DataConnection, code: RoomCode) {
    this.peer = peer;
    this.conn = conn;
    this.code = code;
  }

  static async join(code: string): Promise<RoomPeer> {
    if (!isValidRoomCode(code)) {
      throw new Error("Invalid room code.");
    }
    const upper = code.toUpperCase();
    const { default: PeerCtor } = await import("peerjs");
    const peer = new PeerCtor();

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

    const conn = peer.connect(peerIdFromCode(upper), { reliable: true });

    await openConnection(conn);

    const inst = new RoomPeer(peer, conn, upper);
    inst.state = "connected";
    inst.attempts = 0;
    inst.notifyStatus();
    inst.bindConnection(conn);
    return inst;
  }

  private bindConnection(conn: DataConnection) {
    conn.on("data", (data) => {
      const msg = data as PartyMessage | null;
      if (!msg || typeof msg.type !== "string") return;
      if (msg.type === "host_leaving") {
        for (const cb of this.hostLeavingListeners) cb();
      }
      for (const cb of this.messageListeners) cb(msg);
    });
    conn.on("close", () => this.handleDrop());
    conn.on("error", () => this.handleDrop());
  }

  private handleDrop() {
    if (this.destroyed) return;
    if (this.state === "reconnecting") return;
    this.state = "reconnecting";
    this.notifyStatus();
    this.scheduleReconnect();
  }

  private scheduleReconnect() {
    if (this.destroyed) return;
    if (this.attempts >= RECONNECT_DELAYS_MS.length) {
      this.state = "disconnected";
      this.attempts = RECONNECT_DELAYS_MS.length;
      this.notifyStatus();
      return;
    }
    const delay = RECONNECT_DELAYS_MS[this.attempts];
    this.attempts += 1;
    this.reconnectTimer = setTimeout(() => {
      void this.attemptReconnect();
    }, delay);
  }

  private async attemptReconnect() {
    if (this.destroyed) return;
    try {
      // Tear down the old conn but keep the underlying Peer if it's still alive
      // (PeerJS reuses the broker connection — no need to re-handshake).
      const stalePeer = this.peer.disconnected || this.peer.destroyed;
      if (stalePeer) {
        const { default: PeerCtor } = await import("peerjs");
        this.peer = new PeerCtor();
        await new Promise<void>((resolve, reject) => {
          const onOpen = () => {
            this.peer.off("open", onOpen);
            this.peer.off("error", onError);
            resolve();
          };
          const onError = (err: Error) => {
            this.peer.off("open", onOpen);
            this.peer.off("error", onError);
            reject(err);
          };
          this.peer.on("open", onOpen);
          this.peer.on("error", onError);
        });
      }
      const conn = this.peer.connect(peerIdFromCode(this.code), { reliable: true });
      await openConnection(conn);
      this.conn = conn;
      this.state = "connected";
      this.attempts = 0;
      this.notifyStatus();
      this.bindConnection(conn);
    } catch {
      this.scheduleReconnect();
    }
  }

  /** Send a free-form envelope to the host. Drops silently if disconnected. */
  send(msg: PartyMessage) {
    if (this.state !== "connected") return;
    try {
      this.conn.send(msg);
    } catch {
      // Drop silently — handleDrop fires via the conn 'error' event.
    }
  }

  onMessage(cb: (msg: PartyMessage) => void) {
    this.messageListeners.add(cb);
    return () => {
      this.messageListeners.delete(cb);
    };
  }

  onHostLeaving(cb: () => void) {
    this.hostLeavingListeners.add(cb);
    return () => {
      this.hostLeavingListeners.delete(cb);
    };
  }

  onStatus(cb: (s: RoomPeerStatus) => void) {
    this.statusListeners.add(cb);
    cb(this.status());
    return () => {
      this.statusListeners.delete(cb);
    };
  }

  status(): RoomPeerStatus {
    return { code: this.code, state: this.state, attempts: this.attempts };
  }

  private notifyStatus() {
    const s = this.status();
    for (const cb of this.statusListeners) cb(s);
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    try {
      this.conn.close();
    } catch {
      /* ignore */
    }
    try {
      this.peer.destroy();
    } catch {
      /* ignore */
    }
    this.messageListeners.clear();
    this.statusListeners.clear();
    this.hostLeavingListeners.clear();
  }
}

function openConnection(conn: DataConnection): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const finish = (err?: Error) => {
      conn.off("open", onOpen);
      conn.off("error", onError);
      clearTimeout(t);
      if (err) reject(err);
      else resolve();
    };
    const onOpen = () => finish();
    const onError = (err: Error) => finish(err);
    const t = setTimeout(
      () => finish(new Error("Could not reach host. Check the code or your connection.")),
      8000,
    );
    conn.on("open", onOpen);
    conn.on("error", onError);
  });
}
