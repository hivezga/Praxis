"use client";

import { useEffect, useState } from "react";

import { useNotice } from "@/lib/store";

/**
 * Bottom-pinned transient notice. Reads `notice` from the store; auto-clears
 * via the store's setNotice TTL. Renders nothing when there's no message.
 */
export function Notice() {
  const text = useNotice();
  // Local visible state lets us animate out on text→null transitions.
  const [visible, setVisible] = useState<string | null>(null);
  useEffect(() => {
    if (text) {
      setVisible(text);
    } else if (visible) {
      // Brief fade-out window matching the CSS transition duration.
      const t = setTimeout(() => setVisible(null), 200);
      return () => clearTimeout(t);
    }
  }, [text, visible]);
  if (!visible) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 transition-opacity duration-200 ${
        text ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="pointer-events-auto max-w-md rounded-sharp border border-rule/70 bg-paper px-4 py-2.5 font-serif text-fluid-sm text-ink shadow-lg">
        {visible}
      </div>
    </div>
  );
}
