import { describe, expect, it } from "vitest";

import {
  cheapestSource,
  computeMC,
  mcPolicyStoplight,
  triangular,
  MC_ROUND_ONE_DEFAULTS,
  type MCInputs,
} from "../mc-companion";

function baseInputs(overrides: Partial<MCInputs> = {}): MCInputs {
  // Deep clone — the default has nested objects (goods, storage, policies);
  // a shallow spread would let one test mutate state seen by later tests.
  return {
    ...structuredClone(MC_ROUND_ONE_DEFAULTS),
    ...overrides,
  };
}

describe("triangular", () => {
  it.each([
    [0, 0],
    [1, 1],
    [2, 3],
    [3, 6],
    [4, 10],
    [5, 15],
  ])("n=%i → %i", (n, v) => {
    expect(triangular(n)).toBe(v);
  });

  it("clamps above 5", () => {
    expect(triangular(99)).toBe(15);
  });

  it("clamps below 0", () => {
    expect(triangular(-3)).toBe(0);
  });
});

describe("cheapestSource", () => {
  it("returns min with source label", () => {
    expect(cheapestSource({ cc: 12, mcSelf: 0, foreign: 14 })).toEqual({
      price: 0,
      source: "mcSelf",
    });
  });

  it("ignores undefined entries", () => {
    expect(cheapestSource({ cc: 12, foreign: 14 })).toEqual({
      price: 12,
      source: "cc",
    });
  });

  it("empty input returns Infinity / empty source", () => {
    expect(cheapestSource({})).toEqual({ price: Infinity, source: "" });
  });
});

describe("mcPolicyStoplight", () => {
  it("policies 1–5: B is good, A and C are trouble", () => {
    for (const id of ["fiscal", "laborMarket", "taxation", "health", "education"] as const) {
      expect(mcPolicyStoplight(id, "A")).toBe("trouble");
      expect(mcPolicyStoplight(id, "B")).toBe("good");
      expect(mcPolicyStoplight(id, "C")).toBe("trouble");
    }
  });

  it("foreign trade: A=good, B=neutral, C=trouble", () => {
    expect(mcPolicyStoplight("foreignTrade", "A")).toBe("good");
    expect(mcPolicyStoplight("foreignTrade", "B")).toBe("neutral");
    expect(mcPolicyStoplight("foreignTrade", "C")).toBe("trouble");
  });

  it("immigration: all neutral", () => {
    expect(mcPolicyStoplight("immigration", "A")).toBe("neutral");
    expect(mcPolicyStoplight("immigration", "B")).toBe("neutral");
    expect(mcPolicyStoplight("immigration", "C")).toBe("neutral");
  });
});

describe("computeMC — taxes", () => {
  it("R1 defaults: tax multiplier ×5, income tax/unit 4¥, mcIncomeTax 0¥ (no outside companies)", () => {
    const out = computeMC(baseInputs());
    expect(out.taxMultiplier).toBe(5);
    expect(out.incomeTaxPerUnit).toBe(4);
    expect(out.mcIncomeTax).toBe(0);
    expect(out.mcEmploymentTax).toBe(10); // 2 ops × 5
    expect(out.totalTaxes).toBe(10);
  });

  it("income tax = companies-employed-elsewhere × incomeTaxPerUnit (rulebook p.25)", () => {
    const out = computeMC(baseInputs({ companiesEmployedElsewhere: 3 }));
    // LM=B, Tax=A → 4. 3 × 4 = 12.
    expect(out.mcIncomeTax).toBe(12);
  });

  it("employment tax = operational own × multiplier", () => {
    const out = computeMC(baseInputs({ operationalOwnCompanies: 6 }));
    expect(out.mcEmploymentTax).toBe(6 * 5);
  });
});

describe("computeMC — food bill (mandatory)", () => {
  it("R1: food bill = population × cheapestFood (CC at 12)", () => {
    const out = computeMC(baseInputs());
    expect(out.cheapestFoodPrice).toBe(12);
    expect(out.cheapestFoodSource).toBe("cc");
    expect(out.foodBill).toBe(120);
  });

  it("mcSelf 0¥ becomes cheapest when set (player has storage)", () => {
    const inputs = baseInputs();
    inputs.goods.food = { ...inputs.goods.food, mcSelf: 0 };
    const out = computeMC(inputs);
    expect(out.cheapestFoodPrice).toBe(0);
    expect(out.cheapestFoodSource).toBe("mcSelf");
    expect(out.foodBill).toBe(0);
  });
});

describe("computeMC — loan risk boundary", () => {
  it("loan risk fires when inflow < mandatoryOutlay", () => {
    const out = computeMC(baseInputs()); // inflow 40, mandatory 130
    expect(out.loanRisk).toBe(true);
    expect(out.mandatoryOutlay).toBe(130);
  });

  it("loan risk off when inflow exactly meets mandatory", () => {
    const out = computeMC(baseInputs({ cashInBank: 130 })); // inflow 130
    expect(out.loanRisk).toBe(false);
  });

  it("loan risk off when inflow exceeds mandatory", () => {
    const out = computeMC(baseInputs({ cashInBank: 500 }));
    expect(out.loanRisk).toBe(false);
  });
});

