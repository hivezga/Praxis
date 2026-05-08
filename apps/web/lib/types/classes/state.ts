// State (government) player state. Only present in 4-player games.

import type { ClassId } from "../game";

export interface PublicCompany {
  id: string;
  label: string;
  industry: "health" | "education" | "media";
  workersAssigned: number;
  wageLevel: 1 | 2 | 3;
  operational: boolean; // top row is operational; rows 2-3 are face-down
  rowIndex: 1 | 2 | 3;
}

export interface StateStorage {
  food: number;
  luxury: number;
  influence: number; // personal influence
}

export interface StateClassState {
  treasury: number;
  vp: number;

  // Legitimacy: one track per other class. VP per round = sum of two lowest.
  legitimacy: Record<Exclude<ClassId, "state">, number>;
  // Permanent legitimacy tokens (added each round after Scoring halves the tracks).
  legitimacyTokens: Record<Exclude<ClassId, "state">, number>;

  publicCompanies: PublicCompany[];

  storage: StateStorage;

  // Welfare tile placements: which side of each tile is up (policy-driven).
  welfare: { health: "A" | "B" | "C"; education: "A" | "B" | "C" };

  // Events visible to the State (2 face-up).
  eventCardIds: string[];
  politicalAgendaCardId?: string;

  loans: number;
  handSize: number;

  // The State doesn't get voting cubes; it relies on personal influence.
  billMarkersAvailable: 0 | 1 | 2 | 3;

  notes: string;
}
