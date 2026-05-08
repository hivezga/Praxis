"use client";

import { useGame, useGameState } from "@/lib/store";
import type { Phase } from "@/lib/types/game";

const PHASES: { id: Phase; label: string; short: string; cue: string }[] = [
  {
    id: "preparation",
    label: "Preparation",
    short: "Prep",
    cue: "Reset action markers, refresh cards, place new production tiles, return spent voting cubes.",
  },
  {
    id: "action",
    label: "Action",
    short: "Action",
    cue: "Players take turns playing action cards. Continue until everyone has passed.",
  },
  {
    id: "production",
    label: "Production",
    short: "Prod",
    cue: "Workers produce goods at assigned companies. Capitalist & Middle pay wages.",
  },
  {
    id: "elections",
    label: "Elections",
    short: "Elect",
    cue: "Resolve pending bills. Vote with cubes drawn from each class’s bag.",
  },
  {
    id: "scoring",
    label: "Scoring",
    short: "Score",
    cue: "Apply taxes, welfare costs, prosperity gains and VP. Use the End-round wizard.",
  },
];

const ROMAN: Record<number, string> = {
  1: "I",
  2: "II",
  3: "III",
  4: "IV",
  5: "V",
};

export function RoundPhaseHeader({ onOpenEndRound }: { onOpenEndRound: () => void }) {
  const state = useGameState();
  const setPhase = useGame((s) => s.setPhase);
  const setRound = useGame((s) => s.setRound);
  const advancePhase = useGame((s) => s.advancePhase);
  const undo = useGame((s) => s.undo);
  if (!state) return null;
  const { round, phase } = state.meta;
  const canUndo = state.history.length > 0;
  const phaseInfo = PHASES.find((p) => p.id === phase);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/60 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3">
        {/* Round selector */}
        <div className="flex items-center gap-3">
          <span className="font-serif text-[10px] uppercase italic tracking-[0.3em] text-slate-500">
            Round
          </span>
          <div className="flex gap-1">
            {([1, 2, 3, 4, 5] as const).map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`Round ${n}`}
                aria-pressed={round === n}
                onClick={() => setRound(n)}
                className={`flex h-7 w-7 items-center justify-center rounded-md border font-serif text-[13px] font-normal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 ${
                  round === n
                    ? "border-amber-400/50 bg-amber-400/15 text-amber-100"
                    : "border-slate-700/60 bg-slate-900/40 text-slate-500 hover:border-slate-600 hover:text-slate-300"
                }`}
              >
                {ROMAN[n]}
              </button>
            ))}
          </div>
        </div>

        {/* Phase selector */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="shrink-0 font-serif text-[10px] uppercase italic tracking-[0.3em] text-slate-500">
            Phase
          </span>
          <div className="flex flex-wrap gap-1">
            {PHASES.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-label={p.label}
                aria-pressed={phase === p.id}
                onClick={() => setPhase(p.id)}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 ${
                  phase === p.id
                    ? "border-amber-400/50 bg-amber-400/15 text-amber-100"
                    : "border-slate-700/60 bg-slate-900/40 text-slate-400 hover:border-slate-600 hover:text-slate-200"
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

      {/* Phase cue — concise reminder of what to do */}
      {phaseInfo ? (
        <div className="mx-auto max-w-screen-2xl border-t border-slate-800/40 px-5 py-2">
          <p className="font-serif text-[13px] italic leading-relaxed text-slate-400">
            <span className="not-italic text-slate-600">— </span>
            {phaseInfo.cue}
          </p>
        </div>
      ) : null}
    </header>
  );
}
