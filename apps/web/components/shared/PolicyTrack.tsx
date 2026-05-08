"use client";

import type { PolicySection } from "@/lib/types/game";
import type { PolicyDefinition } from "@/lib/data/policies";

interface Props {
  policy: PolicyDefinition;
  position: PolicySection;
  pendingPosition?: PolicySection;
  onChange?: (next: PolicySection) => void;
}

const SECTIONS: PolicySection[] = ["A", "B", "C"];

export function PolicyTrack({ policy, position, pendingPosition, onChange }: Props) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            {policy.number}. {policy.name}
          </div>
          <div className="mt-0.5 text-[9px] text-slate-600">
            {policy.axis === "leftRight" ? "Socialism ↔ Neoliberalism" : "Nationalism ↔ Globalism"}
          </div>
        </div>
        <span className="shrink-0 font-mono text-sm font-semibold text-slate-300">{position}</span>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {SECTIONS.map((s) => {
          const active = s === position;
          const pending = s === pendingPosition && s !== position;
          return (
            <button
              key={s}
              type="button"
              aria-label={`Set ${policy.name} to section ${s}`}
              aria-pressed={active}
              className={`rounded-md border px-1.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                active
                  ? "border-indigo-500/70 bg-indigo-600/25 text-slate-100"
                  : pending
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
                    : "border-slate-700/60 bg-slate-900/60 text-slate-400 hover:border-slate-600 hover:text-slate-200"
              }`}
              title={policy.sections[s].tooltip}
              onClick={() => onChange?.(s)}
            >
              <div className="mb-0.5 font-mono text-[9px] font-semibold uppercase opacity-60">{s}</div>
              <div className="text-[10px] leading-tight">{policy.sections[s].label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
