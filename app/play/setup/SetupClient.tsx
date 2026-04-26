"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { DEFAULT_EXPANSIONS, createStartingState } from "@/lib/data/startingState";
import { useGame } from "@/lib/store";
import { localStorageAdapter } from "@/lib/store/persistence/localStorage";
import type { ClassId, ExpansionFlags, GameMode } from "@/lib/types/game";

const ALL_CLASSES: ClassId[] = ["working", "middle", "capitalist", "state"];

export function SetupClient() {
  const router = useRouter();
  const params = useSearchParams();
  const initialMode = (params.get("mode") as GameMode) === "solo" ? "solo" : "party";

  const [mode, setMode] = useState<GameMode>(initialMode);
  const [name, setName] = useState("");
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(4);
  const [classes, setClasses] = useState<Set<ClassId>>(new Set(ALL_CLASSES));
  const [expansions, setExpansions] = useState<ExpansionFlags>(DEFAULT_EXPANSIONS);

  const hydrate = useGame((s) => s.hydrate);

  function toggleClass(c: ClassId) {
    const next = new Set(classes);
    if (next.has(c)) next.delete(c);
    else next.add(c);
    setClasses(next);
  }

  function setExp<K extends keyof ExpansionFlags["modules"]>(key: K, value: boolean) {
    setExpansions((prev) => ({
      ...prev,
      modules: { ...prev.modules, [key]: value },
    }));
  }

  async function start() {
    const state = createStartingState({
      name,
      mode,
      playerCount,
      classesInPlay: Array.from(classes),
      expansions,
    });
    await localStorageAdapter.save(state);
    hydrate(state);
    router.push(`/play/${state.meta.id}`);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">← Back</Link>
      <h1 className="mt-2 text-3xl font-bold text-slate-100">New game</h1>
      <p className="mt-1 text-sm text-slate-400">Pick a mode, classes in play, and expansion modules.</p>

      <section className="mt-6 space-y-6">
        <div>
          <div className="panel-title">Game name</div>
          <input className="input" placeholder="Tuesday night at Sam's" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <div className="panel-title">Mode</div>
          <div className="flex gap-2">
            {(["party", "solo"] as GameMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`btn ${mode === m ? "btn-primary" : ""}`}
              >
                {m === "party" ? "Party (one screen)" : "Solo"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="panel-title">Player count</div>
          <div className="flex gap-2">
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPlayerCount(n as 2 | 3 | 4)}
                className={`btn ${playerCount === n ? "btn-primary" : ""}`}
              >
                {n}
              </button>
            ))}
          </div>
          {playerCount < 4 ? (
            <p className="mt-2 text-xs text-slate-500">
              The State class is only used in 4-player games. Toggle it off in classes-in-play below.
            </p>
          ) : null}
        </div>

        <div>
          <div className="panel-title">Classes in play</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ALL_CLASSES.map((c) => {
              const active = classes.has(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleClass(c)}
                  className={`rounded-md border px-3 py-2 text-sm capitalize ${
                    active
                      ? "border-indigo-500 bg-indigo-600/30 text-slate-100"
                      : "border-slate-700 bg-slate-900 text-slate-400"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="panel-title">Expansion: Crisis &amp; Control</div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={expansions.crisisAndControl}
              onChange={(e) =>
                setExpansions((p) => ({ ...p, crisisAndControl: e.target.checked }))
              }
            />
            Enable Crisis &amp; Control
          </label>
          {expansions.crisisAndControl ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {(Object.keys(expansions.modules) as (keyof ExpansionFlags["modules"])[]).map((k) => (
                <label key={k} className="flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={expansions.modules[k]}
                    onChange={(e) => setExp(k, e.target.checked)}
                  />
                  {k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                </label>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex gap-2">
          <button type="button" className="btn btn-primary" onClick={start} disabled={classes.size === 0}>
            Start game →
          </button>
        </div>
      </section>
    </main>
  );
}
