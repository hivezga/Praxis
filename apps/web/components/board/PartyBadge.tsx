"use client";

import { useState } from "react";

import { useGame, useParty } from "@/lib/store";

export function PartyBadge() {
  const party = useParty();
  const stopHosting = useGame((s) => s.stopHosting);
  const leaveRoom = useGame((s) => s.leaveRoom);
  const [copied, setCopied] = useState(false);

  if (!party.role || !party.code) return null;

  const isHost = party.role === "host";

  async function copyCode() {
    if (!party.code) return;
    try {
      await navigator.clipboard.writeText(party.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be blocked — fall back to selecting silently.
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-amber-400/30 bg-amber-400/[0.05] px-3 py-1.5">
      <span className="font-serif text-[10px] uppercase italic tracking-[0.2em] text-amber-200/70">
        {isHost ? "Hosting" : "Joined"}
      </span>
      <button
        type="button"
        onClick={copyCode}
        className="font-mono text-sm tracking-[0.2em] text-amber-100 transition-colors hover:text-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
        title="Click to copy code"
      >
        {party.code}
      </button>
      {isHost ? (
        <span className="font-serif text-[10px] italic text-amber-200/60">
          {party.peerCount} {party.peerCount === 1 ? "peer" : "peers"}
        </span>
      ) : (
        <span
          className={`font-serif text-[10px] italic ${
            party.connected ? "text-emerald-300/70" : "text-rose-300/70"
          }`}
        >
          {party.connected ? "live" : "disconnected"}
        </span>
      )}
      {copied ? (
        <span className="font-serif text-[10px] italic text-amber-200/80">copied</span>
      ) : null}
      <button
        type="button"
        className="ml-1 rounded-md border border-slate-700/60 px-2 py-0.5 text-[10px] text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
        onClick={isHost ? stopHosting : leaveRoom}
      >
        Leave
      </button>
    </div>
  );
}
