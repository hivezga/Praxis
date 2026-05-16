"use client";

import type { Dispatch } from "react";

import { Counter } from "@/components/shared/Counter";
import {
  INDUSTRY_COLOURS,
  type IndustryColour,
  type PolicyId,
  type PolicyPosition,
  type WCInputs,
} from "@/lib/tools/wc-companion";

import type { WCAction } from "../page";

interface Props {
  inputs: WCInputs;
  dispatch: Dispatch<WCAction>;
}

interface PolicyRow {
  id: PolicyId;
  number: number;
  name: string;
}

const POLICY_ROWS: PolicyRow[] = [
  { id: "fiscal", number: 1, name: "Fiscal Policy" },
  { id: "laborMarket", number: 2, name: "Labor Market" },
  { id: "taxation", number: 3, name: "Taxation" },
  { id: "health", number: 4, name: "Health & Benefits" },
  { id: "education", number: 5, name: "Education Welfare" },
  { id: "foreignTrade", number: 6, name: "Foreign Trade" },
  { id: "immigration", number: 7, name: "Immigration" },
];

const COLOUR_LABEL: Record<IndustryColour, string> = {
  red: "Red",
  blue: "Blue",
  yellow: "Yellow",
  green: "Green",
  purple: "Purple",
};

const COLOUR_DOT: Record<IndustryColour, string> = {
  red: "bg-[#c73c2c]",
  blue: "bg-[#2d5fa8]",
  yellow: "bg-[#d59b35]",
  green: "bg-[#1e7349]",
  purple: "bg-[#6b3a8c]",
};

