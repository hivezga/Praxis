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
      <div className={`w-full ${widthClass ?? "max-w-2xl"} rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl`}>
        {title ? (
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
            <div className="text-sm font-semibold uppercase tracking-wider text-slate-300">{title}</div>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-700 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        ) : null}
        <div className="max-h-[72vh] overflow-y-auto p-5">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-2 border-t border-slate-800 px-5 py-3.5">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
