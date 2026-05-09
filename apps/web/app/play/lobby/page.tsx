"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { RoomCodeCard } from "@/components/party/RoomCodeCard";
import { useGame, useGameState, useLocalNickname, useParty } from "@/lib/store";
import type { ClassId } from "@/lib/types/game";

const ALL_CLASSES: ClassId[] = ["working", "middle", "capitalist", "state"];
const CLASS_LABEL: Record<ClassId, string> = {
  working: "Working Class",
  middle: "Middle Class",
  capitalist: "Capitalist",
  state: "The State",
};
const CLASS_TINT: Record<ClassId, string> = {
  working:    "border-working-deep bg-working-deep text-working-ink",
  middle:     "border-middle-deep bg-middle-deep text-middle-ink",
  capitalist: "border-capitalist-deep bg-capitalist-deep text-capitalist-ink",
  state:      "border-state-deep bg-state-deep text-state-ink",
};

export default function LobbyPage() {
  const router = useRouter();
  const party = useParty();
  const state = useGameState();
  const selectFaction = useGame((s) => s.selectFaction);
  const setNickname = useGame((s) => s.setNickname);
  const startGame = useGame((s) => s.startGame);
  const stopHosting = useGame((s) => s.stopHosting);
  const leaveRoom = useGame((s) => s.leaveRoom);
  const localNickname = useLocalNickname();
  const [nicknameDraft, setNicknameDraft] = useState(localNickname);
  useEffect(() => {
    setNicknameDraft(localNickname);
  }, [localNickname]);

  const [origin, setOrigin] = useState<string>("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const joinUrl = useMemo(() => {
    if (!party.code) return "";
    const base = origin || "";
    return `${base}/play/join?code=${party.code}`;
  }, [origin, party.code]);

  // No room → bounce home.
  useEffect(() => {
    if (!party.role) {
      router.replace("/");
    }
  }, [party.role, router]);

  // Game has started → leave the lobby for the live screens.
  useEffect(() => {
    if (party.gameStarted) {
      if (party.role === "host" && state) {
        router.replace(`/play/${state.meta.id}`);
      } else if (party.role === "peer") {
        router.replace("/play/room");
      }
    }
  }, [party.gameStarted, party.role, router, state]);

  if (!party.role) return null;

  const lobby = party.lobby;
  const players = lobby?.players ?? [];
  const selfFaction = party.localFaction;
  const isHost = party.role === "host";
  const allowedClasses = state?.meta.classesInPlay ?? ALL_CLASSES;
  const otherFactions = new Set(
    players
      .filter((p) => p.faction)
      .filter((p) => (isHost ? !p.isHost : p.faction !== selfFaction))
      .map((p) => p.faction as ClassId),
  );

  const canStart = players.length >= 2 && players.every((p) => p.faction !== null);

  return (
    <main id="main" className="mx-auto max-w-3xl px-5 py-10 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex min-h-tap items-center font-serif text-fluid-sm italic text-inkMute hover:text-inkSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          ← Back to home
        </Link>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            if (isHost) stopHosting();
            else leaveRoom();
            router.replace("/");
          }}
        >
          {isHost ? "Cancel room" : "Leave room"}
        </button>
      </div>

      <header className="mb-10 mt-4 border-b border-rule/40 pb-8">
        <p className="poster-eyebrow">{isHost ? "You're hosting" : "You've joined"}</p>
        <h1 className="poster-h2 mt-3">Lobby</h1>
        <p className="mt-3 font-serif text-fluid-sm italic leading-relaxed text-inkMute">
          {isHost
            ? "Share the code, pick your faction, and start once everyone is in."
            : "Pick your faction. The game will begin once the host starts it."}
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 md:gap-8">
        {isHost && party.code ? (
          <RoomCodeCard code={party.code} joinUrl={joinUrl} />
        ) : (
          <div className="rounded-md border border-rule/60 bg-surface/40 p-5 sm:p-6">
            <p className="poster-eyebrow">Connected to</p>
            <p className="mt-3 break-all font-mono text-poster-md tracking-[0.25em] text-accentInk">
              {party.code}
            </p>
            <p className="mt-2 font-serif text-fluid-xs italic text-inkMute">
              Live: {party.connected ? "yes" : party.transport ?? "no"}
            </p>
          </div>
        )}

        <div className="rounded-md border border-rule/60 bg-surface/40 p-5 sm:p-6">
          <p className="poster-eyebrow">Players ({players.length})</p>
          <ul className="mt-4 space-y-2">
            {players.map((p) => (
              <li
                key={p.peerId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-sharp border border-rule/40 bg-paper/30 px-3 py-2"
              >
                <span className="min-w-0 font-serif text-fluid-sm text-ink">
                  {p.name?.trim() || (p.isHost ? "Host" : "Player")}{" "}
                  <span className="font-mono text-[10px] text-inkMute">
                    {p.peerId.slice(-6)}
                  </span>
                </span>
                <span className="font-serif text-fluid-xs italic text-inkMute">
                  {p.faction ? CLASS_LABEL[p.faction as ClassId] : "Choosing…"}
                </span>
              </li>
            ))}
            {players.length === 0 ? (
              <li className="font-serif text-fluid-xs italic text-inkMute">
                No one connected yet.
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <section className="mt-10 rounded-md border border-rule/60 bg-surface/40 p-5 sm:p-6">
        <p className="poster-eyebrow">Your nickname</p>
        <input
          className="input mt-3"
          placeholder={isHost ? "Host" : "Player"}
          value={nicknameDraft}
          maxLength={24}
          aria-label="Your nickname"
          onChange={(e) => setNicknameDraft(e.target.value)}
          onBlur={() => {
            if (nicknameDraft !== localNickname) setNickname(nicknameDraft);
          }}
        />
        <p className="mt-2 font-serif text-fluid-xs italic text-inkMute">
          Shown to other players in the lobby and alongside your class label during play.
        </p>
      </section>

      <section className="mt-10 rounded-md border border-rule/60 bg-surface/40 p-5 sm:p-6">
        <p className="poster-eyebrow">Pick your faction</p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {allowedClasses.map((c) => {
            const active = selfFaction === c;
            const conflict = !active && otherFactions.has(c);
            return (
              <button
                key={c}
                type="button"
                aria-pressed={active}
                onClick={() => selectFaction(active ? null : c)}
                disabled={conflict}
                className={`min-h-tap rounded-sharp border-2 px-3 py-3 text-left font-display text-fluid-sm uppercase tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${
                  active
                    ? CLASS_TINT[c]
                    : conflict
                      ? "border-rule/40 bg-surface/20 text-inkMute opacity-50"
                      : "border-rule/60 bg-paper/40 text-inkSoft hover:border-rule"
                }`}
              >
                <div>{CLASS_LABEL[c]}</div>
                {conflict ? (
                  <div className="mt-1 font-serif text-[11px] italic text-inkMute">Taken</div>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      {isHost ? (
        <div className="mt-10 border-t border-rule/40 pt-6">
          <button
            type="button"
            className="btn btn-poster px-6 py-3 font-display text-fluid-base"
            onClick={() => startGame()}
            disabled={!canStart}
          >
            Start game →
          </button>
          {!canStart ? (
            <p className="mt-2 font-serif text-fluid-xs italic text-inkMute">
              Need at least two players, and every seat must pick a faction.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-10 border-t border-rule/40 pt-6">
          <p className="font-serif text-fluid-sm italic text-inkMute">
            Waiting for the host to start the game…
          </p>
        </div>
      )}
    </main>
  );
}
