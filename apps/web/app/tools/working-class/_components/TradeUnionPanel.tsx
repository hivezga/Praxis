"use client";

import type { Dispatch } from "react";

import {
  INDUSTRY_COLOURS,
  type IndustryColour,
  type TUStatus,
  type WCInputs,
  type WCOutputs,
} from "@/lib/tools/wc-companion";

import type { WCAction } from "../page";

interface Props {
  inputs: WCInputs;
  outputs: WCOutputs;
  dispatch: Dispatch<WCAction>;
}

const COLOUR_LABEL: Record<IndustryColour, string> = {
  red: "Red — industrial",
  blue: "Blue — service",
  yellow: "Yellow — agriculture",
  green: "Green — health & edu",
  purple: "Purple — luxury",
};

const COLOUR_DOT: Record<IndustryColour, string> = {
  red: "bg-[#c73c2c]",
  blue: "bg-[#2d5fa8]",
  yellow: "bg-[#d59b35]",
  green: "bg-[#1e7349]",
  purple: "bg-[#6b3a8c]",
};

export function TradeUnionPanel({ inputs, outputs, dispatch }: Props) {
  return (
    <div className="rounded-sm border border-rule/60 bg-paper/50 p-4 sm:p-5">
      <p className="poster-eyebrow text-inkMute">Trade Unions</p>

      <ul className="mt-3 flex flex-col gap-1.5">
        {INDUSTRY_COLOURS.map((c) => {
          const status = outputs.tuByColour[c];
          const employed = inputs.workforce.byColour[c].employed;
          return (
            <li
              key={c}
              className="flex flex-wrap items-center gap-3 rounded-sharp border border-rule/40 bg-surface/20 px-3 py-2"
            >
              <span
                aria-hidden
                className={`h-3 w-3 shrink-0 rounded-full ${COLOUR_DOT[c]}`}
              />
              <span className="min-w-0 flex-1 font-mono text-[12px] text-ink">
                {COLOUR_LABEL[c]}
                <span className="ml-2 text-inkMute">({employed} employed)</span>
              </span>
              <StatusBadge status={status} />
              <UnionAction
                status={status}
                onForm={() =>
                  dispatch({ type: "setUnion", colour: c, status: "formed" })
                }
                onUnform={() =>
                  dispatch({ type: "setUnion", colour: c, status: "none" })
                }
              />
            </li>
          );
        })}
      </ul>

      <p className="mt-3 border-t border-rule/40 pt-2 font-mono text-[12px] text-inkSoft">
        TU VP now:{" "}
        <span className="font-light text-ink">{outputs.tuVpNow}</span>
        <span className="mx-2 text-inkSubtle">·</span>
        Potential:{" "}
        <span className="font-light text-state">{outputs.tuVpPotential}</span>
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: TUStatus }) {
  if (status === "formed") {
    return (
      <span className="rounded-sharp bg-state/15 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-state">
        Formed
      </span>
    );
  }
  if (status === "eligible") {
    return (
      <span className="rounded-sharp bg-warning/20 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-warning">
        Eligible
      </span>
    );
  }
  return (
    <span className="rounded-sharp bg-surface/40 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-inkMute">
      Not eligible
    </span>
  );
}

function UnionAction({
  status,
  onForm,
  onUnform,
}: {
  status: TUStatus;
  onForm: () => void;
  onUnform: () => void;
}) {
  if (status === "formed") {
    return (
      <button
        type="button"
        onClick={onUnform}
        className="min-h-tap rounded-sharp border border-rule/50 px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-inkMute transition-colors hover:border-rule hover:text-inkSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        Unform
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onForm}
      disabled={status !== "eligible"}
      className="min-h-tap rounded-sharp border border-state/50 bg-state/10 px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-state transition-colors hover:border-state hover:bg-state/20 disabled:cursor-not-allowed disabled:border-rule/30 disabled:bg-transparent disabled:text-inkSubtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      Form union
    </button>
  );
}
