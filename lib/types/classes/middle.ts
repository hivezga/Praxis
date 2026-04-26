// Middle Class player state.

export interface MiddleCompany {
  id: string;
  label: string;
  workersAssigned: number;
  workingClassEmployees: number;
  wageLevel: 1 | 2 | 3;
  fullyOperational: boolean;
}

export interface MiddleStorage {
  food: number;
  luxury: number;
  health: number;
  education: number;
  influence: number;
  // Sale price markers (default 8) for each storage type, used during production sales.
  prices: {
    food: number;
    luxury: number;
    health: number;
    education: number;
  };
}

export interface MiddleClassState {
  money: number;
  capital: number;
  vp: number;
  prosperity: number;
  savings: number;

  population: number;
  unemployedWorkers: number;
  unemployedSkilledWorkers: number;

  companies: MiddleCompany[];
  marketCompanyIds: string[]; // 3 face-up cards in market

  storage: MiddleStorage;

  loans: number;
  handSize: number;

  votingCubesInBag: number;
  billMarkersAvailable: 0 | 1 | 2 | 3;

  notes: string;
}
