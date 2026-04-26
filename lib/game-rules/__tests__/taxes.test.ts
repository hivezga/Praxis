import { describe, expect, it } from "vitest";

import { computeTaxMultiplier } from "../taxes";
import type { PolicyId, PolicySection } from "../../types/game";

function policies(
  overrides: Partial<Record<PolicyId, PolicySection>> = {}
): Record<PolicyId, { position: PolicySection }> {
  const base: Record<PolicyId, PolicySection> = {
    fiscalPolicy: "C",
    laborMarket: "C",
    taxation: "A",
    healthBenefits: "C",
    educationWelfare: "C",
    foreignTrade: "C",
    immigration: "A",
  };
  const merged = { ...base, ...overrides };
  return Object.fromEntries(
    (Object.keys(merged) as PolicyId[]).map((k) => [k, { position: merged[k] }])
  ) as Record<PolicyId, { position: PolicySection }>;
}

describe("computeTaxMultiplier", () => {
  it("at high tax + private welfare = 3", () => {
    expect(computeTaxMultiplier(policies())).toBe(3);
  });

  it("low tax + private welfare = 1", () => {
    expect(
      computeTaxMultiplier(policies({ taxation: "C" }))
    ).toBe(1);
  });

  it("high tax + universal health & education = 7", () => {
    expect(
      computeTaxMultiplier(
        policies({ healthBenefits: "A", educationWelfare: "A" })
      )
    ).toBe(7);
  });

  it("medium tax + subsidized welfare on both = 4", () => {
    expect(
      computeTaxMultiplier(
        policies({
          taxation: "B",
          healthBenefits: "B",
          educationWelfare: "B",
        })
      )
    ).toBe(4);
  });
});
