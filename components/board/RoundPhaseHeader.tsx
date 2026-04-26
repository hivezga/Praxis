"use client";

import { useGame, useGameState } from "@/lib/store";
import type { Phase } from "@/lib/types/game";

const PHASES: { id: Phase; label: string }[] = [
  { id: "preparation", label: "Preparation" },
  { id: "action", label: "Action" },
  { id: "production", label: "Production" },
  { id: "elections", label: "Elections" },
  { id: "scoring", label: "Scoring" },
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
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center gap-4 px-4 py-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500">Round</div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRound(n as 1 | 2 | 3 | 4 | 5)}
                className={`h-7 w-7 rounded-md border text-sm font-semibold ${
                  round === n
                    ? "border-indigo-500 bg-indigo-600 text-white"
                    : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-wider text-slate-500">Phase</div>
          <div className="flex flex-wrap items-center gap-1">
            {PHASES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPhase(p.id)}
                className={`rounded-md border px-2 py-1 text-xs font-medium ${
                  phase === p.id
                    ? "border-indigo-500 bg-indigo-600 text-white"
                    : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn" onClick={undo} disabled={!canUndo} title="Undo last change">
            ↶ Undo
          </button>
          <button type="button" className="btn" onClick={advancePhase}>
            Next phase →
          </button>
          <button type="button" className="btn btn-primary" onClick={onOpenEndRound}>
            End round
          </button>
        </div>
      </div>
    </header>
  );
}
