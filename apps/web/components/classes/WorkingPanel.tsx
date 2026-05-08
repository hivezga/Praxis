"use client";

import { ClassPanelShell } from "./ClassPanelShell";
import { Counter } from "@/components/shared/Counter";
import { StorageGrid } from "./StorageGrid";
import { useGame, useGameState } from "@/lib/store";
import type { Good } from "@/lib/types/game";

export function WorkingPanel() {
  const state = useGameState();
  const adjust = useGame((s) => s.adjustClassNumber);
  const setVal = useGame((s) => s.setClassNumber);
  const setText = useGame((s) => s.setClassString);
  const apply = useGame((s) => s.apply);
  if (!state) return null;
  const w = state.classes.working;
  return (
    <ClassPanelShell classId="working">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Counter label="Money"         value={w.money}                   onAdjust={(d) => adjust("working", "money", d)}                    onSet={(v) => setVal("working", "money", v)} />
        <Counter label="VP track"      value={w.vp}                      onAdjust={(d) => adjust("working", "vp", d)}                       onSet={(v) => setVal("working", "vp", v)} />
        <Counter label="Prosperity"    value={w.prosperity}              onAdjust={(d) => adjust("working", "prosperity", d)}               onSet={(v) => setVal("working", "prosperity", v)} />
        <Counter label="Population"    value={w.population}              onAdjust={(d) => adjust("working", "population", d)}               onSet={(v) => setVal("working", "population", v)} />
        <Counter label="Unemployed"    value={w.unemployedWorkers}       onAdjust={(d) => adjust("working", "unemployedWorkers", d)}        onSet={(v) => setVal("working", "unemployedWorkers", v)} />
        <Counter label="Skilled (free)" value={w.unemployedSkilledWorkers} onAdjust={(d) => adjust("working", "unemployedSkilledWorkers", d)} onSet={(v) => setVal("working", "unemployedSkilledWorkers", v)} />
        <Counter label="Loans"         value={w.loans}                   onAdjust={(d) => adjust("working", "loans", d)}                    onSet={(v) => setVal("working", "loans", v)} />
        <Counter label="Voting cubes"  value={w.votingCubesInBag}        onAdjust={(d) => adjust("working", "votingCubesInBag", d)}         onSet={(v) => setVal("working", "votingCubesInBag", v)} />
        <Counter label="Bill markers"  value={w.billMarkersAvailable}    onAdjust={(d) => adjust("working", "billMarkersAvailable", d)}     onSet={(v) => setVal("working", "billMarkersAvailable", v)} max={3} />
      </div>
      <StorageGrid
        title="Storage"
        values={w.storage as unknown as Record<string, number>}
        labels={{ food: "Food", health: "Health", education: "Education", luxury: "Luxury", influence: "Influence" }}
        onAdjust={(k, d) =>
          apply({ type: "adjustStorage", classId: "working", good: k as Good, delta: d }, `working.storage.${k} ${d}`)
        }
        onSet={(k, v) => {
          const cur = (w.storage as unknown as Record<string, number>)[k] ?? 0;
          apply({ type: "adjustStorage", classId: "working", good: k as Good, delta: Math.max(0, v) - cur }, `working.storage.${k} = ${v}`);
        }}
      />
      <div>
        <div className="panel-title">Trade unions</div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {w.tradeUnions.map((t, idx) => (
            <Counter
              key={t.industry}
              label={`Industry ${t.industry}`}
              value={t.workersAssigned}
              hint={t.workersAssigned >= 4 ? "Active (+2 VP)" : undefined}
              onAdjust={(d) =>
                apply({ type: "adjustTradeUnion", index: idx, delta: d }, `working.tradeUnions[${idx}] ${d}`)
              }
              onSet={(v) =>
                apply({ type: "adjustTradeUnion", index: idx, delta: v - t.workersAssigned }, `working.tradeUnions[${idx}] = ${v}`)
              }
            />
          ))}
        </div>
      </div>
      <div>
        <div className="panel-title">Notes</div>
        <textarea
          className="input min-h-[60px]"
          placeholder="Strategy notes, reminders…"
          value={w.notes}
          onChange={(e) => setText("working", "notes", e.target.value)}
        />
      </div>
    </ClassPanelShell>
  );
}
