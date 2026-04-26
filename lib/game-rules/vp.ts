import type { GameState, ClassId } from "../types/game";

// Compute the live "displayed" VP total per class. Includes the persistent VP track
// plus running bonuses that would be awarded right now if the round ended.
// This is intentionally conservative — rules-faithful end-of-round scoring lives in scoring.ts.

export interface VpBreakdown {
  base: number;
  prosperity?: number;
  tradeUnions?: number;
  storage?: number;
  legitimacy?: number;
  cash?: number;
  capital?: number;
  total: number;
}

export function workingVp(state: GameState): VpBreakdown {
  const w = state.classes.working;
  const tradeUnions =
    w.tradeUnions.filter((t) => t.workersAssigned >= 4).length * 2;
  const cash = Math.floor(w.money / 10);
  return {
    base: w.vp,
    prosperity: w.prosperity,
    tradeUnions,
    cash,
    total: w.vp + w.prosperity + tradeUnions + cash,
  };
}

export function middleVp(state: GameState): VpBreakdown {
  const m = state.classes.middle;
  const storage =
    Math.floor(
      (m.storage.food +
        m.storage.luxury +
        m.storage.health +
        m.storage.education +
        m.storage.influence) /
        2
    );
  const cash = Math.floor(m.money / 15);
  return {
    base: m.vp,
    prosperity: m.prosperity,
    storage,
    cash,
    total: m.vp + m.prosperity + storage + cash,
  };
}

export function capitalistVp(state: GameState): VpBreakdown {
  const c = state.classes.capitalist;
  // Wealth-table approximation: 1 VP per 30 capital. Replace with real table later.
  const capital = Math.floor(c.capital / 30);
  return {
    base: c.vp,
    capital,
    total: c.vp + capital,
  };
}

export function stateVp(state: GameState): VpBreakdown {
  const s = state.classes.state;
  // Sum of two lowest legitimacy values (the per-round Scoring VP).
  const legitValues = Object.values(s.legitimacy).sort((a, b) => a - b);
  const legitimacy = (legitValues[0] ?? 0) + (legitValues[1] ?? 0);
  const cash = Math.floor(s.treasury / 30);
  return {
    base: s.vp,
    legitimacy,
    cash,
    total: s.vp + legitimacy + cash,
  };
}

export function vpFor(classId: ClassId, state: GameState): VpBreakdown {
  switch (classId) {
    case "working":
      return workingVp(state);
    case "middle":
      return middleVp(state);
    case "capitalist":
      return capitalistVp(state);
    case "state":
      return stateVp(state);
  }
}
