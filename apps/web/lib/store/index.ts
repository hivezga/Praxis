"use client";

import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { RoomHost, RoomPeer } from "@praxis/party";
import type { LobbySnapshot, PartyMessage } from "@praxis/party";

import { wasm } from "@/lib/wasm";
import { stateForPeer } from "@/lib/party/state-projection";
import { assertGameState } from "@/lib/util/assert-game-state";
import { localStorageAdapter } from "./persistence/localStorage";
import type { PersistenceAdapter } from "./persistence/adapter";
import type {
  Bill,
  CapitalistState,
  ClassId,
  GameState,
  MiddleClassState,
  Phase,
  PolicyId,
  PolicySection,
  StateClassState,
  WorkingClassState,
} from "../types/game";
import type { Mutation } from "../types/mutations";
import { isKnownMutationShape } from "../types/mutation-validator";

let adapter: PersistenceAdapter = localStorageAdapter;
export function setPersistenceAdapter(next: PersistenceAdapter): void {
  adapter = next;
}

// Live PeerJS instances — kept outside Zustand state so they aren't serialized.
let hostInstance: RoomHost | null = null;
let peerInstance: RoomPeer | null = null;

/**
 * For class-owned mutations, return the ClassId that "owns" the mutation.
 * Returns null for global mutations (phase, policy, market, pools, etc.)
 * that any seat can apply.
 */
function isFactionTakenByOther(
  lobby: LobbySnapshot | null,
  faction: ClassId | null,
  exceptPeerId: string,
): boolean {
  if (!faction || !lobby) return false;
  return lobby.players.some((p) => p.faction === faction && p.peerId !== exceptPeerId);
}

function ownerOfMutation(m: Mutation): ClassId | null {
  switch (m.type) {
    case "proposeBill":
      return m.proposedBy;
    case "adjustMoney":
    case "adjustCapital":
    case "adjustVp":
    case "adjustProsperity":
    case "adjustPopulation":
    case "adjustStorage":
    case "adjustLoans":
    case "setNotes":
    case "adjustUnemployedWorkers":
    case "adjustSkilledWorkers":
    case "adjustVotingCubes":
    case "adjustBillMarkers":
    case "adjustHandSize":
      return m.classId;
    case "adjustRevenue":
      return "capitalist";
    case "adjustTreasury":
    case "adjustLegitimacy":
    case "adjustLegitimacyTokens":
      return "state";
    case "adjustSavings":
      return "middle";
    case "adjustTradeUnion":
      return "working";
    case "adjustFreeTradeZone":
    case "setWealthMarker":
      return "capitalist";
    case "sellWelfare":
      // State performs the sale; party-mode ownership lock should
      // belong to the State seat regardless of buyer choice.
      return "state";
    default:
      return null;
  }
}

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

/**
 * Apply a mutation through WASM, persist, broadcast — bypassing ownership
 * checks. Used when the host validates a peer's `mutation_request` and is
 * acting on behalf of that peer.
 */
function commitMutation(
  set: (
    partial:
      | { state: GameState | null; loading?: boolean; error?: string | null; party?: PartyState }
      | ((prev: { state: GameState | null; party: PartyState }) => Partial<GameStore>),
  ) => void,
  get: () => GameStore,
  mutation: Mutation,
  label: string,
): void {
  const { state: current, party } = get();
  if (!current) return;
  const raw = wasm().apply_mutation_wasm(current, mutation, label) as unknown;
  assertGameState(raw);
  const next = raw;
  next.meta.updatedAt = Date.now();
  set({ state: next });
  persist(next, false);
  if (party.role === "host" && hostInstance) {
    broadcastStatePerPeer(hostInstance, party.lobby, next);
  }
}

/**
 * Send the per-peer state projection to each connected peer. Today this
 * sends the same payload to every seat, but routing through `stateForPeer`
 * is the seam where any future private fields get redacted.
 */
function broadcastStatePerPeer(
  host: RoomHost,
  lobby: LobbySnapshot | null,
  state: GameState,
): void {
  const players = lobby?.players ?? [];
  const seen = new Set<string>();
  for (const p of players) {
    if (p.peerId === host.hostPeerId) continue; // host runs locally
    seen.add(p.peerId);
    const projected = stateForPeer(state, (p.faction as ClassId | null) ?? null);
    host.sendToPeer(p.peerId, { type: "state", payload: projected, ts: Date.now() });
  }
  // Belt: any peer not yet in the lobby snapshot still gets a default view
  // via the host's own broadcastState (cached for new joiners).
  host.broadcastState(stateForPeer(state, null));
}

