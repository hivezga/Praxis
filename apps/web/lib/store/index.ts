"use client";

import { create } from "zustand";

import { wasm } from "@/lib/wasm";
import { localStorageAdapter } from "./persistence/localStorage";
import type { PersistenceAdapter } from "./persistence/adapter";
import type {
  Bill,
  ClassId,
  GameState,
  Phase,
  PolicyId,
  PolicySection,
} from "../types/game";
import type { Mutation } from "../types/mutations";

let adapter: PersistenceAdapter = localStorageAdapter;
export function setPersistenceAdapter(next: PersistenceAdapter): void {
  adapter = next;
}

// Path → Mutation mapping for the adjustClassNumber / setClassNumber helpers.
function classPathToMutation(classId: ClassId, path: string, delta: number): Mutation {
  switch (path) {
    case "money":
      if (classId === "capitalist") return { type: "adjustRevenue", delta };
      if (classId === "state") return { type: "adjustTreasury", delta };
      return { type: "adjustMoney", classId, delta };
    case "revenue": return { type: "adjustRevenue", delta };
    case "treasury": return { type: "adjustTreasury", delta };
    case "capital": return { type: "adjustCapital", classId, delta };
    case "vp": return { type: "adjustVp", classId, delta };
    case "prosperity": return { type: "adjustProsperity", classId, delta };
    case "population": return { type: "adjustPopulation", classId, delta };
    case "loans": return { type: "adjustLoans", classId, delta };
    case "unemployedWorkers": return { type: "adjustUnemployedWorkers", classId, delta };
    case "unemployedSkilledWorkers": return { type: "adjustSkilledWorkers", classId, delta };
    case "votingCubesInBag": return { type: "adjustVotingCubes", classId, delta };
    case "billMarkersAvailable": return { type: "adjustBillMarkers", classId, delta };
    case "handSize": return { type: "adjustHandSize", classId, delta };
    case "savings": return { type: "adjustSavings", delta };
    default:
      throw new Error(`No WASM mutation for ${classId}.${path}`);
  }
}

// Reads a value from a nested object using dot notation, e.g. "storage.food".
function getByPath(obj: Record<string, unknown>, path: string): unknown {
  const segments = path.split(".");
  let cursor: unknown = obj;
  for (const key of segments) {
    if (typeof cursor !== "object" || cursor === null) return undefined;
    cursor = (cursor as Record<string, unknown>)[key];
  }
  return cursor;
}

function persist(state: GameState | null): void {
  if (!state) return;
  void adapter.save(state);
}

interface GameStore {
  state: GameState | null;
  loading: boolean;
  error: string | null;

  load(gameId: string): Promise<void>;
  hydrate(state: GameState): void;
  clear(): void;

  apply(mutation: Mutation, label?: string): void;

  setPolicy(policyId: PolicyId, position: PolicySection): void;
  advancePhase(): void;
  setPhase(phase: Phase): void;
  setRound(round: 1 | 2 | 3 | 4 | 5): void;

  proposeBill(bill: Omit<Bill, "id">): void;
  removeBill(id: string): void;

  adjustClassNumber(classId: ClassId, path: string, delta: number): void;
  setClassNumber(classId: ClassId, path: string, value: number): void;
  setClassString(classId: ClassId, path: string, value: string): void;

  undo(): void;
}

export const useGame = create<GameStore>((set, get) => ({
  state: null,
  loading: false,
  error: null,

  async load(gameId) {
    set({ loading: true, error: null });
    try {
      const loaded = await adapter.load(gameId);
      set({ state: loaded, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  hydrate(state) {
    set({ state });
    persist(state);
  },

  clear() {
    set({ state: null });
  },

  apply(mutation, label = "") {
    const current = get().state;
    if (!current) return;
    const next = wasm().apply_mutation_wasm(current, mutation, label) as GameState;
    next.meta.updatedAt = Date.now();
    set({ state: next });
    persist(next);
  },

  setPolicy(policyId, position) {
    get().apply({ type: "setPolicy", policyId, position }, `Set ${policyId} → ${position}`);
  },

  advancePhase() {
    get().apply({ type: "advancePhase" }, "Advance phase");
  },

  setPhase(phase) {
    get().apply({ type: "setPhase", phase }, `Set phase → ${phase}`);
  },

  setRound(round) {
    get().apply({ type: "setRound", round }, `Set round → ${round}`);
  },

  proposeBill(bill) {
    get().apply(
      { type: "proposeBill", ...bill },
      `Propose bill on ${bill.policyId}`,
    );
  },

  removeBill(id) {
    get().apply({ type: "removeBill", id }, "Remove bill");
  },

  adjustClassNumber(classId, path, delta) {
    const label = `${classId}.${path} ${delta >= 0 ? "+" : ""}${delta}`;
    get().apply(classPathToMutation(classId, path, delta), label);
  },

  setClassNumber(classId, path, value) {
    const current = get().state;
    if (!current) return;
    const cls = current.classes[classId] as unknown as Record<string, unknown>;
    const currentVal = (getByPath(cls, path) as number) ?? 0;
    const delta = Math.max(0, value) - currentVal;
    if (delta === 0) return;
    const label = `${classId}.${path} = ${value}`;
    get().apply(classPathToMutation(classId, path, delta), label);
  },

  setClassString(classId, path, value) {
    if (path === "notes") {
      get().apply({ type: "setNotes", classId, text: value }, `${classId}.notes`);
    }
  },

  undo() {
    const current = get().state;
    if (!current) return;
    const restored = wasm().undo_wasm(current) as GameState | null | undefined;
    if (restored == null) return;
    restored.meta.updatedAt = Date.now();
    set({ state: restored });
    persist(restored);
  },
}));

export function useGameState(): GameState | null {
  return useGame((s) => s.state);
}
