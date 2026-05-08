"use client";

import { useGame, useGameState } from "@/lib/store";
import type { Phase } from "@/lib/types/game";

const PHASES: { id: Phase; label: string; short: string }[] = [
  { id: "preparation", label: "Preparation", short: "Prep" },
  { id: "action",      label: "Action",      short: "Action" },
  { id: "production",  label: "Production",  short: "Prod" },
  { id: "elections",   label: "Elections",   short: "Elect" },
  { id: "scoring",     label: "Scoring",     short: "Score" },
];

export function RoundPhaseHeader({ onOpenEndRound }: { onOpenEndRound: () => void }) {
  const state = useGameState();
  const setPhase = useGame((s) => s.setPhase);
  const setRound = useGame((s) => s.setRound);
  const advancePhase = useGame((s) => s.advancePhase);
  const undo = useGame((s) => s.undo);
  if (!state) return null;
  const { round, phase } = state.meta;
  const canUndo = state.history.length > 0;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5">
        {/* Round selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">Round</span>
          <div className="flex gap-1">
            {([1, 2, 3, 4, 5] as const).map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`Round ${n}`}
                aria-pressed={round === n}
                onClick={() => setRound(n)}
                className={`h-7 w-7 rounded-md border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  round === n
                    ? "border-indigo-500/70 bg-indigo-600 text-white"
                    : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Phase selector */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">Phase</span>
          <div className="flex flex-wrap gap-1">
            {PHASES.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-label={p.label}
                aria-pressed={phase === p.id}
                onClick={() => setPhase(p.id)}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  phase === p.id
                    ? "border-indigo-500/70 bg-indigo-600 text-white"
                    : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                }`}
              >
                <span className="sm:hidden">{p.short}</span>
                <span className="hidden sm:inline">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn"
            onClick={undo}
            disabled={!canUndo}
            aria-label="Undo last change"
            title="Undo last change"
          >
            ↶ Undo
          </button>
          <button type="button" className="btn" onClick={advancePhase}>
            Next →
          </button>
          <button type="button" className="btn btn-primary" onClick={onOpenEndRound}>
            End round
          </button>
        </div>
      </div>
    </header>
  );
}
