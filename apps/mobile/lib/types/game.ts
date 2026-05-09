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

export type PolicySection = "A" | "B" | "C";

export interface PolicyState {
  id: PolicyId;
  position: PolicySection;
}

export interface MarketState {
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
  prevSnapshot: string;
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
  crisis?: {
    crisisCards: { id: string; label: string; locksPolicy?: PolicyId }[];
    activeCrisisCardId?: string;
    bonds: { holder: ClassId; amount: number }[];
    automa?: AutomaState;
  };
  history: HistoryEntry[];
}

export type Good = "food" | "luxury" | "health" | "education" | "influence";

export interface TaxSuggestion {
  multiplier: number;
  workingIncomeTax: number;
  middleIncomeTax: number;
  middleEmploymentTax: number;
  capitalistIncomeTax: number;
  capitalistEmploymentTax: number;
  totalToTreasury: number;
}

export interface RoundSuggestion {
  taxes: TaxSuggestion;
  vpAtScoring: { working: number; middle: number; capitalist: number; state: number };
  wages: { fromCapitalist: number; fromMiddle: number; toWorking: number };
  welfareCosts: { fromState: number; notes: string };
  prosperityDelta: { working: number; middle: number };
  notes: string[];
}

export interface AutomaState {
  difficulty: "easy" | "medium";
  opponents: Record<
    Exclude<ClassId, "working">,
    {
      enabled: boolean;
      vp: number;
      money: number;
      influence: number;
      legitimacy?: number;
      capital?: number;
      prosperity?: number;
      notes: string;
    }
  >;
}
