// Working Class Companion — pure calculation module.
//
// Formulas mirror `crates/hegemony-core/src/rules/taxes.rs` (rulebook v1.2,
// pages 17, 25, 30, 31). Duplicated in TS so the calculator works without
// WASM initialisation.

export type IndustryColour = "red" | "blue" | "yellow" | "green" | "purple";
export type PolicyPosition = "A" | "B" | "C";
export type PolicyId =
  | "fiscal"
  | "laborMarket"
  | "taxation"
  | "health"
  | "education"
  | "foreignTrade"
  | "immigration";
export type TUStatus = "none" | "eligible" | "formed";
export type StoplightColour = "good" | "neutral" | "trouble";
export type FoodSource = "cc" | "mc" | "state";
export type CareSource = "mc" | "state";

export const INDUSTRY_COLOURS: IndustryColour[] = [
  "red",
  "blue",
  "yellow",
  "green",
  "purple",
];

export const POLICY_IDS: PolicyId[] = [
  "fiscal",
  "laborMarket",
  "taxation",
  "health",
  "education",
  "foreignTrade",
  "immigration",
];

export interface WCInputs {
  population: number;
  prosperity: number;
  cashInBank: number;
  wagesReceived: number;
  crisisAndControl: boolean;
  coopFarmCount: number;
  healthCoopCount: number;
  educationCoopCount: number;

  goods: {
    food: { cc?: number; mc?: number; state?: number };
    health: { mc?: number; state?: number };
    edu: { mc?: number; state?: number };
    luxury: { cc?: number };
  };

  workforce: {
    unemployed: number;
    lowestWageLevel: 1 | 2 | 3;
    byColour: Record<
      IndustryColour,
      { employed: number; vacancies: number; union: TUStatus }
    >;
  };

  policies: Record<PolicyId, PolicyPosition>;
}

export interface WCOutputs {
  taxMultiplier: number;
  incomeTaxPerUnit: number;
  wcIncomeTax: number;

  cheapestFoodPrice: number;
  cheapestHealthPrice: number;
  cheapestEduPrice: number;
  luxuryPrice: number;
  cheapestFoodSource: FoodSource;
  cheapestHealthSource: CareSource;
  cheapestEduSource: CareSource;

  foodBill: number;
  healthBill: number;
  eduBill: number;
  luxuryBill: number;
  bundleCost: number;
  bundlePrice: number;
  coverNeeds: number;
  wagesNeeded: number;
  wagesShortfall: number;
  wagesSurplus: number;

  treasuryAfterTax: number;
  excessWealthPoints: number;
  maxBundles: number;
  prosperityPotential: number;

  totalVacancies: number;
  demonstrationAlert: boolean;
  strikeAlert: boolean;

  tuByColour: Record<IndustryColour, TUStatus>;
  tuFormedCount: number;
  tuEligibleCount: number;
  tuVpNow: number;
  tuVpPotential: number;

  policyStoplight: Record<PolicyId, StoplightColour>;
  goodCount: number;
  neutralCount: number;
  troubleCount: number;
  eogPolicyVpEstimate: number;
}

function welfareMod(p: PolicyPosition): number {
  return p === "A" ? 2 : p === "B" ? 1 : 0;
}

export function taxMultiplier(
  taxation: PolicyPosition,
  health: PolicyPosition,
  education: PolicyPosition,
): number {
  const h = welfareMod(health);
  const e = welfareMod(education);
  switch (taxation) {
    case "A":
      return 3 + 2 * (h + e);
    case "B":
      return 2 + (h + e);
    case "C":
      return 1;
  }
}

const INCOME_TAX_TABLE: Record<
  PolicyPosition,
  Record<PolicyPosition, number>
> = {
  A: { A: 7, B: 6, C: 5 },
  B: { A: 4, B: 4, C: 4 },
  C: { A: 1, B: 2, C: 3 },
};

