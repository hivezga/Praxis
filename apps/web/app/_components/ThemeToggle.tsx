"use client";

import { useTheme } from "./ThemeProvider";

const OPTIONS = [
  { value: "system", label: "Auto", title: "Match system preference" },
  { value: "dark",   label: "Dark", title: "Evening (dark theme)"     },
  { value: "light",  label: "Day",  title: "Daylight (light theme)"   },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex items-center gap-0.5 rounded-sharp border border-rule/50 bg-surface/30 p-0.5"
    >
      {OPTIONS.map((opt) => {
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={opt.title}
            onClick={() => setTheme(opt.value)}
            className={`min-h-tap rounded-sharp px-3 py-1 font-display text-[11px] uppercase tracking-[0.2em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${
              active
                ? "bg-accent/20 text-accentInk"
                : "text-inkMute hover:text-ink"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
