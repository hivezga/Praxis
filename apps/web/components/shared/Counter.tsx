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
  accent?: string;
  hint?: ReactNode;
}

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
    <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="stat-label truncate">{label}</div>
        {hint ? <div className="mt-0.5 text-[10px] leading-tight text-slate-600">{hint}</div> : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-base leading-none text-slate-400 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          onClick={() => onAdjust?.(-step)}
          disabled={decDisabled || !onAdjust}
        >
          −
        </button>
        <input
          type="number"
          aria-label={label}
          className={`h-8 w-14 rounded-md border border-slate-700 bg-slate-950 text-center font-mono text-lg font-semibold text-slate-100 transition-colors focus:border-indigo-500 focus:outline-none ${accent ?? ""}`}
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
          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-base leading-none text-slate-400 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          onClick={() => onAdjust?.(step)}
          disabled={incDisabled || !onAdjust}
        >
          +
        </button>
      </div>
    </div>
  );
}
