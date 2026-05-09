"use client";

import { useMemo, useState } from "react";

import { Modal } from "@/components/shared/Modal";
import { wasm } from "@/lib/wasm";
import { useGame, useGameState } from "@/lib/store";
import type { RoundSuggestion } from "@/lib/types/game";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function EndRoundWizard({ open, onClose }: Props) {
  const state = useGameState();
  const apply = useGame((s) => s.apply);
  const advancePhase = useGame((s) => s.advancePhase);

  const suggestion = useMemo(
    () => (state ? (wasm().compute_round_suggestion_wasm(state) as RoundSuggestion) : null),
    [state],
  );

  const [taxToTreasury, setTaxToTreasury] = useState<number | null>(null);
  const [wagesToWorking, setWagesToWorking] = useState<number | null>(null);
  const [welfareFromState, setWelfareFromState] = useState<number | null>(null);
  const [workingProsperity, setWorkingProsperity] = useState<number | null>(null);
  const [middleProsperity, setMiddleProsperity] = useState<number | null>(null);

  if (!state || !suggestion) return null;

  const tT = taxToTreasury ?? suggestion.taxes.totalToTreasury;
  const wW = wagesToWorking ?? suggestion.wages.toWorking;
  const wS = welfareFromState ?? suggestion.welfareCosts.fromState;
  const pW = workingProsperity ?? suggestion.prosperityDelta.working;
  const pM = middleProsperity ?? suggestion.prosperityDelta.middle;

  const totals = {
    workingNet:    wW - suggestion.taxes.workingIncomeTax,
    middleNet:     -suggestion.taxes.middleIncomeTax - suggestion.taxes.middleEmploymentTax,
    capitalistNet: -suggestion.taxes.capitalistIncomeTax - suggestion.taxes.capitalistEmploymentTax,
    stateNet:      tT - wS,
  };

  function reset() {
    setTaxToTreasury(null);
    setWagesToWorking(null);
    setWelfareFromState(null);
    setWorkingProsperity(null);
    setMiddleProsperity(null);
  }

  function handleApply() {
    apply(
      {
        type: "applyEndRound",
        wagesFromCapitalist: suggestion!.wages.fromCapitalist,
        wagesFromMiddle:     suggestion!.wages.fromMiddle,
        wagesToWorking:      wW,
        workingIncomeTax:    suggestion!.taxes.workingIncomeTax,
        middleIncomeTax:     suggestion!.taxes.middleIncomeTax,
        middleEmploymentTax:     suggestion!.taxes.middleEmploymentTax,
        capitalistIncomeTax:     suggestion!.taxes.capitalistIncomeTax,
        capitalistEmploymentTax: suggestion!.taxes.capitalistEmploymentTax,
        totalToTreasury:         tT,
        welfareCost:             wS,
        workingProsperitySteps:  pW,
        middleProsperitySteps:   pM,
      },
      "Apply end-of-round",
    );
    advancePhase();
    reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title={`End of round ${state.meta.round}`}
      widthClass="max-w-3xl"
      footer={
        <>
          <button type="button" className="btn" onClick={() => { reset(); onClose(); }}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleApply}>
            Apply &amp; advance
          </button>
        </>
      }
    >
      <div className="space-y-6 text-fluid-sm">
        <p className="rounded-sharp border border-rule/60 bg-paper/40 px-4 py-3 font-serif italic leading-relaxed text-inkSoft">
          Tax multiplier this round:{" "}
          <strong className="not-italic font-mono text-ink">
            ×{suggestion.taxes.multiplier}
          </strong>
          . Editable fields (highlighted) override the computed suggestions.
        </p>

        <Section title="Taxes → Treasury">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Stat label="Working income tax"       value={suggestion.taxes.workingIncomeTax} />
            <Stat label="Middle income tax"        value={suggestion.taxes.middleIncomeTax} />
            <Stat label="Middle employment tax"    value={suggestion.taxes.middleEmploymentTax} />
            <Stat label="Capitalist income tax"    value={suggestion.taxes.capitalistIncomeTax} />
            <Stat label="Capitalist employment tax" value={suggestion.taxes.capitalistEmploymentTax} />
            <EditableStat label="Total to Treasury" value={tT} onChange={setTaxToTreasury} />
          </div>
        </Section>

        <Section title="Wages">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Stat label="From Capitalist companies" value={suggestion.wages.fromCapitalist} />
            <Stat label="From Middle companies"     value={suggestion.wages.fromMiddle} />
            <EditableStat label="To Working class"  value={wW} onChange={setWagesToWorking} />
          </div>
        </Section>

        <Section title="Welfare costs">
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            <EditableStat
              label="State pays for free services"
              value={wS}
              onChange={setWelfareFromState}
            />
            <p className="self-center font-serif text-fluid-sm italic text-inkMute">
              {suggestion.welfareCosts.notes}
            </p>
          </div>
        </Section>

        <Section title="Prosperity gains">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <EditableStat label="Working +Prosperity steps" value={pW} onChange={setWorkingProsperity} />
            <EditableStat label="Middle +Prosperity steps"  value={pM} onChange={setMiddleProsperity} />
          </div>
          <p className="mt-2 font-serif text-fluid-sm italic text-inkMute">
            Each step grants VP equal to the new Prosperity value.
          </p>
        </Section>

        <section className="rounded-sharp border border-rule/60 bg-paper/40 p-4 sm:p-5">
          <h4 className="mb-4 font-display text-[11px] uppercase tracking-[0.25em] text-inkMute">
            Net cash impact
          </h4>
          <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            <NetCell label="Working"    value={totals.workingNet}    />
            <NetCell label="Middle"     value={totals.middleNet}     />
            <NetCell label="Capitalist" value={totals.capitalistNet} />
            <NetCell label="State"      value={totals.stateNet}      />
          </div>
        </section>
      </div>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="mb-3 font-display text-[11px] uppercase tracking-[0.25em] text-inkMute">
        {title}
      </h4>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-sharp border border-rule/60 bg-paper/30 px-3 py-2.5">
      <div className="stat-label">{label}</div>
      <div className="mt-0.5 font-mono text-fluid-base font-light text-ink">{value}</div>
    </div>
  );
}

function EditableStat({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (next: number | null) => void;
}) {
  return (
    <div className="rounded-sharp border-2 border-accent/40 bg-accent/[0.06] px-3 py-2.5">
      <div className="font-display text-[10px] uppercase tracking-[0.2em] text-accentInk/80">
        {label}
      </div>
      <input
        type="number"
        aria-label={label}
        className="input mt-1.5 border-accent/30 bg-transparent font-mono focus:border-accent"
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          onChange(Number.isNaN(n) ? null : n);
        }}
      />
    </div>
  );
}

function NetCell({ label, value }: { label: string; value: number }) {
  const positive = value >= 0;
  return (
    <div className="rounded-sharp border border-rule/60 bg-paper/40 py-3">
      <div className="font-display text-[10px] uppercase tracking-[0.2em] text-inkMute">
        {label}
      </div>
      <div
        className={`mt-1 font-mono text-fluid-xl font-light ${
          positive ? "text-positive" : "text-danger"
        }`}
      >
        {positive ? "+" : ""}
        {value}
      </div>
    </div>
  );
}
