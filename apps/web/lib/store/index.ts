"use client";

import { create } from "zustand";
import { RoomHost, RoomPeer } from "@praxis/party";

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

// Live PeerJS instances — kept outside Zustand state so they aren't serialized.
let hostInstance: RoomHost | null = null;
let peerInstance: RoomPeer | null = null;

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

function persist(state: GameState | null, isPeer: boolean): void {
  // Peers never write to local persistence — their copy is host-driven.
  if (!state || isPeer) return;
  void adapter.save(state);
}

interface PartyState {
  role: "host" | "peer" | null;
  code: string | null;
  peerCount: number;
  connected: boolean;
  error: string | null;
}

const PARTY_IDLE: PartyState = {
  role: null,
  code: null,
  peerCount: 0,
  connected: false,
  error: null,
};

interface GameStore {
  state: GameState | null;
  loading: boolean;
  error: string | null;
  party: PartyState;

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

  startHosting(): Promise<string>;
  stopHosting(): void;
  joinRoom(code: string): Promise<void>;
  leaveRoom(): void;
}

export const useGame = create<GameStore>((set, get) => ({
  state: null,
  loading: false,
  error: null,
  party: PARTY_IDLE,

  async load(gameId) {
    // Peers receive state through broadcasts — never touch local storage.
    if (get().party.role === "peer") return;
    set({ loading: true, error: null });
    try {
      const loaded = await adapter.load(gameId);
      set({ state: loaded, loading: false });
      if (loaded && get().party.role === "host" && hostInstance) {
        hostInstance.broadcastState(loaded);
      }
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  hydrate(state) {
    set({ state });
    persist(state, get().party.role === "peer");
    if (get().party.role === "host" && hostInstance) {
      hostInstance.broadcastState(state);
    }
  },

  clear() {
    set({ state: null });
  },

  apply(mutation, label = "") {
    const { state: current, party } = get();
    if (!current) return;
    if (party.role === "peer") return; // Peer cannot mutate locally.
    const next = wasm().apply_mutation_wasm(current, mutation, label) as GameState;
    next.meta.updatedAt = Date.now();
    set({ state: next });
    persist(next, false);
    if (party.role === "host" && hostInstance) {
      hostInstance.broadcastState(next);
    }
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
    const { state: current, party } = get();
    if (!current) return;
    if (party.role === "peer") return;
    const restored = wasm().undo_wasm(current) as GameState | null | undefined;
    if (restored == null) return;
    restored.meta.updatedAt = Date.now();
    set({ state: restored });
    persist(restored, false);
    if (party.role === "host" && hostInstance) {
      hostInstance.broadcastState(restored);
    }
  },

  async startHosting() {
    if (hostInstance) return hostInstance.code;
    if (get().party.role) {
      throw new Error("Leave the current room before hosting.");
    }
    try {
      const host = await RoomHost.create();
      hostInstance = host;
      set({ party: { role: "host", code: host.code, peerCount: 0, connected: true, error: null } });
      host.onStatus((s) => {
        set((prev) => ({
          party: { ...prev.party, peerCount: s.peerCount },
        }));
      });
      const cur = get().state;
      if (cur) host.broadcastState(cur);
      return host.code;
    } catch (err) {
      hostInstance = null;
      set({ party: { ...PARTY_IDLE, error: (err as Error).message } });
      throw err;
    }
  },

  stopHosting() {
    hostInstance?.destroy();
    hostInstance = null;
    set({ party: PARTY_IDLE });
  },

  async joinRoom(code) {
    if (peerInstance) return;
    if (get().party.role) {
      throw new Error("Leave the current room before joining another.");
    }
    try {
      const peer = await RoomPeer.join(code);
      peerInstance = peer;
      set({
        party: { role: "peer", code: peer.code, peerCount: 0, connected: true, error: null },
        // Clear local state — peer state is host-driven.
        state: null,
      });
      peer.onState((payload) => {
        set({ state: payload as GameState });
      });
      peer.onStatus((s) => {
        set((prev) => ({
          party: { ...prev.party, connected: s.connected },
        }));
      });
    } catch (err) {
      peerInstance = null;
      set({ party: { ...PARTY_IDLE, error: (err as Error).message } });
      throw err;
    }
  },

  leaveRoom() {
    peerInstance?.destroy();
    peerInstance = null;
    set({ party: PARTY_IDLE, state: null });
  },
}));

export function useGameState(): GameState | null {
  return useGame((s) => s.state);
}

export function useParty(): PartyState {
  return useGame((s) => s.party);
}
