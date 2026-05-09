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
    active:   "border-working-deep bg-working-deep text-working-ink",
    inactive: "border-rule/60 bg-surface/40 text-inkSoft hover:border-rule",
  },
  middle: {
    label:    "Middle Class",
    desc:     "Companies & savings",
    active:   "border-middle-deep bg-middle-deep text-middle-ink",
    inactive: "border-rule/60 bg-surface/40 text-inkSoft hover:border-rule",
  },
  capitalist: {
    label:    "Capitalist Class",
    desc:     "Capital & revenue",
    active:   "border-capitalist-deep bg-capitalist-deep text-capitalist-ink",
    inactive: "border-rule/60 bg-surface/40 text-inkSoft hover:border-rule",
  },
  state: {
    label:    "The State",
    desc:     "Treasury & legitimacy",
    active:   "border-state-deep bg-state-deep text-state-ink",
    inactive: "border-rule/60 bg-surface/40 text-inkSoft hover:border-rule",
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
  const [localPlayerClass, setLocalPlayerClass] = useState<ClassId | null>(null);
  const [expansions, setExpansions] = useState<ExpansionFlags>(DEFAULT_EXPANSIONS);
  const [hostParty, setHostParty] = useState(false);
  const [starting, setStarting] = useState(false);
  const [partyError, setPartyError] = useState<string | null>(null);

  const hydrate = useGame((s) => s.hydrate);
  const startHosting = useGame((s) => s.startHosting);
  const selectFaction = useGame((s) => s.selectFaction);

  function toggleClass(c: ClassId) {
    const next = new Set(classes);
    if (next.has(c)) next.delete(c);
    else next.add(c);
    setClasses(next);
    if (localPlayerClass && !next.has(localPlayerClass)) setLocalPlayerClass(null);
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
        localPlayerClass: mode === "solo" ? localPlayerClass ?? undefined : undefined,
      }) as GameState;
      await localStorageAdapter.save(state);
      hydrate(state);
      if (mode === "solo" && localPlayerClass) selectFaction(localPlayerClass);
      if (hostParty) {
        try {
          await startHosting();
          router.push("/play/lobby");
          return;
        } catch (err) {
          setPartyError(
            err instanceof Error
              ? err.message
              : "Couldn’t start the party room. The game is still saved locally.",
          );
          return;
        }
      }
      router.push(`/play/${state.meta.id}`);
    } finally {
      setStarting(false);
    }
  }

  return (
    <main id="main" className="mx-auto max-w-2xl px-5 py-12 sm:px-6 sm:py-16">
      <Link
        href="/"
        className="inline-flex min-h-tap items-center font-serif text-fluid-sm italic text-inkMute transition-colors hover:text-inkSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        ← Back to home
      </Link>

      <header className="mb-12 mt-6 border-b border-rule/40 pb-8">
        <p className="poster-eyebrow">A new session</p>
        <h1 className="poster-h2 mt-3">Configure & begin</h1>
        <p className="mt-3 font-serif text-fluid-sm italic leading-relaxed text-inkMute">
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
            aria-label="Game name"
          />
        </Field>

        {/* Mode */}
        <Field label="Mode">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(["party", "solo"] as GameMode[]).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
                className={`min-h-tap rounded-sharp border-2 px-4 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${
                  mode === m
                    ? "border-accent bg-accent/15 text-accentInk"
                    : "border-rule/60 bg-surface/40 text-inkSoft hover:border-rule"
                }`}
              >
                <div className="font-display text-fluid-base uppercase tracking-tight">
                  {m === "party" ? "Party" : "Solo"}
                </div>
                <div
                  className={`mt-1 font-serif text-fluid-xs italic ${
                    mode === m ? "text-accentInk" : "text-inkMute"
                  }`}
                >
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
          <div className="flex flex-wrap gap-2">
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
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {ALL_CLASSES.map((c) => {
              const active = classes.has(c);
              const meta = CLASS_META[c];
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleClass(c)}
                  className={`min-h-tap rounded-sharp border-2 px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${
                    active ? meta.active : meta.inactive
                  }`}
                >
                  <div className="font-display text-fluid-sm uppercase tracking-tight">{meta.label}</div>
                  <div
                    className={`mt-1 font-serif text-[11px] italic ${
                      active ? "" : "text-inkMute"
                    }`}
                  >
                    {meta.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </Field>

        {/* Solo: which class am I playing */}
        {mode === "solo" && classes.size > 0 ? (
          <Field
            label="Which class are you playing?"
            hint="Other classes' private info (cards in hand, notes) will stay hidden behind a curtain."
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from(classes).map((c) => {
                const meta = CLASS_META[c];
                const active = localPlayerClass === c;
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setLocalPlayerClass(active ? null : c)}
                    className={`min-h-tap rounded-sharp border-2 px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${
                      active ? meta.active : meta.inactive
                    }`}
                  >
                    <div className="font-display text-fluid-sm uppercase tracking-tight">{meta.label}</div>
                    <div
                      className={`mt-1 font-serif text-[11px] italic ${
                        active ? "opacity-80" : "text-inkMute"
                      }`}
                    >
                      {meta.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </Field>
        ) : null}

        {/* Expansion */}
        <Field label="Expansion: Crisis & Control">
          <label className="flex min-h-tap cursor-pointer items-center gap-3 rounded-sharp border border-rule/60 bg-surface/40 px-4 py-3 text-fluid-sm text-inkSoft transition-colors hover:border-rule">
            <input
              type="checkbox"
              className="h-4 w-4 rounded-sharp border-rule"
              checked={expansions.crisisAndControl}
              onChange={(e) =>
                setExpansions((p) => ({ ...p, crisisAndControl: e.target.checked }))
              }
            />
            <span className="font-serif text-fluid-base">Enable Crisis &amp; Control</span>
          </label>
          {expansions.crisisAndControl ? (
            <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {(Object.keys(expansions.modules) as (keyof ExpansionFlags["modules"])[]).map(
                (k) => (
                  <label
                    key={k}
                    className="flex min-h-tap cursor-pointer items-center gap-2.5 rounded-sharp border border-rule/60 bg-paper/30 px-3 py-2 text-fluid-xs text-inkSoft transition-colors hover:border-rule"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded-sharp border-rule"
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
          <label className="flex min-h-tap cursor-pointer items-center gap-3 rounded-sharp border border-rule/60 bg-surface/40 px-4 py-3 text-fluid-sm text-inkSoft transition-colors hover:border-rule">
            <input
              type="checkbox"
              className="h-4 w-4 rounded-sharp border-rule"
              checked={hostParty}
              onChange={(e) => setHostParty(e.target.checked)}
            />
            <span className="font-serif text-fluid-base">Host a party room (share a 6-char code)</span>
          </label>
        </Field>

        {/* CTA */}
        <div className="border-t border-rule/40 pt-6">
          <button
            type="button"
            className="btn btn-poster px-6 py-3 font-display text-fluid-base"
            onClick={start}
            disabled={
              classes.size === 0 ||
              starting ||
              (mode === "solo" && classes.size > 1 && !localPlayerClass)
            }
          >
            {starting ? (hostParty ? "Opening room…" : "Starting…") : "Start game →"}
          </button>
          {classes.size === 0 ? (
            <p className="mt-2 font-serif text-fluid-xs italic text-inkMute">
              Select at least one class to start.
            </p>
          ) : mode === "solo" && classes.size > 1 && !localPlayerClass ? (
            <p className="mt-2 font-serif text-fluid-xs italic text-inkMute">
              Pick which class you&rsquo;ll play to start.
            </p>
          ) : null}
          {partyError ? (
            <p
              role="alert"
              className="mt-3 rounded-sharp border border-danger/40 bg-danger/15 px-4 py-2.5 font-serif text-fluid-xs italic text-danger"
            >
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
      <p className="poster-eyebrow mb-3">{label}</p>
      {children}
      {hint ? <p className="mt-2 font-serif text-fluid-xs italic text-inkMute">{hint}</p> : null}
    </div>
  );
}
