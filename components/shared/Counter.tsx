"use client";

import { ReactNode } from "react";

interface Props {
  label: string;
  value: number;
  onAdjust?: (delta: number) => void;
  onSet?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  // Optional accent classes (e.g. text-working).
  accent?: string;
  hint?: ReactNode;
}

// Numeric counter with +/- buttons and a direct-edit input. Bounded by min/max.
export function Counter({
  label,
  value,
  onAdjust,
  onSet,
  min = 0,
  max = 999,
  step = 1,
  accent,
  hint,
}: Props) {
  const decDisabled = value <= min;
  const incDisabled = value >= max;
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-slate-800 bg-slate-950/40 px-3 py-2">
      <div className="min-w-0">
        <div className="stat-label truncate">{label}</div>
        {hint ? <div className="text-[10px] text-slate-500">{hint}</div> : null}
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          className="btn btn-ghost h-7 w-7 p-0"
          onClick={() => onAdjust?.(-step)}
          disabled={decDisabled || !onAdjust}
        >
          −
        </button>
        <input
          type="number"
          className={`stat-num w-16 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-center ${accent ?? ""}`}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const next = Number(e.target.value);
            if (!Number.isNaN(next)) onSet?.(Math.min(max, Math.max(min, next)));
          }}
        />
        <button
          type="button"
          aria-label={`Increase ${label}`}
          className="btn btn-ghost h-7 w-7 p-0"
          onClick={() => onAdjust?.(step)}
          disabled={incDisabled || !onAdjust}
        >
          +
        </button>
      </div>
    </div>
  );
}
