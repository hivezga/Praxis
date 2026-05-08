"use client";

import { ReactNode } from "react";

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

const ACCENT: Record<ClassId, { border: string; headerBg: string; text: string; label: string }> = {
  working:    { border: "border-working/30",    headerBg: "bg-working/[0.07]",    text: "text-working",    label: "Working Class"    },
  middle:     { border: "border-middle/30",     headerBg: "bg-middle/[0.07]",     text: "text-middle",     label: "Middle Class"     },
  capitalist: { border: "border-capitalist/30", headerBg: "bg-capitalist/[0.07]", text: "text-capitalist", label: "Capitalist Class" },
  state:      { border: "border-state/30",      headerBg: "bg-state/[0.07]",      text: "text-state",      label: "The State"        },
};

interface Props {
  classId: ClassId;
  children: ReactNode;
}

export function ClassPanelShell({ classId, children }: Props) {
  const state = useGameState();
  const accent = ACCENT[classId];
  const vp = state
    ? (wasm().compute_vp_wasm(state, classId) as VpBreakdown)
    : null;
  return (
    <section className={`overflow-hidden rounded-xl border ${accent.border} bg-slate-900/60`}>
      <header className={`flex items-center justify-between px-4 py-3 ${accent.headerBg} border-b ${accent.border}`}>
        <span className={`text-xs font-semibold uppercase tracking-widest ${accent.text}`}>
          {accent.label}
        </span>
        {vp != null ? (
          <div className="flex items-baseline gap-1.5">
            <span className="text-[9px] uppercase tracking-widest text-slate-500">VP</span>
            <span className={`font-mono text-2xl font-semibold leading-none ${accent.text}`}>{vp.total}</span>
          </div>
        ) : null}
      </header>
      <div className="space-y-3 p-4">{children}</div>
    </section>
  );
}