export interface PhaseRunResult {
  log: {
    phase: Phase;
    round: number;
    entries: string[];
    suggestion: unknown | null;
    imfIntervened: boolean;
  };
}

interface PartyState {
  role: "host" | "peer" | null;
  code: string | null;
  peerCount: number;
  /** Host: always true; peer: tracks live transport state. */
  connected: boolean;
  /** Peer-only: detailed transport state for surfacing reconnect banners. */
  transport: "connecting" | "connected" | "reconnecting" | "disconnected" | null;
  /** Lobby snapshot — host owns it, peers receive it via broadcast. */
  lobby: LobbySnapshot | null;
  /** This player's chosen faction (host or peer). */
  localFaction: ClassId | null;
  /** True once the host has started the game. */
  gameStarted: boolean;
  /** Peer-only: host has signalled it's leaving — show promote/wait UI. */
  hostLeavingPending: boolean;
  /**
   * This client's PeerJS ID (host: own peer.id; peer: own peer.id). Mirror
   * of `hostInstance.hostPeerId` / `peerInstance.peerId` in Zustand state so
   * selectors can react to host/peer lifecycle without polling module-level
   * refs.
   */
  localPeerId: string | null;
  error: string | null;
}

const PARTY_IDLE: PartyState = {
  role: null,
  code: null,
  peerCount: 0,
  connected: false,
  transport: null,
  lobby: null,
  localFaction: null,
  gameStarted: false,
  hostLeavingPending: false,
  localPeerId: null,
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
  /**
   * Resolve a proposed bill: move policy marker, return bill marker, +3 VP
   * to proposer, +1 VP to each supporter that contributed (cube or
   * Influence). Pass an empty array if no supporters contributed (rulebook p.13).
   */
  passBill(id: string, supporters?: ClassId[]): void;
  /** Resolve a proposed bill as failed: just return the bill marker, no VP. */
  failBill(id: string): void;

  adjustClassNumber(classId: ClassId, path: string, delta: number): void;
  setClassNumber(classId: ClassId, path: string, value: number): void;
  setClassString(classId: ClassId, path: string, value: string): void;

  undo(): void;

  /** Run Preparation Phase: pay loan interest, drop prosperity, advance phase to Action. */
  runPreparationPhase(): PhaseRunResult | null;
  /** Run Production Phase: wages, taxes, IMF check. Mode "auto" applies, "manual" only computes. */
  runProductionPhase(mode: "auto" | "manual"): PhaseRunResult | null;
  /** Run Scoring Phase: legitimacy VP, per-class totals, advance round. */
  runScoringPhase(): PhaseRunResult | null;

  startHosting(): Promise<string>;
  stopHosting(): void;
  joinRoom(code: string): Promise<void>;
  leaveRoom(): void;

  /** Lobby + party-coordination API. */
  selectFaction(faction: ClassId | null): void;
  /** Set this seat's nickname. Broadcast via lobby update. */
  setNickname(name: string): void;
  startGame(): void;
  promoteToHost(): Promise<string | null>;
  dismissHostLeaving(): void;
}

