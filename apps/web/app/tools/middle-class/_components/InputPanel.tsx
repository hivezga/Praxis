"use client";

import type { Dispatch } from "react";

import { Counter } from "@/components/shared/Counter";
import type {
  MCInputs,
  PolicyId,
  PolicyPosition,
} from "@/lib/tools/mc-companion";

import type { MCAction } from "../page";

interface Props {
  inputs: MCInputs;
  dispatch: Dispatch<MCAction>;
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
        </div>
      </Section>

      <Section title="Companies">
        <div className="flex flex-col gap-2">
          <Counter
            label="Operational own companies"
            value={inputs.operationalOwnCompanies}
            min={0}
            max={8}
            hint="Drives employment tax + Scoring-phase boost"
            onAdjust={(d) =>
              dispatch({
                type: "setNumber",
                key: "operationalOwnCompanies",
                value: Math.max(
                  0,
                  Math.min(8, inputs.operationalOwnCompanies + d),
                ),
              })
            }
            onSet={(v) =>
              dispatch({
                type: "setNumber",
                key: "operationalOwnCompanies",
                value: v,
              })
            }
          />
          <Counter
            label="Companies employed elsewhere"
            value={inputs.companiesEmployedElsewhere}
            min={0}
            max={99}
            hint="Count of OTHER companies where MC has workers (drives income tax)"
            onAdjust={(d) =>
              dispatch({
                type: "setNumber",
                key: "companiesEmployedElsewhere",
                value: Math.max(0, inputs.companiesEmployedElsewhere + d),
              })
            }
            onSet={(v) =>
              dispatch({
                type: "setNumber",
                key: "companiesEmployedElsewhere",
                value: v,
              })
            }
          />
        </div>
      </Section>

      <Section title="Goods Prices (per unit, ¥)">
        <div className="grid grid-cols-[5.5rem_repeat(4,1fr)] items-center gap-1.5">
          <span aria-hidden />
          <SourceHeader>CC</SourceHeader>
          <SourceHeader>Self</SourceHeader>
          <SourceHeader>Foreign</SourceHeader>
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
            label="Food / Self"
            value={inputs.goods.food.mcSelf}
            placeholder="—"
            onChange={(v) =>
              dispatch({ type: "setFoodPrice", source: "mcSelf", value: v })
            }
          />
          <PriceInput
            label="Food / Foreign"
            value={inputs.goods.food.foreign}
            onChange={(v) =>
              dispatch({ type: "setFoodPrice", source: "foreign", value: v })
            }
          />
          <DisabledCell />

          <RowLabel>Luxury</RowLabel>
          <PriceInput
            label="Luxury / CC"
            value={inputs.goods.luxury.cc}
            onChange={(v) =>
              dispatch({ type: "setLuxuryPrice", source: "cc", value: v })
            }
          />
          <PriceInput
            label="Luxury / Self"
            value={inputs.goods.luxury.mcSelf}
            placeholder="—"
            onChange={(v) =>
              dispatch({ type: "setLuxuryPrice", source: "mcSelf", value: v })
            }
          />
          <PriceInput
            label="Luxury / Foreign"
            value={inputs.goods.luxury.foreign}
            onChange={(v) =>
              dispatch({
                type: "setLuxuryPrice",
                source: "foreign",
                value: v,
              })
            }
          />
          <DisabledCell />

          <RowLabel>Health</RowLabel>
          <PriceInput
            label="Health / CC"
            value={inputs.goods.health.cc}
            onChange={(v) =>
              dispatch({ type: "setHealthPrice", source: "cc", value: v })
            }
          />
          <PriceInput
            label="Health / Self"
            value={inputs.goods.health.mcSelf}
            placeholder="—"
            onChange={(v) =>
              dispatch({
                type: "setHealthPrice",
                source: "mcSelf",
                value: v,
              })
            }
          />
          <DisabledCell />
          <PriceInput
            label="Health / State"
            value={inputs.goods.health.state}
            onChange={(v) =>
              dispatch({
                type: "setHealthPrice",
                source: "state",
                value: v,
              })
            }
          />

          <RowLabel>Education</RowLabel>
          <PriceInput
            label="Edu / CC"
            value={inputs.goods.edu.cc}
            onChange={(v) =>
              dispatch({ type: "setEduPrice", source: "cc", value: v })
            }
          />
          <PriceInput
            label="Edu / Self"
            value={inputs.goods.edu.mcSelf}
            placeholder="—"
            onChange={(v) =>
              dispatch({
                type: "setEduPrice",
                source: "mcSelf",
                value: v,
              })
            }
          />
          <DisabledCell />
          <PriceInput
            label="Edu / State"
            value={inputs.goods.edu.state}
            onChange={(v) =>
              dispatch({
                type: "setEduPrice",
                source: "state",
                value: v,
              })
            }
          />

          <RowLabel>Influence</RowLabel>
          <DisabledCell />
          <DisabledCell />
          <DisabledCell />
          <PriceInput
            label="Influence / State"
            value={inputs.goods.influence.state}
            onChange={(v) =>
              dispatch({ type: "setInfluencePrice", value: v })
            }
          />
        </div>
        <p className="mt-2 font-serif text-[11px] italic text-inkMute">
          Self-supply is 0¥ but only valid when MC has the good in storage in
          quantities ≥ population. Leave blank until you do.
        </p>
      </Section>

      <Section title="Storage on hand (EOG VP)">
        <div className="grid grid-cols-2 gap-2">
          <StorageInput
            label="Food (÷2)"
            value={inputs.storage.food}
            onChange={(v) =>
              dispatch({ type: "setStorage", good: "food", value: v })
            }
          />
          <StorageInput
            label="Luxury (÷3)"
            value={inputs.storage.luxury}
            onChange={(v) =>
              dispatch({ type: "setStorage", good: "luxury", value: v })
            }
          />
          <StorageInput
            label="Health (÷3)"
            value={inputs.storage.health}
            onChange={(v) =>
              dispatch({ type: "setStorage", good: "health", value: v })
            }
          />
          <StorageInput
            label="Education (÷3)"
            value={inputs.storage.education}
            onChange={(v) =>
              dispatch({ type: "setStorage", good: "education", value: v })
            }
          />
          <StorageInput
            label="Influence (no VP)"
            value={inputs.storage.influence}
            onChange={(v) =>
              dispatch({ type: "setStorage", good: "influence", value: v })
            }
          />
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
    <span className="text-center font-mono text-[10px] uppercase tracking-wider text-inkMute">
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
  placeholder,
  onChange,
}: {
  label: string;
  value: number | undefined;
  placeholder?: string;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <input
      type="number"
      aria-label={label}
      inputMode="numeric"
      min={0}
      max={99}
      placeholder={placeholder}
      className="h-10 w-full rounded-sharp border border-rule/70 bg-paper text-center font-mono text-sm text-ink placeholder:text-inkSubtle focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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

function StorageInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2 rounded-sharp border border-rule/50 bg-surface/20 px-3 py-2">
      <span className="font-mono text-[11px] text-inkSoft">{label}</span>
      <input
        type="number"
        aria-label={label}
        inputMode="numeric"
        min={0}
        max={99}
        className="h-9 w-14 rounded-sharp border border-rule/70 bg-paper text-center font-mono text-sm text-ink focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        value={value}
        onChange={(e) => {
          const next = Number(e.target.value);
          if (!Number.isNaN(next)) onChange(Math.max(0, next));
        }}
      />
    </label>
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
