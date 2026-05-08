"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { GlobalBoardPanel } from "@/components/board/GlobalBoardPanel";
import { RoundPhaseHeader } from "@/components/board/RoundPhaseHeader";
import { CapitalistPanel } from "@/components/classes/CapitalistPanel";
import { MiddlePanel } from "@/components/classes/MiddlePanel";
import { StatePanel } from "@/components/classes/StatePanel";
import { WorkingPanel } from "@/components/classes/WorkingPanel";
import { ScoringPanel } from "@/components/scoring/ScoringPanel";
import { ErrorBoundary, PanelErrorFallback } from "@/components/shared/ErrorBoundary";
import { useGameState, useParty } from "@/lib/store";
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

export default function RoomPage() {
  const router = useRouter();
  const state = useGameState();
  const party = useParty();

  useEffect(() => {
    if (party.role !== "peer") {
      router.replace("/");
    }
  }, [party.role, router]);

  if (party.role !== "peer") return null;

  if (!state) {
    return (
      <main id="main" className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="editorial-eyebrow">Connected</p>
        <h1 className="editorial-h2">Waiting for the host…</h1>
        <p className="font-serif text-sm italic text-inkMute">
          The first state snapshot will arrive any moment.
        </p>
      </main>
    );
  }

  const activeClasses = state.meta.classesInPlay;

  return (
    <div className="min-h-screen">
      <PeerObserverBanner />
      <RoundPhaseHeader onOpenEndRound={() => {}} />
      <main id="main" className="mx-auto max-w-screen-2xl space-y-5 px-5 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule/40 pb-4">
          <div>
            <h1 className="font-serif text-2xl font-light text-ink">{state.meta.name}</h1>
            <p className="mt-1 font-serif text-xs italic text-inkMute">
              {state.meta.mode === "solo" ? "Solo" : "Party"} · {state.meta.playerCount} players
              {state.meta.expansions.crisisAndControl ? " · Crisis & Control" : ""}
            </p>
          </div>
          <Link href="/" className="btn btn-ghost text-xs">
            ← Leave
          </Link>
        </div>

        <GlobalBoardPanel />

        {state.meta.phase === "scoring" && <ScoringPanel />}

        <div className="grid gap-4 lg:grid-cols-2">
          {activeClasses.map((c) => {
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
          })}
        </div>
      </main>
    </div>
  );
}

function PeerObserverBanner() {
  return (
    <div className="border-b border-accent/20 bg-accent/[0.04] px-5 py-2 text-center">
      <p className="font-serif text-[13px] italic text-accentInk/80">
        Connected as observer — only the host can change values. Your taps are silent.
      </p>
    </div>
  );
}
