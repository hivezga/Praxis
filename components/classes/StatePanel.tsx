"use client";

import { ClassPanelShell } from "./ClassPanelShell";
import { Counter } from "@/components/shared/Counter";
import { useGame, useGameState } from "@/lib/store";
import type { ClassId } from "@/lib/types/game";

const OTHERS: Exclude<ClassId, "state">[] = ["working", "middle", "capitalist"];

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
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
        <Counter label="Treasury" value={sc.treasury} onAdjust={(d) => adjust("state", "treasury", d)} onSet={(v) => setVal("state", "treasury", v)} max={9999} />
        <Counter label="VP track" value={sc.vp} onAdjust={(d) => adjust("state", "vp", d)} onSet={(v) => setVal("state", "vp", v)} />
        <Counter label="Personal influence" value={sc.storage.influence}
          onAdjust={(d) =>
            apply(`state.storage.influence ${d}`, (s) => {
              s.classes.state.storage.influence = Math.max(0, s.classes.state.storage.influence + d);
            })
          }
          onSet={(v) =>
            apply(`state.storage.influence = ${v}`, (s) => {
              s.classes.state.storage.influence = Math.max(0, v);
            })
          }
        />
        <Counter label="Loans" value={sc.loans} onAdjust={(d) => adjust("state", "loans", d)} onSet={(v) => setVal("state", "loans", v)} />
        <Counter label="Bill markers" value={sc.billMarkersAvailable} onAdjust={(d) => adjust("state", "billMarkersAvailable", d)} onSet={(v) => setVal("state", "billMarkersAvailable", v)} max={3} />
      </div>
      <div>
        <div className="panel-title">Legitimacy (per class)</div>
        <div className="grid grid-cols-3 gap-2">
          {OTHERS.map((c) => (
            <Counter
              key={c}
              label={`Toward ${c}`}
              value={sc.legitimacy[c]}
              hint={`+${sc.legitimacyTokens[c]} permanent`}
              onAdjust={(d) =>
                apply(`state.legitimacy.${c} ${d}`, (s) => {
                  s.classes.state.legitimacy[c] = Math.max(0, s.classes.state.legitimacy[c] + d);
                })
              }
              onSet={(v) =>
                apply(`state.legitimacy.${c} = ${v}`, (s) => {
                  s.classes.state.legitimacy[c] = Math.max(0, v);
                })
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
              label={`Token: ${c}`}
              value={sc.legitimacyTokens[c]}
              onAdjust={(d) =>
                apply(`state.legitimacyTokens.${c} ${d}`, (s) => {
                  s.classes.state.legitimacyTokens[c] = Math.max(0, s.classes.state.legitimacyTokens[c] + d);
                })
              }
              onSet={(v) =>
                apply(`state.legitimacyTokens.${c} = ${v}`, (s) => {
                  s.classes.state.legitimacyTokens[c] = Math.max(0, v);
                })
              }
            />
          ))}
        </div>
      </div>
      <div>
        <div className="panel-title">Storage</div>
        <div className="grid grid-cols-2 gap-2">
          <Counter label="Food" value={sc.storage.food}
            onAdjust={(d) =>
              apply(`state.storage.food ${d}`, (s) => {
                s.classes.state.storage.food = Math.max(0, s.classes.state.storage.food + d);
              })
            }
            onSet={(v) =>
              apply(`state.storage.food = ${v}`, (s) => {
                s.classes.state.storage.food = Math.max(0, v);
              })
            }
          />
          <Counter label="Luxury" value={sc.storage.luxury}
            onAdjust={(d) =>
              apply(`state.storage.luxury ${d}`, (s) => {
                s.classes.state.storage.luxury = Math.max(0, s.classes.state.storage.luxury + d);
              })
            }
            onSet={(v) =>
              apply(`state.storage.luxury = ${v}`, (s) => {
                s.classes.state.storage.luxury = Math.max(0, v);
              })
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
