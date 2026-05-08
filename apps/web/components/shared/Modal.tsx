"use client";

import { ReactNode, useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  widthClass?: string;
}

export function Modal({ open, onClose, title, children, footer, widthClass }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`w-full ${widthClass ?? "max-w-2xl"} rounded-lg border border-rule/40 bg-surface/95 shadow-2xl`}>
        {title ? (
          <div className="flex items-center justify-between border-b border-rule/60 px-6 py-4">
            <h2 className="font-serif text-xl font-light italic text-ink">{title}</h2>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-rule/60 text-inkSoft transition-colors hover:bg-surfaceSoft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        ) : null}
        <div className="max-h-[72vh] overflow-y-auto p-6">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-2 border-t border-rule/60 px-6 py-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
