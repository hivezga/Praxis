"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "wc-r1-banner-dismissed";

export function RoundOneBanner() {
  const [dismissed, setDismissed] = useState(true); // assume dismissed until hydration to avoid flash

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      setDismissed(stored === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (dismissed) return null;

  return (
    <div className="rounded-sm border border-warning/50 bg-warning/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="poster-eyebrow text-warning">Round 1 tip</p>
          <p className="mt-2 font-serif text-[13px] leading-snug text-inkSoft">
            Working Class should generally ignore Policy 1 (Fiscal) unless wages
            are constrained. Focus action points on Labor Market and Taxation
            first.
          </p>
        </div>
        <button
          type="button"
          aria-label="Dismiss tip"
          onClick={() => {
            setDismissed(true);
            try {
              window.localStorage.setItem(STORAGE_KEY, "1");
            } catch {
              // silent
            }
          }}
          className="min-h-tap rounded-sharp border border-rule/40 px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-inkMute hover:border-rule hover:text-inkSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