export function incomeTaxPerUnit(
  laborMarket: PolicyPosition,
  taxation: PolicyPosition,
): number {
  return INCOME_TAX_TABLE[laborMarket][taxation];
}

export function cheapestSource(
  prices: Partial<Record<string, number>>,
): { price: number; source: string } {
  let bestSource = "";
  let bestPrice = Infinity;
  for (const [source, price] of Object.entries(prices)) {
    if (typeof price === "number" && price < bestPrice) {
      bestPrice = price;
      bestSource = source;
    }
  }
  return { price: bestPrice, source: bestSource };
}

export function tuVp(formedCount: number): number {
  const n = Math.max(0, Math.min(5, Math.floor(formedCount)));
  return (n * (n + 1)) / 2;
}

const POLICY_STOPLIGHT_TABLE: Record<
  PolicyId,
  Record<PolicyPosition, StoplightColour>
> = {
  fiscal: { A: "neutral", B: "neutral", C: "neutral" },
  laborMarket: { A: "good", B: "neutral", C: "trouble" },
  taxation: { A: "good", B: "neutral", C: "trouble" },
  health: { A: "good", B: "neutral", C: "trouble" },
  education: { A: "good", B: "neutral", C: "trouble" },
  foreignTrade: { A: "trouble", B: "neutral", C: "good" },
  immigration: { A: "trouble", B: "neutral", C: "good" },
};

export function policyStoplight(
  id: PolicyId,
  position: PolicyPosition,
): StoplightColour {
  return POLICY_STOPLIGHT_TABLE[id][position];
}

export function eogPolicyVpEstimate(
  outputs: Pick<WCOutputs, "goodCount" | "troubleCount">,
): number {
  return outputs.goodCount * 3 - outputs.troubleCount * 2;
}

