// Middle Class Companion — pure calculation module.
//
// MC's math differs from WC: dual tax (income tax per outside company +
// employment tax per own operational company), food as a mandatory
// pop-scaled bill, optional prosperity-action bundles (health / edu /
// luxury), and an authoritative game-end VP formula from rulebook
// page 25 (Section B count → triangular VP).
//
// Tax multiplier and income-tax-per-unit lookups are identical to WC's,
// so we re-export from wc-companion.ts instead of duplicating.

import {
  incomeTaxPerUnit as wcIncomeTaxPerUnit,
  taxMultiplier as wcTaxMultiplier,
  type PolicyPosition,
} from "./wc-companion";

export type { PolicyPosition };
export type PolicyId =
  | "fiscal"
  | "laborMarket"
  | "taxation"
  | "health"
  | "education"
  | "foreignTrade"
  | "immigration";
export type StoplightColour = "good" | "neutral" | "trouble";

export type FoodLuxurySource = "cc" | "mcSelf" | "foreign";
export type CareSource = "cc" | "mcSelf" | "state";

export const POLICY_IDS: PolicyId[] = [
  "fiscal",
  "laborMarket",
  "taxation",
  "health",
  "education",
  "foreignTrade",
  "immigration",
];

// Re-export the shared formulas verbatim so callers don't reach into
// the WC module by name.
export const taxMultiplier = wcTaxMultiplier;
export const incomeTaxPerUnit = wcIncomeTaxPerUnit;

export interface MCInputs {
  population: number;
  prosperity: number;
  cashInBank: number;
  revenue: number;
  wagesReceived: number;

  operationalOwnCompanies: number;
  companiesEmployedElsewhere: number;

  goods: {
    food: { cc?: number; mcSelf?: number; foreign?: number };
    luxury: { cc?: number; mcSelf?: number; foreign?: number };
    health: { cc?: number; mcSelf?: number; state?: number };
    edu: { cc?: number; mcSelf?: number; state?: number };
    influence: { state?: number };
  };

  storage: {
    food: number;
    luxury: number;
    health: number;
    education: number;
    influence: number;
  };

  policies: Record<PolicyId, PolicyPosition>;
}

export interface MCOutputs {
  taxMultiplier: number;
  incomeTaxPerUnit: number;
  mcIncomeTax: number;
  mcEmploymentTax: number;
  totalTaxes: number;

  cheapestFoodPrice: number;
  cheapestLuxuryPrice: number;
  cheapestHealthPrice: number;
  cheapestEduPrice: number;
  influencePrice: number;
  cheapestFoodSource: FoodLuxurySource;
  cheapestLuxurySource: FoodLuxurySource;
  cheapestHealthSource: CareSource;
  cheapestEduSource: CareSource;

  foodBill: number;
  healthBundleCost: number;
  eduBundleCost: number;
  luxuryBundleCost: number;
  influenceBundleCost: number;

  mandatoryOutlay: number;
  netCashAfterMandatory: number;
  excessWealthPoints: number;

  scoringBoost: 0 | 1;
  maxBoostsAfforded: number;
  prosperityPotential: number;

  loanRisk: boolean;
  scoringBoostLost: boolean;

  policyStoplight: Record<PolicyId, StoplightColour>;
  goodCount: number;
  neutralCount: number;
  troubleCount: number;
  sectionBCount: number;

  eogPolicyVp: number;
  eogStorageVp: number;
  eogCashVp: number;
  eogTotalVp: number;
}

export function cheapestSource<S extends string>(
  prices: Partial<Record<S, number>>,
): { price: number; source: S | "" } {
  let bestSource = "" as S | "";
  let bestPrice = Infinity;
  for (const [source, price] of Object.entries(prices) as [S, number | undefined][]) {
    if (typeof price === "number" && price < bestPrice) {
      bestPrice = price;
      bestSource = source;
    }
  }
  return { price: bestPrice, source: bestSource };
}

