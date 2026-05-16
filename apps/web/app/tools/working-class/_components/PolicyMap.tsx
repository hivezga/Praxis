"use client";

import type { WCOutputs, PolicyId } from "@/lib/tools/wc-companion";

interface Props {
  outputs: WCOutputs;
}

interface PolicyRow {
  id: PolicyId;
  number: number;
  name: string;
}

const POLICY_ROWS: PolicyRow[] = [
  { id: "fiscal", number: 1, name: "Fiscal Policy" },
  { id: "laborMarket", number: 2, name: "Labor Market" },
  { id: "taxation", number: 3, name: "Taxation" },
  { id: "health", number: 4, name: "Health & Benefits" },
  { id: "education", number: 5, name: "Education Welfare" },
  { id: "foreignTrade", number: 6, name: "Foreign Trade" },
  { id: "immigration", number: 7, name: "Immigration" },
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
        <Chip dotClass="bg-state" label={`${outputs.goodCount} Good`} tone="state" />
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
              </span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-inkMute">
                {STOPLIGHT_LABEL[light]}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 border-t border-rule/40 pt-2 font-mono text-[12px] text-inkSoft">
        EOG policy VP estimate:{" "}
        <span className="font-light text-ink">
          {outputs.eogPolicyVpEstimate > 0 ? "+" : ""}
          {outputs.eogPolicyVpEstimate}
        </span>
      </p>
      <p className="mt-1 font-serif text-[11px] italic text-inkMute">
        ⚠ Directional only — exact formula unconfirmed against rulebook p.13.
      </p>
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
