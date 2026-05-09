"use client";

import { useEffect, useState } from "react";

import { Modal } from "@/components/shared/Modal";

const STORAGE_KEY = "praxis.onboarding.dismissed";

const STEPS = [
  {
    title: "What Praxis does",
    body: "A companion tracker for Hegemony: Lead Your Class to Victory. It does the arithmetic so the table can spend the evening playing.",
  },
  {
    title: "Solo or party",
    body: "Solo — one device tracks every faction. Party — host a room with a 6-character code, friends join from their own devices and watch the game live.",
  },
  {
    title: "Tap and it's saved",
    body: "Use + and − on any value to adjust it. Everything saves automatically to this browser, so you can close the tab and pick up where you left off.",
  },
];

export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(STORAGE_KEY)) return;
    setOpen(true);
  }, []);

  function dismiss() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }
    setOpen(false);
  }

  const isLast = step === STEPS.length - 1;
  const cur = STEPS[step];

  return (
    <Modal
      open={open}
      onClose={dismiss}
      title={cur.title}
      widthClass="max-w-lg"
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div
            className="flex gap-1.5"
            role="tablist"
            aria-label={`Onboarding step ${step + 1} of ${STEPS.length}`}
          >
            {STEPS.map((_, i) => (
              <span
                key={i}
                role="tab"
                aria-selected={i === step}
                aria-label={`Step ${i + 1}`}
                className={`h-1.5 w-6 rounded-sm transition-colors ${
                  i === step ? "bg-accent" : "bg-surfaceMute/60"
                }`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-ghost" onClick={dismiss}>
              Skip
            </button>
            {!isLast ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              >
                Next →
              </button>
            ) : (
              <button type="button" className="btn btn-poster" onClick={dismiss}>
                Begin
              </button>
            )}
          </div>
        </div>
      }
    >
      <p className="font-serif text-fluid-base leading-relaxed text-inkSoft">{cur.body}</p>
    </Modal>
  );
}
