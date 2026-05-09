"use client";

import { useMemo } from "react";

import { wasm } from "@/lib/wasm";
import { useGameState } from "@/lib/store";
import type { ClassId } from "@/lib/types/game";

interface VpBreakdown {
  base: number;
  total: number;
  prosperity?: number;
  tradeUnions?: number;
  storage?: number;
  legitimacy?: number;
  cash?: number;
  capital?: number;
}

const ACCENT: Record<
  ClassId,
  { label: string; text: string; bg: string; border: string; rail: string }
> = {
  working:    { label: "Working Class",    text: "text-working",    bg: "bg-working/[0.06]",    border: "border-working/40",    rail: "bg-working"    },
  middle:     { label: "Middle Class",     text: "text-middle",     bg: "bg-middle/[0.06]",     border: "border-middle/40",     rail: "bg-middle"     },
  capitalist: { label: "Capitalist Class", text: "text-capitalist", bg: "bg-capitalist/[0.06]", border: "border-capitalist/40", rail: "bg-capitalist" },
  state:      { label: "The State",        text: "text-state",      bg: "bg-state/[0.06]",      border: "border-state/40",      rail: "bg-state"      },
};

const PLACE = ["1st", "2nd", "3rd", "4th"];

export function ScoringPanel() {
  const state = useGameState();

  const vpMap = useMemo(() => {
    if (!state) return null;
    return Object.fromEntries(
      state.meta.classesInPlay.map((c) => [
        c,
        wasm().compute_vp_wasm(state, c) as VpBreakdown,
      ]),
    ) as Record<ClassId, VpBreakdown>;
  }, [state]);

  if (!state || !vpMap) return null;

  const ranked = [...state.meta.classesInPlay].sort(
    (a, b) => vpMap[b].total - vpMap[a].total,
  );

  const isFinal = state.meta.round === 5;
  const winner = ACCENT[ranked[0]].label;

  return (
    <section
      className="rounded-md border border-rule/60 bg-surface/60 p-4 sm:p-5"
      aria-label={isFinal ? "Final scores" : `Round ${state.meta.round} scoring`}
    >
      <div className="mb-4">
        <h2 className="font-display text-poster-md uppercase tracking-tight text-ink">
          {isFinal ? "Final Scores" : `Round ${state.meta.round} — Scoring`}
        </h2>
        {isFinal ? (
          <p className="mt-1 font-display text-fluid-base uppercase tracking-wider text-accent">
            Game over — {winner} wins
          </p>
        ) : (
          <p className="mt-1 font-serif text-fluid-sm italic text-inkMute">
            Live VP totals · Apply end-of-round to advance to the next round.
          </p>
        )}
      </div>

      <div className="space-y-2.5">
        {ranked.map((classId, i) => {
          const vp = vpMap[classId];
          const accent = ACCENT[classId];
          const isLeader = i === 0;

          return (
            <div
              key={classId}
              className={`relative overflow-hidden rounded-sharp border ${accent.border} ${accent.bg} px-4 py-3 pl-5 ${
                isLeader && isFinal ? "shadow-poster-sm ring-2 ring-accent/40" : ""
              }`}
            >
              <span aria-hidden className={`absolute left-0 top-0 h-full w-1 ${accent.rail}`} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="shrink-0 font-display text-[10px] uppercase tracking-[0.2em] text-inkMute">
                    {PLACE[i]}
                  </span>
                  <span
                    className={`min-w-0 font-display text-fluid-base uppercase tracking-tight ${accent.text}`}
                  >
                    {accent.label}
                  </span>
                </div>
                <span className={`shrink-0 font-mono text-fluid-xl font-bold leading-none ${accent.text}`}>
                  {vp.total}
                  <span className="ml-1 font-display text-[10px] uppercase tracking-wider text-inkMute">
                    VP
                  </span>
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {vp.base !== 0 && <Chip label="Base" value={vp.base} />}
                {vp.prosperity != null && <Chip label="Prosperity" value={vp.prosperity} />}
                {vp.tradeUnions != null && <Chip label="Trade unions" value={vp.tradeUnions} />}
                {vp.storage != null && <Chip label="Storage" value={vp.storage} />}
                {vp.legitimacy != null && <Chip label="Legitimacy" value={vp.legitimacy} />}
                {vp.capital != null && <Chip label="Capital" value={vp.capital} />}
                {vp.cash != null && <Chip label="Cash" value={vp.cash} />}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Chip({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-sharp border border-rule/50 bg-paper/60 px-2 py-0.5 text-fluid-sm">
      <span className="text-inkSoft">{label}</span>
      <span className="font-mono font-semibold text-ink">{value}</span>
    </span>
  );
}
