import { describe, expect, it } from "vitest";

import {
  cheapestSource,
  computeWC,
  eogPolicyVpEstimate,
  INDUSTRY_COLOURS,
  incomeTaxPerUnit,
  policyStoplight,
  taxMultiplier,
  tuVp,
  WC_ROUND_ONE_DEFAULTS,
  type PolicyPosition,
  type WCInputs,
} from "../wc-companion";

function baseInputs(overrides: Partial<WCInputs> = {}): WCInputs {
  const byColour = {} as WCInputs["workforce"]["byColour"];
  for (const c of INDUSTRY_COLOURS) {
    byColour[c] = { employed: 0, vacancies: 0, union: "none" };
  }
  return {
    ...WC_ROUND_ONE_DEFAULTS,
    workforce: {
      unemployed: 0,
      lowestWageLevel: 3,
      byColour,
    },
    ...overrides,
  };
}

describe("incomeTaxPerUnit — all 9 cells", () => {
  const cases: [PolicyPosition, PolicyPosition, number][] = [
    ["A", "A", 7],
    ["A", "B", 6],
    ["A", "C", 5],
    ["B", "A", 4],
    ["B", "B", 4],
    ["B", "C", 4],
    ["C", "A", 1],
    ["C", "B", 2],
    ["C", "C", 3],
  ];
  it.each(cases)("lm=%s tax=%s → %i", (lm, tax, v) => {
    expect(incomeTaxPerUnit(lm, tax)).toBe(v);
  });
});

describe("taxMultiplier", () => {
  it("matches the printed track values {1..7, 9, 11}", () => {
    const seen = new Set<number>();
    const positions: PolicyPosition[] = ["A", "B", "C"];
    for (const t of positions) {
      for (const h of positions) {
        for (const e of positions) {
          seen.add(taxMultiplier(t, h, e));
        }
      }
    }
    expect([...seen].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 9, 11]);
  });

  it("returns 1 for Tax=C regardless of welfare", () => {
    const positions: PolicyPosition[] = ["A", "B", "C"];
    for (const h of positions) {
      for (const e of positions) {
        expect(taxMultiplier("C", h, e)).toBe(1);
      }
    }
  });

  it("Tax=A doubles welfare contribution", () => {
    expect(taxMultiplier("A", "A", "A")).toBe(11);
    expect(taxMultiplier("A", "C", "C")).toBe(3);
  });
});

describe("cheapestSource", () => {
  it("picks the minimum and returns its label", () => {
    expect(cheapestSource({ cc: 5, mc: 3, state: 4 })).toEqual({
      price: 3,
      source: "mc",
    });
  });

  it("ignores undefined entries", () => {
    expect(cheapestSource({ mc: 4, state: 5 })).toEqual({
      price: 4,
      source: "mc",
    });
  });

  it("returns Infinity / empty source when nothing is priced", () => {
    expect(cheapestSource({})).toEqual({ price: Infinity, source: "" });
  });
});

describe("tuVp — 0..5 formed unions", () => {
  it.each([
    [0, 0],
    [1, 1],
    [2, 3],
    [3, 6],
    [4, 10],
    [5, 15],
  ])("formed=%i → %i", (n, v) => {
    expect(tuVp(n)).toBe(v);
  });

  it("clamps above 5", () => {
    expect(tuVp(99)).toBe(15);
  });
});

describe("policyStoplight", () => {
  it("matches rulebook entries", () => {
    expect(policyStoplight("fiscal", "A")).toBe("neutral");
    expect(policyStoplight("fiscal", "B")).toBe("neutral");
    expect(policyStoplight("fiscal", "C")).toBe("neutral");
    expect(policyStoplight("laborMarket", "A")).toBe("good");
    expect(policyStoplight("laborMarket", "C")).toBe("trouble");
    expect(policyStoplight("taxation", "A")).toBe("good");
    expect(policyStoplight("foreignTrade", "A")).toBe("trouble");
    expect(policyStoplight("foreignTrade", "C")).toBe("good");
    expect(policyStoplight("immigration", "A")).toBe("trouble");
    expect(policyStoplight("immigration", "C")).toBe("good");
  });
});

describe("computeWC — bundle cost & coops", () => {
  it("C&C off: ignores health and education coop inputs", () => {
    const out = computeWC(
      baseInputs({
        crisisAndControl: false,
        coopFarmCount: 0,
        healthCoopCount: 5,
        educationCoopCount: 5,
      }),
    );
    expect(out.foodBill).toBe(15 * 3);
    expect(out.healthBill).toBe(15 * 4);
    expect(out.eduBill).toBe(15 * 4);
  });

  it("C&C on: subtracts food, health, and education coops", () => {
    const out = computeWC(
      baseInputs({
        crisisAndControl: true,
        coopFarmCount: 2,
        healthCoopCount: 3,
        educationCoopCount: 1,
      }),
    );
    // food buyers = 15 - 2 - 3 - 1 = 9
    // health buyers = 15 - 3 = 12
    // edu buyers   = 15 - 1 = 14
    expect(out.foodBill).toBe(9 * 3);
    expect(out.healthBill).toBe(12 * 4);
    expect(out.eduBill).toBe(14 * 4);
  });

  it("luxury bill always uses full population (no coops)", () => {
    const out = computeWC(baseInputs({ crisisAndControl: true, coopFarmCount: 5 }));
    expect(out.luxuryBill).toBe(15 * 3);
  });
});

