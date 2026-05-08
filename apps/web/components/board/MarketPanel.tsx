"use client";

import { Counter } from "@/components/shared/Counter";
import { useGame, useGameState } from "@/lib/store";
import type { Good, MarketState } from "@/lib/types/game";

type MarketKey = keyof MarketState;

const MARKET_GOODS: { key: MarketKey; label: string; good: Good }[] = [
  { key: "food",           label: "Food",            good: "food"      },
  { key: "luxury",         label: "Luxury",          good: "luxury"    },
  { key: "healthGoods",    label: "Health goods",    good: "health"    },
  { key: "educationGoods", label: "Education goods", good: "education" },
];

export function MarketPanel() {
  const state = useGameState();
  const apply = useGame((s) => s.apply);
  if (!state) return null;
  const mkt = state.market;
  return (
    <section className="panel">
      <div className="panel-title">Open Market</div>
      <div className="grid grid-cols-2 gap-2">
        {MARKET_GOODS.map(({ key, label, good }) => (
          <Counter
            key={key}
            label={label}
            value={mkt[key]}
            onAdjust={(d) =>
              apply({ type: "adjustMarket", good, delta: d }, `market.${key} ${d}`)
            }
            onSet={(v) =>
              apply({ type: "adjustMarket", good, delta: v - mkt[key] }, `market.${key} = ${v}`)
            }
          />
        ))}
      </div>
    </section>
  );
}
