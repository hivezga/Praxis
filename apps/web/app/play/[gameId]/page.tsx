"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { GlobalBoardPanel } from "@/components/board/GlobalBoardPanel";
import { RoundPhaseHeader } from "@/components/board/RoundPhaseHeader";
import { CapitalistPanel } from "@/components/classes/CapitalistPanel";
import { MiddlePanel } from "@/components/classes/MiddlePanel";
import { StatePanel } from "@/components/classes/StatePanel";
import { WorkingPanel } from "@/components/classes/WorkingPanel";
import { ScoringPanel } from "@/components/scoring/ScoringPanel";
import { ErrorBoundary, PanelErrorFallback } from "@/components/shared/ErrorBoundary";
import { useGame, useGameState } from "@/lib/store";
import type { ClassId, GameState } from "@/lib/types/game";

// Lazy-load the wizard — it's only opened on demand and pulls in WASM phase logic.
const EndRoundWizard = dynamic(
  () => import("@/components/endRound/EndRoundWizard").then((m) => m.EndRoundWizard),
  { ssr: false },
);

const PANELS: Record<ClassId, React.FC> = {
  working:    WorkingPanel,
  middle:     MiddlePanel,
  capitalist: CapitalistPanel,
  state:      StatePanel,
};

const CLASS_LABEL: Record<ClassId, string> = {
  working:    "Working",
  middle:     "Middle",
  capitalist: "Capitalist",
  state:      "State",
};

export default function GamePage() {
  const params = useParams<{ gameId: string }>();
  const state = useGameState();
  const load = useGame((s) => s.load);
  const loading = useGame((s) => s.loading);
  const [endRoundOpen, setEndRoundOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ClassId | "all">("all");

  useEffect(() => {
    // `state` deliberately omitted from deps — putting it here re-ran the
    // effect on every counter tap. Read the latest state from the store
    // imperatively so the guard still works.
    const current = useGame.getState().state;
    if (!current || current.meta.id !== params.gameId) {
      void load(params.gameId);
    }
  }, [params.gameId, load]);

  if (loading) {
    return (
      <main
        id="main"
        className="flex min-h-screen items-center justify-center font-display text-fluid-base uppercase tracking-wider text-inkMute"
      >
        Loading…
      </main>
    );
  }
  if (!state) {
    return (
      <main
        id="main"
        className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center"
      >
        <p className="font-serif text-fluid-base text-inkSoft">
          This game was not found in your browser storage.
        </p>
        <Link href="/" className="btn btn-primary">
          ← Back to home
        </Link>
      </main>
    );
  }

  const activeClasses = state.meta.classesInPlay;
  const showAll = state.meta.mode === "party" || activeTab === "all";

  return (
    <div className="min-h-screen">
      <RoundPhaseHeader onOpenEndRound={() => setEndRoundOpen(true)} />
      <main id="main" className="mx-auto max-w-screen-2xl space-y-5 px-3 py-4 sm:px-5 sm:py-5">
        {/* Game identity row */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 border-b border-rule/40 pb-4">
          <div className="min-w-0">
            <h1 className="font-display text-fluid-xl uppercase tracking-tight text-ink">
              {state.meta.name}
            </h1>
            <p className="mt-1 font-serif text-fluid-xs italic text-inkMute">
              {state.meta.mode === "solo" ? "Solo" : "Party"} · {state.meta.playerCount} players
              {state.meta.expansions.crisisAndControl ? " · Crisis & Control" : ""}
            </p>
          </div>
          <ScoreLine state={state} classes={state.meta.classesInPlay} />
          <Link href="/" className="btn btn-ghost shrink-0">
            ← Saved games
          </Link>
        </div>

        <GlobalBoardPanel />

        {state.meta.phase === "scoring" && <ScoringPanel />}

        {/* Solo mode tab switcher */}
        {state.meta.mode === "solo" ? (
          <div className="flex flex-wrap gap-1.5">
            <TabBtn label="All" active={activeTab === "all"} onClick={() => setActiveTab("all")} />
            {activeClasses.map((c) => (
              <TabBtn
                key={c}
                label={CLASS_LABEL[c]}
                active={activeTab === c}
                onClick={() => setActiveTab(c)}
              />
            ))}
          </div>
        ) : null}

        {/* Class panels */}
        <div
          className={`grid gap-4 ${
            showAll ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"
          }`}
        >
          {showAll
            ? activeClasses.map((c) => {
                const Panel = PANELS[c];
                return (
                  <ErrorBoundary
                    key={c}
                    fallback={(_err, retry) => (
                      <PanelErrorFallback label={CLASS_LABEL[c]} retry={retry} />
                    )}
                  >
                    <Panel />
                  </ErrorBoundary>
                );
              })
            : (() => {
                const Panel = PANELS[activeTab as ClassId];
                return (
                  <ErrorBoundary
                    fallback={(_err, retry) => (
                      <PanelErrorFallback
                        label={CLASS_LABEL[activeTab as ClassId]}
                        retry={retry}
                      />
                    )}
                  >
                    <Panel />
                  </ErrorBoundary>
                );
              })()}
        </div>
      </main>
      <EndRoundWizard open={endRoundOpen} onClose={() => setEndRoundOpen(false)} />
    </div>
  );
}

const SCORE_RAIL: Record<ClassId, string> = {
  working:    "bg-working",
  middle:     "bg-middle",
  capitalist: "bg-capitalist",
  state:      "bg-state",
};

function ScoreLine({ state, classes }: { state: GameState; classes: ClassId[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2" aria-label="Victory points by class">
      {classes.map((c) => (
        <div key={c} className="flex items-center gap-2">
          <span aria-hidden className={`block h-7 w-2 ${SCORE_RAIL[c]}`} />
          <span className="font-mono text-fluid-lg font-medium leading-none text-ink">
            {state.classes[c].vp}
          </span>
          <span className="font-display text-[10px] uppercase tracking-[0.18em] text-inkMute">
            vp
          </span>
        </div>
      ))}
    </div>
  );
}

function TabBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-tap rounded-sharp border px-3 py-1.5 font-display text-fluid-xs uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${
        active
          ? "border-accent bg-accent/15 text-accentInk"
          : "border-rule/60 bg-surface/40 text-inkSoft hover:border-rule hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}