describe("computeWC — wages shortfall / surplus", () => {
  it("are never both non-zero", () => {
    for (const wagesReceived of [0, 50, 100, 200, 1_000, 999_999]) {
      const out = computeWC(baseInputs({ wagesReceived }));
      expect(out.wagesShortfall === 0 || out.wagesSurplus === 0).toBe(true);
    }
  });

  it("shortfall when wages below need", () => {
    const out = computeWC(baseInputs({ wagesReceived: 0 }));
    expect(out.wagesShortfall).toBeGreaterThan(0);
    expect(out.wagesSurplus).toBe(0);
  });

  it("surplus when wages above need", () => {
    const out = computeWC(baseInputs({ wagesReceived: 999_999 }));
    expect(out.wagesSurplus).toBeGreaterThan(0);
    expect(out.wagesShortfall).toBe(0);
  });

  it("both zero when wages exactly meet need", () => {
    const draft = computeWC(baseInputs());
    const out = computeWC(baseInputs({ wagesReceived: draft.wagesNeeded }));
    expect(out.wagesShortfall).toBe(0);
    expect(out.wagesSurplus).toBe(0);
  });
});

describe("computeWC — prosperity potential", () => {
  it("caps at 5", () => {
    const out = computeWC(
      baseInputs({ prosperity: 4, cashInBank: 100_000, wagesReceived: 100_000 }),
    );
    expect(out.prosperityPotential).toBe(5);
  });

  it("never drops below current prosperity", () => {
    const out = computeWC(baseInputs({ prosperity: 2, cashInBank: 0, wagesReceived: 0 }));
    expect(out.prosperityPotential).toBeGreaterThanOrEqual(2);
  });
});

describe("computeWC — demonstration boundary", () => {
  it("unemployed == vacancies + 2 → false", () => {
    const inputs = baseInputs();
    inputs.workforce.byColour.red.vacancies = 1; // total vacancies = 1, threshold = 3
    inputs.workforce.unemployed = 3;
    expect(computeWC(inputs).demonstrationAlert).toBe(false);
  });

  it("unemployed == vacancies + 3 → true", () => {
    const inputs = baseInputs();
    inputs.workforce.byColour.red.vacancies = 1;
    inputs.workforce.unemployed = 4;
    expect(computeWC(inputs).demonstrationAlert).toBe(true);
  });
});

describe("computeWC — strike alert", () => {
  it("lowestWageLevel = 1 or 2 → true", () => {
    for (const lvl of [1, 2] as const) {
      const inputs = baseInputs();
      inputs.workforce.lowestWageLevel = lvl;
      expect(computeWC(inputs).strikeAlert).toBe(true);
    }
  });

  it("lowestWageLevel = 3 → false", () => {
    const inputs = baseInputs();
    inputs.workforce.lowestWageLevel = 3;
    expect(computeWC(inputs).strikeAlert).toBe(false);
  });
});

describe("computeWC — trade unions", () => {
  it("auto-marks eligible at employed >= 4", () => {
    const inputs = baseInputs();
    inputs.workforce.byColour.red.employed = 3;
    inputs.workforce.byColour.blue.employed = 4;
    inputs.workforce.byColour.yellow.employed = 5;
    const out = computeWC(inputs);
    expect(out.tuByColour.red).toBe("none");
    expect(out.tuByColour.blue).toBe("eligible");
    expect(out.tuByColour.yellow).toBe("eligible");
  });

  it("formed status is sticky regardless of employed count", () => {
    const inputs = baseInputs();
    inputs.workforce.byColour.red.employed = 0;
    inputs.workforce.byColour.red.union = "formed";
    const out = computeWC(inputs);
    expect(out.tuByColour.red).toBe("formed");
    expect(out.tuFormedCount).toBe(1);
    expect(out.tuVpNow).toBe(1);
  });

  it("VP potential includes both formed + eligible", () => {
    const inputs = baseInputs();
    inputs.workforce.byColour.red.union = "formed";
    inputs.workforce.byColour.blue.employed = 4;
    inputs.workforce.byColour.yellow.employed = 4;
    const out = computeWC(inputs);
    expect(out.tuFormedCount).toBe(1);
    expect(out.tuEligibleCount).toBe(2);
    expect(out.tuVpNow).toBe(1);
    expect(out.tuVpPotential).toBe(6); // 1+2+3
  });
});

describe("computeWC — policy summary", () => {
  it("Round 1 defaults: 1 good, 5 neutral, 1 trouble", () => {
    // fiscal C neutral, laborMarket B neutral, taxation A good, health B neutral,
    // education C trouble, foreignTrade B neutral, immigration B neutral
    const out = computeWC(baseInputs());
    expect(out.goodCount).toBe(1);
    expect(out.neutralCount).toBe(5);
    expect(out.troubleCount).toBe(1);
    expect(out.eogPolicyVpEstimate).toBe(1 * 3 - 1 * 2);
  });

  it("eogPolicyVpEstimate helper matches inline computation", () => {
    const out = computeWC(baseInputs());
    expect(eogPolicyVpEstimate(out)).toBe(out.eogPolicyVpEstimate);
  });
});
