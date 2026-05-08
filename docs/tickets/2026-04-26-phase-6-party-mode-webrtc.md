# [Feature] Phase 6: Party mode — real-time sync via WebRTC

## Context
Party mode allows one device per player. The host device is the source of truth; all players see each other's public resources in real time. WebRTC peer-to-peer data channels eliminate any cloud backend — the host generates a 6-character room code, peers join by entering it. PeerJS handles the signaling using Google's free STUN infrastructure.

## User story
As a group of players, I want to join a shared game lobby via a room code so that each person can track their own faction while seeing the global board and other factions' public resources on their own device.

## Acceptance criteria
- [ ] Host taps "Create Room" and receives a 6-character alphanumeric room code within 2 seconds
- [ ] A peer on a different network (not same WiFi) can join by entering the room code
- [ ] When the host applies any mutation, all connected peers receive the updated `GameState` within 500ms under normal network conditions
- [ ] Peers cannot apply mutations directly — their +/− buttons send a `Mutation` request to the host
- [ ] When a peer disconnects, remaining players see a "Player disconnected" indicator; the game continues
- [ ] When the host disconnects, all peers see a "Host disconnected" screen with a "Promote to host" option
- [ ] Reconnecting peer receives the current full `GameState` on rejoin
- [ ] Party mode works on both web and Android

## Tasks

### 6.1 — Infrastructure (`packages/party/`)
- [ ] Create `packages/party/` workspace package
- [ ] Add `peerjs` dependency
- [ ] Implement `createRoom(): Promise<{ roomCode: string; host: RoomHost }>`
- [ ] Implement `joinRoom(code: string): Promise<RoomPeer>`
- [ ] `RoomHost` class: manages peer connections, broadcasts state, receives mutation requests
- [ ] `RoomPeer` class: receives state broadcasts, sends mutation requests to host
- [ ] Implement reconnection logic: exponential backoff, rejoin on disconnect
- [ ] For React Native: use `react-native-webrtc` as the WebRTC adapter (PeerJS supports custom adapters)

### 6.2 — State sync protocol
- [ ] Host: on every `apply_mutation`, broadcast full `GameState` JSON to all connected peers
- [ ] Peer: on receiving broadcast, replace local state (read-only store mode)
- [ ] Peer mutation flow: user action → send `{ type: 'mutation', payload: Mutation }` to host → host applies → host broadcasts new state back
- [ ] Host disconnect: broadcast `{ type: 'host_leaving' }` before closing; peers show promotion UI
- [ ] Host promotion: elected peer calls `createRoom()` with the existing `GameState` as seed, shares new code with group (or re-uses same code via PeerJS room ID reassignment)
- [ ] Reconnect: on peer rejoin, host sends `{ type: 'full_state', payload: GameState }`

### 6.3 — UI
- [ ] Web: Create Room screen — large mono room code + "Copy" button + QR code (web only)
- [ ] Web/Mobile: Join Room screen — 6-char auto-advancing input (one box per char), "Join" button
- [ ] Lobby screen — list of connected players with faction icon; "Start Game" button (host only, enabled when ≥ 2 players)
- [ ] In-game connection status badge in sticky header (green dot = connected, amber = reconnecting, red = disconnected)
- [ ] Non-local faction panels: show public resources normally, hide secret fields (hand size, notes) with `HideCurtain`
- [ ] Host disconnect modal: "Host left the game. Take over as host?" with Promote / Wait buttons

## Technical notes
- PeerJS Cloud signaling (free tier) handles the initial WebRTC handshake — no server to maintain
- Google STUN servers (`stun:stun.l.google.com:19302`) are used for NAT traversal; no TURN needed for same-network play, and most consumer NATs work without TURN
- Full state broadcast (not delta) keeps the protocol simple and self-healing — a missed message is recovered on the next broadcast
- `packages/party/` must not import React — it is a pure TypeScript utility consumed by both web and mobile

## Metadata
- **Type**: Feature
- **Priority**: Medium
- **Effort**: XL (> 2 days)
- **Blocked by**: Phase 2 (web WASM integration), Phase 5 (Expo mobile app)
- **Blocks**: Phase 8 (Play Store release — party mode is a key feature)
