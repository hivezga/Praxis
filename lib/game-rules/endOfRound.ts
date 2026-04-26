import { suggestTaxes, type TaxSuggestion } from "./taxes";
import { vpFor } from "./vp";
import type { GameState } from "../types/game";

export interface RoundSuggestion {
  taxes: TaxSuggestion;
  vpAtScoring: {
    working: number;
    middle: number;
    capitalist: number;
    state: number;
  };
  // Suggested wage/welfare lines — heuristic, editable in UI.
  wages: {
    fromCapitalist: number;
    fromMiddle: number;
    toWorking: number;
  };
  welfareCosts: {
    fromState: number;
    notes: string;
  };
  prosperityDelta: {
    working: number;
    middle: number;
  };
  notes: string[];
}

export function computeRoundSuggestion(state: GameState): RoundSuggestion {
  const taxes = suggestTaxes(state);
  const m = taxes.multiplier;

  // Wages: each company pays wageLevel * 5 per assigned worker (rough heuristic).
  const wagePerWorker = (level: 1 | 2 | 3) => level * 5;
  const fromCapitalist = state.classes.capitalist.companies.reduce(
    (sum, c) => sum + c.workersAssigned * wagePerWorker(c.wageLevel),
    0
  );
  const fromMiddle = state.classes.middle.companies.reduce(
    (sum, c) => sum + c.workingClassEmployees * wagePerWorker(c.wageLevel),
    0
  );
  const toWorking = fromCapitalist + fromMiddle;

  // Public services: free at policy A (cost +2 multiplier), $5 at B, $10 at C.
  const welfareUseEstimate =
    state.classes.working.population + state.classes.middle.population;
  const fromState =
    (state.policies.healthBenefits.position === "A" ? welfareUseEstimate : 0) +
    (state.policies.educationWelfare.position === "A" ? welfareUseEstimate : 0);

  // Prosperity heuristic: +1 if Health+Education+Luxury sum >= population.
  const w = state.classes.working;
  const md = state.classes.middle;
  const wPros =
    w.storage.health + w.storage.education + w.storage.luxury >= w.population
      ? 1
      : 0;
  const mPros =
    md.storage.health + md.storage.education + md.storage.luxury >= md.population
      ? 1
      : 0;

  return {
    taxes,
    wages: { fromCapitalist, fromMiddle, toWorking },
    welfareCosts: {
      fromState,
      notes:
        "Free policies (section A) cost the State per use; sections B/C charge users instead.",
    },
    prosperityDelta: { working: wPros, middle: mPros },
    vpAtScoring: {
      working: vpFor("working", state).total,
      middle: vpFor("middle", state).total,
      capitalist: vpFor("capitalist", state).total,
      state: vpFor("state", state).total,
    },
    notes: [
      `Tax multiplier this round: ×${m}`,
      "Suggestions are heuristics — edit any number before applying.",
    ],
  };
}
