"use client";

import type { MCOutputs, PolicyId } from "@/lib/tools/mc-companion";

interface Props {
  outputs: MCOutputs;
}

interface PolicyRow {
  id: PolicyId;
  number: number;
  name: string;
  countsForSectionB: boolean;
}

const POLICY_ROWS: PolicyRow[] = [
  { id: "fiscal", number: 1, name: "Fiscal Policy", countsForSectionB: true },
  { id: "laborMarket", number: 2, name: "Labor Market", countsForSectionB: true },
  { id: "taxation", number: 3, name: "Taxation", countsForSectionB: true },
  { id: "health", number: 4, name: "Health & Benefits", countsForSectionB: true },
  { id: "education", number: 5, name: "Education Welfare", countsForSectionB: true },
  { id: "foreignTrade", number: 6, name: "Foreign Trade", countsForSectionB: false },
  { id: "immigration", number: 7, name: "Immigration", countsForSectionB: false },
];

const STOPLIGHT_DOT: Record<"good" | "neutral" | "trouble", string> = {
  good: "bg-state",
  neutral: "bg-warning",
  trouble: "bg-working",
};

const STOPLIGHT_LABEL: Record<"good" | "neutral" | "trouble", string> = {
  good: "Good",
  neutral: "Neutral",
  trouble: "Trouble",
};

export function PolicyMap({ outputs }: Props) {
  return (
    <div className="rounded-sm border border-rule/60 bg-paper/50 p-4 sm:p-5">
      <p className="poster-eyebrow text-inkMute">Policy Map</p>

      <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[12px]">
        <Chip
          dotClass="bg-state"
          label={`${outputs.goodCount} Good`}
          tone="state"
        />
        <Chip
          dotClass="bg-warning"
          label={`${outputs.neutralCount} Neutral`}
          tone="warning"
        />
        <Chip
          dotClass="bg-working"
          label={`${outputs.troubleCount} Trouble`}
          tone="working"
        />
      </div>

      <ul className="mt-3 flex flex-col gap-1">
        {POLICY_ROWS.map((p) => {
          const light = outputs.policyStoplight[p.id];
          return (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-sharp border border-rule/30 bg-surface/20 px-3 py-2"
            >
              <span
                aria-hidden
                className={`h-3 w-3 shrink-0 rounded-full ${STOPLIGHT_DOT[light]}`}
              />
              <span className="font-mono text-[11px] text-inkMute">
                {p.number}.
              </span>
              <span className="min-w-0 flex-1 font-serif text-[12px] italic text-inkSoft">
                {p.name}
                {!p.countsForSectionB ? (
                  <span className="ml-1 text-[10px] text-inkSubtle">
                    (no EOG VP)
                  </span>
                ) : null}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-inkMute">
                {STOPLIGHT_LABEL[light]}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 rounded-sharp border border-rule/40 bg-surface/30 p-3">
        <p className="poster-eyebrow text-inkMute">
          EOG VP (rulebook page 25)
        </p>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[12px] text-inkSoft">
          <dt>Section B policies (1–5)</dt>
          <dd className="text-right">{outputs.sectionBCount}</dd>
          <dt>Policy VP</dt>
          <dd className="text-right font-light text-ink">
            +{outputs.eogPolicyVp}
          </dd>
          <dt>Storage VP</dt>
          <dd className="text-right font-light text-ink">
            +{outputs.eogStorageVp}
          </dd>
          <dt>Cash VP (÷15)</dt>
          <dd className="text-right font-light text-ink">
            +{outputs.eogCashVp}
          </dd>
          <dt className="border-t border-rule/40 pt-1.5">Total EOG VP</dt>
          <dd className="border-t border-rule/40 pt-1.5 text-right font-light text-state">
            +{outputs.eogTotalVp}
          </dd>
        </dl>
      </div>
    </div>
  );
}

function Chip({
  dotClass,
  label,
  tone,
}: {
  dotClass: string;
  label: string;
  tone: "state" | "warning" | "working";
}) {
  const bg =
    tone === "state"
      ? "bg-state/10"
      : tone === "warning"
        ? "bg-warning/15"
        : "bg-working/10";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sharp border border-rule/40 px-2 py-0.5 text-inkSoft ${bg}`}
    >
      <span aria-hidden className={`h-2 w-2 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}
