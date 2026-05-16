"use client";

import { useEffect, useMemo, useReducer, useState } from "react";

import {
  computeMC,
  MC_ROUND_ONE_DEFAULTS,
  type MCInputs,
  type PolicyId,
  type PolicyPosition,
} from "@/lib/tools/mc-companion";

import { ActionAlerts } from "./_components/ActionAlerts";
import { FinancialsCard } from "./_components/FinancialsCard";
import { InputPanel } from "./_components/InputPanel";
import { PolicyMap } from "./_components/PolicyMap";
import { RoundOneBanner } from "./_components/RoundOneBanner";

const STORAGE_KEY = "mc-companion-inputs-v1";

type ScalarNumberKey =
  | "population"
  | "prosperity"
  | "cashInBank"
  | "revenue"
  | "wagesReceived"
  | "operationalOwnCompanies"
  | "companiesEmployedElsewhere";

type FoodLuxurySource = "cc" | "mcSelf" | "foreign";
type CareSource = "cc" | "mcSelf" | "state";
type StorageGood = "food" | "luxury" | "health" | "education" | "influence";

export type MCAction =
  | { type: "reset" }
  | { type: "hydrate"; payload: MCInputs }
  | { type: "setNumber"; key: ScalarNumberKey; value: number }
  | {
      type: "setFoodPrice";
      source: FoodLuxurySource;
      value: number | undefined;
    }
  | {
      type: "setLuxuryPrice";
      source: FoodLuxurySource;
      value: number | undefined;
    }
  | {
      type: "setHealthPrice";
      source: CareSource;
      value: number | undefined;
    }
  | {
      type: "setEduPrice";
      source: CareSource;
      value: number | undefined;
    }
  | { type: "setInfluencePrice"; value: number | undefined }
  | { type: "setStorage"; good: StorageGood; value: number }
  | { type: "setPolicy"; id: PolicyId; position: PolicyPosition };

function makeDefaults(): MCInputs {
  return structuredClone(MC_ROUND_ONE_DEFAULTS);
}

function reducer(state: MCInputs, action: MCAction): MCInputs {
  switch (action.type) {
    case "reset":
      return makeDefaults();
    case "hydrate":
      return action.payload;
    case "setNumber":
      return { ...state, [action.key]: action.value };
    case "setFoodPrice":
      return {
        ...state,
        goods: {
          ...state.goods,
          food: { ...state.goods.food, [action.source]: action.value },
        },
      };
    case "setLuxuryPrice":
      return {
        ...state,
        goods: {
          ...state.goods,
          luxury: { ...state.goods.luxury, [action.source]: action.value },
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
    case "setInfluencePrice":
      return {
        ...state,
        goods: { ...state.goods, influence: { state: action.value } },
      };
    case "setStorage":
      return {
        ...state,
        storage: { ...state.storage, [action.good]: action.value },
      };
    case "setPolicy":
      return {
        ...state,
        policies: { ...state.policies, [action.id]: action.position },
      };
  }
}

function isValidStoredShape(value: unknown): value is MCInputs {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.population === "number" &&
    typeof v.cashInBank === "number" &&
    typeof v.policies === "object" &&
    typeof v.goods === "object" &&
    typeof v.storage === "object"
  );
}

export default function MiddleClassToolPage() {
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
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
    } catch {
      // quota / privacy mode — silent
    }
  }, [inputs, hydrated]);

  const outputs = useMemo(() => computeMC(inputs), [inputs]);

  return (
    <main
      id="main"
      className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14"
    >
      <header className="mb-8 sm:mb-12">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rule/40 pb-3">
          <div>
            <p className="poster-eyebrow text-middle">Middle Class</p>
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
          Dual taxes, the mandatory food bill, and Section-B scoring tracker.
          MC is both employer and employee — this screen handles the math.
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        <section aria-label="Inputs" className="min-w-0">
          <InputPanel inputs={inputs} dispatch={dispatch} />
        </section>

        <section aria-label="Outputs" className="flex min-w-0 flex-col gap-6">
          <FinancialsCard inputs={inputs} outputs={outputs} dispatch={dispatch} />
          <ActionAlerts outputs={outputs} />
          <PolicyMap outputs={outputs} />
          <RoundOneBanner />
        </section>
      </div>
    </main>
  );
}
