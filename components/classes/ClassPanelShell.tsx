"use client";

import { ReactNode } from "react";

import { useGameState } from "@/lib/store";
import { vpFor } from "@/lib/game-rules/vp";
import type { ClassId } from "@/lib/types/game";

const ACCENT: Record<ClassId, { ring: string; chip: string; label: string }> = {
  working: { ring: "ring-working", chip: "bg-working/20 text-working", label: "Working Class" },
  middle: { ring: "ring-middle", chip: "bg-middle/20 text-middle", label: "Middle Class" },
  capitalist: { ring: "ring-capitalist", chip: "bg-capitalist/20 text-capitalist", label: "Capitalist Class" },
  state: { ring: "ring-state", chip: "bg-state/20 text-state", label: "The State" },
};

interface Props {
  classId: ClassId;
  children: ReactNode;
}

export function ClassPanelShell({ classId, children }: Props) {
  const state = useGameState();
  const accent = ACCENT[classId];
  const vp = state ? vpFor(classId, state) : null;
  return (
    <section className={`rounded-xl border border-slate-800 bg-slate-900/60 ring-1 ${accent.ring}/40`}>
      <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className={`rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${accent.chip}`}>
            {accent.label}
          </span>
        </div>
        {vp ? (
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Live VP</div>
            <div className="font-mono text-2xl font-semibold text-slate-100">{vp.total}</div>
          </div>
        ) : null}
      </header>
      <div className="space-y-3 p-4">{children}</div>
    </section>
  );
}