export function triangular(n: number): number {
  const x = Math.max(0, Math.min(5, Math.floor(n)));
  return (x * (x + 1)) / 2;
}

const MC_STOPLIGHT_TABLE: Record<
  PolicyId,
  Record<PolicyPosition, StoplightColour>
> = {
  fiscal: { A: "trouble", B: "good", C: "trouble" },
  laborMarket: { A: "trouble", B: "good", C: "trouble" },
  taxation: { A: "trouble", B: "good", C: "trouble" },
  health: { A: "trouble", B: "good", C: "trouble" },
  education: { A: "trouble", B: "good", C: "trouble" },
  foreignTrade: { A: "good", B: "neutral", C: "trouble" },
  immigration: { A: "neutral", B: "neutral", C: "neutral" },
};

export function mcPolicyStoplight(
  id: PolicyId,
  position: PolicyPosition,
): StoplightColour {
  return MC_STOPLIGHT_TABLE[id][position];
}

// Section B counts only policies 1..5 — Foreign Trade and Immigration
// are excluded from MC's game-end VP per rulebook page 25.
const SECTION_B_VP_POLICIES: PolicyId[] = [
  "fiscal",
  "laborMarket",
  "taxation",
  "health",
  "education",
];

export function computeMC(inputs: MCInputs): MCOutputs {
  const {
    policies,
    population,
    prosperity,
    cashInBank,
    revenue,
    wagesReceived,
    operationalOwnCompanies,
    companiesEmployedElsewhere,
    storage,
  } = inputs;

  // Taxes
  const taxMult = taxMultiplier(
    policies.taxation,
    policies.health,
    policies.education,
  );
  const itPerUnit = incomeTaxPerUnit(policies.laborMarket, policies.taxation);
  const mcIncomeTax = companiesEmployedElsewhere * itPerUnit;
  const mcEmploymentTax = operationalOwnCompanies * taxMult;
  const totalTaxes = mcIncomeTax + mcEmploymentTax;

  // Cheapest source per good
  const foodPick = cheapestSource<FoodLuxurySource>(inputs.goods.food);
  const luxuryPick = cheapestSource<FoodLuxurySource>(inputs.goods.luxury);
  const healthPick = cheapestSource<CareSource>(inputs.goods.health);
  const eduPick = cheapestSource<CareSource>(inputs.goods.edu);

  const cheapestFoodPrice = foodPick.price === Infinity ? 0 : foodPick.price;
  const cheapestLuxuryPrice =
    luxuryPick.price === Infinity ? 0 : luxuryPick.price;
  const cheapestHealthPrice =
    healthPick.price === Infinity ? 0 : healthPick.price;
  const cheapestEduPrice = eduPick.price === Infinity ? 0 : eduPick.price;
  const influencePrice = inputs.goods.influence.state ?? 0;

  const cheapestFoodSource = (foodPick.source || "cc") as FoodLuxurySource;
  const cheapestLuxurySource = (luxuryPick.source || "cc") as FoodLuxurySource;
  const cheapestHealthSource = (healthPick.source || "cc") as CareSource;
  const cheapestEduSource = (eduPick.source || "cc") as CareSource;

  // Bills
  const foodBill = population * cheapestFoodPrice;
  const healthBundleCost = population * cheapestHealthPrice;
  const eduBundleCost = population * cheapestEduPrice;
  const luxuryBundleCost = population * cheapestLuxuryPrice;
  const influenceBundleCost = population * influencePrice;

  // Cash math
  const mandatoryOutlay = totalTaxes + foodBill;
  const inflow = cashInBank + revenue + wagesReceived;
  const netCashAfterMandatory = inflow - mandatoryOutlay;
  const excessWealthPoints = Math.max(0, Math.floor(netCashAfterMandatory / 15));

  // Prosperity boosts — greedy fit of the three free-action bundles
  // (health, edu, luxury) into netCashAfterMandatory, cheapest-first.
  // Influence is for lobbying, not prosperity, so excluded.
  const bundles = [healthBundleCost, eduBundleCost, luxuryBundleCost]
    .filter((c) => c > 0)
    .sort((a, b) => a - b);
  let remaining = Math.max(0, netCashAfterMandatory);
  let maxBoostsAfforded = 0;
  for (const cost of bundles) {
    if (remaining >= cost) {
      remaining -= cost;
      maxBoostsAfforded += 1;
    } else {
      break;
    }
  }

  const scoringBoost: 0 | 1 =
    operationalOwnCompanies > prosperity ? 1 : 0;
  const prosperityPotential = Math.min(
    5,
    prosperity + scoringBoost + maxBoostsAfforded,
  );

  // Alerts
  const loanRisk = inflow < mandatoryOutlay;
  const scoringBoostLost = operationalOwnCompanies <= prosperity;

  // Policy stoplight
  let goodCount = 0;
  let neutralCount = 0;
  let troubleCount = 0;
  let sectionBCount = 0;
  const stoplight = {} as Record<PolicyId, StoplightColour>;
  for (const id of POLICY_IDS) {
    const pos = policies[id];
    const s = MC_STOPLIGHT_TABLE[id][pos];
    stoplight[id] = s;
    if (s === "good") goodCount += 1;
    else if (s === "neutral") neutralCount += 1;
    else troubleCount += 1;
    if (SECTION_B_VP_POLICIES.includes(id) && pos === "B") {
      sectionBCount += 1;
    }
  }

  // EOG VP (rulebook page 25)
  const eogPolicyVp = triangular(sectionBCount);
  const eogStorageVp =
    Math.floor(storage.food / 2) +
    Math.floor(storage.luxury / 3) +
    Math.floor(storage.health / 3) +
    Math.floor(storage.education / 3);
  const eogCashVp = Math.floor(cashInBank / 15);
  const eogTotalVp = eogPolicyVp + eogStorageVp + eogCashVp;

  return {
    taxMultiplier: taxMult,
    incomeTaxPerUnit: itPerUnit,
    mcIncomeTax,
    mcEmploymentTax,
    totalTaxes,

    cheapestFoodPrice,
    cheapestLuxuryPrice,
    cheapestHealthPrice,
    cheapestEduPrice,
    influencePrice,
    cheapestFoodSource,
    cheapestLuxurySource,
    cheapestHealthSource,
    cheapestEduSource,

    foodBill,
    healthBundleCost,
    eduBundleCost,
    luxuryBundleCost,
    influenceBundleCost,

    mandatoryOutlay,
    netCashAfterMandatory,
    excessWealthPoints,

    scoringBoost,
    maxBoostsAfforded,
    prosperityPotential,

    loanRisk,
    scoringBoostLost,

    policyStoplight: stoplight,
    goodCount,
    neutralCount,
    troubleCount,
    sectionBCount,

    eogPolicyVp,
    eogStorageVp,
    eogCashVp,
    eogTotalVp,
  };
}

export const MC_ROUND_ONE_DEFAULTS: MCInputs = {
  population: 10,
  prosperity: 0,
  cashInBank: 40,
  revenue: 0,
  wagesReceived: 0,
  operationalOwnCompanies: 2,
  companiesEmployedElsewhere: 0,
  // mcSelf left undefined at R1 — starting storage (1 food / 0 lux / 1
  // health / 0 edu) is below population (10), so "free from self" isn't
  // a valid full-bundle source. Player toggles mcSelf to 0 once they
  // have ≥population of the good in storage and choose to self-supply.
  goods: {
    food: { cc: 12, foreign: 14 },
    luxury: { cc: 8, foreign: 10 },
    health: { cc: 10, state: 5 },
    edu: { cc: 10, state: 5 },
    influence: { state: 10 },
  },
  storage: {
    food: 1,
    luxury: 0,
    health: 1,
    education: 0,
    influence: 1,
  },
  policies: {
    fiscal: "C",
    laborMarket: "B",
    taxation: "A",
    health: "B",
    education: "C",
    foreignTrade: "B",
    immigration: "B",
  },
};
