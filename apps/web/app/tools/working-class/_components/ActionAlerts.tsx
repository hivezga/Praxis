"use client";

import type { WCOutputs } from "@/lib/tools/wc-companion";

interface Props {
  outputs: WCOutputs;
}

export function ActionAlerts({ outputs }: Props) {
  return (
    <div className="rounded-sm border border-rule/60 bg-paper/50 p-4 sm:p-5">
      <p className="poster-eyebrow text-inkMute">Action Alerts</p>
      <ul className="mt-3 flex flex-col gap-2">
        <AlertRow
          active={outputs.strikeAlert}
          activeLabel="Strike risk"
          activeHint="Lowest wage level is below 3 — WC may strike during the Action phase."
          idleLabel="No strike risk"
        />
        <AlertRow
          active={outputs.demonstrationAlert}
          activeLabel="Demonstration risk"
          activeHint={`Unemployed (${outputs.totalVacancies + 3}+) exceeds vacancies (${outputs.totalVacancies}) by more than 2.`}
          idleLabel="No demonstration risk"
        />
      </ul>
    </div>
  );
}

function AlertRow({
  active,
  activeLabel,
  activeHint,
  idleLabel,
}: {
  active: boolean;
  activeLabel: string;
  activeHint: string;
  idleLabel: string;
}) {
  if (active) {
    return (
      <li className="rounded-sharp border border-danger/40 bg-danger/10 p-3">
        <div className="flex items-baseline gap-2">
          <span aria-hidden className="font-mono text-base text-danger">
            ⚠
          </span>
          <span className="font-display text-[12px] uppercase tracking-[0.16em] text-danger">
            {activeLabel}
          </span>
        </div>
        <p className="mt-1 font-serif text-[12px] italic leading-snug text-inkSoft">
          {activeHint}
        </p>
      </li>
    );
  }
  return (
    <li className="flex items-center gap-2 rounded-sharp border border-rule/40 bg-surface/20 px-3 py-2">
      <span aria-hidden className="font-mono text-sm text-state">
        ✓
      </span>
      <span className="font-mono text-[12px] text-inkSoft">{idleLabel}</span>
    </li>
  );
}
