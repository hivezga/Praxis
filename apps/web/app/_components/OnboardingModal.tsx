"use client";

import { useEffect, useState } from "react";

import { Modal } from "@/components/shared/Modal";

const STORAGE_KEY = "praxis.onboarding.dismissed";

const STEPS = [
  {
    title: "Welcome",
    body: "Praxis is a companion tracker for Hegemony — Lead Your Class to Victory. It keeps the table free of arithmetic so the evening is spent playing.",
  },
  {
    title: "How a session flows",
    body: "Pick Party or Solo, choose the classes in play, then begin. Each round moves through five phases — Praxis shows a short cue under the header to remind you what happens in each.",
  },
  {
    title: "End-of-round wizard",
    body: "When you finish a round, tap End round. Praxis suggests taxes, wages, welfare costs and prosperity gains from the current state — adjust anything you need, then apply.",
  },
  {
    title: "Saved on this device",
    body: "Sessions are saved in this browser. Use Export to download a save as a JSON file — handy for moving between devices or sharing with a friend.",
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
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-6 rounded-full transition-colors ${
                  i === step ? "bg-accent/80" : "bg-surfaceMute/60"
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost text-xs" onClick={dismiss}>
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
              <button type="button" className="btn btn-primary" onClick={dismiss}>
                Begin
              </button>
            )}
          </div>
        </div>
      }
    >
      <p className="font-serif text-base leading-relaxed text-inkSoft">{cur.body}</p>
    </Modal>
  );
}
