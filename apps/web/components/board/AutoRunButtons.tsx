"use client";

import { useState } from "react";

import { useGame, useGameState, type PhaseRunResult } from "@/lib/store";

type Mode = "auto" | "manual";

const MODE_KEY = "praxis.production-mode";

function loadMode(): Mode {
  if (typeof window === "undefined") return "auto";
  return (window.localStorage.getItem(MODE_KEY) as Mode) ?? "auto";
}

function saveMode(m: Mode) {
  if (typeof window !== "undefined") window.localStorage.setItem(MODE_KEY, m);
}

export function AutoRunButtons() {
  const state = useGameState();
  const runPrep = useGame((s) => s.runPreparationPhase);
  const runProd = useGame((s) => s.runProductionPhase);
  const runScore = useGame((s) => s.runScoringPhase);
  const [mode, setMode] = useState<Mode>(loadMode());
  const [lastLog, setLastLog] = useState<PhaseRunResult["log"] | null>(null);
  const [showLog, setShowLog] = useState(false);

  if (!state) return null;
  const phase = state.meta.phase;

  function setProductionMode(m: Mode) {
    setMode(m);
    saveMode(m);
  }

  function handleRun(fn: () => PhaseRunResult | null) {
    const result = fn();
    if (result) {
      setLastLog(result.log);
      setShowLog(true);
    }
  }

  const buttons: { id: typeof phase; label: string; run: () => PhaseRunResult | null; subtle?: string }[] = [
    {
      id: "preparation",
      label: "Run Preparation",
      run: () => runPrep(),
      subtle: "Loan interest, prosperity drop, advance to Action.",
    },
    {
      id: "production",
      label: mode === "auto" ? "Apply Production (Auto)" : "Compute Production (Manual)",
      run: () => runProd(mode),
      subtle:
        mode === "auto"
          ? "Wages + taxes + IMF check applied atomically. Auto-place enabled."
          : "Computes the breakdown without applying. You verify and apply each line manually.",
    },
    {
      id: "scoring",
      label: "Run Scoring",
      run: () => runScore(),
      subtle: "Legitimacy VP, per-class totals, advance round.",
    },
  ];

  const active = buttons.find((b) => b.id === phase);

  return (
    <div className="mx-auto max-w-screen-2xl border-t border-rule/40 bg-surface/30 px-4 py-2 sm:px-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {buttons.map((b) => (
            <button
              key={b.id}
              type="button"
              className={`btn ${b.id === phase ? "btn-primary" : ""}`}
              onClick={() => handleRun(b.run)}
              disabled={b.id !== phase}
              aria-disabled={b.id !== phase}
              title={b.subtle}
            >
              {b.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="font-serif italic text-inkMute">Production:</span>
          <button
            type="button"
            onClick={() => setProductionMode("auto")}
            aria-pressed={mode === "auto"}
            className={`rounded-md border px-2 py-1 text-[11px] transition-colors ${
              mode === "auto"
                ? "border-accent/50 bg-accent/15 text-accentInk"
                : "border-rule/60 bg-surface/40 text-inkMute hover:text-inkSoft"
            }`}
          >
            Auto
          </button>
          <button
            type="button"
            onClick={() => setProductionMode("manual")}
            aria-pressed={mode === "manual"}
            className={`rounded-md border px-2 py-1 text-[11px] transition-colors ${
              mode === "manual"
                ? "border-accent/50 bg-accent/15 text-accentInk"
                : "border-rule/60 bg-surface/40 text-inkMute hover:text-inkSoft"
            }`}
          >
            Manual
          </button>
        </div>
      </div>
      {active ? (
        <p className="mt-1 font-serif text-[12px] italic text-inkSoft">
          {active.subtle}
        </p>
      ) : null}
      {showLog && lastLog ? (
        <div className="mt-2 rounded-md border border-rule/60 bg-paper/50 p-3 text-[12px]">
          <div className="flex items-center justify-between">
            <strong className="text-inkSoft">
              {lastLog.phase} phase log (round {lastLog.round})
            </strong>
            <button
              type="button"
              className="text-[11px] text-inkMute hover:text-inkSoft"
              onClick={() => setShowLog(false)}
            >
              Close
            </button>
          </div>
          <ul className="mt-1 list-disc pl-5 text-inkSoft">
            {lastLog.entries.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
          {lastLog.imfIntervened ? (
            <p className="mt-2 rounded bg-accent/15 px-2 py-1 font-medium text-accentInk">
              ⚠ IMF intervention applied.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
