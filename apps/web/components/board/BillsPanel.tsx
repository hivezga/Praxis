"use client";

import { useState } from "react";

import { Modal } from "@/components/shared/Modal";
import { POLICIES, POLICIES_BY_ID } from "@/lib/data/policies";
import { useGame, useGameState } from "@/lib/store";
import type { ClassId, PolicyId, PolicySection } from "@/lib/types/game";

const CLASSES: ClassId[] = ["working", "middle", "capitalist", "state"];

const CLASS_BADGE: Record<ClassId, string> = {
  working:    "bg-working-deep text-working-ink border-working-deep",
  middle:     "bg-middle-deep text-middle-ink border-middle-deep",
  capitalist: "bg-capitalist-deep text-capitalist-ink border-capitalist-deep",
  state:      "bg-state-deep text-state-ink border-state-deep",
};

export function BillsPanel() {
  const state = useGameState();
  const propose = useGame((s) => s.proposeBill);
  const remove = useGame((s) => s.removeBill);
  const passBill = useGame((s) => s.passBill);
  const failBill = useGame((s) => s.failBill);
  const [open, setOpen] = useState(false);
  const [policyId, setPolicyId] = useState<PolicyId>("taxation");
  const [section, setSection] = useState<PolicySection>("B");
  const [proposer, setProposer] = useState<ClassId>("working");
  const [immediateVote, setImmediateVote] = useState(false);
  if (!state) return null;
  return (
    <section className="panel">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="panel-title m-0">Pending Bills</div>
        <button type="button" className="btn" onClick={() => setOpen(true)}>
          + Propose
        </button>
      </div>
      {state.bills.length === 0 ? (
        <p className="rounded-sharp border border-dashed border-rule/60 p-3 font-serif text-fluid-sm italic text-inkMute">
          No bills proposed for the next election.
        </p>
      ) : (
        <ul className="space-y-2">
          {state.bills.map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-sharp border border-rule/60 bg-paper/30 px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 text-fluid-sm">
                  <span className="font-mono text-[10px] text-inkMute">
                    {POLICIES_BY_ID[b.policyId].number}.
                  </span>
                  <span className="text-ink">{POLICIES_BY_ID[b.policyId].name}</span>
                  <span className="text-inkMute">→</span>
                  <span className="font-mono font-semibold text-accentInk">
                    {b.proposedSection}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded-sharp border px-1.5 py-0.5 font-display text-[9px] uppercase tracking-wider ${CLASS_BADGE[b.proposedBy]}`}
                  >
                    {b.proposedBy}
                  </span>
                  {b.immediateVote ? (
                    <span className="text-[10px] text-inkMute">· immediate vote</span>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-1">
                <button
                  type="button"
                  className="btn btn-positive"
                  title="Bill passed: move marker, return bill, +3 VP to proposer"
                  onClick={() => passBill(b.id)}
                >
                  Pass
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  title="Bill failed: return bill, no VP"
                  onClick={() => failBill(b.id)}
                >
                  Fail
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  aria-label="Discard bill"
                  title="Discard without resolving"
                  onClick={() => remove(b.id)}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Propose Bill"
        footer={
          <>
            <button type="button" className="btn" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                propose({ policyId, proposedSection: section, proposedBy: proposer, immediateVote });
                setOpen(false);
              }}
            >
              Propose
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-3 text-fluid-sm sm:grid-cols-2">
          <label className="sm:col-span-2 flex flex-col gap-1.5">
            <span className="stat-label">Policy</span>
            <select
              className="input"
              value={policyId}
              onChange={(e) => setPolicyId(e.target.value as PolicyId)}
            >
              {POLICIES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.number}. {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="stat-label">Move to</span>
            <select
              className="input"
              value={section}
              onChange={(e) => setSection(e.target.value as PolicySection)}
            >
              <option value="A">A — {POLICIES_BY_ID[policyId].sections.A.label}</option>
              <option value="B">B — {POLICIES_BY_ID[policyId].sections.B.label}</option>
              <option value="C">C — {POLICIES_BY_ID[policyId].sections.C.label}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="stat-label">Proposed by</span>
            <select
              className="input"
              value={proposer}
              onChange={(e) => setProposer(e.target.value as ClassId)}
            >
              {CLASSES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <label className="sm:col-span-2 flex items-center gap-2 text-fluid-sm text-inkSoft">
            <input
              type="checkbox"
              className="h-4 w-4 rounded-sharp border-rule"
              checked={immediateVote}
              onChange={(e) => setImmediateVote(e.target.checked)}
            />
            Immediate vote (spend 1 Influence to skip the Elections phase)
          </label>
        </div>
      </Modal>
    </section>
  );
}
