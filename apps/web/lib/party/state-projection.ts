import type { ClassId, GameState } from "@/lib/types/game";

/**
 * Returns the `GameState` slice that should be sent to the peer seated at
 * `faction`. Today every field is public — this returns a structural clone
 * with no redaction. The function exists so that *any* future private field
 * (hidden cards, secret votes, hidden agendas) MUST be redacted here at the
 * one host→peer broadcast site.
 *
 * Rule: when adding a new field to `GameState` that is private to a faction,
 * strip it from `next` before returning. Do not gate on a runtime opt-in —
 * defaults must redact.
 *
 * `faction === null` means the peer hasn't claimed a seat yet (still in
 * lobby); they receive the same redacted view as a spectator would.
 */
export function stateForPeer(state: GameState, _faction: ClassId | null): GameState {
  // Structural clone via JSON round-trip is safe because GameState is
  // serde-friendly (already the wire format the host sends).
  return JSON.parse(JSON.stringify(state)) as GameState;
}
