import { Text, View } from "react-native";
import { Counter } from "@/components/shared/Counter";
import { useGame, useGameState } from "@/lib/store";
import type { PoolId, ServiceId } from "@/lib/types/mutations";
import type { PopulationPools, PublicServices } from "@/lib/types/game";

type PoolKey = keyof PopulationPools;
type ServiceKey = keyof PublicServices;

const POOLS: { key: PoolKey; poolId: PoolId; label: string }[] = [
  { key: "workers",        poolId: "workers",        label: "Workers"         },
  { key: "middleClass",    poolId: "middleClass",    label: "Middle class"    },
  { key: "foreignCapital", poolId: "foreignCapital", label: "Foreign capital" },
];

const SERVICES: { key: ServiceKey; serviceId: ServiceId; label: string }[] = [
  { key: "health",         serviceId: "health",         label: "Public health"    },
  { key: "education",      serviceId: "education",      label: "Public education" },
  { key: "mediaInfluence", serviceId: "mediaInfluence", label: "Media influence"  },
];

export function PoolsPanel() {
  const state = useGameState();
  const apply = useGame((s) => s.apply);
  if (!state) return null;
  const p = state.pools;
  const ps = state.publicServices;
  return (
    <View className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 gap-3">
      <View>
        <Text className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Population pools
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {POOLS.map(({ key, poolId, label }) => (
            <View key={key} className="w-[48%]">
              <Counter
                label={label}
                value={p[key]}
                onAdjust={(d) => apply({ type: "adjustPool", pool: poolId, delta: d }, `pools.${key} ${d}`)}
                onSet={(v) => apply({ type: "adjustPool", pool: poolId, delta: v - p[key] }, `pools.${key} = ${v}`)}
              />
            </View>
          ))}
        </View>
      </View>
      <View>
        <Text className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Public services
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {SERVICES.map(({ key, serviceId, label }) => (
            <View key={key} className="w-[48%]">
              <Counter
                label={label}
                value={ps[key]}
                onAdjust={(d) => apply({ type: "adjustPublicService", service: serviceId, delta: d }, `publicServices.${key} ${d}`)}
                onSet={(v) => apply({ type: "adjustPublicService", service: serviceId, delta: v - ps[key] }, `publicServices.${key} = ${v}`)}
              />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
