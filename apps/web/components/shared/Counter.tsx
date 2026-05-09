"use client";

import { ReactNode } from "react";

type Size = "sm" | "md" | "lg";

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
  size?: Size;
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
  size = "md",
}: Props) {
  const decDisabled = value <= min;
  const incDisabled = value >= max;

  if (size === "lg") {
    return (
      <div className="flex flex-col gap-3 rounded-md border border-rule/60 bg-paper/30 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="font-serif text-[11px] uppercase italic leading-tight tracking-[0.25em] text-inkMute">
            {label}
          </div>
          {hint ? <div className="mt-1 text-[11px] leading-tight text-inkMute">{hint}</div> : null}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            aria-label={`Decrease ${label}`}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-rule/70 bg-surface/60 text-lg leading-none text-inkSoft transition-colors hover:border-rule hover:bg-surfaceSoft hover:text-ink active:bg-surfaceMute disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            onClick={() => onAdjust?.(-step)}
            disabled={decDisabled || !onAdjust}
          >
            −
          </button>
          <input
            type="number"
            aria-label={label}
            className={`h-11 w-20 rounded-md border border-rule/70 bg-paper text-center font-mono text-2xl font-light tracking-tight text-ink transition-colors focus:border-accent/60 focus:outline-none ${accent ?? ""}`}
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
            className="flex h-10 w-10 items-center justify-center rounded-md border border-rule/70 bg-surface/60 text-lg leading-none text-inkSoft transition-colors hover:border-rule hover:bg-surfaceSoft hover:text-ink active:bg-surfaceMute disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            onClick={() => onAdjust?.(step)}
            disabled={incDisabled || !onAdjust}
          >
            +
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-rule/60 bg-paper/40 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="stat-label leading-tight">{label}</div>
        {hint ? <div className="mt-0.5 text-[10px] leading-tight text-inkMute">{hint}</div> : null}
      </div>
      <div className="flex shrink-0 items-center justify-end gap-1">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-rule/70 bg-surface/60 text-base leading-none text-inkSoft transition-colors hover:border-rule hover:bg-surfaceSoft hover:text-ink active:bg-surfaceMute disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          onClick={() => onAdjust?.(-step)}
          disabled={decDisabled || !onAdjust}
        >
          −
        </button>
        <input
          type="number"
          aria-label={label}
          className={`h-9 w-14 rounded-md border border-rule/70 bg-paper text-center font-mono text-lg font-light text-ink transition-colors focus:border-accent/60 focus:outline-none ${accent ?? ""}`}
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
          className="flex h-9 w-9 items-center justify-center rounded-md border border-rule/70 bg-surface/60 text-base leading-none text-inkSoft transition-colors hover:border-rule hover:bg-surfaceSoft hover:text-ink active:bg-surfaceMute disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          onClick={() => onAdjust?.(step)}
          disabled={incDisabled || !onAdjust}
        >
          +
        </button>
      </div>
    </div>
  );
}