export const useGame = create<GameStore>((set, get) => ({
  state: null,
  loading: false,
  error: null,
  party: PARTY_IDLE,

  async load(gameId) {
    if (get().party.role === "peer") return;
    set({ loading: true, error: null });
    try {
      const loaded = await adapter.load(gameId);
      set({ state: loaded, loading: false });
      if (loaded && get().party.role === "host" && hostInstance) {
        broadcastStatePerPeer(hostInstance, get().party.lobby, loaded);
      }
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  hydrate(state) {
    set({ state });
    persist(state, get().party.role === "peer");
    if (get().party.role === "host" && hostInstance) {
      broadcastStatePerPeer(hostInstance, get().party.lobby, state);
    }
  },

  clear() {
    set({ state: null });
  },

  apply(mutation, label = "") {
    const { state: current, party } = get();
    if (!current) return;
    // Ownership lock (party mode only): if local seat picked a faction, don't
    // mutate someone else's class. Solo mode does not lock — single tracker.
    if (current.meta.mode === "party" && party.localFaction) {
      const owner = ownerOfMutation(mutation);
      if (owner && owner !== party.localFaction) return;
    }
    if (party.role === "peer") {
      peerInstance?.send({
        type: "mutation_request",
        payload: { mutation, label },
        ts: Date.now(),
      });
      return;
    }
    commitMutation(set, get, mutation, label);
  },

  setPolicy(policyId, position) {
    get().apply({ type: "setPolicy", policyId, position }, `Set ${policyId} → ${position}`);
  },

  advancePhase() { get().apply({ type: "advancePhase" }, "Advance phase"); },
  setPhase(phase) { get().apply({ type: "setPhase", phase }, `Set phase → ${phase}`); },
  setRound(round) { get().apply({ type: "setRound", round }, `Set round → ${round}`); },

  proposeBill(bill) {
    get().apply({ type: "proposeBill", ...bill }, `Propose bill on ${bill.policyId}`);
  },
  removeBill(id) {
    get().apply({ type: "removeBill", id }, "Remove bill");
  },

  passBill(id, supporters = []) {
    const current = get().state;
    if (!current) return;
    const bill = current.bills.find((b) => b.id === id);
    if (!bill) return;
    const tail = supporters.length > 0 ? ` (+${supporters.length} supporter)` : "";
    get().apply(
      { type: "passBill", billId: id, supporters },
      `Bill passed: ${bill.policyId} → ${bill.proposedSection}${tail}`,
    );
  },

  failBill(id) {
    const current = get().state;
    if (!current) return;
    const bill = current.bills.find((b) => b.id === id);
    if (!bill) return;
    get().apply({ type: "failBill", billId: id }, `Bill failed: ${bill.policyId} → ${bill.proposedSection}`);
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
    // Don't clamp here — Rust enforces bounds (saturating to 0 on negative).
    // Clamping in TS hid genuine "user typed -5" inputs as silent zeros.
    const delta = value - currentVal;
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
      broadcastStatePerPeer(hostInstance, party.lobby, restored);
    }
  },

  runPreparationPhase() {
    const { state: current, party } = get();
    if (!current) return null;
    if (party.role === "peer") return null;
    const result = wasm().apply_preparation_phase_wasm(current) as {
      state: GameState;
      log: PhaseRunResult["log"];
    };
    result.state.meta.updatedAt = Date.now();
    set({ state: result.state });
    persist(result.state, false);
    if (party.role === "host" && hostInstance)
      broadcastStatePerPeer(hostInstance, party.lobby, result.state);
    return { log: result.log };
  },

  runProductionPhase(mode) {
    const { state: current, party } = get();
    if (!current) return null;
    if (party.role === "peer") return null;
    const result = wasm().apply_production_phase_wasm(current, mode) as {
      state: GameState;
      log: PhaseRunResult["log"];
    };
    result.state.meta.updatedAt = Date.now();
    set({ state: result.state });
    persist(result.state, false);
    if (party.role === "host" && hostInstance)
      broadcastStatePerPeer(hostInstance, party.lobby, result.state);
    return { log: result.log };
  },

  runScoringPhase() {
    const { state: current, party } = get();
    if (!current) return null;
    if (party.role === "peer") return null;
    const result = wasm().apply_scoring_phase_wasm(current) as {
      state: GameState;
      log: PhaseRunResult["log"];
    };
    result.state.meta.updatedAt = Date.now();
    set({ state: result.state });
    persist(result.state, false);
    if (party.role === "host" && hostInstance)
      broadcastStatePerPeer(hostInstance, party.lobby, result.state);
    return { log: result.log };
  },

  async startHosting() {
    if (hostInstance) return hostInstance.code;
    if (get().party.role) {
      throw new Error("Leave the current room before hosting.");
    }
    try {
      const host = await RoomHost.create();
      hostInstance = host;

      const initialLobby: LobbySnapshot = {
        code: host.code,
        hostPeerId: host.hostPeerId,
        started: false,
        players: [
          { peerId: host.hostPeerId, isHost: true, faction: null },
        ],
      };
      set({
        party: {
          ...PARTY_IDLE,
          role: "host",
          code: host.code,
          peerCount: 0,
          connected: true,
          transport: null,
          lobby: initialLobby,
          localFaction: null,
          gameStarted: false,
          localPeerId: host.hostPeerId,
        },
      });
      host.broadcastLobby(initialLobby);

      host.onStatus((s) => {
        set((prev) => ({
          party: { ...prev.party, peerCount: s.peerCount },
        }));
      });

      host.onConnection((peerId, kind) => {
        const cur = get().party.lobby;
        if (!cur) return;
        let next: LobbySnapshot;
        if (kind === "open") {
          if (cur.players.some((p) => p.peerId === peerId)) return;
          next = {
            ...cur,
            players: [...cur.players, { peerId, isHost: false, faction: null }],
          };
        } else {
          next = { ...cur, players: cur.players.filter((p) => p.peerId !== peerId) };
        }
        set((prev) => ({ party: { ...prev.party, lobby: next } }));
        host.broadcastLobby(next);
      });

      host.onMessage((peerId, msg) => {
        const gameStarted = get().party.gameStarted;
        if (msg.type === "hello") {
          // Block lobby-shape changes once the game starts: no faction or
          // nickname rewrites mid-game.
          if (gameStarted) {
            host.sendToPeer(peerId, {
              type: "lobby_locked" as never,
              payload: { reason: "game-started" },
              ts: Date.now(),
            } as never);
            return;
          }
          const payload = msg.payload as { faction?: string | null; name?: string } | undefined;
          const requested = (payload?.faction as ClassId | null | undefined) ?? null;
          const taken = isFactionTakenByOther(get().party.lobby, requested, peerId);
          updateLobbyPlayer(peerId, (p) => ({
            ...p,
            name: payload?.name ?? p.name,
            faction: taken ? p.faction : requested ?? p.faction,
          }));
          if (taken) {
            host.sendToPeer(peerId, {
              type: "select_faction_rejected" as never,
              payload: { reason: "taken", faction: requested },
              ts: Date.now(),
            } as never);
          }
        } else if (msg.type === "select_faction") {
          if (gameStarted) {
            host.sendToPeer(peerId, {
              type: "lobby_locked" as never,
              payload: { reason: "game-started" },
              ts: Date.now(),
            } as never);
            return;
          }
          const payload = msg.payload as { faction: string | null };
          const requested = payload.faction as ClassId | null;
          if (isFactionTakenByOther(get().party.lobby, requested, peerId)) {
            host.sendToPeer(peerId, {
              type: "select_faction_rejected" as never,
              payload: { reason: "taken", faction: requested },
              ts: Date.now(),
            } as never);
            return;
          }
          updateLobbyPlayer(peerId, (p) => ({ ...p, faction: requested }));
        } else if (msg.type === "mutation_request") {
          if (!gameStarted) return;
          const payload = msg.payload as { mutation?: unknown; label?: string };
          // Whitelist mutation type before WASM gets a look. Keeps unknown /
          // future-protocol variants out of the engine.
          if (!isKnownMutationShape(payload.mutation)) return;
          // Validate the requesting peer is allowed to mutate this class.
          const owner = ownerOfMutation(payload.mutation);
          if (owner) {
            const peerFaction = get()
              .party.lobby?.players.find((p) => p.peerId === peerId)
              ?.faction;
            if (peerFaction !== owner) return;
          }
          commitMutation(set, get, payload.mutation, payload.label ?? "");
        }
      });

      const cur = get().state;
      if (cur) broadcastStatePerPeer(host, get().party.lobby, cur);
      return host.code;

      function updateLobbyPlayer(
        peerId: string,
        mutate: (p: LobbySnapshot["players"][number]) => LobbySnapshot["players"][number],
      ) {
        const lobby = get().party.lobby;
        if (!lobby) return;
        const next: LobbySnapshot = {
          ...lobby,
          players: lobby.players.map((p) => (p.peerId === peerId ? mutate(p) : p)),
        };
        set((prev) => ({ party: { ...prev.party, lobby: next } }));
        host.broadcastLobby(next);
      }
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
        party: {
          ...PARTY_IDLE,
          role: "peer",
          code: peer.code,
          peerCount: 0,
          connected: true,
          transport: "connected",
          localPeerId: peer.peerId,
        },
        state: null,
      });
      peer.send({
        type: "hello",
        payload: { faction: null },
        ts: Date.now(),
      });
      peer.onMessage((msg) => {
        if (msg.type === "state" || msg.type === "full_state") {
          set({ state: msg.payload as GameState });
        } else if (msg.type === "lobby") {
          const lobby = msg.payload as LobbySnapshot;
          set((prev) => ({
            party: { ...prev.party, lobby, gameStarted: lobby.started },
          }));
        } else if (msg.type === "start_game") {
          set((prev) => ({ party: { ...prev.party, gameStarted: true } }));
        }
      });
      peer.onHostLeaving(() => {
        set((prev) => ({ party: { ...prev.party, hostLeavingPending: true } }));
      });
      peer.onStatus((s) => {
        set((prev) => ({
          party: {
            ...prev.party,
            transport: s.state,
            connected: s.state === "connected",
          },
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

  selectFaction(faction) {
    const { party } = get();
    set((prev) => ({ party: { ...prev.party, localFaction: faction } }));
    if (party.role === "host" && hostInstance) {
      const lobby = get().party.lobby;
      if (!lobby) return;
      const next: LobbySnapshot = {
        ...lobby,
        players: lobby.players.map((p) =>
          p.peerId === hostInstance!.hostPeerId ? { ...p, faction } : p,
        ),
      };
      set((prev) => ({ party: { ...prev.party, lobby: next } }));
      hostInstance.broadcastLobby(next);
    } else if (party.role === "peer" && peerInstance) {
      peerInstance.send({
        type: "select_faction",
        payload: { faction },
        ts: Date.now(),
      });
    }
  },

  setNickname(name) {
    const trimmed = name.trim();
    const { party } = get();
    if (party.role === "host" && hostInstance) {
      const lobby = get().party.lobby;
      if (!lobby) return;
      const next: LobbySnapshot = {
        ...lobby,
        players: lobby.players.map((p) =>
          p.peerId === hostInstance!.hostPeerId ? { ...p, name: trimmed || undefined } : p,
        ),
      };
      set((prev) => ({ party: { ...prev.party, lobby: next } }));
      hostInstance.broadcastLobby(next);
    } else if (party.role === "peer" && peerInstance) {
      peerInstance.send({
        type: "hello",
        payload: { name: trimmed || undefined },
        ts: Date.now(),
      });
    }
  },

  startGame() {
    const { party, state } = get();
    if (party.role !== "host" || !hostInstance) return;
    const lobby = party.lobby;
    if (!lobby) return;
    const started: LobbySnapshot = { ...lobby, started: true };
    set((prev) => ({ party: { ...prev.party, lobby: started, gameStarted: true } }));
    hostInstance.broadcastLobby(started);
    const startMsg: PartyMessage = { type: "start_game", ts: Date.now() };
    hostInstance.broadcast(startMsg);
    if (state) broadcastStatePerPeer(hostInstance, get().party.lobby, state);
  },

  async promoteToHost() {
    const { state } = get();
    // Tear down peer transport first so we can spin up a fresh host.
    peerInstance?.destroy();
    peerInstance = null;
    set({ party: PARTY_IDLE });
    if (!state) return null;
    const code = await get().startHosting();
    // Re-broadcast current state so any future joiners are in sync.
    if (hostInstance) broadcastStatePerPeer(hostInstance, get().party.lobby, state);
    set((prev) => ({ party: { ...prev.party, gameStarted: true, lobby: prev.party.lobby ? { ...prev.party.lobby, started: true } : null } }));
    return code;
  },

  dismissHostLeaving() {
    set((prev) => ({ party: { ...prev.party, hostLeavingPending: false } }));
  },
}));

// Per-slice selectors — keep panel components from re-rendering on unrelated state changes.

export function useGameState(): GameState | null {
  return useGame((s) => s.state);
}

export function useParty(): PartyState {
  return useGame(useShallow((s) => s.party));
}

export function useGameMeta() {
  return useGame(useShallow((s) => (s.state ? s.state.meta : null)));
}

export function useClassState(classId: "working"): WorkingClassState | null;
export function useClassState(classId: "middle"): MiddleClassState | null;
export function useClassState(classId: "capitalist"): CapitalistState | null;
export function useClassState(classId: "state"): StateClassState | null;
export function useClassState(classId: ClassId) {
  return useGame((s) => (s.state ? s.state.classes[classId] : null));
}

/** Nickname of the player seated at this class (party mode), or undefined. */
export function useClassNickname(classId: ClassId): string | undefined {
  return useGame((s) => {
    if (!s.state || s.state.meta.mode !== "party") return undefined;
    const seat = s.party.lobby?.players.find((p) => p.faction === classId);
    return seat?.name?.trim() || undefined;
  });
}

/** Local seat's own nickname, for editing in the lobby. */
export function useLocalNickname(): string {
  return useGame((s) => {
    const myPeerId = s.party.localPeerId;
    if (!s.party.lobby || !myPeerId) return "";
    return s.party.lobby.players.find((p) => p.peerId === myPeerId)?.name ?? "";
  });
}

/** True when the given class belongs to another player (party seat or solo identity). */
export function useShouldHideClass(classId: ClassId): boolean {
  return useGame((s) => {
    if (!s.state) return false;
    if (s.state.meta.mode === "party") {
      if (!s.party.role) return false;
      return s.party.localFaction !== classId;
    }
    const local = s.state.meta.localPlayerClass;
    if (!local) return false;
    return local !== classId;
  });
}

export function useGameActions() {
  return useGame(
    useShallow((s) => ({
      apply: s.apply,
      adjustClassNumber: s.adjustClassNumber,
      setClassNumber: s.setClassNumber,
      setClassString: s.setClassString,
    })),
  );
}
