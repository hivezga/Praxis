// Capitalist Class player state.

export interface CapitalistCompany {
  id: string;
  label: string;
  workersAssigned: number;
  wageLevel: 1 | 2 | 3;
  industry: 1 | 2 | 3 | 4 | 5;
  onStrike: boolean;
}

export interface CapitalistStorage {
  food: number;
  luxury: number;
  health: number;
  education: number;
  influence: number;
  // Free Trade Zone holds Food/Luxury exempt from import tariffs when sold.
  freeTradeZone: { food: number; luxury: number };
  prices: {
    food: number;
    luxury: number;
    health: number;
    education: number;
  };
}

export interface CapitalistState {
  // Income lands in revenue first; after wages & taxes the remainder transfers to capital.
  revenue: number;
  capital: number;
  vp: number;

  companies: CapitalistCompany[];
  marketCompanyIds: string[]; // 4 face-up cards rotated each preparation

  storage: CapitalistStorage;

  loans: number;
  handSize: number;

  votingCubesInBag: number;
  billMarkersAvailable: 0 | 1 | 2 | 3;

  notes: string;
}
