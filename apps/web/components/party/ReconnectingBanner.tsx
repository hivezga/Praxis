"use client";

import { useEffect, useState } from "react";

import { useParty } from "@/lib/store";

/**
 * Persistent warning banner shown to a peer while their transport is in
 * "reconnecting" or while the browser reports it's offline. Auto-dismisses on
 * reconnect — no banner is shown in solo or while everything is healthy.
 */
export function ReconnectingBanner() {
  const party = useParty();
  const [browserOffline, setBrowserOffline] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setBrowserOffline(!window.navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const peerReconnecting = party.role === "peer" && party.transport === "reconnecting";
  const peerOffline =
    party.role === "peer" && party.transport === "disconnected" && !party.hostLeavingPending;
  const offlineDuringParty = party.role !== null && browserOffline;

  if (!peerReconnecting && !peerOffline && !offlineDuringParty) return null;

  const label = peerReconnecting
    ? "Reconnecting to host…"
    : offlineDuringParty
      ? "You're offline — waiting for the network."
      : "Disconnected from host. Will keep trying in the background.";

  return (
    <div
      role="status"
      className="border-b border-warning/40 bg-warning/15 px-5 py-2 text-center"
    >
      <p className="font-display text-[11px] uppercase tracking-[0.2em] text-warning">
        {label}
      </p>
    </div>
  );
}
