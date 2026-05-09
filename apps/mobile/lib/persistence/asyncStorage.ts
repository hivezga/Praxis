import AsyncStorage from "@react-native-async-storage/async-storage";
import type { GameMeta, GameState } from "../types/game";
import type { PersistenceAdapter } from "./adapter";

const PREFIX = "praxis.game.";
const INDEX_KEY = "praxis.index";

async function readIndex(): Promise<GameMeta[]> {
  const raw = await AsyncStorage.getItem(INDEX_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as GameMeta[];
  } catch {
    return [];
  }
}

async function writeIndex(metas: GameMeta[]): Promise<void> {
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(metas));
}

export const asyncStorageAdapter: PersistenceAdapter = {
  async list() {
    const metas = await readIndex();
    return metas.sort((a, b) => b.updatedAt - a.updatedAt);
  },

  async load(gameId) {
    const raw = await AsyncStorage.getItem(PREFIX + gameId);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as GameState;
    } catch {
      return null;
    }
  },

  async save(state) {
    const updated: GameState = {
      ...state,
      meta: { ...state.meta, updatedAt: Date.now() },
    };
    await AsyncStorage.setItem(PREFIX + state.meta.id, JSON.stringify(updated));
    const metas = (await readIndex()).filter((m) => m.id !== state.meta.id);
    metas.push(updated.meta);
    await writeIndex(metas);
  },

  async remove(gameId) {
    await AsyncStorage.removeItem(PREFIX + gameId);
    await writeIndex((await readIndex()).filter((m) => m.id !== gameId));
  },
};
