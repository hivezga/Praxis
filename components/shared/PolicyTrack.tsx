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

// Three-segment policy track. Click a segment to set the position.
export function PolicyTrack({ policy, position, pendingPosition, onChange }: Props) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
      <div className="mb-2 flex items-baseline justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {policy.number}. {policy.name}
          </div>
          <div className="text-[10px] text-slate-500">
            {policy.axis === "leftRight" ? "Socialism ↔ Neoliberalism" : "Nationalism ↔ Globalism"}
          </div>
        </div>
        <span className="font-mono text-xs text-slate-300">{position}</span>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {SECTIONS.map((s) => {
          const active = s === position;
          const pending = s === pendingPosition && s !== position;
          return (
            <button
              key={s}
              type="button"
              className={`group rounded-md border px-2 py-2 text-left text-xs transition ${
                active
                  ? "border-indigo-500 bg-indigo-600/30 text-slate-100"
                  : pending
                    ? "border-amber-500/60 bg-amber-500/10 text-amber-200"
                    : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500 hover:text-slate-200"
              }`}
              title={policy.sections[s].tooltip}
              onClick={() => onChange?.(s)}
            >
              <div className="font-mono text-[10px] uppercase opacity-70">{s}</div>
              <div className="leading-tight">{policy.sections[s].label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
