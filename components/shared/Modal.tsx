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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className={`w-full ${widthClass ?? "max-w-2xl"} rounded-xl border border-slate-700 bg-slate-900 shadow-2xl`}>
        {title ? (
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div className="text-sm font-semibold uppercase tracking-wider text-slate-300">{title}</div>
            <button type="button" className="btn btn-ghost h-8 w-8 p-0" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        ) : null}
        <div className="max-h-[70vh] overflow-y-auto p-4">{children}</div>
        {footer ? <div className="flex justify-end gap-2 border-t border-slate-800 px-4 py-3">{footer}</div> : null}
      </div>
    </div>
  );
}
