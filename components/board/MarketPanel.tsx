"use client";

import { Counter } from "@/components/shared/Counter";
import { useGame, useGameState } from "@/lib/store";

export function MarketPanel() {
  const state = useGameState();
  const apply = useGame((s) => s.apply);
  if (!state) return null;
  const m = state.market;
  const adjust = (key: keyof typeof m, delta: number) =>
    apply(`market.${key} ${delta >= 0 ? "+" : ""}${delta}`, (s) => {
      s.market[key] = Math.max(0, s.market[key] + delta);
    });
  const setVal = (key: keyof typeof m, value: number) =>
    apply(`market.${key} = ${value}`, (s) => {
      s.market[key] = Math.max(0, value);
    });
  return (
    <section className="panel">
      <div className="panel-title">Open Market</div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Counter label="Food" value={m.food} onAdjust={(d) => adjust("food", d)} onSet={(v) => setVal("food", v)} />
        <Counter label="Luxury" value={m.luxury} onAdjust={(d) => adjust("luxury", d)} onSet={(v) => setVal("luxury", v)} />
        <Counter label="Health goods" value={m.healthGoods} onAdjust={(d) => adjust("healthGoods", d)} onSet={(v) => setVal("healthGoods", v)} />
        <Counter label="Education goods" value={m.educationGoods} onAdjust={(d) => adjust("educationGoods", d)} onSet={(v) => setVal("educationGoods", v)} />
      </div>
    </section>
  );
}
