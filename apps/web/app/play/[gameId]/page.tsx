"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { GlobalBoardPanel } from "@/components/board/GlobalBoardPanel";
import { RoundPhaseHeader } from "@/components/board/RoundPhaseHeader";
import { CapitalistPanel } from "@/components/classes/CapitalistPanel";
import { MiddlePanel } from "@/components/classes/MiddlePanel";
import { StatePanel } from "@/components/classes/StatePanel";
import { WorkingPanel } from "@/components/classes/WorkingPanel";
import { EndRoundWizard } from "@/components/endRound/EndRoundWizard";
import { ScoringPanel } from "@/components/scoring/ScoringPanel";
import { ErrorBoundary, PanelErrorFallback } from "@/components/shared/ErrorBoundary";
import { useGame, useGameState } from "@/lib/store";
import type { ClassId } from "@/lib/types/game";

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
    if (!state || state.meta.id !== params.gameId) {
      void load(params.gameId);
    }
  }, [params.gameId, state, load]);

  if (loading) {
    return (
      <main id="main" className="flex min-h-screen items-center justify-center text-slate-500">
        Loading…
      </main>
    );
  }
  if (!state) {
    return (
      <main id="main" className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <p className="text-slate-400">This game was not found in your browser storage.</p>
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
      <main id="main" className="mx-auto max-w-screen-2xl space-y-5 px-5 py-5">
        {/* Game identity row */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/40 pb-4">
          <div>
            <h1 className="font-serif text-2xl font-light text-slate-100">{state.meta.name}</h1>
            <p className="mt-1 font-serif text-xs italic text-slate-500">
              {state.meta.mode === "solo" ? "Solo" : "Party"} · {state.meta.playerCount} players
              {state.meta.expansions.crisisAndControl ? " · Crisis & Control" : ""}
            </p>
          </div>
          <Link href="/" className="btn btn-ghost text-xs">
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
            showAll ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
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

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-md border px-3 py-1.5 font-serif text-xs capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 ${
        active
          ? "border-amber-400/40 bg-amber-400/15 text-amber-100"
          : "border-slate-700/60 bg-slate-900/40 text-slate-400 hover:border-slate-600 hover:text-slate-200"
      }`}
    >
      {label}
    </button>
  );
}
