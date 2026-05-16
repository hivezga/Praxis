"use client";

import type { Dispatch } from "react";

import type { WCInputs, WCOutputs } from "@/lib/tools/wc-companion";

import type { WCAction } from "../page";

interface Props {
  inputs: WCInputs;
  outputs: WCOutputs;
  dispatch: Dispatch<WCAction>;
}

export function FinancialsCard({ inputs, outputs, dispatch }: Props) {
  const showProsperity = outputs.prosperityPotential > inputs.prosperity;
  const ewpClass =
    outputs.excessWealthPoints > 0 ? "text-state" : "text-inkSubtle";

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
        <dt>WC income tax</dt>
        <dd className="text-right font-light text-ink">
          {outputs.wcIncomeTax}¥
        </dd>
        <dt>Food bill</dt>
        <dd className="text-right">{outputs.foodBill}¥</dd>
        <dt>Bundle cost</dt>
        <dd className="text-right font-light text-ink">
          {outputs.bundleCost}¥
        </dd>
        <dt className="border-t border-rule/40 pt-1.5">Wages needed</dt>
        <dd className="border-t border-rule/40 pt-1.5 text-right font-light text-ink">
          {outputs.wagesNeeded}¥
        </dd>
      </dl>

      <div className="mt-4 rounded-sharp border border-rule/50 bg-surface/30 p-3">
        <label className="flex items-center justify-between gap-3">
          <span className="stat-label">Wages received</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            className="h-10 w-24 rounded-sharp border border-rule/70 bg-paper text-right font-mono text-base text-ink focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={inputs.wagesReceived}
            onChange={(e) => {
              const next = Number(e.target.value);
              if (!Number.isNaN(next)) {
                dispatch({ type: "setNumber", key: "wagesReceived", value: Math.max(0, next) });
              }
            }}
          />
        </label>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider text-inkMute">
            vs wages needed
          </span>
          {outputs.wagesShortfall > 0 ? (
            <span className="rounded-sharp bg-danger/15 px-2 py-0.5 font-mono text-[12px] font-medium text-danger">
              −{outputs.wagesShortfall}¥ shortfall
            </span>
          ) : outputs.wagesSurplus > 0 ? (
            <span className="rounded-sharp bg-state/15 px-2 py-0.5 font-mono text-[12px] font-medium text-state">
              +{outputs.wagesSurplus}¥ surplus
            </span>
          ) : (
            <span className="font-mono text-[12px] text-inkSoft">exact</span>
          )}
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-[12px] text-inkSoft sm:text-[13px]">
        <dt>Treasury after tax</dt>
        <dd className="text-right">{outputs.treasuryAfterTax}¥</dd>
        <dt>Excess wealth pts</dt>
        <dd className={`text-right font-light ${ewpClass}`}>
          {outputs.excessWealthPoints > 0
            ? `+${outputs.excessWealthPoints} VP`
            : "0"}
        </dd>
        <dt>Max bundles</dt>
        <dd className="text-right">{outputs.maxBundles}</dd>
        {showProsperity ? (
          <>
            <dt>Prosperity</dt>
            <dd className="text-right font-light text-state">
              {inputs.prosperity} → {outputs.prosperityPotential}
            </dd>
          </>
        ) : (
          <>
            <dt>Prosperity</dt>
            <dd className="text-right">{inputs.prosperity}</dd>
          </>
        )}
      </dl>
    </div>
  );
}
