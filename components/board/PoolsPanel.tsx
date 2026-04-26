"use client";

import { Counter } from "@/components/shared/Counter";
import { useGame, useGameState } from "@/lib/store";

export function PoolsPanel() {
  const state = useGameState();
  const apply = useGame((s) => s.apply);
  if (!state) return null;
  const p = state.pools;
  const ps = state.publicServices;
  const adjustPool = (key: keyof typeof p, delta: number) =>
    apply(`pools.${key} ${delta}`, (s) => {
      s.pools[key] = Math.max(0, s.pools[key] + delta);
    });
  const setPool = (key: keyof typeof p, v: number) =>
    apply(`pools.${key} = ${v}`, (s) => {
      s.pools[key] = Math.max(0, v);
    });
  const adjustService = (key: keyof typeof ps, delta: number) =>
    apply(`publicServices.${key} ${delta}`, (s) => {
      s.publicServices[key] = Math.max(0, s.publicServices[key] + delta);
    });
  const setService = (key: keyof typeof ps, v: number) =>
    apply(`publicServices.${key} = ${v}`, (s) => {
      s.publicServices[key] = Math.max(0, v);
    });
  return (
    <section className="panel">
      <div className="panel-title">Pools & Public Services</div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
        <Counter label="Workers pool" value={p.workers} onAdjust={(d) => adjustPool("workers", d)} onSet={(v) => setPool("workers", v)} />
        <Counter label="Middle-class pool" value={p.middleClass} onAdjust={(d) => adjustPool("middleClass", d)} onSet={(v) => setPool("middleClass", v)} />
        <Counter label="Foreign capital" value={p.foreignCapital} onAdjust={(d) => adjustPool("foreignCapital", d)} onSet={(v) => setPool("foreignCapital", v)} />
        <Counter label="Public health tokens" value={ps.health} onAdjust={(d) => adjustService("health", d)} onSet={(v) => setService("health", v)} />
        <Counter label="Public education tokens" value={ps.education} onAdjust={(d) => adjustService("education", d)} onSet={(v) => setService("education", v)} />
        <Counter label="Media influence" value={ps.mediaInfluence} onAdjust={(d) => adjustService("mediaInfluence", d)} onSet={(v) => setService("mediaInfluence", v)} />
      </div>
    </section>
  );
}
