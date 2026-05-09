"use client";

import { AutoRunButtons } from "./AutoRunButtons";
import { PartyBadge } from "./PartyBadge";
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
    <header className="sticky top-0 z-30 border-b border-rule/60 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-2.5 px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:gap-x-6">
        {/* Round selector */}
        <div className="flex items-center gap-3">
          <span className="w-12 shrink-0 font-serif text-[10px] uppercase italic tracking-[0.3em] text-inkMute lg:w-auto">
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
                className={`flex h-9 w-9 items-center justify-center rounded-md border font-serif text-[15px] font-normal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
                  round === n
                    ? "border-accent/50 bg-accent/15 text-accentInk"
                    : "border-rule/60 bg-surface/40 text-inkMute hover:border-rule hover:text-inkSoft"
                }`}
              >
                {ROMAN[n]}
              </button>
            ))}
          </div>
        </div>

        {/* Phase selector */}
        <div className="flex min-w-0 items-center gap-3 lg:flex-1">
          <span className="w-12 shrink-0 font-serif text-[10px] uppercase italic tracking-[0.3em] text-inkMute lg:w-auto">
            Phase
          </span>
          <div className="flex flex-1 gap-1 lg:flex-initial">
            {PHASES.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-label={p.label}
                aria-pressed={phase === p.id}
                onClick={() => setPhase(p.id)}
                className={`min-h-[36px] flex-1 rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 sm:flex-initial sm:px-3 sm:text-xs ${
                  phase === p.id
                    ? "border-accent/50 bg-accent/15 text-accentInk"
                    : "border-rule/60 bg-surface/40 text-inkSoft hover:border-rule hover:text-ink"
                }`}
              >
                <span className="sm:hidden">{p.short}</span>
                <span className="hidden sm:inline">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 lg:shrink-0">
          <button
            type="button"
            className="btn flex-1 sm:flex-initial"
            onClick={undo}
            disabled={!canUndo}
            aria-label="Undo last change"
            title="Undo last change"
          >
            ↶ Undo
          </button>
          <button
            type="button"
            className="btn flex-1 sm:flex-initial"
            onClick={advancePhase}
          >
            Next →
          </button>
          <button
            type="button"
            className="btn btn-primary flex-1 sm:flex-initial"
            onClick={onOpenEndRound}
          >
            End round
          </button>
        </div>

        {/* Party badge — only renders when in a room */}
        <div className="lg:order-last">
          <PartyBadge />
        </div>
      </div>

      {/* Phase cue — concise reminder of what to do */}
      {phaseInfo ? (
        <div className="mx-auto max-w-screen-2xl border-t border-rule/40 px-4 py-2 sm:px-5">
          <p className="font-serif text-[12px] italic leading-snug text-inkSoft sm:text-[13px] sm:leading-relaxed">
            <span className="not-italic text-inkMute">— </span>
            {phaseInfo.cue}
          </p>
        </div>
      ) : null}

      {/* Auto-run buttons for the deterministic phases (Prep / Production / Scoring) */}
      <AutoRunButtons />
    </header>
  );
}
