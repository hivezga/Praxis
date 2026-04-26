"use client";

import { useMemo, useState } from "react";

import { Modal } from "@/components/shared/Modal";
import { computeRoundSuggestion } from "@/lib/game-rules/endOfRound";
import { useGame, useGameState } from "@/lib/store";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function EndRoundWizard({ open, onClose }: Props) {
  const state = useGameState();
  const apply = useGame((s) => s.apply);
  const advancePhase = useGame((s) => s.advancePhase);

  const suggestion = useMemo(() => (state ? computeRoundSuggestion(state) : null), [state]);

  // Editable copies of suggestion values.
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
    workingNet: wW - suggestion.taxes.workingIncomeTax,
    middleNet: -suggestion.taxes.middleIncomeTax - suggestion.taxes.middleEmploymentTax,
    capitalistNet: -suggestion.taxes.capitalistIncomeTax - suggestion.taxes.capitalistEmploymentTax,
    stateNet: tT - wS,
  };

  function reset() {
    setTaxToTreasury(null);
    setWagesToWorking(null);
    setWelfareFromState(null);
    setWorkingProsperity(null);
    setMiddleProsperity(null);
  }

  function handleApply() {
    apply("Apply end-of-round suggestion", (s) => {
      // Wages flow Capitalist→Working and Middle→Working (rough split).
      s.classes.capitalist.revenue = Math.max(0, s.classes.capitalist.revenue - suggestion!.wages.fromCapitalist);
      s.classes.middle.money = Math.max(0, s.classes.middle.money - suggestion!.wages.fromMiddle);
      s.classes.working.money += wW;

      // Taxes drain from each class to the treasury.
      s.classes.working.money = Math.max(0, s.classes.working.money - suggestion!.taxes.workingIncomeTax);
      s.classes.middle.money = Math.max(
        0,
        s.classes.middle.money - suggestion!.taxes.middleIncomeTax - suggestion!.taxes.middleEmploymentTax
      );
      s.classes.capitalist.revenue = Math.max(
        0,
        s.classes.capitalist.revenue -
          suggestion!.taxes.capitalistIncomeTax -
          suggestion!.taxes.capitalistEmploymentTax
      );
      s.classes.state.treasury += tT;

      // State pays welfare costs.
      s.classes.state.treasury = Math.max(0, s.classes.state.treasury - wS);

      // Capitalist transfers remaining revenue to capital after wages & taxes.
      const transfer = s.classes.capitalist.revenue;
      s.classes.capitalist.capital += transfer;
      s.classes.capitalist.revenue = 0;

      // Prosperity adjustments grant VP equal to the new prosperity value.
      if (pW > 0) {
        for (let i = 0; i < pW; i++) {
          s.classes.working.prosperity += 1;
          s.classes.working.vp += s.classes.working.prosperity;
        }
      }
      if (pM > 0) {
        for (let i = 0; i < pM; i++) {
          s.classes.middle.prosperity += 1;
          s.classes.middle.vp += s.classes.middle.prosperity;
        }
      }
    });
    advancePhase();
    reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={`End of round ${state.meta.round} — review`}
      widthClass="max-w-3xl"
      footer={
        <>
          <button type="button" className="btn" onClick={() => { reset(); onClose(); }}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleApply}>
            Apply & advance
          </button>
        </>
      }
    >
      <div className="space-y-5 text-sm">
        <p className="text-xs text-slate-400">
          Tax multiplier this round: <strong className="font-mono text-slate-100">×{suggestion.taxes.multiplier}</strong>.
          All figures are heuristic suggestions — edit them to match what really happened.
        </p>

        <section>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Taxes → Treasury</h4>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <Stat label="Working income tax" value={suggestion.taxes.workingIncomeTax} />
            <Stat label="Middle income tax" value={suggestion.taxes.middleIncomeTax} />
            <Stat label="Middle employment tax" value={suggestion.taxes.middleEmploymentTax} />
            <Stat label="Capitalist income tax" value={suggestion.taxes.capitalistIncomeTax} />
            <Stat label="Capitalist employment tax" value={suggestion.taxes.capitalistEmploymentTax} />
            <EditableStat label="Total to Treasury" value={tT} onChange={setTaxToTreasury} />
          </div>
        </section>

        <section>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Wages</h4>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <Stat label="From Capitalist companies" value={suggestion.wages.fromCapitalist} />
            <Stat label="From Middle companies" value={suggestion.wages.fromMiddle} />
            <EditableStat label="To Working class" value={wW} onChange={setWagesToWorking} />
          </div>
        </section>

        <section>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Welfare costs</h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <EditableStat label="State pays for free services" value={wS} onChange={setWelfareFromState} />
            <p className="text-xs text-slate-500">{suggestion.welfareCosts.notes}</p>
          </div>
        </section>

        <section>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Prosperity gains</h4>
          <div className="grid grid-cols-2 gap-3">
            <EditableStat label="Working +Prosperity steps" value={pW} onChange={setWorkingProsperity} />
            <EditableStat label="Middle +Prosperity steps" value={pM} onChange={setMiddleProsperity} />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Each step grants VP equal to the new Prosperity value (per rulebook).
          </p>
        </section>

        <section className="rounded-md border border-slate-800 bg-slate-950/40 p-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Net cash impact</h4>
          <div className="grid grid-cols-4 gap-3 text-center">
            <NetCell label="Working" value={totals.workingNet} />
            <NetCell label="Middle" value={totals.middleNet} />
            <NetCell label="Capitalist" value={totals.capitalistNet} />
            <NetCell label="State" value={totals.stateNet} />
          </div>
        </section>
      </div>
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-950/40 px-3 py-2">
      <div className="stat-label">{label}</div>
      <div className="font-mono text-base text-slate-100">{value}</div>
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
    <div className="rounded-md border border-indigo-700/40 bg-indigo-900/10 px-3 py-2">
      <div className="stat-label text-indigo-200">{label}</div>
      <input
        type="number"
        className="input mt-1 font-mono"
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
    <div>
      <div className="stat-label">{label}</div>
      <div className={`font-mono text-lg ${positive ? "text-emerald-300" : "text-rose-300"}`}>
        {positive ? "+" : ""}
        {value}
      </div>
    </div>
  );
}
