"use client";

import { Counter } from "@/components/shared/Counter";
import { useGame, useGameState } from "@/lib/store";
import type { PoolId, ServiceId } from "@/lib/types/mutations";
import type { PopulationPools, PublicServices } from "@/lib/types/game";

type PoolKey = keyof PopulationPools;
type ServiceKey = keyof PublicServices;

const POOLS: { key: PoolKey; poolId: PoolId; label: string }[] = [
  { key: "workers",       poolId: "workers",       label: "Workers"        },
  { key: "middleClass",   poolId: "middleClass",   label: "Middle class"   },
  { key: "foreignCapital", poolId: "foreignCapital", label: "Foreign capital" },
];

const SERVICES: { key: ServiceKey; serviceId: ServiceId; label: string }[] = [
  { key: "health",          serviceId: "health",          label: "Public health"    },
  { key: "education",       serviceId: "education",       label: "Public education" },
  { key: "mediaInfluence",  serviceId: "mediaInfluence",  label: "Media influence"  },
];

export function PoolsPanel() {
  const state = useGameState();
  const apply = useGame((s) => s.apply);
  if (!state) return null;
  const p = state.pools;
  const ps = state.publicServices;
  return (
    <section className="panel space-y-3">
      <div>
        <div className="panel-title">Population pools</div>
        <div className="grid grid-cols-2 gap-2">
          {POOLS.map(({ key, poolId, label }) => (
            <Counter
              key={key}
              label={label}
              value={p[key]}
              onAdjust={(d) =>
                apply({ type: "adjustPool", pool: poolId, delta: d }, `pools.${key} ${d}`)
              }
              onSet={(v) =>
                apply({ type: "adjustPool", pool: poolId, delta: v - p[key] }, `pools.${key} = ${v}`)
              }
            />
          ))}
        </div>
      </div>
      <div>
        <div className="panel-title">Public services</div>
        <div className="grid grid-cols-2 gap-2">
          {SERVICES.map(({ key, serviceId, label }) => (
            <Counter
              key={key}
              label={label}
              value={ps[key]}
              onAdjust={(d) =>
                apply({ type: "adjustPublicService", service: serviceId, delta: d }, `publicServices.${key} ${d}`)
              }
              onSet={(v) =>
                apply({ type: "adjustPublicService", service: serviceId, delta: v - ps[key] }, `publicServices.${key} = ${v}`)
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
