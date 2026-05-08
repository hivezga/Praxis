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

const ACCENT: Record<ClassId, { label: string; text: string; bg: string; border: string }> = {
  working:    { label: "Working Class",    text: "text-working",    bg: "bg-working/[0.07]",    border: "border-working/30"    },
  middle:     { label: "Middle Class",     text: "text-middle",     bg: "bg-middle/[0.07]",     border: "border-middle/30"     },
  capitalist: { label: "Capitalist Class", text: "text-capitalist", bg: "bg-capitalist/[0.07]", border: "border-capitalist/30" },
  state:      { label: "The State",        text: "text-state",      bg: "bg-state/[0.07]",      border: "border-state/30"      },
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
    <section className="rounded-xl border border-slate-700 bg-slate-900/80 p-5">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-100">
          {isFinal ? "Final Scores" : `Round ${state.meta.round} — Scoring`}
        </h2>
        {isFinal ? (
          <p className="mt-0.5 text-sm font-medium text-amber-400">
            Game over — {winner} wins!
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-slate-500">
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
              className={`rounded-lg border ${accent.border} ${accent.bg} px-4 py-3 ${
                isLeader && isFinal ? "ring-2 ring-amber-500/40" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                    {PLACE[i]}
                  </span>
                  <span className={`truncate text-sm font-semibold ${accent.text}`}>
                    {accent.label}
                  </span>
                </div>
                <span className={`shrink-0 font-mono text-2xl font-bold leading-none ${accent.text}`}>
                  {vp.total}
                  <span className="ml-1 text-xs font-normal text-slate-500">VP</span>
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
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-950/60 px-2.5 py-0.5 text-xs">
      <span className="text-slate-400">{label}</span>
      <span className="font-mono font-semibold text-slate-200">{value}</span>
    </span>
  );
}
