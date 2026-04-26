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
import { useGame, useGameState } from "@/lib/store";
import type { ClassId } from "@/lib/types/game";

const PANELS: Record<ClassId, React.FC> = {
  working: WorkingPanel,
  middle: MiddlePanel,
  capitalist: CapitalistPanel,
  state: StatePanel,
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
    return <main className="p-8 text-slate-400">Loading…</main>;
  }
  if (!state) {
    return (
      <main className="mx-auto max-w-xl p-8 text-center text-slate-300">
        <p>This game wasn’t found in your browser storage.</p>
        <Link href="/" className="mt-4 inline-block btn btn-primary">
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
      <main className="mx-auto max-w-screen-2xl space-y-4 px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold text-slate-100">{state.meta.name}</h1>
            <p className="text-xs text-slate-500">
              {state.meta.mode === "solo" ? "Solo" : "Party"} mode · {state.meta.playerCount} players ·{" "}
              {state.meta.expansions.crisisAndControl ? "Crisis & Control" : "base game"}
            </p>
          </div>
          <Link href="/" className="btn btn-ghost text-xs">
            ← Saved games
          </Link>
        </div>

        <GlobalBoardPanel />

        {state.meta.mode === "solo" ? (
          <div className="flex flex-wrap gap-1">
            <TabBtn label="All" active={activeTab === "all"} onClick={() => setActiveTab("all")} />
            {activeClasses.map((c) => (
              <TabBtn key={c} label={c} active={activeTab === c} onClick={() => setActiveTab(c)} />
            ))}
          </div>
        ) : null}

        <div
          className={`grid gap-4 ${
            showAll ? "grid-cols-1 lg:grid-cols-2 xl:grid-cols-2" : "grid-cols-1"
          }`}
        >
          {showAll
            ? activeClasses.map((c) => {
                const Panel = PANELS[c];
                return <Panel key={c} />;
              })
            : (() => {
                const Panel = PANELS[activeTab as ClassId];
                return <Panel />;
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
      className={`rounded-md border px-3 py-1.5 text-xs capitalize ${
        active
          ? "border-indigo-500 bg-indigo-600 text-white"
          : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500"
      }`}
    >
      {label}
    </button>
  );
}
