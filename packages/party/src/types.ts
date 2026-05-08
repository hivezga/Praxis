/**
 * Wire protocol for party-mode peer connections.
 *
 * Peers receive `state` snapshots from the host whenever the host applies a mutation.
 * MVP is broadcast-only: peers are read-only observers. Mutation-request handling
 * (peer → host) is reserved for a follow-up.
 */

export type RoomCode = string;

export interface PartyMessage {
  type: "state";
  payload: unknown;
  ts: number;
}

export interface RoomHostStatus {
  code: RoomCode;
  peerCount: number;
}

export interface RoomPeerStatus {
  code: RoomCode;
  connected: boolean;
}
