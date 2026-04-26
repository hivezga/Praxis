import type { GameMeta, GameState } from "../../types/game";
import type { PersistenceAdapter } from "./adapter";

const PREFIX = "praxis.game.";
const INDEX_KEY = "praxis.index";

function isBrowser(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

function readIndex(): GameMeta[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(INDEX_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as GameMeta[];
  } catch {
    return [];
  }
}

function writeIndex(metas: GameMeta[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(INDEX_KEY, JSON.stringify(metas));
}

export const localStorageAdapter: PersistenceAdapter = {
  async list() {
    return readIndex().sort((a, b) => b.updatedAt - a.updatedAt);
  },

  async load(gameId) {
    if (!isBrowser()) return null;
    const raw = window.localStorage.getItem(PREFIX + gameId);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as GameState;
    } catch {
      return null;
    }
  },

  async save(state) {
    if (!isBrowser()) return;
    const updated: GameState = {
      ...state,
      meta: { ...state.meta, updatedAt: Date.now() },
    };
    window.localStorage.setItem(PREFIX + state.meta.id, JSON.stringify(updated));
    const metas = readIndex().filter((m) => m.id !== state.meta.id);
    metas.push(updated.meta);
    writeIndex(metas);
  },

  async remove(gameId) {
    if (!isBrowser()) return;
    window.localStorage.removeItem(PREFIX + gameId);
    writeIndex(readIndex().filter((m) => m.id !== gameId));
  },
};
