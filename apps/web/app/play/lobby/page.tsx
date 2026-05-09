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
  // A faction is "other-taken" if any player whose seat isn't yours holds it.
  // Host owns the lobby record so can identify itself by isHost; peers approximate
  // by treating "anyone whose faction differs from my local pick" as other.
  const otherFactions = new Set(
    players
      .filter((p) => p.faction)
      .filter((p) => (isHost ? !p.isHost : p.faction !== selfFaction))
      .map((p) => p.faction as ClassId),
  );

  const canStart = players.length >= 2 && players.every((p) => p.faction !== null);

  return (
    <main id="main" className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="font-serif text-xs italic text-inkMute hover:text-inkSoft">
          ← Back to home
        </Link>
        <button
          type="button"
          className="btn btn-ghost text-xs"
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
        <p className="editorial-eyebrow">{isHost ? "You're hosting" : "You've joined"}</p>
        <h1 className="editorial-h2 mt-3">Lobby</h1>
        <p className="mt-3 font-serif text-sm italic leading-relaxed text-inkMute">
          {isHost
            ? "Share the code, pick your faction, and start once everyone is in."
            : "Pick your faction. The game will begin once the host starts it."}
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        {isHost && party.code ? (
          <RoomCodeCard code={party.code} joinUrl={joinUrl} />
        ) : (
          <div className="rounded-lg border border-rule/60 bg-surface/40 p-6">
            <p className="editorial-eyebrow">Connected to</p>
            <p className="mt-3 font-mono text-3xl tracking-[0.35em] text-accentInk">{party.code}</p>
            <p className="mt-2 font-serif text-xs italic text-inkMute">
              Live: {party.connected ? "yes" : party.transport ?? "no"}
            </p>
          </div>
        )}

        <div className="rounded-lg border border-rule/60 bg-surface/40 p-6">
          <p className="editorial-eyebrow">Players ({players.length})</p>
          <ul className="mt-4 space-y-2">
            {players.map((p) => (
              <li
                key={p.peerId}
                className="flex items-center justify-between rounded-md border border-rule/40 bg-paper/30 px-3 py-2"
              >
                <span className="font-serif text-sm text-ink">
                  {p.name?.trim() || (p.isHost ? "Host" : "Player")}{" "}
                  <span className="font-mono text-[10px] text-inkMute">
                    {p.peerId.slice(-6)}
                  </span>
                </span>
                <span className="font-serif text-xs italic text-inkMute">
                  {p.faction ? CLASS_LABEL[p.faction as ClassId] : "Choosing…"}
                </span>
              </li>
            ))}
            {players.length === 0 ? (
              <li className="font-serif text-xs italic text-inkMute">No one connected yet.</li>
            ) : null}
          </ul>
        </div>
      </div>

      <section className="mt-10 rounded-lg border border-rule/60 bg-surface/40 p-6">
        <p className="editorial-eyebrow">Your nickname</p>
        <input
          className="input mt-3"
          placeholder={isHost ? "Host" : "Player"}
          value={nicknameDraft}
          maxLength={24}
          onChange={(e) => setNicknameDraft(e.target.value)}
          onBlur={() => {
            if (nicknameDraft !== localNickname) setNickname(nicknameDraft);
          }}
        />
        <p className="mt-2 font-serif text-xs italic text-inkMute">
          Shown to other players in the lobby and alongside your class label during play.
        </p>
      </section>

      <section className="mt-10 rounded-lg border border-rule/60 bg-surface/40 p-6">
        <p className="editorial-eyebrow">Pick your faction</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                className={`rounded-lg border px-3 py-3 text-left font-serif text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
                  active
                    ? "border-accent/40 bg-accent/15 text-accentInk"
                    : conflict
                      ? "border-rule/40 bg-surface/20 text-inkMute opacity-50"
                      : "border-rule/60 bg-paper/40 text-inkSoft hover:border-rule"
                }`}
              >
                <div className="font-serif text-sm">{CLASS_LABEL[c]}</div>
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
            className="btn btn-primary px-6 py-3 font-serif text-base"
            onClick={() => startGame()}
            disabled={!canStart}
          >
            Start game →
          </button>
          {!canStart ? (
            <p className="mt-2 font-serif text-xs italic text-inkMute">
              Need at least two players, and every seat must pick a faction.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-10 border-t border-rule/40 pt-6">
          <p className="font-serif text-sm italic text-inkMute">
            Waiting for the host to start the game…
          </p>
        </div>
      )}
    </main>
  );
}
