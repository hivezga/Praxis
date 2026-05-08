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
      <div className="space-y-5 text-sm">
        <p className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs text-slate-400">
          Tax multiplier this round:{" "}
          <strong className="font-mono text-slate-200">×{suggestion.taxes.multiplier}</strong>.{" "}
          Editable fields (highlighted) override the computed suggestions.
        </p>

        <Section title="Taxes → Treasury">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
            <Stat label="Working income tax"       value={suggestion.taxes.workingIncomeTax} />
            <Stat label="Middle income tax"        value={suggestion.taxes.middleIncomeTax} />
            <Stat label="Middle employment tax"    value={suggestion.taxes.middleEmploymentTax} />
            <Stat label="Capitalist income tax"    value={suggestion.taxes.capitalistIncomeTax} />
            <Stat label="Capitalist employment tax" value={suggestion.taxes.capitalistEmploymentTax} />
            <EditableStat label="Total to Treasury" value={tT} onChange={setTaxToTreasury} />
          </div>
        </Section>

        <Section title="Wages">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
            <Stat label="From Capitalist companies" value={suggestion.wages.fromCapitalist} />
            <Stat label="From Middle companies"     value={suggestion.wages.fromMiddle} />
            <EditableStat label="To Working class"  value={wW} onChange={setWagesToWorking} />
          </div>
        </Section>

        <Section title="Welfare costs">
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            <EditableStat label="State pays for free services" value={wS} onChange={setWelfareFromState} />
            <p className="self-center text-xs text-slate-500">{suggestion.welfareCosts.notes}</p>
          </div>
        </Section>

        <Section title="Prosperity gains">
          <div className="grid grid-cols-2 gap-2">
            <EditableStat label="Working +Prosperity steps" value={pW} onChange={setWorkingProsperity} />
            <EditableStat label="Middle +Prosperity steps"  value={pM} onChange={setMiddleProsperity} />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Each step grants VP equal to the new Prosperity value.
          </p>
        </Section>

        <section className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
            Net cash impact
          </h4>
          <div className="grid grid-cols-4 gap-3 text-center">
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
      <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">{title}</h4>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2.5">
      <div className="stat-label">{label}</div>
      <div className="mt-0.5 font-mono text-base font-semibold text-slate-200">{value}</div>
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
    <div className="rounded-lg border border-indigo-700/40 bg-indigo-950/30 px-3 py-2.5">
      <div className="stat-label text-indigo-300/70">{label}</div>
      <input
        type="number"
        className="input mt-1 border-indigo-700/30 bg-transparent font-mono focus:border-indigo-500"
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
    <div className="rounded-lg border border-slate-800 bg-slate-950/30 py-2">
      <div className="stat-label">{label}</div>
      <div className={`mt-0.5 font-mono text-xl font-semibold ${positive ? "text-emerald-400" : "text-rose-400"}`}>
        {positive ? "+" : ""}{value}
      </div>
    </div>
  );
}
