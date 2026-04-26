// Core type definitions for Praxis (Hegemony companion tracker).
// All state must be plain JSON-serializable (no class instances, Maps, Sets).

import type { CapitalistState } from "./classes/capitalist";
import type { MiddleClassState } from "./classes/middle";
import type { StateClassState } from "./classes/state";
import type { WorkingClassState } from "./classes/working";

export type ClassId = "working" | "middle" | "capitalist" | "state";

export type GameMode = "solo" | "party";

export type Phase =
  | "setup"
  | "preparation"
  | "action"
  | "production"
  | "elections"
  | "scoring";

export type PolicyId =
  | "fiscalPolicy"
  | "laborMarket"
  | "taxation"
  | "healthBenefits"
  | "educationWelfare"
  | "foreignTrade"
  | "immigration";

// Each policy has three sections; A favors Working, B favors Middle, C favors Capitalist.
export type PolicySection = "A" | "B" | "C";

export interface PolicyState {
  id: PolicyId;
  position: PolicySection;
}

export interface MarketState {
  // Goods stored on the open market (not in any class's storage).
  food: number;
  luxury: number;
  healthGoods: number;
  educationGoods: number;
}

export interface PublicServices {
  health: number;
  education: number;
  mediaInfluence: number;
}

export interface PopulationPools {
  // The general pool of unhired population available via Immigration etc.
  workers: number;
  middleClass: number;
  foreignCapital: number;
}

export interface Bill {
  id: string;
  policyId: PolicyId;
  proposedSection: PolicySection;
  proposedBy: ClassId;
  immediateVote: boolean;
}

export interface BusinessDeal {
  id: string;
  label: string;
  cost: number;
  reward: string;
}

export interface ExpansionFlags {
  crisisAndControl: boolean;
  modules: {
    automa: boolean;
    crisisCards: boolean;
    alternativeEvents: boolean;
    hiddenAgendas: boolean;
    newActionCards: boolean;
  };
}

export interface HistoryEntry {
  id: string;
  ts: number;
  label: string;
  // Snapshot of the GameState slice that was mutated. Coarse to keep storage small.
  prevSnapshot: string; // JSON
}

export interface GameMeta {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  mode: GameMode;
  expansions: ExpansionFlags;
  playerCount: 2 | 3 | 4;
  classesInPlay: ClassId[];
  round: 1 | 2 | 3 | 4 | 5;
  phase: Phase;
  activeClass?: ClassId;
}

export interface GameState {
  meta: GameMeta;
  policies: Record<PolicyId, PolicyState>;
  market: MarketState;
  publicServices: PublicServices;
  pools: PopulationPools;
  bills: Bill[];
  businessDeals: BusinessDeal[];
  classes: {
    working: WorkingClassState;
    middle: MiddleClassState;
    capitalist: CapitalistState;
    state: StateClassState;
  };
  // Crisis & Control extension state (only populated when expansion enabled).
  crisis?: {
    crisisCards: { id: string; label: string; locksPolicy?: PolicyId }[];
    activeCrisisCardId?: string;
    bonds: { holder: ClassId; amount: number }[];
    automa?: AutomaState;
  };
  history: HistoryEntry[];
}

export interface AutomaState {
  // Simplified opponent tracker for solo mode. Numbers only — humans advance manually.
  difficulty: "easy" | "medium";
  opponents: Record<
    Exclude<ClassId, "working">, // typically the human plays Working; configurable via UI
    {
      enabled: boolean;
      vp: number;
      money: number;
      influence: number;
      legitimacy?: number; // for State opponent
      capital?: number; // for Capitalist opponent
      prosperity?: number; // for Middle opponent
      notes: string;
    }
  >;
}
