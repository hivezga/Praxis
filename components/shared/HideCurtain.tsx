"use client";

import { ReactNode, useState } from "react";

interface Props {
  label?: string;
  children: ReactNode;
  startHidden?: boolean;
}

// Used in party mode to hide hidden information (cards, pending bills) from
// players sharing a single screen. Click to reveal, click again to hide.
export function HideCurtain({ label = "Hidden info", children, startHidden = true }: Props) {
  const [hidden, setHidden] = useState(startHidden);
  return (
    <div className="relative">
      <div className={hidden ? "pointer-events-none select-none blur-md" : ""}>{children}</div>
      <button
        type="button"
        onClick={() => setHidden((h) => !h)}
        className="absolute right-2 top-2 rounded-md border border-slate-700 bg-slate-900/90 px-2 py-1 text-[10px] uppercase tracking-wider text-slate-300 hover:bg-slate-800"
      >
        {hidden ? `Reveal ${label}` : `Hide ${label}`}
      </button>
    </div>
  );
}
