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
    <div className="rounded-md border border-rule/60 bg-paper/30 p-3">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-serif text-[12px] italic text-inkSoft">
            <span className="not-italic font-mono text-inkMute">{policy.number}.</span>{" "}
            {policy.name}
          </div>
          <div className="mt-0.5 font-serif text-[10px] italic text-inkMute">
            {policy.axis === "leftRight" ? "Socialism ↔ Neoliberalism" : "Nationalism ↔ Globalism"}
          </div>
        </div>
        <span className="shrink-0 font-mono text-sm font-light text-inkSoft">{position}</span>
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
              className={`min-w-0 overflow-hidden rounded-md border px-1.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
                active
                  ? "border-accent/40 bg-accent/[0.08] text-accentInk"
                  : pending
                    ? "border-rose-400/40 bg-rose-400/[0.05] text-danger"
                    : "border-rule/50 bg-surface/40 text-inkSoft hover:border-rule hover:text-ink"
              }`}
              title={policy.sections[s].tooltip}
              onClick={() => onChange?.(s)}
            >
              <div className="mb-0.5 font-mono text-[9px] uppercase opacity-60">{s}</div>
              <div className="hyphens-auto break-words text-[10px] leading-tight">
                {policy.sections[s].label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
