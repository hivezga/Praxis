"use client";

import { ReactNode, useState } from "react";

interface Props {
  label?: string;
  children: ReactNode;
  startHidden?: boolean;
}

// NOTE: this is a UX privacy curtain, not a security boundary. The hidden
// content is still rendered to the DOM and visible in DevTools — anyone with
// physical access to the device can inspect it. Use only for casual
// shoulder-surfing protection between trusted players at the same table.
export function HideCurtain({ label = "Hidden info", children, startHidden = true }: Props) {
  const [hidden, setHidden] = useState(startHidden);
  return (
    <div className="relative">
      <div
        aria-hidden={hidden}
        className={hidden ? "pointer-events-none select-none blur-md" : ""}
      >
        {children}
      </div>
      <button
        type="button"
        onClick={() => setHidden((h) => !h)}
        aria-pressed={!hidden}
        aria-label={hidden ? `Reveal ${label}` : `Hide ${label}`}
        className="absolute right-2 top-2 min-h-tap rounded-sharp border border-rule/60 bg-surface/95 px-3 py-1.5 font-display text-[10px] uppercase tracking-wider text-inkSoft transition-colors hover:bg-surfaceSoft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        {hidden ? `Reveal ${label}` : `Hide ${label}`}
      </button>
    </div>
  );
}
