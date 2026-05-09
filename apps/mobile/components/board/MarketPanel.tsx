import { Text, View } from "react-native";
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
    <View className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
      <Text className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        Open Market
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {MARKET_GOODS.map(({ key, label, good }) => (
          <View key={key} className="w-[48%]">
            <Counter
              label={label}
              value={mkt[key]}
              onAdjust={(d) => apply({ type: "adjustMarket", good, delta: d }, `market.${key} ${d}`)}
              onSet={(v) => apply({ type: "adjustMarket", good, delta: v - mkt[key] }, `market.${key} = ${v}`)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}
