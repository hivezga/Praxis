"use client";

import { ClassPanelShell } from "./ClassPanelShell";
import { Counter } from "@/components/shared/Counter";
import { HideCurtain } from "@/components/shared/HideCurtain";
import { NotesField } from "./NotesField";
import { StorageGrid } from "./StorageGrid";
import { useClassState, useGame, useShouldHideClass } from "@/lib/store";
import type { Good } from "@/lib/types/game";

export function CapitalistPanel() {
  const c = useClassState("capitalist");
  const adjust = useGame((s) => s.adjustClassNumber);
  const setVal = useGame((s) => s.setClassNumber);
  const setText = useGame((s) => s.setClassString);
  const apply = useGame((s) => s.apply);
  const hideForeign = useShouldHideClass("capitalist");
  if (!c) return null;
  return (
    <ClassPanelShell classId="capitalist">
      {/* Primary stats */}
      <div className="grid gap-2 @md:grid-cols-2">
        <Counter
          size="lg"
          label="Revenue"
          value={c.revenue}
          onAdjust={(d) => adjust("capitalist", "revenue", d)}
          onSet={(v) => setVal("capitalist", "revenue", v)}
          max={9999}
        />
        <Counter
          size="lg"
          label="Capital"
          value={c.capital}
          onAdjust={(d) => adjust("capitalist", "capital", d)}
          onSet={(v) => setVal("capitalist", "capital", v)}
          max={9999}
        />
      </div>

      <div>
        <div className="panel-title">Action economy</div>
        <div className="grid grid-cols-2 gap-2 @md:grid-cols-3">
          <Counter label="VP track"     value={c.vp}                  onAdjust={(d) => adjust("capitalist", "vp", d)}                  onSet={(v) => setVal("capitalist", "vp", v)} />
          <Counter label="Loans"        value={c.loans}               onAdjust={(d) => adjust("capitalist", "loans", d)}               onSet={(v) => setVal("capitalist", "loans", v)} />
          <Counter label="Voting cubes" value={c.votingCubesInBag}    onAdjust={(d) => adjust("capitalist", "votingCubesInBag", d)}    onSet={(v) => setVal("capitalist", "votingCubesInBag", v)} />
          <Counter label="Bill markers" value={c.billMarkersAvailable} onAdjust={(d) => adjust("capitalist", "billMarkersAvailable", d)} onSet={(v) => setVal("capitalist", "billMarkersAvailable", v)} max={3} />
        </div>
      </div>

      <StorageGrid
        title="Storage"
        values={{ food: c.storage.food, luxury: c.storage.luxury, health: c.storage.health, education: c.storage.education, influence: c.storage.influence }}
        labels={{ food: "Food", luxury: "Luxury", health: "Health", education: "Education", influence: "Influence" }}
        onAdjust={(k, d) =>
          apply({ type: "adjustStorage", classId: "capitalist", good: k as Good, delta: d }, `capitalist.storage.${k} ${d}`)
        }
        onSet={(k, v) => {
          const cur = (c.storage as unknown as Record<string, number>)[k] ?? 0;
          apply({ type: "adjustStorage", classId: "capitalist", good: k as Good, delta: Math.max(0, v) - cur }, `capitalist.storage.${k} = ${v}`);
        }}
      />

      <div>
        <div className="panel-title">Free Trade Zone</div>
        <div className="grid grid-cols-2 gap-2">
          <Counter
            label="FTZ — Food"
            value={c.storage.freeTradeZone.food}
            onAdjust={(d) =>
              apply({ type: "adjustFreeTradeZone", good: "food", delta: d }, `capitalist.ftz.food ${d}`)
            }
            onSet={(v) =>
              apply({ type: "adjustFreeTradeZone", good: "food", delta: v - c.storage.freeTradeZone.food }, `capitalist.ftz.food = ${v}`)
            }
          />
          <Counter
            label="FTZ — Luxury"
            value={c.storage.freeTradeZone.luxury}
            onAdjust={(d) =>
              apply({ type: "adjustFreeTradeZone", good: "luxury", delta: d }, `capitalist.ftz.luxury ${d}`)
            }
            onSet={(v) =>
              apply({ type: "adjustFreeTradeZone", good: "luxury", delta: v - c.storage.freeTradeZone.luxury }, `capitalist.ftz.luxury = ${v}`)
            }
          />
        </div>
      </div>

      <div>
        <div className="panel-title">Companies ({c.companies.length})</div>
        <ul className="space-y-1.5">
          {c.companies.map((co) => (
            <li key={co.id} className="rounded-sharp border border-rule/60 bg-paper/30 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="min-w-0 text-fluid-sm text-ink">{co.label}</span>
                <span className="shrink-0 font-mono text-[10px] text-inkMute">
                  Ind {co.industry} · L{co.wageLevel} · {co.workersAssigned}W{co.onStrike ? " · strike" : ""}
                </span>
              </div>
            </li>
          ))}
          {c.companies.length === 0 ? (
            <li className="font-serif text-fluid-sm italic text-inkMute">No companies built.</li>
          ) : null}
        </ul>
      </div>

      {hideForeign ? (
        <HideCurtain label="hand">
          <div>
            <div className="panel-title">Hand size</div>
            <Counter
              label="Cards in hand"
              value={c.handSize}
              onAdjust={(d) => adjust("capitalist", "handSize", d)}
              onSet={(v) => setVal("capitalist", "handSize", v)}
              max={20}
            />
          </div>
        </HideCurtain>
      ) : (
        <div>
          <div className="panel-title">Hand size</div>
          <Counter
            label="Cards in hand"
            value={c.handSize}
            onAdjust={(d) => adjust("capitalist", "handSize", d)}
            onSet={(v) => setVal("capitalist", "handSize", v)}
            max={20}
          />
        </div>
      )}

      <NotesField classId="capitalist" value={c.notes} onChange={(t) => setText("capitalist", "notes", t)} />
    </ClassPanelShell>
  );
}
