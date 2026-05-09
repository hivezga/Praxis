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
  const peerColor =
    party.transport === "connected"
      ? "text-positive"
      : party.transport === "reconnecting"
        ? "text-warning"
        : "text-danger";

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
    <div className="flex flex-wrap items-center gap-2 rounded-sharp border border-accent/40 bg-accent/[0.08] px-3 py-1.5">
      <span className="font-display text-[10px] uppercase tracking-[0.2em] text-accentInk/80">
        {isHost ? "Hosting" : "Joined"}
      </span>
      <button
        type="button"
        onClick={copyCode}
        className="min-h-tap min-w-tap rounded-sharp px-2 font-mono text-fluid-base tracking-[0.2em] text-accentInk transition-colors hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        title="Click to copy code"
        aria-label={`Room code ${party.code}, click to copy`}
      >
        {party.code}
      </button>
      {isHost ? (
        <span className="font-serif text-[11px] italic text-accentInk/70">
          {party.peerCount} {party.peerCount === 1 ? "peer" : "peers"}
        </span>
      ) : (
        <span className={`font-display text-[10px] uppercase tracking-wider ${peerColor}`}>
          {peerLabel}
        </span>
      )}
      {copied ? (
        <span className="font-serif text-[11px] italic text-accentInk/80" role="status">
          copied
        </span>
      ) : null}
      {isHost ? (
        <button
          type="button"
          onClick={share}
          className="min-h-tap rounded-sharp border border-accent/50 px-3 py-1 font-display text-[10px] uppercase tracking-wider text-accentInk transition-colors hover:border-accent hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          {canShare ? "Share" : "Copy link"}
        </button>
      ) : null}
      <button
        type="button"
        className="min-h-tap rounded-sharp border border-rule/60 px-3 py-1 font-display text-[10px] uppercase tracking-wider text-inkSoft transition-colors hover:border-rule hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        onClick={isHost ? stopHosting : leaveRoom}
      >
        Leave
      </button>
    </div>
  );
}
