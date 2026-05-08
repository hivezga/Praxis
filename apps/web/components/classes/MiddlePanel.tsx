"use client";

import { ClassPanelShell } from "./ClassPanelShell";
import { Counter } from "@/components/shared/Counter";
import { StorageGrid } from "./StorageGrid";
import { useGame, useGameState } from "@/lib/store";
import type { Good } from "@/lib/types/game";

export function MiddlePanel() {
  const state = useGameState();
  const adjust = useGame((s) => s.adjustClassNumber);
  const setVal = useGame((s) => s.setClassNumber);
  const setText = useGame((s) => s.setClassString);
  const apply = useGame((s) => s.apply);
  if (!state) return null;
  const m = state.classes.middle;
  return (
    <ClassPanelShell classId="middle">
      {/* Primary stats */}
      <div className="grid gap-2 sm:grid-cols-3">
        <Counter
          size="lg"
          label="Money"
          value={m.money}
          onAdjust={(d) => adjust("middle", "money", d)}
          onSet={(v) => setVal("middle", "money", v)}
        />
        <Counter
          size="lg"
          label="Capital"
          value={m.capital}
          onAdjust={(d) => adjust("middle", "capital", d)}
          onSet={(v) => setVal("middle", "capital", v)}
        />
        <Counter
          size="lg"
          label="Savings"
          value={m.savings}
          onAdjust={(d) => adjust("middle", "savings", d)}
          onSet={(v) => setVal("middle", "savings", v)}
        />
      </div>

      <div>
        <div className="panel-title">VP, prosperity & population</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Counter label="VP track"      value={m.vp}                       onAdjust={(d) => adjust("middle", "vp", d)}                       onSet={(v) => setVal("middle", "vp", v)} />
          <Counter label="Prosperity"    value={m.prosperity}               onAdjust={(d) => adjust("middle", "prosperity", d)}               onSet={(v) => setVal("middle", "prosperity", v)} />
          <Counter label="Population"    value={m.population}               onAdjust={(d) => adjust("middle", "population", d)}               onSet={(v) => setVal("middle", "population", v)} />
          <Counter label="Unemployed"    value={m.unemployedWorkers}        onAdjust={(d) => adjust("middle", "unemployedWorkers", d)}        onSet={(v) => setVal("middle", "unemployedWorkers", v)} />
          <Counter label="Skilled (free)" value={m.unemployedSkilledWorkers} onAdjust={(d) => adjust("middle", "unemployedSkilledWorkers", d)} onSet={(v) => setVal("middle", "unemployedSkilledWorkers", v)} />
          <Counter label="Loans"         value={m.loans}                    onAdjust={(d) => adjust("middle", "loans", d)}                    onSet={(v) => setVal("middle", "loans", v)} />
          <Counter label="Voting cubes"  value={m.votingCubesInBag}         onAdjust={(d) => adjust("middle", "votingCubesInBag", d)}         onSet={(v) => setVal("middle", "votingCubesInBag", v)} />
          <Counter label="Bill markers"  value={m.billMarkersAvailable}     onAdjust={(d) => adjust("middle", "billMarkersAvailable", d)}     onSet={(v) => setVal("middle", "billMarkersAvailable", v)} max={3} />
        </div>
      </div>

      <StorageGrid
        title="Storage"
        values={{ food: m.storage.food, luxury: m.storage.luxury, health: m.storage.health, education: m.storage.education, influence: m.storage.influence }}
        labels={{ food: "Food", luxury: "Luxury", health: "Health", education: "Education", influence: "Influence" }}
        onAdjust={(k, d) =>
          apply({ type: "adjustStorage", classId: "middle", good: k as Good, delta: d }, `middle.storage.${k} ${d}`)
        }
        onSet={(k, v) => {
          const cur = (m.storage as unknown as Record<string, number>)[k] ?? 0;
          apply({ type: "adjustStorage", classId: "middle", good: k as Good, delta: Math.max(0, v) - cur }, `middle.storage.${k} = ${v}`);
        }}
      />

      <div>
        <div className="panel-title">Companies ({m.companies.length})</div>
        <ul className="space-y-1.5">
          {m.companies.map((c) => (
            <li key={c.id} className="rounded-md border border-rule/60 bg-paper/30 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-ink">{c.label}</span>
                <span className="shrink-0 font-mono text-[10px] text-inkMute">
                  L{c.wageLevel} · {c.workersAssigned}M / {c.workingClassEmployees}W
                </span>
              </div>
            </li>
          ))}
          {m.companies.length === 0 ? (
            <li className="font-serif text-xs italic text-inkMute">No companies built.</li>
          ) : null}
        </ul>
      </div>

      <div>
        <div className="panel-title">Notes</div>
        <textarea
          className="input min-h-[60px]"
          placeholder="Strategy notes, reminders…"
          value={m.notes}
          onChange={(e) => setText("middle", "notes", e.target.value)}
        />
      </div>
    </ClassPanelShell>
  );
}
