"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { wasm } from "@/lib/wasm";
import { useGame } from "@/lib/store";
import { localStorageAdapter } from "@/lib/store/persistence/localStorage";
import type { ClassId, ExpansionFlags, GameMode, GameState } from "@/lib/types/game";

const DEFAULT_EXPANSIONS: ExpansionFlags = {
  crisisAndControl: false,
  modules: {
    automa: false,
    crisisCards: false,
    alternativeEvents: false,
    hiddenAgendas: false,
    newActionCards: false,
  },
};

const ALL_CLASSES: ClassId[] = ["working", "middle", "capitalist", "state"];

const CLASS_META: Record<ClassId, { label: string; desc: string; active: string; inactive: string }> = {
  working: {
    label: "Working Class",
    desc: "Labor, unions & welfare",
    active:   "border-working/60 bg-working/10 text-working",
    inactive: "border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-600",
  },
  middle: {
    label: "Middle Class",
    desc: "Companies & savings",
    active:   "border-middle/60 bg-middle/10 text-middle",
    inactive: "border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-600",
  },
  capitalist: {
    label: "Capitalist Class",
    desc: "Capital & revenue",
    active:   "border-capitalist/60 bg-capitalist/10 text-capitalist",
    inactive: "border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-600",
  },
  state: {
    label: "The State",
    desc: "Treasury & legitimacy",
    active:   "border-state/60 bg-state/10 text-state",
    inactive: "border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-600",
  },
};

const MODULE_LABELS: Record<keyof ExpansionFlags["modules"], string> = {
  automa:              "Automa (solo opponent)",
  crisisCards:         "Crisis cards",
  alternativeEvents:   "Alternative events",
  hiddenAgendas:       "Hidden agendas",
  newActionCards:      "New action cards",
};

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
    const state = wasm().create_starting_state_wasm({
      name: name || undefined,
      mode,
      playerCount,
      classesInPlay: Array.from(classes),
      expansions,
    }) as GameState;
    await localStorageAdapter.save(state);
    hydrate(state);
    router.push(`/play/${state.meta.id}`);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/" className="text-xs text-slate-500 transition-colors hover:text-slate-300">
        ← Back
      </Link>
      <h1 className="mt-3 text-3xl font-light tracking-tight text-slate-100">New game</h1>
      <p className="mt-1 text-sm text-slate-500">Configure your session, then start tracking.</p>

      <div className="mt-8 space-y-7">
        {/* Game name */}
        <div>
          <div className="panel-title">Game name</div>
          <input
            className="input"
            placeholder="Tuesday night at Sam's"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Mode */}
        <div>
          <div className="panel-title">Mode</div>
          <div className="grid grid-cols-2 gap-3">
            {(["party", "solo"] as GameMode[]).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
                className={`rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  mode === m
                    ? "border-indigo-500/60 bg-indigo-600/15 text-slate-100"
                    : "border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-600"
                }`}
              >
                <div className="font-medium capitalize">
                  {m === "party" ? "Party" : "Solo"}
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {m === "party" ? "One screen, 2–4 players" : "One player + automa"}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Player count */}
        <div>
          <div className="panel-title">Player count</div>
          <div className="flex gap-2">
            {([2, 3, 4] as const).map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={playerCount === n}
                onClick={() => setPlayerCount(n)}
                className={`btn ${playerCount === n ? "btn-primary" : ""}`}
              >
                {n} players
              </button>
            ))}
          </div>
          {playerCount < 4 ? (
            <p className="mt-2 text-xs text-slate-600">
              The State class is only used in 4-player games. Toggle it off below.
            </p>
          ) : null}
        </div>

        {/* Classes */}
        <div>
          <div className="panel-title">Classes in play</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ALL_CLASSES.map((c) => {
              const active = classes.has(c);
              const meta = CLASS_META[c];
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleClass(c)}
                  className={`rounded-xl border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    active ? meta.active : meta.inactive
                  }`}
                >
                  <div className="text-sm font-medium">{meta.label}</div>
                  <div className={`mt-0.5 text-[10px] ${active ? "opacity-70" : "text-slate-600"}`}>
                    {meta.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Expansion */}
        <div>
          <div className="panel-title">Expansion: Crisis &amp; Control</div>
          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-300 transition-colors hover:border-slate-600">
            <input
              type="checkbox"
              className="rounded border-slate-600"
              checked={expansions.crisisAndControl}
              onChange={(e) =>
                setExpansions((p) => ({ ...p, crisisAndControl: e.target.checked }))
              }
            />
            Enable Crisis &amp; Control
          </label>
          {expansions.crisisAndControl ? (
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {(Object.keys(expansions.modules) as (keyof ExpansionFlags["modules"])[]).map((k) => (
                <label
                  key={k}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs text-slate-300 transition-colors hover:border-slate-700"
                >
                  <input
                    type="checkbox"
                    className="rounded border-slate-600"
                    checked={expansions.modules[k]}
                    onChange={(e) => setExp(k, e.target.checked)}
                  />
                  {MODULE_LABELS[k]}
                </label>
              ))}
            </div>
          ) : null}
        </div>

        {/* CTA */}
        <div className="pt-2">
          <button
            type="button"
            className="btn btn-primary px-6 py-2.5 text-base"
            onClick={start}
            disabled={classes.size === 0}
          >
            Start game →
          </button>
          {classes.size === 0 ? (
            <p className="mt-2 text-xs text-slate-600">Select at least one class to start.</p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
