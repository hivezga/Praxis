import type { DataConnection, Peer } from "peerjs";

import { isValidRoomCode, peerIdFromCode } from "./room-code";
import type { PartyMessage, RoomCode, RoomPeerStatus } from "./types";

/**
 * Connects to a host identified by a 6-character room code. Receives state
 * snapshots and forwards them to the consumer via `onState`.
 */
export class RoomPeer {
  readonly code: RoomCode;
  private peer: Peer;
  private conn: DataConnection;
  private stateListeners = new Set<(payload: unknown) => void>();
  private statusListeners = new Set<(s: RoomPeerStatus) => void>();
  private connected = false;

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

    await new Promise<void>((resolve, reject) => {
      const onOpen = () => {
        conn.off("open", onOpen);
        conn.off("error", onError);
        resolve();
      };
      const onError = (err: Error) => {
        conn.off("open", onOpen);
        conn.off("error", onError);
        reject(err);
      };
      const t = setTimeout(() => onError(new Error("Could not reach host. Check the code or your connection.")), 8000);
      conn.on("open", () => {
        clearTimeout(t);
        onOpen();
      });
      conn.on("error", (err) => {
        clearTimeout(t);
        onError(err);
      });
    });

    const inst = new RoomPeer(peer, conn, upper);
    inst.connected = true;
    inst.notifyStatus();

    conn.on("data", (data) => {
      const msg = data as PartyMessage;
      if (msg?.type === "state") {
        for (const cb of inst.stateListeners) cb(msg.payload);
      }
    });
    conn.on("close", () => {
      inst.connected = false;
      inst.notifyStatus();
    });
    conn.on("error", () => {
      inst.connected = false;
      inst.notifyStatus();
    });

    return inst;
  }

  onState(cb: (payload: unknown) => void) {
    this.stateListeners.add(cb);
    return () => {
      this.stateListeners.delete(cb);
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
    return { code: this.code, connected: this.connected };
  }

  private notifyStatus() {
    const s = this.status();
    for (const cb of this.statusListeners) cb(s);
  }

  destroy() {
    this.conn.close();
    this.peer.destroy();
    this.stateListeners.clear();
    this.statusListeners.clear();
  }
}
