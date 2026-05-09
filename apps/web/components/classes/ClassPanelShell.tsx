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
  { band: string; rail: string; tint: string; label: string; subtitle: string }
> = {
  working: {
    band:     "bg-working-deep text-working-ink",
    rail:     "bg-working",
    tint:     "bg-working/[0.04]",
    label:    "Working Class",
    subtitle: "Labor · unions · welfare",
  },
  middle: {
    band:     "bg-middle-deep text-middle-ink",
    rail:     "bg-middle",
    tint:     "bg-middle/[0.04]",
    label:    "Middle Class",
    subtitle: "Companies · capital · savings",
  },
  capitalist: {
    band:     "bg-capitalist-deep text-capitalist-ink",
    rail:     "bg-capitalist",
    tint:     "bg-capitalist/[0.04]",
    label:    "Capitalist Class",
    subtitle: "Revenue · capital · industry",
  },
  state: {
    band:     "bg-state-deep text-state-ink",
    rail:     "bg-state",
    tint:     "bg-state/[0.04]",
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
      aria-label={accent.label}
      className={`@container relative overflow-hidden rounded-md border border-rule/40 ${accent.tint}`}
    >
      <span aria-hidden className={`absolute left-0 top-0 z-10 h-full w-1.5 ${accent.rail}`} />

      <header className={`faction-band ${accent.band} pl-7`}>
        <div className="min-w-0">
          <h3 className="faction-band-title">
            {accent.label}
          </h3>
          {nickname ? (
            <p className="mt-1 font-serif text-[12px] italic opacity-90">
              · {nickname}
            </p>
          ) : null}
          <p className="mt-1.5 font-display text-[10px] uppercase tracking-[0.2em] opacity-80">
            {accent.subtitle}
          </p>
        </div>
        {vp != null ? (
          <div className="flex shrink-0 flex-col items-end text-right">
            <span className="font-display text-[9px] uppercase tracking-[0.25em] opacity-80">
              Victory
            </span>
            <span className="font-mono text-fluid-xl font-light leading-none">
              {vp.total}
            </span>
          </div>
        ) : null}
      </header>

      <div className="space-y-5 p-4 pl-5 sm:p-5 sm:pl-6">{children}</div>
    </section>
  );
}
