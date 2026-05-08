"use client";

import { ClassPanelShell } from "./ClassPanelShell";
import { Counter } from "@/components/shared/Counter";
import { useGame, useGameState } from "@/lib/store";
import type { ClassId } from "@/lib/types/game";

const OTHERS: Exclude<ClassId, "state">[] = ["working", "middle", "capitalist"];

const LEGIT_LABEL: Record<Exclude<ClassId, "state">, string> = {
  working:    "vs Working",
  middle:     "vs Middle",
  capitalist: "vs Capitalist",
};

export function StatePanel() {
  const state = useGameState();
  const adjust = useGame((s) => s.adjustClassNumber);
  const setVal = useGame((s) => s.setClassNumber);
  const setText = useGame((s) => s.setClassString);
  const apply = useGame((s) => s.apply);
  if (!state) return null;
  const sc = state.classes.state;
  return (
    <ClassPanelShell classId="state">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Counter label="Treasury"          value={sc.treasury}             onAdjust={(d) => adjust("state", "treasury", d)}             onSet={(v) => setVal("state", "treasury", v)} max={9999} />
        <Counter label="VP track"          value={sc.vp}                   onAdjust={(d) => adjust("state", "vp", d)}                   onSet={(v) => setVal("state", "vp", v)} />
        <Counter
          label="Personal influence"
          value={sc.storage.influence}
          onAdjust={(d) =>
            apply({ type: "adjustStorage", classId: "state", good: "influence", delta: d }, `state.storage.influence ${d}`)
          }
          onSet={(v) =>
            apply({ type: "adjustStorage", classId: "state", good: "influence", delta: v - sc.storage.influence }, `state.storage.influence = ${v}`)
          }
        />
        <Counter label="Loans"        value={sc.loans}               onAdjust={(d) => adjust("state", "loans", d)}               onSet={(v) => setVal("state", "loans", v)} />
        <Counter label="Bill markers" value={sc.billMarkersAvailable} onAdjust={(d) => adjust("state", "billMarkersAvailable", d)} onSet={(v) => setVal("state", "billMarkersAvailable", v)} max={3} />
      </div>
      <div>
        <div className="panel-title">Legitimacy (current)</div>
        <div className="grid grid-cols-3 gap-2">
          {OTHERS.map((c) => (
            <Counter
              key={c}
              label={LEGIT_LABEL[c]}
              value={sc.legitimacy[c]}
              hint={`+${sc.legitimacyTokens[c]} permanent`}
              onAdjust={(d) =>
                apply({ type: "adjustLegitimacy", fromClass: c, delta: d }, `state.legitimacy.${c} ${d}`)
              }
              onSet={(v) =>
                apply({ type: "adjustLegitimacy", fromClass: c, delta: v - sc.legitimacy[c] }, `state.legitimacy.${c} = ${v}`)
              }
            />
          ))}
        </div>
      </div>
      <div>
        <div className="panel-title">Legitimacy tokens (permanent)</div>
        <div className="grid grid-cols-3 gap-2">
          {OTHERS.map((c) => (
            <Counter
              key={c}
              label={LEGIT_LABEL[c]}
              value={sc.legitimacyTokens[c]}
              onAdjust={(d) =>
                apply({ type: "adjustLegitimacyTokens", fromClass: c, delta: d }, `state.legitimacyTokens.${c} ${d}`)
              }
              onSet={(v) =>
                apply({ type: "adjustLegitimacyTokens", fromClass: c, delta: v - sc.legitimacyTokens[c] }, `state.legitimacyTokens.${c} = ${v}`)
              }
            />
          ))}
        </div>
      </div>
      <div>
        <div className="panel-title">Storage</div>
        <div className="grid grid-cols-2 gap-2">
          <Counter
            label="Food"
            value={sc.storage.food}
            onAdjust={(d) =>
              apply({ type: "adjustStorage", classId: "state", good: "food", delta: d }, `state.storage.food ${d}`)
            }
            onSet={(v) =>
              apply({ type: "adjustStorage", classId: "state", good: "food", delta: v - sc.storage.food }, `state.storage.food = ${v}`)
            }
          />
          <Counter
            label="Luxury"
            value={sc.storage.luxury}
            onAdjust={(d) =>
              apply({ type: "adjustStorage", classId: "state", good: "luxury", delta: d }, `state.storage.luxury ${d}`)
            }
            onSet={(v) =>
              apply({ type: "adjustStorage", classId: "state", good: "luxury", delta: v - sc.storage.luxury }, `state.storage.luxury = ${v}`)
            }
          />
        </div>
      </div>
      <div>
        <div className="panel-title">Notes</div>
        <textarea
          className="input min-h-[60px]"
          placeholder="Strategy notes, reminders…"
          value={sc.notes}
          onChange={(e) => setText("state", "notes", e.target.value)}
        />
      </div>
    </ClassPanelShell>
  );
}
