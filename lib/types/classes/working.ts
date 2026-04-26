// Working Class player state.

export interface WorkingClassCompany {
  id: string;
  label: string;
  workersAssigned: number;
  wageLevel: 1 | 2 | 3;
  onStrike: boolean;
}

export interface TradeUnionPresence {
  industry: 1 | 2 | 3 | 4 | 5;
  workersAssigned: number; // counts toward 4+ threshold for benefits
}

export interface WorkingStorage {
  food: number;
  health: number;
  education: number;
  luxury: number;
  influence: number; // personal influence storage
}

export interface WorkingClassState {
  // Currency / VP
  money: number;
  vp: number;
  prosperity: number;

  // Population pool tracker (workers belonging to this class).
  population: number;
  unemployedWorkers: number;
  unemployedSkilledWorkers: number;

  // Companies owned by the working class (small co-ops).
  companies: WorkingClassCompany[];

  // Trade unions: presence in each industry.
  tradeUnions: TradeUnionPresence[];

  // Cooperating farms: each produces 2 Food. Track remaining uses this round.
  cooperatingFarmsRemaining: number;

  // Storage holdings.
  storage: WorkingStorage;

  // Loans and hand size.
  loans: number;
  handSize: number;

  // Voting cubes currently in the bag (refilled at Elections phase).
  votingCubesInBag: number;
  billMarkersAvailable: 0 | 1 | 2 | 3;

  // Free-form notes the player can use at the table.
  notes: string;
}
