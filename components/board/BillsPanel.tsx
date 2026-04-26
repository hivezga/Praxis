"use client";

import { useState } from "react";

import { Modal } from "@/components/shared/Modal";
import { POLICIES, POLICIES_BY_ID } from "@/lib/data/policies";
import { useGame, useGameState } from "@/lib/store";
import type { ClassId, PolicyId, PolicySection } from "@/lib/types/game";

const CLASSES: ClassId[] = ["working", "middle", "capitalist", "state"];

export function BillsPanel() {
  const state = useGameState();
  const propose = useGame((s) => s.proposeBill);
  const remove = useGame((s) => s.removeBill);
  const [open, setOpen] = useState(false);
  const [policyId, setPolicyId] = useState<PolicyId>("taxation");
  const [section, setSection] = useState<PolicySection>("B");
  const [proposer, setProposer] = useState<ClassId>("working");
  const [immediateVote, setImmediateVote] = useState(false);
  if (!state) return null;
  return (
    <section className="panel">
      <div className="mb-3 flex items-center justify-between">
        <div className="panel-title m-0">Pending Bills</div>
        <button type="button" className="btn" onClick={() => setOpen(true)}>
          + Propose
        </button>
      </div>
      {state.bills.length === 0 ? (
        <p className="text-sm text-slate-500">No bills proposed for the next election.</p>
      ) : (
        <ul className="space-y-2">
          {state.bills.map((b) => (
            <li key={b.id} className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950/40 px-3 py-2">
              <div className="text-sm">
                <span className="font-mono text-xs text-slate-500">{POLICIES_BY_ID[b.policyId].number}.</span>{" "}
                <span className="text-slate-200">{POLICIES_BY_ID[b.policyId].name}</span>
                {" → "}
                <span className="font-mono text-amber-300">{b.proposedSection}</span>
                <span className="ml-2 text-xs text-slate-500">
                  by {b.proposedBy}
                  {b.immediateVote ? " · immediate" : ""}
                </span>
              </div>
              <button type="button" className="btn btn-ghost text-xs" onClick={() => remove(b.id)}>
                Remove
              </button>
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
        <div className="grid grid-cols-2 gap-3 text-sm">
          <label className="col-span-2 flex flex-col gap-1">
            <span className="stat-label">Policy</span>
            <select className="input" value={policyId} onChange={(e) => setPolicyId(e.target.value as PolicyId)}>
              {POLICIES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.number}. {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="stat-label">Move to</span>
            <select className="input" value={section} onChange={(e) => setSection(e.target.value as PolicySection)}>
              <option value="A">A — {POLICIES_BY_ID[policyId].sections.A.label}</option>
              <option value="B">B — {POLICIES_BY_ID[policyId].sections.B.label}</option>
              <option value="C">C — {POLICIES_BY_ID[policyId].sections.C.label}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="stat-label">Proposed by</span>
            <select className="input" value={proposer} onChange={(e) => setProposer(e.target.value as ClassId)}>
              {CLASSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="col-span-2 flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
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
