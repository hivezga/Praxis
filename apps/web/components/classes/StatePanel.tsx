"use client";

import { ClassPanelShell } from "./ClassPanelShell";
import { Counter } from "@/components/shared/Counter";
import { NotesField } from "./NotesField";
import { useClassState, useGame } from "@/lib/store";
import type { ClassId } from "@/lib/types/game";

const OTHERS: Exclude<ClassId, "state">[] = ["working", "middle", "capitalist"];

const LEGIT_LABEL: Record<Exclude<ClassId, "state">, string> = {
  working:    "vs Working",
  middle:     "vs Middle",
  capitalist: "vs Capitalist",
};

export function StatePanel() {
  const sc = useClassState("state");
  const adjust = useGame((s) => s.adjustClassNumber);
  const setVal = useGame((s) => s.setClassNumber);
  const setText = useGame((s) => s.setClassString);
  const apply = useGame((s) => s.apply);
  if (!sc) return null;
  return (
    <ClassPanelShell classId="state">
      {/* Primary stats */}
      <div className="grid gap-2 @md:grid-cols-2">
        <Counter
          size="lg"
          label="Treasury"
          value={sc.treasury}
          onAdjust={(d) => adjust("state", "treasury", d)}
          onSet={(v) => setVal("state", "treasury", v)}
          max={9999}
        />
        <Counter
          size="lg"
          label="Personal influence"
          value={sc.storage.influence}
          onAdjust={(d) =>
            apply({ type: "adjustStorage", classId: "state", good: "influence", delta: d }, `state.storage.influence ${d}`)
          }
          onSet={(v) =>
            apply({ type: "adjustStorage", classId: "state", good: "influence", delta: v - sc.storage.influence }, `state.storage.influence = ${v}`)
          }
        />
      </div>

      <div>
        <div className="panel-title">Action economy</div>
        <div className="grid grid-cols-2 gap-2 @md:grid-cols-3">
          <Counter label="VP track"     value={sc.vp}                   onAdjust={(d) => adjust("state", "vp", d)}                   onSet={(v) => setVal("state", "vp", v)} />
          <Counter label="Loans"        value={sc.loans}                onAdjust={(d) => adjust("state", "loans", d)}               onSet={(v) => setVal("state", "loans", v)} />
          <Counter label="Bill markers" value={sc.billMarkersAvailable} onAdjust={(d) => adjust("state", "billMarkersAvailable", d)} onSet={(v) => setVal("state", "billMarkersAvailable", v)} max={3} />
        </div>
      </div>

      <div>
        <div className="panel-title">Legitimacy (current)</div>
        <div className="grid grid-cols-1 gap-2 @md:grid-cols-3">
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
        <div className="grid grid-cols-1 gap-2 @md:grid-cols-3">
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
        <div className="grid grid-cols-1 gap-2 @md:grid-cols-2">
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

      <NotesField classId="state" value={sc.notes} onChange={(t) => setText("state", "notes", t)} />
    </ClassPanelShell>
  );
}
