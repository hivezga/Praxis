"use client";

import { useEffect, useMemo, useState } from "react";

import { useGame, useParty } from "@/lib/store";

export function PartyBadge() {
  const party = useParty();
  const stopHosting = useGame((s) => s.stopHosting);
  const leaveRoom = useGame((s) => s.leaveRoom);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const joinUrl = useMemo(
    () => (party.code && origin ? `${origin}/play/join?code=${party.code}` : ""),
    [origin, party.code],
  );

  if (!party.role || !party.code) return null;

  const isHost = party.role === "host";
  const peerLabel =
    party.transport === "reconnecting"
      ? "reconnecting…"
      : party.transport === "disconnected"
        ? "offline"
        : party.connected
          ? "live"
          : "offline";

  async function copyCode() {
    if (!party.code) return;
    try {
      await navigator.clipboard.writeText(party.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be blocked */
    }
  }

  async function share() {
    if (!joinUrl) return;
    if (canShare) {
      try {
        await navigator.share({
          title: "Praxis party room",
          text: `Join my Hegemony game — code ${party.code}`,
          url: joinUrl,
        });
        return;
      } catch {
        /* fall through to clipboard fallback */
      }
    }
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be blocked */
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-accent/30 bg-accent/[0.05] px-3 py-1.5">
      <span className="font-serif text-[10px] uppercase italic tracking-[0.2em] text-accentInk/70">
        {isHost ? "Hosting" : "Joined"}
      </span>
      <button
        type="button"
        onClick={copyCode}
        className="font-mono text-sm tracking-[0.2em] text-accentInk transition-colors hover:text-accentInk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        title="Click to copy code"
      >
        {party.code}
      </button>
      {isHost ? (
        <span className="font-serif text-[10px] italic text-accentInk/60">
          {party.peerCount} {party.peerCount === 1 ? "peer" : "peers"}
        </span>
      ) : (
        <span
          className={`font-serif text-[10px] italic ${
            party.transport === "connected"
              ? "text-emerald-300/70"
              : party.transport === "reconnecting"
                ? "text-amber-300/80"
                : "text-danger/70"
          }`}
        >
          {peerLabel}
        </span>
      )}
      {copied ? (
        <span className="font-serif text-[10px] italic text-accentInk/80">copied</span>
      ) : null}
      {isHost ? (
        <button
          type="button"
          onClick={share}
          className="ml-1 rounded-md border border-accent/40 px-2 py-0.5 text-[10px] text-accentInk transition-colors hover:border-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          {canShare ? "Share" : "Copy link"}
        </button>
      ) : null}
      <button
        type="button"
        className="ml-1 rounded-md border border-rule/60 px-2 py-0.5 text-[10px] text-inkSoft transition-colors hover:border-rule hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        onClick={isHost ? stopHosting : leaveRoom}
      >
        Leave
      </button>
    </div>
  );
}
