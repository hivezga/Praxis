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

const CLASS_META: Record<
  ClassId,
  { label: string; desc: string; active: string; inactive: string }
> = {
  working: {
    label:    "Working Class",
    desc:     "Labor, unions & welfare",
    active:   "border-working/60 bg-working/10 text-working",
    inactive: "border-slate-700/60 bg-slate-900/40 text-slate-400 hover:border-slate-600",
  },
  middle: {
    label:    "Middle Class",
    desc:     "Companies & savings",
    active:   "border-middle/60 bg-middle/10 text-middle",
    inactive: "border-slate-700/60 bg-slate-900/40 text-slate-400 hover:border-slate-600",
  },
  capitalist: {
    label:    "Capitalist Class",
    desc:     "Capital & revenue",
    active:   "border-capitalist/60 bg-capitalist/10 text-capitalist",
    inactive: "border-slate-700/60 bg-slate-900/40 text-slate-400 hover:border-slate-600",
  },
  state: {
    label:    "The State",
    desc:     "Treasury & legitimacy",
    active:   "border-state/60 bg-state/10 text-state",
    inactive: "border-slate-700/60 bg-slate-900/40 text-slate-400 hover:border-slate-600",
  },
};

const MODULE_LABELS: Record<keyof ExpansionFlags["modules"], string> = {
  automa:            "Automa (solo opponent)",
  crisisCards:       "Crisis cards",
  alternativeEvents: "Alternative events",
  hiddenAgendas:     "Hidden agendas",
  newActionCards:    "New action cards",
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
  const [hostParty, setHostParty] = useState(false);
  const [starting, setStarting] = useState(false);
  const [partyError, setPartyError] = useState<string | null>(null);

  const hydrate = useGame((s) => s.hydrate);
  const startHosting = useGame((s) => s.startHosting);

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
    setPartyError(null);
    setStarting(true);
    try {
      const state = wasm().create_starting_state_wasm({
        name: name || undefined,
        mode,
        playerCount,
        classesInPlay: Array.from(classes),
        expansions,
      }) as GameState;
      await localStorageAdapter.save(state);
      hydrate(state);
      if (hostParty) {
        try {
          await startHosting();
        } catch (err) {
          setPartyError(
            err instanceof Error
              ? err.message
              : "Couldn’t start the party room. The game is still saved locally.",
          );
        }
      }
      router.push(`/play/${state.meta.id}`);
    } finally {
      setStarting(false);
    }
  }

  return (
    <main id="main" className="mx-auto max-w-2xl px-6 py-16">
      <Link
        href="/"
        className="font-serif text-xs italic text-slate-500 transition-colors hover:text-slate-300"
      >
        ← Back to home
      </Link>

      <header className="mb-12 mt-6 border-b border-slate-800/40 pb-8">
        <p className="editorial-eyebrow">A new session</p>
        <h1 className="editorial-h2 mt-3">Configure & begin</h1>
        <p className="mt-3 font-serif text-sm italic leading-relaxed text-slate-500">
          A few choices first — then Praxis sets up the board state for you.
        </p>
      </header>

      <div className="space-y-10">
        {/* Game name */}
        <Field label="Game name" hint="Optional. A friendly title for your saved sessions.">
          <input
            className="input"
            placeholder="Tuesday night at Sam's"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        {/* Mode */}
        <Field label="Mode">
          <div className="grid grid-cols-2 gap-3">
            {(["party", "solo"] as GameMode[]).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
                className={`rounded-lg border px-4 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 ${
                  mode === m
                    ? "border-amber-400/40 bg-amber-400/10 text-amber-100"
                    : "border-slate-700/60 bg-slate-900/40 text-slate-400 hover:border-slate-600"
                }`}
              >
                <div className="font-serif text-lg font-normal capitalize">
                  {m === "party" ? "Party" : "Solo"}
                </div>
                <div className="mt-1 font-serif text-xs italic text-slate-500">
                  {m === "party" ? "One screen, two to four players" : "One player against an automa"}
                </div>
              </button>
            ))}
          </div>
        </Field>

        {/* Player count */}
        <Field
          label="Player count"
          hint={
            playerCount < 4
              ? "The State class is only used in 4-player games. Toggle it off below."
              : undefined
          }
        >
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
        </Field>

        {/* Classes */}
        <Field label="Classes in play">
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
                  className={`rounded-lg border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 ${
                    active ? meta.active : meta.inactive
                  }`}
                >
                  <div className="font-serif text-sm font-normal">{meta.label}</div>
                  <div
                    className={`mt-1 font-serif text-[11px] italic ${
                      active ? "opacity-70" : "text-slate-600"
                    }`}
                  >
                    {meta.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </Field>

        {/* Expansion */}
        <Field label="Expansion: Crisis & Control">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-700/60 bg-slate-900/40 px-4 py-3 text-sm text-slate-300 transition-colors hover:border-slate-600">
            <input
              type="checkbox"
              className="rounded border-slate-600"
              checked={expansions.crisisAndControl}
              onChange={(e) =>
                setExpansions((p) => ({ ...p, crisisAndControl: e.target.checked }))
              }
            />
            <span className="font-serif text-base">Enable Crisis &amp; Control</span>
          </label>
          {expansions.crisisAndControl ? (
            <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {(Object.keys(expansions.modules) as (keyof ExpansionFlags["modules"])[]).map(
                (k) => (
                  <label
                    key={k}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md border border-slate-800/60 bg-slate-950/30 px-3 py-2 text-xs text-slate-300 transition-colors hover:border-slate-700"
                  >
                    <input
                      type="checkbox"
                      className="rounded border-slate-600"
                      checked={expansions.modules[k]}
                      onChange={(e) => setExp(k, e.target.checked)}
                    />
                    {MODULE_LABELS[k]}
                  </label>
                ),
              )}
            </div>
          ) : null}
        </Field>

        {/* Party room option */}
        <Field
          label="Party room"
          hint="Friends with the room code can connect from another device and watch the game live. Only you can change values."
        >
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-700/60 bg-slate-900/40 px-4 py-3 text-sm text-slate-300 transition-colors hover:border-slate-600">
            <input
              type="checkbox"
              className="rounded border-slate-600"
              checked={hostParty}
              onChange={(e) => setHostParty(e.target.checked)}
            />
            <span className="font-serif text-base">Host a party room (share a 6-char code)</span>
          </label>
        </Field>

        {/* CTA */}
        <div className="border-t border-slate-800/40 pt-6">
          <button
            type="button"
            className="btn btn-primary px-6 py-3 font-serif text-base"
            onClick={start}
            disabled={classes.size === 0 || starting}
          >
            {starting ? (hostParty ? "Opening room…" : "Starting…") : "Start game →"}
          </button>
          {classes.size === 0 ? (
            <p className="mt-2 font-serif text-xs italic text-slate-500">
              Select at least one class to start.
            </p>
          ) : null}
          {partyError ? (
            <p className="mt-3 rounded-md border border-rose-700/30 bg-rose-950/20 px-4 py-2.5 font-serif text-xs italic text-rose-300">
              {partyError}
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="editorial-eyebrow mb-3">{label}</p>
      {children}
      {hint ? <p className="mt-2 font-serif text-xs italic text-slate-500">{hint}</p> : null}
    </div>
  );
}
