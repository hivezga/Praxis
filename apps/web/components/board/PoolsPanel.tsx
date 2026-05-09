"use client";

import { useState } from "react";

import { Counter } from "@/components/shared/Counter";
import { Modal } from "@/components/shared/Modal";
import { useGame, useGameState } from "@/lib/store";
import type { ClassId, PolicySection } from "@/lib/types/game";
import type { PoolId, ServiceId } from "@/lib/types/mutations";
import type { PopulationPools, PublicServices } from "@/lib/types/game";

type PoolKey = keyof PopulationPools;
type ServiceKey = keyof PublicServices;
type SellableGood = "health" | "education";

const POOLS: { key: PoolKey; poolId: PoolId; label: string }[] = [
  { key: "workers",       poolId: "workers",       label: "Workers"        },
  { key: "middleClass",   poolId: "middleClass",   label: "Middle class"   },
  { key: "foreignCapital", poolId: "foreignCapital", label: "Foreign capital" },
];

const SERVICES: { key: ServiceKey; serviceId: ServiceId; label: string; sellable: SellableGood | null }[] = [
  { key: "health",          serviceId: "health",          label: "Public health",    sellable: "health"    },
  { key: "education",       serviceId: "education",       label: "Public education", sellable: "education" },
  { key: "mediaInfluence",  serviceId: "mediaInfluence",  label: "Media influence",  sellable: null         },
];

/** Price per unit based on the relevant Welfare Policy section. */
function pricePerUnit(section: PolicySection): number {
  return section === "A" ? 0 : section === "B" ? 5 : 10;
}

function bonusLabel(section: PolicySection): string {
  return section === "A"
    ? "Free — buyer's class +1 Legitimacy per 3 sold"
    : section === "B"
      ? "5¥/unit — State +1 VP regardless of amount"
      : "10¥/unit — no bonus";
}

export function PoolsPanel() {
  const state = useGameState();
  const apply = useGame((s) => s.apply);
  const [sellOpen, setSellOpen] = useState<SellableGood | null>(null);
  const [buyer, setBuyer] = useState<ClassId>("working");
  const [units, setUnits] = useState(1);
  if (!state) return null;
  const p = state.pools;
  const ps = state.publicServices;

  const policySection = (good: SellableGood): PolicySection =>
    good === "health"
      ? state.policies.healthBenefits.position
      : state.policies.educationWelfare.position;

  const openSell = (good: SellableGood) => {
    setSellOpen(good);
    setBuyer("working");
    setUnits(1);
  };

  const confirmSell = () => {
    if (!sellOpen) return;
    const available = ps[sellOpen];
    const qty = Math.min(Math.max(1, units), available);
    if (qty <= 0) return;
    apply(
      { type: "sellWelfare", good: sellOpen, buyer, units: qty },
      `Sell ${qty} ${sellOpen} to ${buyer}`,
    );
    setSellOpen(null);
  };

  const activeSection = sellOpen ? policySection(sellOpen) : null;
  const activePrice = activeSection ? pricePerUnit(activeSection) : 0;
  const activeAvailable = sellOpen ? ps[sellOpen] : 0;

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
          {SERVICES.map(({ key, serviceId, label, sellable }) => (
            <div key={key} className="space-y-1">
              <Counter
                label={label}
                value={ps[key]}
                onAdjust={(d) =>
                  apply({ type: "adjustPublicService", service: serviceId, delta: d }, `publicServices.${key} ${d}`)
                }
                onSet={(v) =>
                  apply({ type: "adjustPublicService", service: serviceId, delta: v - ps[key] }, `publicServices.${key} = ${v}`)
                }
              />
              {sellable && ps[key] > 0 ? (
                <button
                  type="button"
                  className="btn btn-ghost w-full text-[10px]"
                  onClick={() => openSell(sellable)}
                >
                  Sell to class…
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <Modal
        open={sellOpen !== null}
        onClose={() => setSellOpen(null)}
        title={sellOpen ? `Sell ${sellOpen} to a class` : ""}
        footer={
          <>
            <button type="button" className="btn" onClick={() => setSellOpen(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={units <= 0 || activeAvailable <= 0}
              onClick={confirmSell}
            >
              Sell {Math.min(Math.max(1, units), activeAvailable)} ({activePrice * Math.min(Math.max(1, units), activeAvailable)}¥)
            </button>
          </>
        }
      >
        {sellOpen && activeSection ? (
          <div className="space-y-3 text-fluid-sm">
            <p className="rounded-sharp border border-rule/60 bg-paper/30 p-2 text-inkSoft">
              Welfare policy section <span className="font-mono font-semibold text-accentInk">{activeSection}</span>:{" "}
              {bonusLabel(activeSection)}.
            </p>
            <div className="text-[11px] text-inkMute">
              Available in Public Services: <span className="font-mono">{activeAvailable}</span>
            </div>
            <fieldset>
              <legend className="stat-label mb-1.5">Buyer</legend>
              <div className="flex gap-2">
                {(["working", "middle"] as ClassId[]).map((c) => (
                  <label
                    key={c}
                    className={`flex flex-1 cursor-pointer items-center gap-2 rounded-sharp border px-2 py-1.5 ${
                      buyer === c ? "border-accent bg-accent/10" : "border-rule/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="welfare-buyer"
                      value={c}
                      checked={buyer === c}
                      onChange={() => setBuyer(c)}
                    />
                    <span className="font-display text-[10px] uppercase tracking-wider text-ink">
                      {c === "working" ? "Working" : "Middle"}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="flex flex-col gap-1.5">
              <span className="stat-label">Units</span>
              <input
                type="number"
                min={1}
                max={activeAvailable}
                step={1}
                className="input"
                value={units}
                onChange={(e) => setUnits(parseInt(e.target.value, 10) || 0)}
              />
            </label>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
