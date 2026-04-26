"use client";

import { ClassPanelShell } from "./ClassPanelShell";
import { Counter } from "@/components/shared/Counter";
import { HideCurtain } from "@/components/shared/HideCurtain";
import { StorageGrid } from "./StorageGrid";
import { useGame, useGameState } from "@/lib/store";

export function CapitalistPanel() {
  const state = useGameState();
  const adjust = useGame((s) => s.adjustClassNumber);
  const setVal = useGame((s) => s.setClassNumber);
  const setText = useGame((s) => s.setClassString);
  const apply = useGame((s) => s.apply);
  if (!state) return null;
  const c = state.classes.capitalist;
  const partyMode = state.meta.mode === "party";
  return (
    <ClassPanelShell classId="capitalist">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
        <Counter label="Revenue" value={c.revenue} onAdjust={(d) => adjust("capitalist", "revenue", d)} onSet={(v) => setVal("capitalist", "revenue", v)} max={9999} />
        <Counter label="Capital" value={c.capital} onAdjust={(d) => adjust("capitalist", "capital", d)} onSet={(v) => setVal("capitalist", "capital", v)} max={9999} />
        <Counter label="VP track" value={c.vp} onAdjust={(d) => adjust("capitalist", "vp", d)} onSet={(v) => setVal("capitalist", "vp", v)} />
        <Counter label="Loans" value={c.loans} onAdjust={(d) => adjust("capitalist", "loans", d)} onSet={(v) => setVal("capitalist", "loans", v)} />
        <Counter label="Voting cubes" value={c.votingCubesInBag} onAdjust={(d) => adjust("capitalist", "votingCubesInBag", d)} onSet={(v) => setVal("capitalist", "votingCubesInBag", v)} />
        <Counter label="Bill markers" value={c.billMarkersAvailable} onAdjust={(d) => adjust("capitalist", "billMarkersAvailable", d)} onSet={(v) => setVal("capitalist", "billMarkersAvailable", v)} max={3} />
      </div>
      <StorageGrid
        title="Storage"
        values={{ food: c.storage.food, luxury: c.storage.luxury, health: c.storage.health, education: c.storage.education, influence: c.storage.influence }}
        labels={{ food: "Food", luxury: "Luxury", health: "Health", education: "Education", influence: "Influence" }}
        onAdjust={(k, d) =>
          apply(`capitalist.storage.${k} ${d}`, (s) => {
            const st = s.classes.capitalist.storage as unknown as Record<string, number>;
            st[k] = Math.max(0, (st[k] ?? 0) + d);
          })
        }
        onSet={(k, v) =>
          apply(`capitalist.storage.${k} = ${v}`, (s) => {
            const st = s.classes.capitalist.storage as unknown as Record<string, number>;
            st[k] = Math.max(0, v);
          })
        }
      />
      <div className="grid grid-cols-2 gap-2">
        <Counter label="Free Trade Zone — Food" value={c.storage.freeTradeZone.food}
          onAdjust={(d) =>
            apply(`capitalist.ftz.food ${d}`, (s) => {
              const ftz = s.classes.capitalist.storage.freeTradeZone;
              ftz.food = Math.max(0, ftz.food + d);
            })
          }
          onSet={(v) =>
            apply(`capitalist.ftz.food = ${v}`, (s) => {
              s.classes.capitalist.storage.freeTradeZone.food = Math.max(0, v);
            })
          }
        />
        <Counter label="Free Trade Zone — Luxury" value={c.storage.freeTradeZone.luxury}
          onAdjust={(d) =>
            apply(`capitalist.ftz.luxury ${d}`, (s) => {
              const ftz = s.classes.capitalist.storage.freeTradeZone;
              ftz.luxury = Math.max(0, ftz.luxury + d);
            })
          }
          onSet={(v) =>
            apply(`capitalist.ftz.luxury = ${v}`, (s) => {
              s.classes.capitalist.storage.freeTradeZone.luxury = Math.max(0, v);
            })
          }
        />
      </div>
      <div>
        <div className="panel-title">Companies ({c.companies.length})</div>
        <ul className="space-y-1 text-xs">
          {c.companies.map((co) => (
            <li key={co.id} className="rounded-md border border-slate-800 bg-slate-950/40 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-200">{co.label}</span>
                <span className="text-slate-500">Industry {co.industry} · L{co.wageLevel} · {co.workersAssigned}W{co.onStrike ? " · strike" : ""}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <HideCurtain label="hand">
        <div>
          <div className="panel-title">Hand size</div>
          <Counter label="Cards in hand" value={c.handSize} onAdjust={(d) => adjust("capitalist", "handSize", d)} onSet={(v) => setVal("capitalist", "handSize", v)} max={20} />
          {!partyMode ? <p className="mt-2 text-xs text-slate-500">In solo mode this curtain isn’t needed; toggling it just blurs the panel.</p> : null}
        </div>
      </HideCurtain>
      <div>
        <div className="panel-title">Notes</div>
        <textarea
          className="input min-h-[60px]"
          placeholder="Strategy notes, reminders…"
          value={c.notes}
          onChange={(e) => setText("capitalist", "notes", e.target.value)}
        />
      </div>
    </ClassPanelShell>
  );
}
