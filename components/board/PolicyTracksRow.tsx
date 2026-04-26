"use client";

import { PolicyTrack } from "@/components/shared/PolicyTrack";
import { POLICIES } from "@/lib/data/policies";
import { useGame, useGameState } from "@/lib/store";

export function PolicyTracksRow() {
  const state = useGameState();
  const setPolicy = useGame((s) => s.setPolicy);
  if (!state) return null;
  return (
    <section className="panel">
      <div className="panel-title">Policies</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {POLICIES.map((p) => {
          const pendingBill = state.bills.find((b) => b.policyId === p.id);
          return (
            <PolicyTrack
              key={p.id}
              policy={p}
              position={state.policies[p.id].position}
              pendingPosition={pendingBill?.proposedSection}
              onChange={(next) => setPolicy(p.id, next)}
            />
          );
        })}
      </div>
    </section>
  );
}
