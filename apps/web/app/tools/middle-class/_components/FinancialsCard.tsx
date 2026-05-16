"use client";

import type { Dispatch } from "react";

import type { MCInputs, MCOutputs } from "@/lib/tools/mc-companion";

import type { MCAction } from "../page";

interface Props {
  inputs: MCInputs;
  outputs: MCOutputs;
  dispatch: Dispatch<MCAction>;
}

export function FinancialsCard({ inputs, outputs, dispatch }: Props) {
  const showProsperity =
    outputs.prosperityPotential > inputs.prosperity;
  const ewpClass =
    outputs.excessWealthPoints > 0 ? "text-state" : "text-inkSubtle";
  const netCashClass =
    outputs.netCashAfterMandatory < 0 ? "text-danger" : "text-ink";

  return (
    <div className="rounded-sm border border-rule/60 bg-paper/50 p-4 sm:p-5">
      <p className="poster-eyebrow text-inkMute">Financials</p>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-[12px] text-inkSoft sm:text-[13px]">
        <dt>Tax multiplier</dt>
        <dd className="text-right font-light text-ink">
          ×{outputs.taxMultiplier}
        </dd>
        <dt>Income tax / unit</dt>
        <dd className="text-right">{outputs.incomeTaxPerUnit}¥</dd>
        <dt>MC income tax</dt>
        <dd className="text-right">{outputs.mcIncomeTax}¥</dd>
        <dt>MC employment tax</dt>
        <dd className="text-right">{outputs.mcEmploymentTax}¥</dd>
        <dt className="border-t border-rule/40 pt-1.5">Total taxes</dt>
        <dd className="border-t border-rule/40 pt-1.5 text-right font-light text-ink">
          {outputs.totalTaxes}¥
        </dd>
      </dl>

      <div className="mt-4 rounded-sharp border border-rule/50 bg-surface/30 p-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="stat-label">Food bill (mandatory)</span>
          <span className="font-mono text-base font-light text-ink">
            {outputs.foodBill}¥
          </span>
        </div>
        <p className="mt-1 font-serif text-[11px] italic text-inkMute">
          {inputs.population} pop × {outputs.cheapestFoodPrice}¥ ·{" "}
          {outputs.cheapestFoodSource}
        </p>
      </div>

      <div className="mt-3 rounded-sharp border border-rule/50 bg-surface/30 p-3">
        <p className="poster-eyebrow text-inkMute">Inflow this round</p>
        <div className="mt-2 flex flex-col gap-2">
          <InflowInput
            label="Revenue"
            value={inputs.revenue}
            onChange={(v) =>
              dispatch({ type: "setNumber", key: "revenue", value: v })
            }
          />
          <InflowInput
            label="Wages received"
            value={inputs.wagesReceived}
            onChange={(v) =>
              dispatch({ type: "setNumber", key: "wagesReceived", value: v })
            }
          />
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-[12px] text-inkSoft sm:text-[13px]">
        <dt>Mandatory outlay</dt>
        <dd className="text-right">{outputs.mandatoryOutlay}¥</dd>
        <dt>Net cash after mand.</dt>
        <dd className={`text-right font-light ${netCashClass}`}>
          {outputs.netCashAfterMandatory}¥
        </dd>
        <dt>Excess wealth pts</dt>
        <dd className={`text-right font-light ${ewpClass}`}>
          {outputs.excessWealthPoints > 0
            ? `+${outputs.excessWealthPoints} VP`
            : "0"}
          <span className="ml-1 text-[10px] text-inkSubtle">(÷15)</span>
        </dd>
      </dl>

      <div className="mt-3 rounded-sharp border border-rule/50 bg-surface/30 p-3">
        <p className="poster-eyebrow text-inkMute">Prosperity actions</p>
        <ul className="mt-2 flex flex-col gap-1 font-mono text-[12px] text-inkSoft">
          <li className="flex items-baseline justify-between">
            <span>Health bundle</span>
            <span className="font-light text-ink">
              {outputs.healthBundleCost}¥
            </span>
          </li>
          <li className="flex items-baseline justify-between">
            <span>Education bundle</span>
            <span className="font-light text-ink">
              {outputs.eduBundleCost}¥
            </span>
          </li>
          <li className="flex items-baseline justify-between">
            <span>Luxury bundle</span>
            <span className="font-light text-ink">
              {outputs.luxuryBundleCost}¥
            </span>
          </li>
          <li className="flex items-baseline justify-between border-t border-rule/40 pt-1.5">
            <span>Boosts affordable</span>
            <span className="font-light text-ink">
              {outputs.maxBoostsAfforded} of 3
            </span>
          </li>
          {outputs.scoringBoost > 0 ? (
            <li className="font-serif text-[11px] italic text-state">
              + 1 free scoring-phase boost (ops &gt; prosperity)
            </li>
          ) : null}
        </ul>
      </div>

      <div className="mt-3 flex items-baseline justify-between border-t border-rule/40 pt-2 font-mono text-[12px] text-inkSoft sm:text-[13px]">
        <span>Prosperity</span>
        {showProsperity ? (
          <span className="font-light text-state">
            {inputs.prosperity} → {outputs.prosperityPotential}
          </span>
        ) : (
          <span className="font-light text-ink">{inputs.prosperity}</span>
        )}
      </div>
    </div>
  );
}

function InflowInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="font-mono text-[12px] text-inkSoft">{label}</span>
      <input
        type="number"
        min={0}
        inputMode="numeric"
        aria-label={label}
        className="h-10 w-24 rounded-sharp border border-rule/70 bg-paper text-right font-mono text-base text-ink focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        value={value}
        onChange={(e) => {
          const next = Number(e.target.value);
          if (!Number.isNaN(next)) onChange(Math.max(0, next));
        }}
      />
    </label>
  );
}
