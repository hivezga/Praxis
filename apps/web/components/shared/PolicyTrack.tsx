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
    <div className="@container rounded-sharp border border-rule/60 bg-paper/30 p-3">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-serif text-[12px] italic leading-tight text-inkSoft">
            <span className="not-italic font-mono text-inkMute">{policy.number}.</span>{" "}
            <span className="text-balance">{policy.name}</span>
          </div>
          <div className="mt-0.5 font-serif text-[10px] italic text-inkMute">
            {policy.axis === "leftRight" ? "Socialism ↔ Neoliberalism" : "Nationalism ↔ Globalism"}
          </div>
        </div>
        <span className="shrink-0 font-mono text-sm font-light text-inkSoft" aria-label={`Current position ${position}`}>
          {position}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {SECTIONS.map((s) => {
          const active = s === position;
          const pending = s === pendingPosition && s !== position;
          return (
            <button
              key={s}
              type="button"
              aria-label={`Set ${policy.name} to section ${s}: ${policy.sections[s].label}`}
              aria-pressed={active}
              className={`min-h-tap min-w-0 overflow-hidden rounded-sharp border px-1.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-paper ${
                active
                  ? "border-accent bg-accent/15 text-accentInk"
                  : pending
                    ? "border-danger/40 bg-danger/10 text-danger"
                    : "border-rule/50 bg-surface/40 text-inkSoft hover:border-rule hover:text-ink"
              }`}
              title={policy.sections[s].tooltip}
              onClick={() => onChange?.(s)}
            >
              <div className="mb-0.5 font-display text-[9px] uppercase tracking-wider opacity-70">
                {s}
              </div>
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
