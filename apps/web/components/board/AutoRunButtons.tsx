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
    <div className="mx-auto max-w-screen-2xl border-t border-rule/40 bg-surface/30 px-3 py-2 sm:px-5">
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
        <div
          className="flex flex-wrap items-center gap-2"
          role="radiogroup"
          aria-label="Production mode"
        >
          <span className="font-display text-[10px] uppercase tracking-[0.2em] text-inkMute">
            Production:
          </span>
          <button
            type="button"
            role="radio"
            aria-checked={mode === "auto"}
            onClick={() => setProductionMode("auto")}
            className={`min-h-tap rounded-sharp border px-3 py-1.5 font-display text-[11px] uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${
              mode === "auto"
                ? "border-accent bg-accent/20 text-accentInk"
                : "border-rule/60 bg-surface/40 text-inkMute hover:text-inkSoft"
            }`}
          >
            Auto
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === "manual"}
            onClick={() => setProductionMode("manual")}
            className={`min-h-tap rounded-sharp border px-3 py-1.5 font-display text-[11px] uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${
              mode === "manual"
                ? "border-accent bg-accent/20 text-accentInk"
                : "border-rule/60 bg-surface/40 text-inkMute hover:text-inkSoft"
            }`}
          >
            Manual
          </button>
        </div>
      </div>
      {active ? (
        <p className="mt-1 font-serif text-fluid-sm italic text-inkSoft">{active.subtle}</p>
      ) : null}
      {showLog && lastLog ? (
        <div className="mt-2 rounded-sharp border border-rule/60 bg-paper/50 p-3 text-fluid-sm">
          <div className="flex items-center justify-between">
            <strong className="font-display text-[11px] uppercase tracking-wider text-inkSoft">
              {lastLog.phase} phase log (round {lastLog.round})
            </strong>
            <button
              type="button"
              className="min-h-tap rounded-sharp px-2 text-fluid-sm text-inkMute hover:text-inkSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
            <p className="mt-2 rounded-sharp bg-warning/15 px-2 py-1 font-display text-[11px] uppercase tracking-wider text-warning">
              ⚠ IMF intervention applied.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
