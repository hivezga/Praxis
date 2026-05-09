import type { GameMeta, GameState } from "../types/game";

export interface PersistenceAdapter {
  list(): Promise<GameMeta[]>;
  load(gameId: string): Promise<GameState | null>;
  save(state: GameState): Promise<void>;
  remove(gameId: string): Promise<void>;
}