export function InputPanel({ inputs, dispatch }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <Section title="Demographics">
        <div className="flex flex-col gap-2">
          <Counter
            label="Population"
            value={inputs.population}
            min={1}
            max={99}
            onAdjust={(d) =>
              dispatch({
                type: "setNumber",
                key: "population",
                value: Math.max(1, inputs.population + d),
              })
            }
            onSet={(v) =>
              dispatch({ type: "setNumber", key: "population", value: v })
            }
          />
          <Counter
            label="Prosperity"
            value={inputs.prosperity}
            min={0}
            max={5}
            hint="0–5 on the track"
            onAdjust={(d) =>
              dispatch({
                type: "setNumber",
                key: "prosperity",
                value: Math.max(0, Math.min(5, inputs.prosperity + d)),
              })
            }
            onSet={(v) =>
              dispatch({ type: "setNumber", key: "prosperity", value: v })
            }
          />
        </div>
      </Section>

      <Section title="Financials">
        <div className="mb-3 flex items-center justify-between rounded-sharp border border-rule/50 bg-surface/20 px-3 py-2">
          <label
            htmlFor="cc-toggle"
            className="font-mono text-[12px] text-inkSoft"
          >
            Crisis &amp; Control expansion
          </label>
          <input
            id="cc-toggle"
            type="checkbox"
            checked={inputs.crisisAndControl}
            onChange={(e) =>
              dispatch({
                type: "setCrisisAndControl",
                value: e.target.checked,
              })
            }
            className="h-5 w-5 cursor-pointer accent-accent"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Counter
            label="Cash in bank"
            value={inputs.cashInBank}
            min={0}
            max={999}
            onAdjust={(d) =>
              dispatch({
                type: "setNumber",
                key: "cashInBank",
                value: Math.max(0, inputs.cashInBank + d),
              })
            }
            onSet={(v) =>
              dispatch({ type: "setNumber", key: "cashInBank", value: v })
            }
          />
          <Counter
            label="Coop farms"
            value={inputs.coopFarmCount}
            min={0}
            max={99}
            hint="Each offsets 1 food unit"
            onAdjust={(d) =>
              dispatch({
                type: "setNumber",
                key: "coopFarmCount",
                value: Math.max(0, inputs.coopFarmCount + d),
              })
            }
            onSet={(v) =>
              dispatch({ type: "setNumber", key: "coopFarmCount", value: v })
            }
          />
          {inputs.crisisAndControl ? (
            <>
              <Counter
                label="Health coops"
                value={inputs.healthCoopCount}
                min={0}
                max={99}
                hint="C&C — offsets 1 health unit each"
                onAdjust={(d) =>
                  dispatch({
                    type: "setNumber",
                    key: "healthCoopCount",
                    value: Math.max(0, inputs.healthCoopCount + d),
                  })
                }
                onSet={(v) =>
                  dispatch({
                    type: "setNumber",
                    key: "healthCoopCount",
                    value: v,
                  })
                }
              />
              <Counter
                label="Education coops"
                value={inputs.educationCoopCount}
                min={0}
                max={99}
                hint="C&C — offsets 1 edu unit each"
                onAdjust={(d) =>
                  dispatch({
                    type: "setNumber",
                    key: "educationCoopCount",
                    value: Math.max(0, inputs.educationCoopCount + d),
                  })
                }
                onSet={(v) =>
                  dispatch({
                    type: "setNumber",
                    key: "educationCoopCount",
                    value: v,
                  })
                }
              />
            </>
          ) : null}
        </div>
      </Section>

      <Section title="Goods Prices (per unit, ¥)">
        <div className="grid grid-cols-[5rem_repeat(3,1fr)] items-center gap-1.5">
          <span aria-hidden />
          <SourceHeader>CC</SourceHeader>
          <SourceHeader>MC</SourceHeader>
          <SourceHeader>State</SourceHeader>

          <RowLabel>Food</RowLabel>
          <PriceInput
            label="Food / CC"
            value={inputs.goods.food.cc}
            onChange={(v) =>
              dispatch({ type: "setFoodPrice", source: "cc", value: v })
            }
          />
          <PriceInput
            label="Food / MC"
            value={inputs.goods.food.mc}
            onChange={(v) =>
              dispatch({ type: "setFoodPrice", source: "mc", value: v })
            }
          />
          <PriceInput
            label="Food / State"
            value={inputs.goods.food.state}
            onChange={(v) =>
              dispatch({ type: "setFoodPrice", source: "state", value: v })
            }
          />

          <RowLabel>Health</RowLabel>
          <DisabledCell />
          <PriceInput
            label="Health / MC"
            value={inputs.goods.health.mc}
            onChange={(v) =>
              dispatch({ type: "setHealthPrice", source: "mc", value: v })
            }
          />
          <PriceInput
            label="Health / State"
            value={inputs.goods.health.state}
            onChange={(v) =>
              dispatch({ type: "setHealthPrice", source: "state", value: v })
            }
          />

          <RowLabel>Education</RowLabel>
          <DisabledCell />
          <PriceInput
            label="Edu / MC"
            value={inputs.goods.edu.mc}
            onChange={(v) =>
              dispatch({ type: "setEduPrice", source: "mc", value: v })
            }
          />
          <PriceInput
            label="Edu / State"
            value={inputs.goods.edu.state}
            onChange={(v) =>
              dispatch({ type: "setEduPrice", source: "state", value: v })
            }
          />

          <RowLabel>Luxury</RowLabel>
          <PriceInput
            label="Luxury / CC"
            value={inputs.goods.luxury.cc}
            onChange={(v) => dispatch({ type: "setLuxuryPrice", value: v })}
          />
          <DisabledCell />
          <DisabledCell />
        </div>
      </Section>

      <Section title="Workforce">
        <Counter
          label="Unemployed"
          value={inputs.workforce.unemployed}
          min={0}
          max={99}
          onAdjust={(d) =>
            dispatch({
              type: "setUnemployed",
              value: Math.max(0, inputs.workforce.unemployed + d),
            })
          }
          onSet={(v) => dispatch({ type: "setUnemployed", value: v })}
        />

        <div className="mt-3 flex items-center justify-between rounded-sharp border border-rule/50 bg-surface/20 px-3 py-2">
          <span className="stat-label">Lowest wage level</span>
          <div role="radiogroup" aria-label="Lowest wage level" className="inline-flex overflow-hidden rounded-sharp border border-rule/60">
            {[1, 2, 3].map((lvl) => {
              const active = inputs.workforce.lowestWageLevel === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() =>
                    dispatch({
                      type: "setLowestWage",
                      value: lvl as 1 | 2 | 3,
                    })
                  }
                  className={`min-h-tap w-10 font-mono text-sm transition-colors ${
                    active
                      ? "bg-accent/20 text-accentInk"
                      : "bg-paper/40 text-inkSoft hover:bg-surfaceSoft"
                  }`}
                >
                  {lvl}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-[6rem_1fr_1fr] items-center gap-1.5">
          <span aria-hidden />
          <SourceHeader>Employed</SourceHeader>
          <SourceHeader>Vacancies</SourceHeader>
          {INDUSTRY_COLOURS.map((c) => (
            <ColourRow
              key={c}
              colour={c}
              employed={inputs.workforce.byColour[c].employed}
              vacancies={inputs.workforce.byColour[c].vacancies}
              onEmployed={(v) =>
                dispatch({ type: "setEmployed", colour: c, value: v })
              }
              onVacancies={(v) =>
                dispatch({ type: "setVacancies", colour: c, value: v })
              }
            />
          ))}
        </div>
      </Section>

      <Section title="Policies">
        <ul className="flex flex-col gap-1.5">
          {POLICY_ROWS.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-sharp border border-rule/50 bg-surface/20 px-3 py-2"
            >
              <span className="font-mono text-[11px] text-inkMute">
                {p.number}.
              </span>
              <span className="min-w-0 flex-1 font-serif text-[12px] italic text-inkSoft">
                {p.name}
              </span>
              <ABCToggle
                label={p.name}
                value={inputs.policies[p.id]}
                onChange={(pos) =>
                  dispatch({ type: "setPolicy", id: p.id, position: pos })
                }
              />
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-sm border border-rule/40 bg-paper/30 p-4">
      <p className="poster-eyebrow text-inkMute">{title}</p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function SourceHeader({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-wider text-inkMute">
      {children}
    </span>
  );
}

function RowLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-serif text-[12px] italic text-inkSoft">
      {children}
    </span>
  );
}

function DisabledCell() {
  return (
    <span
      aria-hidden
      className="flex h-10 items-center justify-center rounded-sharp border border-dashed border-rule/30 bg-transparent font-mono text-sm text-inkSubtle"
    >
      —
    </span>
  );
}

function PriceInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <input
      type="number"
      aria-label={label}
      inputMode="numeric"
      min={0}
      max={99}
      className="h-10 w-full rounded-sharp border border-rule/70 bg-paper text-center font-mono text-sm text-ink focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      value={value ?? ""}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === "") {
          onChange(undefined);
          return;
        }
        const next = Number(raw);
        if (!Number.isNaN(next)) onChange(Math.max(0, next));
      }}
    />
  );
}

