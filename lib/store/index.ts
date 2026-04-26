"use client";

import { nanoid } from "nanoid";
import { create } from "zustand";

import { localStorageAdapter } from "./persistence/localStorage";
import type { PersistenceAdapter } from "./persistence/adapter";
import type {
  Bill,
  ClassId,
  GameState,
  HistoryEntry,
  Phase,
  PolicyId,
  PolicySection,
} from "../types/game";

const HISTORY_LIMIT = 30;

let adapter: PersistenceAdapter = localStorageAdapter;
export function setPersistenceAdapter(next: PersistenceAdapter): void {
  adapter = next;
}

interface GameStore {
  state: GameState | null;
  loading: boolean;
  error: string | null;

  load(gameId: string): Promise<void>;
  hydrate(state: GameState): void;
  clear(): void;

  // Mutations — each wraps a pure update with a history snapshot + persistence.
  apply(label: string, mutator: (draft: GameState) => void): void;

  setPolicy(policyId: PolicyId, position: PolicySection): void;
  advancePhase(): void;
  setPhase(phase: Phase): void;
  setRound(round: 1 | 2 | 3 | 4 | 5): void;

  proposeBill(bill: Omit<Bill, "id">): void;
  removeBill(id: string): void;

  adjustClassNumber(
    classId: ClassId,
    path: string,
    delta: number
  ): void;
  setClassNumber(classId: ClassId, path: string, value: number): void;
  setClassString(classId: ClassId, path: string, value: string): void;

  undo(): void;
}

const PHASE_ORDER: Phase[] = [
  "preparation",
  "action",
  "production",
  "elections",
  "scoring",
];

function snapshot(state: GameState, label: string): HistoryEntry {
  return {
    id: nanoid(8),
    ts: Date.now(),
    label,
    prevSnapshot: JSON.stringify({
      meta: state.meta,
      policies: state.policies,
      market: state.market,
      publicServices: state.publicServices,
      pools: state.pools,
      bills: state.bills,
      businessDeals: state.businessDeals,
      classes: state.classes,
      crisis: state.crisis,
    }),
  };
}

// Helpers for nested-path mutation. Paths use dot notation, e.g. "storage.food".
function setByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const segments = path.split(".");
  let cursor: Record<string, unknown> = obj;
  for (let i = 0; i < segments.length - 1; i++) {
    const key = segments[i];
    const next = cursor[key];
    if (typeof next !== "object" || next === null) {
      throw new Error(`setByPath: missing intermediate key "${key}" in path "${path}"`);
    }
    cursor = next as Record<string, unknown>;
  }
  cursor[segments[segments.length - 1]] = value;
}

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

  apply(label, mutator) {
    const current = get().state;
    if (!current) return;
    const entry = snapshot(current, label);
    // Deep clone via JSON to keep state immutable per Zustand expectations.
    const draft: GameState = JSON.parse(JSON.stringify(current));
    mutator(draft);
    draft.meta = { ...draft.meta, updatedAt: Date.now() };
    draft.history = [entry, ...current.history].slice(0, HISTORY_LIMIT);
    set({ state: draft });
    persist(draft);
  },

  setPolicy(policyId, position) {
    get().apply(`Set ${policyId} → ${position}`, (s) => {
      s.policies[policyId] = { id: policyId, position };
    });
  },

  advancePhase() {
    get().apply("Advance phase", (s) => {
      const idx = PHASE_ORDER.indexOf(s.meta.phase);
      if (idx < 0 || idx === PHASE_ORDER.length - 1) {
        // Wrap to next round.
        const nextRound = Math.min(5, s.meta.round + 1) as 1 | 2 | 3 | 4 | 5;
        s.meta.round = nextRound;
        s.meta.phase = "preparation";
      } else {
        s.meta.phase = PHASE_ORDER[idx + 1];
      }
    });
  },

  setPhase(phase) {
    get().apply(`Set phase → ${phase}`, (s) => {
      s.meta.phase = phase;
    });
  },

  setRound(round) {
    get().apply(`Set round → ${round}`, (s) => {
      s.meta.round = round;
    });
  },

  proposeBill(bill) {
    get().apply(`Propose bill on ${bill.policyId}`, (s) => {
      s.bills.push({ ...bill, id: nanoid(8) });
    });
  },

  removeBill(id) {
    get().apply("Remove bill", (s) => {
      s.bills = s.bills.filter((b) => b.id !== id);
    });
  },

  adjustClassNumber(classId, path, delta) {
    get().apply(`${classId}.${path} ${delta >= 0 ? "+" : ""}${delta}`, (s) => {
      const cls = s.classes[classId] as unknown as Record<string, unknown>;
      const current = (getByPath(cls, path) as number) ?? 0;
      const next = current + delta;
      setByPath(cls, path, Math.max(0, next));
    });
  },

  setClassNumber(classId, path, value) {
    get().apply(`${classId}.${path} = ${value}`, (s) => {
      const cls = s.classes[classId] as unknown as Record<string, unknown>;
      setByPath(cls, path, Math.max(0, value));
    });
  },

  setClassString(classId, path, value) {
    get().apply(`${classId}.${path} (text)`, (s) => {
      const cls = s.classes[classId] as unknown as Record<string, unknown>;
      setByPath(cls, path, value);
    });
  },

  undo() {
    const current = get().state;
    if (!current || current.history.length === 0) return;
    const [entry, ...rest] = current.history;
    const restored = JSON.parse(entry.prevSnapshot) as Omit<GameState, "history" | "meta"> & {
      meta: GameState["meta"];
    };
    const next: GameState = {
      ...current,
      ...restored,
      meta: { ...restored.meta, updatedAt: Date.now() },
      history: rest,
    };
    set({ state: next });
    persist(next);
  },
}));

// Convenience selector hook for components that only need the active GameState.
export function useGameState(): GameState | null {
  return useGame((s) => s.state);
}
