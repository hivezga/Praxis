"use client";

import { ReactNode, useEffect, useRef } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  widthClass?: string;
}

const FOCUSABLE =
  'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, children, footer, widthClass }: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const lastActiveRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    lastActiveRef.current = document.activeElement;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const items = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);

    const focusTimer = window.setTimeout(() => {
      const items = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      items?.[0]?.focus();
    }, 10);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(focusTimer);
      const previous = lastActiveRef.current;
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        className={`w-full ${widthClass ?? "max-w-2xl"} rounded-md border border-rule/40 bg-surface/95 shadow-poster`}
      >
        {title ? (
          <div className="flex items-center justify-between gap-3 border-b border-rule/60 px-5 py-4 sm:px-6">
            <h2 className="font-display text-fluid-xl uppercase tracking-tight text-ink">
              {title}
            </h2>
            <button
              type="button"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sharp border border-rule/60 text-inkSoft transition-colors hover:bg-surfaceSoft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
              onClick={onClose}
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>
        ) : null}
        <div className="max-h-[72vh] overflow-y-auto p-5 sm:p-6">{children}</div>
        {footer ? (
          <div className="flex flex-wrap justify-end gap-2 border-t border-rule/60 px-5 py-4 sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
