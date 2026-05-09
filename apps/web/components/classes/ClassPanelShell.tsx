"use client";

import { ReactNode } from "react";

import { wasm } from "@/lib/wasm";
import { useClassNickname, useGameState } from "@/lib/store";
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
  { rule: string; rail: string; text: string; label: string; subtitle: string }
> = {
  working: {
    rule:     "border-working/25",
    rail:     "bg-working",
    text:     "text-working",
    label:    "Working Class",
    subtitle: "Labor · unions · welfare",
  },
  middle: {
    rule:     "border-middle/25",
    rail:     "bg-middle",
    text:     "text-middle",
    label:    "Middle Class",
    subtitle: "Companies · capital · savings",
  },
  capitalist: {
    rule:     "border-capitalist/25",
    rail:     "bg-capitalist",
    text:     "text-capitalist",
    label:    "Capitalist Class",
    subtitle: "Revenue · capital · industry",
  },
  state: {
    rule:     "border-state/25",
    rail:     "bg-state",
    text:     "text-state",
    label:    "The State",
    subtitle: "Treasury · legitimacy · policy",
  },
};

interface Props {
  classId: ClassId;
  children: ReactNode;
}

export function ClassPanelShell({ classId, children }: Props) {
  const state = useGameState();
  const accent = ACCENT[classId];
  const nickname = useClassNickname(classId);
  const vp = state ? (wasm().compute_vp_wasm(state, classId) as VpBreakdown) : null;
  return (
    <section
      className={`relative overflow-hidden rounded-lg border ${accent.rule} bg-surface/30`}
    >
      <span aria-hidden className={`absolute left-0 top-0 h-full w-[2px] ${accent.rail}`} />
      <header
        className={`flex items-end justify-between gap-3 border-b ${accent.rule} px-5 py-4`}
      >
        <div className="min-w-0">
          <h3 className={`font-serif text-2xl font-light leading-none ${accent.text}`}>
            {accent.label}
            {nickname ? (
              <span className="ml-2 font-serif text-base italic text-inkMute">· {nickname}</span>
            ) : null}
          </h3>
          <p className="mt-1.5 font-serif text-[11px] uppercase italic tracking-[0.2em] text-inkMute">
            {accent.subtitle}
          </p>
        </div>
        {vp != null ? (
          <div className="flex items-baseline gap-2 text-right">
            <span className="font-serif text-[10px] uppercase italic tracking-[0.25em] text-inkMute">
              Victory
            </span>
            <span className={`font-mono text-3xl font-light leading-none ${accent.text}`}>
              {vp.total}
            </span>
          </div>
        ) : null}
      </header>
      <div className="space-y-5 p-5">{children}</div>
    </section>
  );
}