export function computeWC(inputs: WCInputs): WCOutputs {
  const {
    policies,
    population,
    prosperity,
    cashInBank,
    wagesReceived,
    crisisAndControl,
  } = inputs;

  const taxMult = taxMultiplier(
    policies.taxation,
    policies.health,
    policies.education,
  );
  const itPerUnit = incomeTaxPerUnit(policies.laborMarket, policies.taxation);
  const wcIncomeTax = population * itPerUnit;

  const food = cheapestSource(inputs.goods.food);
  const careHealth = cheapestSource(inputs.goods.health);
  const careEdu = cheapestSource(inputs.goods.edu);
  const luxuryPrice = inputs.goods.luxury.cc ?? 0;

  const cheapestFoodPrice = food.price === Infinity ? 0 : food.price;
  const cheapestHealthPrice =
    careHealth.price === Infinity ? 0 : careHealth.price;
  const cheapestEduPrice = careEdu.price === Infinity ? 0 : careEdu.price;

  const cheapestFoodSource = (food.source || "cc") as FoodSource;
  const cheapestHealthSource = (careHealth.source || "mc") as CareSource;
  const cheapestEduSource = (careEdu.source || "mc") as CareSource;

  const healthCoops = crisisAndControl ? inputs.healthCoopCount : 0;
  const eduCoops = crisisAndControl ? inputs.educationCoopCount : 0;

  const foodBuyers = Math.max(
    0,
    population - inputs.coopFarmCount - healthCoops - eduCoops,
  );
  const healthBuyers = Math.max(0, population - healthCoops);
  const eduBuyers = Math.max(0, population - eduCoops);

  const foodBill = foodBuyers * cheapestFoodPrice;
  const healthBill = healthBuyers * cheapestHealthPrice;
  const eduBill = eduBuyers * cheapestEduPrice;
  const luxuryBill = population * luxuryPrice;
  const bundleCost = foodBill + healthBill + eduBill + luxuryBill;

  const coverNeeds = wcIncomeTax + foodBill;
  const wagesNeeded = wcIncomeTax + bundleCost;
  const wagesShortfall = Math.max(0, wagesNeeded - wagesReceived);
  const wagesSurplus = Math.max(0, wagesReceived - wagesNeeded);

  const treasuryAfterTax = cashInBank + wagesReceived - wcIncomeTax;
  const excessWealthPoints = Math.max(0, Math.floor(treasuryAfterTax / 10));

  const bundlePrice =
    cheapestFoodPrice + cheapestHealthPrice + cheapestEduPrice + luxuryPrice;
  const maxBundles =
    bundlePrice > 0 ? Math.max(0, Math.floor(treasuryAfterTax / bundlePrice)) : 0;
  const prosperityPotential = Math.min(5, prosperity + maxBundles);

  let totalVacancies = 0;
  const tuByColour = {} as Record<IndustryColour, TUStatus>;
  let tuFormedCount = 0;
  let tuEligibleCount = 0;
  for (const c of INDUSTRY_COLOURS) {
    const row = inputs.workforce.byColour[c];
    totalVacancies += row.vacancies;
    let status: TUStatus;
    if (row.union === "formed") {
      status = "formed";
      tuFormedCount += 1;
    } else if (row.employed >= 4) {
      status = "eligible";
      tuEligibleCount += 1;
    } else {
      status = "none";
    }
    tuByColour[c] = status;
  }
  const demonstrationAlert =
    inputs.workforce.unemployed > totalVacancies + 2;
  const strikeAlert = inputs.workforce.lowestWageLevel < 3;

  const tuVpNow = tuVp(tuFormedCount);
  const tuVpPotential = tuVp(tuFormedCount + tuEligibleCount);

  let goodCount = 0;
  let neutralCount = 0;
  let troubleCount = 0;
  const stoplight = {} as Record<PolicyId, StoplightColour>;
  for (const id of POLICY_IDS) {
    const s = POLICY_STOPLIGHT_TABLE[id][policies[id]];
    stoplight[id] = s;
    if (s === "good") goodCount += 1;
    else if (s === "neutral") neutralCount += 1;
    else troubleCount += 1;
  }
  const eogEstimate = goodCount * 3 - troubleCount * 2;

  return {
    taxMultiplier: taxMult,
    incomeTaxPerUnit: itPerUnit,
    wcIncomeTax,
    cheapestFoodPrice,
    cheapestHealthPrice,
    cheapestEduPrice,
    luxuryPrice,
    cheapestFoodSource,
    cheapestHealthSource,
    cheapestEduSource,
    foodBill,
    healthBill,
    eduBill,
    luxuryBill,
    bundleCost,
    bundlePrice,
    coverNeeds,
    wagesNeeded,
    wagesShortfall,
    wagesSurplus,
    treasuryAfterTax,
    excessWealthPoints,
    maxBundles,
    prosperityPotential,
    totalVacancies,
    demonstrationAlert,
    strikeAlert,
    tuByColour,
    tuFormedCount,
    tuEligibleCount,
    tuVpNow,
    tuVpPotential,
    policyStoplight: stoplight,
    goodCount,
    neutralCount,
    troubleCount,
    eogPolicyVpEstimate: eogEstimate,
  };
}

export const WC_ROUND_ONE_DEFAULTS: WCInputs = {
  population: 15,
  prosperity: 2,
  cashInBank: 0,
  wagesReceived: 0,
  crisisAndControl: false,
  coopFarmCount: 0,
  healthCoopCount: 0,
  educationCoopCount: 0,
  goods: {
    food: { cc: 3, mc: 4, state: 5 },
    health: { mc: 4, state: 5 },
    edu: { mc: 4, state: 5 },
    luxury: { cc: 3 },
  },
  workforce: {
    unemployed: 0,
    lowestWageLevel: 3,
    byColour: {
      red: { employed: 0, vacancies: 0, union: "none" },
      blue: { employed: 0, vacancies: 0, union: "none" },
      yellow: { employed: 0, vacancies: 0, union: "none" },
      green: { employed: 0, vacancies: 0, union: "none" },
      purple: { employed: 0, vacancies: 0, union: "none" },
    },
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
