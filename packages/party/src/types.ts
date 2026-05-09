/**
 * Wire protocol for party-mode peer connections.
 *
 * The transport layer (`RoomHost` / `RoomPeer`) is intentionally generic — it
 * carries opaque envelopes and lets the consumer decide how to interpret
 * payloads. The shared message types below are advisory: hosts and peers in the
 * Praxis app use them, but other consumers could swap in their own.
 *
 * Mutations cross the wire as opaque `unknown` payloads; the app layer applies
 * the WASM-typed shape on receipt. This keeps the transport package free of
 * any dependency on game-state types.
 */

export type RoomCode = string;

export type PartyMessageType =
  | "state"
  | "full_state"
  | "lobby"
  | "host_leaving"
  | "hello"
  | "select_faction"
  | "start_game"
  | "mutation_request";

export interface PartyEnvelope<T extends PartyMessageType = PartyMessageType, P = unknown> {
  type: T;
  payload?: P;
  ts: number;
}

export type PartyMessage = PartyEnvelope<PartyMessageType, unknown>;

export interface HelloPayload {
  name?: string;
  faction?: string | null;
}

export interface LobbyPlayer {
  peerId: string;
  isHost: boolean;
  name?: string;
  faction: string | null;
}

export interface LobbySnapshot {
  code: RoomCode;
  hostPeerId: string;
  started: boolean;
  players: LobbyPlayer[];
}

export interface RoomHostStatus {
  code: RoomCode;
  peerCount: number;
  peerIds: string[];
}

export type RoomPeerConnectionState = "connecting" | "connected" | "reconnecting" | "disconnected";

export interface RoomPeerStatus {
  code: RoomCode;
  state: RoomPeerConnectionState;
  attempts: number;
}
