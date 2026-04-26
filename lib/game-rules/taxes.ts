import type { GameState, PolicyId, PolicySection } from "../types/game";

// Base tax value per Taxation policy section.
const TAX_BASE: Record<PolicySection, number> = { A: 3, B: 2, C: 1 };

// Welfare-policy modifiers add to the multiplier (more generous = costlier taxes).
const WELFARE_MOD: Record<PolicySection, number> = { A: 2, B: 1, C: 0 };

export function computeTaxMultiplier(
  policies: Record<PolicyId, { position: PolicySection }>
): number {
  const base = TAX_BASE[policies.taxation.position];
  const welfare =
    WELFARE_MOD[policies.healthBenefits.position] +
    WELFARE_MOD[policies.educationWelfare.position];
  return base + welfare;
}

export interface TaxSuggestion {
  multiplier: number;
  workingIncomeTax: number;
  middleIncomeTax: number;
  middleEmploymentTax: number;
  capitalistIncomeTax: number;
  capitalistEmploymentTax: number;
  totalToTreasury: number;
}

// Heuristic suggestion for end-of-round taxes. Players can override values in the wizard.
export function suggestTaxes(state: GameState): TaxSuggestion {
  const m = computeTaxMultiplier(state.policies);
  const { working, middle, capitalist } = state.classes;

  const workingIncomeTax = Math.max(0, Math.floor(working.population * m * 0.5));
  const middleIncomeTax = Math.max(0, Math.floor(middle.population * m * 0.5));
  const middleEmploymentTax = middle.companies.length * m;
  const capitalistIncomeTax = Math.floor(capitalist.revenue / 10) * m;
  const capitalistEmploymentTax = capitalist.companies.length * m;

  const totalToTreasury =
    workingIncomeTax +
    middleIncomeTax +
    middleEmploymentTax +
    capitalistIncomeTax +
    capitalistEmploymentTax;

  return {
    multiplier: m,
    workingIncomeTax,
    middleIncomeTax,
    middleEmploymentTax,
    capitalistIncomeTax,
    capitalistEmploymentTax,
    totalToTreasury,
  };
}
