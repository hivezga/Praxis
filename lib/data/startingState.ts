import { nanoid } from "nanoid";

import { POLICIES } from "./policies";
import type {
  ClassId,
  ExpansionFlags,
  GameState,
  PolicyId,
  PolicyState,
} from "../types/game";
import type { CapitalistState } from "../types/classes/capitalist";
import type { MiddleClassState } from "../types/classes/middle";
import type { StateClassState } from "../types/classes/state";
import type { WorkingClassState } from "../types/classes/working";

export interface NewGameInput {
  name?: string;
  mode: "solo" | "party";
  playerCount: 2 | 3 | 4;
  classesInPlay: ClassId[];
  expansions: ExpansionFlags;
}

export const DEFAULT_EXPANSIONS: ExpansionFlags = {
  crisisAndControl: false,
  modules: {
    automa: false,
    crisisCards: false,
    alternativeEvents: false,
    hiddenAgendas: false,
    newActionCards: false,
  },
};

function makeWorking(): WorkingClassState {
  return {
    money: 30,
    vp: 0,
    prosperity: 0,
    population: 10,
    unemployedWorkers: 2,
    unemployedSkilledWorkers: 0,
    companies: [],
    tradeUnions: [
      { industry: 1, workersAssigned: 0 },
      { industry: 2, workersAssigned: 0 },
      { industry: 3, workersAssigned: 0 },
      { industry: 4, workersAssigned: 0 },
      { industry: 5, workersAssigned: 0 },
    ],
    cooperatingFarmsRemaining: 2,
    storage: { food: 0, health: 0, education: 0, luxury: 0, influence: 1 },
    loans: 0,
    handSize: 7,
    votingCubesInBag: 8,
    billMarkersAvailable: 3,
    notes: "",
  };
}

function makeMiddle(): MiddleClassState {
  return {
    money: 40,
    capital: 0,
    vp: 0,
    prosperity: 0,
    savings: 0,
    population: 10,
    unemployedWorkers: 0,
    unemployedSkilledWorkers: 0,
    companies: [
      {
        id: nanoid(8),
        label: "Convenience Store",
        workersAssigned: 1,
        workingClassEmployees: 0,
        wageLevel: 2,
        fullyOperational: false,
      },
      {
        id: nanoid(8),
        label: "Doctor's Office",
        workersAssigned: 1,
        workingClassEmployees: 0,
        wageLevel: 2,
        fullyOperational: false,
      },
    ],
    marketCompanyIds: [],
    storage: {
      food: 1,
      luxury: 0,
      health: 1,
      education: 0,
      influence: 1,
      prices: { food: 12, luxury: 8, health: 8, education: 8 },
    },
    loans: 0,
    handSize: 7,
    votingCubesInBag: 8,
    billMarkersAvailable: 3,
    notes: "",
  };
}

function makeCapitalist(): CapitalistState {
  return {
    revenue: 120,
    capital: 0,
    vp: 0,
    companies: [
      { id: nanoid(8), label: "Supermarket", workersAssigned: 0, wageLevel: 1, industry: 1, onStrike: false },
      { id: nanoid(8), label: "Shopping Mall", workersAssigned: 0, wageLevel: 1, industry: 2, onStrike: false },
      { id: nanoid(8), label: "College", workersAssigned: 0, wageLevel: 1, industry: 5, onStrike: false },
      { id: nanoid(8), label: "Clinic", workersAssigned: 0, wageLevel: 1, industry: 4, onStrike: false },
    ],
    marketCompanyIds: [],
    storage: {
      food: 1,
      luxury: 2,
      health: 0,
      education: 2,
      influence: 1,
      freeTradeZone: { food: 0, luxury: 0 },
      prices: { food: 12, luxury: 8, health: 8, education: 8 },
    },
    loans: 0,
    handSize: 7,
    votingCubesInBag: 8,
    billMarkersAvailable: 3,
    notes: "",
  };
}

function makeState(): StateClassState {
  return {
    treasury: 120,
    vp: 0,
    legitimacy: { working: 2, middle: 2, capitalist: 2 },
    legitimacyTokens: { working: 0, middle: 0, capitalist: 0 },
    publicCompanies: [],
    storage: { food: 0, luxury: 0, influence: 1 },
    welfare: { health: "C", education: "C" },
    eventCardIds: [],
    loans: 0,
    handSize: 7,
    billMarkersAvailable: 3,
    notes: "",
  };
}

export function createStartingState(input: NewGameInput): GameState {
  const policies = Object.fromEntries(
    POLICIES.map((p) => [p.id, { id: p.id, position: p.defaultStart }])
  ) as Record<PolicyId, PolicyState>;

  const now = Date.now();
  return {
    meta: {
      id: nanoid(10),
      name: input.name?.trim() || "New Game",
      createdAt: now,
      updatedAt: now,
      mode: input.mode,
      expansions: input.expansions,
      playerCount: input.playerCount,
      classesInPlay: input.classesInPlay,
      round: 1,
      phase: "preparation",
    },
    policies,
    market: { food: 0, luxury: 0, healthGoods: 0, educationGoods: 0 },
    publicServices: { health: 0, education: 0, mediaInfluence: 0 },
    pools: { workers: 0, middleClass: 0, foreignCapital: 0 },
    bills: [],
    businessDeals: [],
    classes: {
      working: makeWorking(),
      middle: makeMiddle(),
      capitalist: makeCapitalist(),
      state: makeState(),
    },
    crisis: input.expansions.crisisAndControl
      ? {
          crisisCards: [],
          bonds: [],
          automa:
            input.mode === "solo" && input.expansions.modules.automa
              ? {
                  difficulty: "easy",
                  opponents: {
                    middle: { enabled: true, vp: 0, money: 40, influence: 1, prosperity: 0, notes: "" },
                    capitalist: { enabled: true, vp: 0, money: 120, influence: 1, capital: 0, notes: "" },
                    state: { enabled: false, vp: 0, money: 120, influence: 1, legitimacy: 6, notes: "" },
                  },
                }
              : undefined,
        }
      : undefined,
    history: [],
  };
}
