import type { GameMeta, GameState } from "../../types/game";

// Pluggable persistence layer. v1 uses LocalStorageAdapter; a SupabaseAdapter
// can be added later without touching the store or UI.
export interface PersistenceAdapter {
  list(): Promise<GameMeta[]>;
  load(gameId: string): Promise<GameState | null>;
  save(state: GameState): Promise<void>;
  remove(gameId: string): Promise<void>;
  // Optional: realtime sync hook for the future cloud adapter.
  subscribe?(
    gameId: string,
    callback: (state: GameState) => void
  ): () => void;
}
