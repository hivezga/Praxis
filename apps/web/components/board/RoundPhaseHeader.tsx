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
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-3 px-3 py-3 sm:px-5 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-5">
        {/* Round selector */}
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="font-display text-[10px] uppercase tracking-[0.25em] text-inkMute">
            Round
          </span>
          <div className="flex flex-wrap gap-1">
            {([1, 2, 3, 4, 5] as const).map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`Round ${n}`}
                aria-pressed={round === n}
                onClick={() => setRound(n)}
                className={`flex h-11 w-11 items-center justify-center rounded-sharp border font-display text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${
                  round === n
                    ? "border-accent bg-accent/20 text-accentInk"
                    : "border-rule/60 bg-surface/40 text-inkMute hover:border-rule hover:text-inkSoft"
                }`}
              >
                {ROMAN[n]}
              </button>
            ))}
          </div>
        </div>

        {/* Phase selector */}
        <div className="flex min-w-0 flex-wrap items-center gap-2 lg:flex-1">
          <span className="font-display text-[10px] uppercase tracking-[0.25em] text-inkMute">
            Phase
          </span>
          <div className="flex flex-1 flex-wrap gap-1">
            {PHASES.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-label={p.label}
                aria-pressed={phase === p.id}
                onClick={() => setPhase(p.id)}
                className={`min-h-tap min-w-0 flex-1 rounded-sharp border px-2 py-1.5 font-display text-[11px] uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper sm:flex-initial sm:px-3 sm:text-xs ${
                  phase === p.id
                    ? "border-accent bg-accent/20 text-accentInk"
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
        <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
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

        {/* Party badge — only renders when in a room */}
        <div className="lg:order-last">
          <PartyBadge />
        </div>
      </div>

      {/* Phase cue — concise reminder of what to do */}
      {phaseInfo ? (
        <div className="mx-auto max-w-screen-2xl border-t border-rule/40 px-3 py-2 sm:px-5">
          <p className="font-serif text-fluid-sm italic leading-snug text-inkSoft sm:leading-relaxed">
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
