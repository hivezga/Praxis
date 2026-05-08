"use client";

import { ReactNode, useState } from "react";

interface Props {
  label?: string;
  children: ReactNode;
  startHidden?: boolean;
}

export function HideCurtain({ label = "Hidden info", children, startHidden = true }: Props) {
  const [hidden, setHidden] = useState(startHidden);
  return (
    <div className="relative">
      <div className={hidden ? "pointer-events-none select-none blur-md" : ""}>{children}</div>
      <button
        type="button"
        onClick={() => setHidden((h) => !h)}
        className="absolute right-2 top-2 rounded-md border border-rule bg-surface/95 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-inkSoft transition-colors hover:bg-surfaceSoft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {hidden ? `Reveal ${label}` : `Hide ${label}`}
      </button>
    </div>
  );
}