describe("computeMC — scoring boost (Scoring Phase free prosperity)", () => {
  it("ops > prosperity → boost available", () => {
    const out = computeMC(
      baseInputs({ operationalOwnCompanies: 3, prosperity: 2 }),
    );
    expect(out.scoringBoost).toBe(1);
    expect(out.scoringBoostLost).toBe(false);
  });

  it("ops == prosperity → boost lost (boundary)", () => {
    const out = computeMC(
      baseInputs({ operationalOwnCompanies: 2, prosperity: 2 }),
    );
    expect(out.scoringBoost).toBe(0);
    expect(out.scoringBoostLost).toBe(true);
  });

  it("ops < prosperity → boost lost", () => {
    const out = computeMC(
      baseInputs({ operationalOwnCompanies: 1, prosperity: 3 }),
    );
    expect(out.scoringBoost).toBe(0);
    expect(out.scoringBoostLost).toBe(true);
  });
});

describe("computeMC — prosperity action bundles (greedy fit)", () => {
  it("R1 default: cannot afford any bundle (mandatory eats inflow)", () => {
    const out = computeMC(baseInputs());
    expect(out.netCashAfterMandatory).toBeLessThanOrEqual(0);
    expect(out.maxBoostsAfforded).toBe(0);
  });

  it("with surplus 200, fits 2 of 3 bundles (50 + 50 = 100; luxury 80 → 3rd)", () => {
    // bundles: health 50, edu 50, luxury 80 (sorted: 50,50,80). 200 fits all.
    const out = computeMC(baseInputs({ cashInBank: 330 })); // inflow 330, mandatory 130 → net 200
    expect(out.netCashAfterMandatory).toBe(200);
    expect(out.healthBundleCost).toBe(50);
    expect(out.eduBundleCost).toBe(50);
    expect(out.luxuryBundleCost).toBe(80);
    expect(out.maxBoostsAfforded).toBe(3);
  });

  it("with surplus 75, fits 1 bundle (cheapest 50)", () => {
    const out = computeMC(baseInputs({ cashInBank: 205 })); // net 75
    expect(out.netCashAfterMandatory).toBe(75);
    expect(out.maxBoostsAfforded).toBe(1);
  });
});

describe("computeMC — prosperity potential cap", () => {
  it("never exceeds 5", () => {
    const out = computeMC(
      baseInputs({
        prosperity: 4,
        cashInBank: 1000,
        operationalOwnCompanies: 8,
      }),
    );
    expect(out.prosperityPotential).toBe(5);
  });
});

describe("computeMC — excess wealth points", () => {
  it("uses /15 (not /10 like WC)", () => {
    const out = computeMC(baseInputs({ cashInBank: 175 })); // net 45 (after 130 mandatory)
    expect(out.netCashAfterMandatory).toBe(45);
    expect(out.excessWealthPoints).toBe(3); // floor(45/15)
  });

  it("clamped to 0 when net is negative", () => {
    const out = computeMC(baseInputs()); // net negative
    expect(out.excessWealthPoints).toBe(0);
  });
});

describe("computeMC — EOG VP (rulebook page 25)", () => {
  it("R1: only laborMarket=B and health=B in section B → triangular(2) = 3", () => {
    const out = computeMC(baseInputs());
    expect(out.sectionBCount).toBe(2);
    expect(out.eogPolicyVp).toBe(3);
  });

  it("all 5 policies 1–5 in B → triangular(5) = 15", () => {
    const inputs = baseInputs();
    inputs.policies = {
      ...inputs.policies,
      fiscal: "B",
      laborMarket: "B",
      taxation: "B",
      health: "B",
      education: "B",
    };
    const out = computeMC(inputs);
    expect(out.sectionBCount).toBe(5);
    expect(out.eogPolicyVp).toBe(15);
  });

  it("Foreign Trade or Immigration in B does NOT add to section B count", () => {
    const inputs = baseInputs();
    inputs.policies = {
      ...inputs.policies,
      fiscal: "A",
      laborMarket: "A",
      taxation: "A",
      health: "A",
      education: "A",
      foreignTrade: "B",
      immigration: "B",
    };
    const out = computeMC(inputs);
    expect(out.sectionBCount).toBe(0);
    expect(out.eogPolicyVp).toBe(0);
  });

  it("storage VP uses food/2, lux/3, health/3, edu/3 (Influence excluded)", () => {
    const inputs = baseInputs();
    inputs.storage = { food: 8, luxury: 9, health: 9, education: 9, influence: 99 };
    const out = computeMC(inputs);
    // 8/2=4 + 9/3=3 + 9/3=3 + 9/3=3 = 13. Influence ignored.
    expect(out.eogStorageVp).toBe(13);
  });

  it("cash VP uses /15", () => {
    const out = computeMC(baseInputs({ cashInBank: 100 }));
    expect(out.eogCashVp).toBe(6); // floor(100/15)
  });

  it("total = policy + storage + cash", () => {
    const out = computeMC(baseInputs());
    expect(out.eogTotalVp).toBe(
      out.eogPolicyVp + out.eogStorageVp + out.eogCashVp,
    );
  });
});