function ColourRow({
  colour,
  employed,
  vacancies,
  onEmployed,
  onVacancies,
}: {
  colour: IndustryColour;
  employed: number;
  vacancies: number;
  onEmployed: (v: number) => void;
  onVacancies: (v: number) => void;
}) {
  return (
    <>
      <span className="flex items-center gap-2 font-mono text-[12px] text-inkSoft">
        <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${COLOUR_DOT[colour]}`} />
        {COLOUR_LABEL[colour]}
      </span>
      <input
        type="number"
        aria-label={`${colour} employed`}
        inputMode="numeric"
        min={0}
        max={99}
        className="h-10 w-full rounded-sharp border border-rule/70 bg-paper text-center font-mono text-sm text-ink focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        value={employed}
        onChange={(e) => {
          const next = Number(e.target.value);
          if (!Number.isNaN(next)) onEmployed(Math.max(0, next));
        }}
      />
      <input
        type="number"
        aria-label={`${colour} vacancies`}
        inputMode="numeric"
        min={0}
        max={99}
        className="h-10 w-full rounded-sharp border border-rule/70 bg-paper text-center font-mono text-sm text-ink focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        value={vacancies}
        onChange={(e) => {
          const next = Number(e.target.value);
          if (!Number.isNaN(next)) onVacancies(Math.max(0, next));
        }}
      />
    </>
  );
}

function ABCToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: PolicyPosition;
  onChange: (v: PolicyPosition) => void;
}) {
  const positions: PolicyPosition[] = ["A", "B", "C"];
  return (
    <div
      role="radiogroup"
      aria-label={`${label} position`}
      className="inline-flex overflow-hidden rounded-sharp border border-rule/60"
    >
      {positions.map((p) => {
        const active = value === p;
        return (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(p)}
            className={`min-h-tap w-9 font-mono text-sm transition-colors ${
              active
                ? "bg-accent/20 text-accentInk"
                : "bg-paper/40 text-inkSoft hover:bg-surfaceSoft"
            }`}
          >
            {p}
          </button>
        );
      })}
    </div>
  );
}
