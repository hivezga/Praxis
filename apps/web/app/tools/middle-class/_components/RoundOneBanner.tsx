"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "mc-r1-banner-dismissed";

export function RoundOneBanner() {
  const [dismissed, setDismissed] = useState(true);

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
            Middle Class scoring rewards Section B at game end — triangular VP
            (1 / 3 / 6 / 10 / 15) by how many of policies 1–5 land in B. Food
            is mandatory each round; make sure revenue + cash covers{" "}
            <code className="font-mono not-italic">
              population × cheapest food
            </code>
            .
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
