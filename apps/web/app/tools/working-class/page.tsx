"use client";

import { useEffect, useMemo, useReducer, useState } from "react";

import {
  computeWC,
  WC_ROUND_ONE_DEFAULTS,
  type IndustryColour,
  type PolicyId,
  type PolicyPosition,
  type TUStatus,
  type WCInputs,
} from "@/lib/tools/wc-companion";

import { ActionAlerts } from "./_components/ActionAlerts";
import { FinancialsCard } from "./_components/FinancialsCard";
import { InputPanel } from "./_components/InputPanel";
import { PolicyMap } from "./_components/PolicyMap";
import { RoundOneBanner } from "./_components/RoundOneBanner";
import { TradeUnionPanel } from "./_components/TradeUnionPanel";

const STORAGE_KEY = "wc-companion-inputs-v1";

type ScalarNumberKey =
  | "population"
  | "prosperity"
  | "cashInBank"
  | "wagesReceived"
  | "coopFarmCount"
  | "healthCoopCount"
  | "educationCoopCount";

export type WCAction =
  | { type: "reset" }
  | { type: "hydrate"; payload: WCInputs }
  | { type: "setNumber"; key: ScalarNumberKey; value: number }
  | { type: "setCrisisAndControl"; value: boolean }
  | {
      type: "setFoodPrice";
      source: "cc" | "mc" | "state";
      value: number | undefined;
    }
  | {
      type: "setHealthPrice";
      source: "mc" | "state";
      value: number | undefined;
    }
  | {
      type: "setEduPrice";
      source: "mc" | "state";
      value: number | undefined;
    }
  | { type: "setLuxuryPrice"; value: number | undefined }
  | { type: "setUnemployed"; value: number }
  | { type: "setLowestWage"; value: 1 | 2 | 3 }
  | { type: "setEmployed"; colour: IndustryColour; value: number }
  | { type: "setVacancies"; colour: IndustryColour; value: number }
  | { type: "setUnion"; colour: IndustryColour; status: TUStatus }
  | { type: "setPolicy"; id: PolicyId; position: PolicyPosition };

function makeDefaults(): WCInputs {
  return structuredClone(WC_ROUND_ONE_DEFAULTS);
}

function reducer(state: WCInputs, action: WCAction): WCInputs {
  switch (action.type) {
    case "reset":
      return makeDefaults();
    case "hydrate":
      return action.payload;
    case "setNumber":
      return { ...state, [action.key]: action.value };
    case "setCrisisAndControl":
      return { ...state, crisisAndControl: action.value };
    case "setFoodPrice":
      return {
        ...state,
        goods: {
          ...state.goods,
          food: { ...state.goods.food, [action.source]: action.value },
        },
      };
    case "setHealthPrice":
      return {
        ...state,
        goods: {
          ...state.goods,
          health: { ...state.goods.health, [action.source]: action.value },
        },
      };
    case "setEduPrice":
      return {
        ...state,
        goods: {
          ...state.goods,
          edu: { ...state.goods.edu, [action.source]: action.value },
        },
      };
    case "setLuxuryPrice":
      return {
        ...state,
        goods: { ...state.goods, luxury: { cc: action.value } },
      };
    case "setUnemployed":
      return {
        ...state,
        workforce: { ...state.workforce, unemployed: action.value },
      };
    case "setLowestWage":
      return {
        ...state,
        workforce: { ...state.workforce, lowestWageLevel: action.value },
      };
    case "setEmployed":
      return {
        ...state,
        workforce: {
          ...state.workforce,
          byColour: {
            ...state.workforce.byColour,
            [action.colour]: {
              ...state.workforce.byColour[action.colour],
              employed: action.value,
            },
          },
        },
      };
    case "setVacancies":
      return {
        ...state,
        workforce: {
          ...state.workforce,
          byColour: {
            ...state.workforce.byColour,
            [action.colour]: {
              ...state.workforce.byColour[action.colour],
              vacancies: action.value,
            },
          },
        },
      };
    case "setUnion":
      return {
        ...state,
        workforce: {
          ...state.workforce,
          byColour: {
            ...state.workforce.byColour,
            [action.colour]: {
              ...state.workforce.byColour[action.colour],
              union: action.status,
            },
          },
        },
      };
    case "setPolicy":
      return {
        ...state,
        policies: { ...state.policies, [action.id]: action.position },
      };
  }
}

// Minimal runtime check to guard against schema drift on hydration.
function isValidStoredShape(value: unknown): value is WCInputs {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.population === "number" &&
    typeof v.crisisAndControl === "boolean" &&
    typeof v.policies === "object" &&
    typeof v.goods === "object" &&
    typeof v.workforce === "object"
  );
}

export default function WorkingClassToolPage() {
  const [inputs, dispatch] = useReducer(reducer, undefined, makeDefaults);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isValidStoredShape(parsed)) {
          dispatch({ type: "hydrate", payload: parsed });
        }
      }
    } catch {
      // ignore malformed storage; fall back to defaults
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
    } catch {
      // quota or privacy mode — silent
    }
  }, [inputs, hydrated]);

  const outputs = useMemo(() => computeWC(inputs), [inputs]);

  return (
    <main
      id="main"
      className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14"
    >
      <header className="mb-8 sm:mb-12">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rule/40 pb-3">
          <div>
            <p className="poster-eyebrow text-working">Working Class</p>
            <h1 className="poster-h2 mt-1">Companion Calculator</h1>
          </div>
          <button
            type="button"
            onClick={() => dispatch({ type: "reset" })}
            className="min-h-tap rounded-sm border border-rule/60 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-inkSoft transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Reset to Round 1 defaults
          </button>
        </div>
        <p className="mt-4 max-w-2xl font-serif text-fluid-sm italic leading-relaxed text-inkSoft text-pretty">
          The physical board stays the source of truth. This screen handles the
          arithmetic — taxes, bundle cost, wages, action alerts, policy scoring.
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        <section aria-label="Inputs" className="min-w-0">
          <InputPanel inputs={inputs} dispatch={dispatch} />
        </section>

        <section aria-label="Outputs" className="flex min-w-0 flex-col gap-6">
          <FinancialsCard inputs={inputs} outputs={outputs} dispatch={dispatch} />
          <ActionAlerts outputs={outputs} />
          <TradeUnionPanel
            inputs={inputs}
            outputs={outputs}
            dispatch={dispatch}
          />
          <PolicyMap outputs={outputs} />
          <RoundOneBanner />
        </section>
      </div>
    </main>
  );
}
