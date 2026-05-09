"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
  isValidRoomCode,
  RoomHost,
  RoomPeer,
  type RoomHostStatus,
  type RoomPeerStatus,
} from "@praxis/party";

type Mode = "idle" | "hosting" | "joining";

export default function PartyTestPage() {
  const [mode, setMode] = useState<Mode>("idle");
  const [error, setError] = useState<string | null>(null);

  // Host state
  const hostRef = useRef<RoomHost | null>(null);
  const [hostStatus, setHostStatus] = useState<RoomHostStatus | null>(null);
  const [hostMessage, setHostMessage] = useState("hello from host");

  // Peer state
  const peerRef = useRef<RoomPeer | null>(null);
  const [peerStatus, setPeerStatus] = useState<RoomPeerStatus | null>(null);
  const [peerCode, setPeerCode] = useState("");
  const [peerLog, setPeerLog] = useState<string[]>([]);

  useEffect(() => {
    return () => {
      hostRef.current?.destroy();
      peerRef.current?.destroy();
    };
  }, []);

  async function startHost() {
    setError(null);
    try {
      const h = await RoomHost.create();
      hostRef.current = h;
      setMode("hosting");
      h.onStatus((s) => setHostStatus(s));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room.");
    }
  }

  function broadcast() {
    hostRef.current?.broadcastState({ msg: hostMessage, at: new Date().toISOString() });
  }

  function stopHost() {
    hostRef.current?.destroy();
    hostRef.current = null;
    setHostStatus(null);
    setMode("idle");
  }

  async function joinAsPeer() {
    setError(null);
    if (!isValidRoomCode(peerCode)) {
      setError("Code must be 6 alphanumeric characters (no 0/1/I/L/O).");
      return;
    }
    try {
      const p = await RoomPeer.join(peerCode);
      peerRef.current = p;
      setMode("joining");
      p.onStatus((s) => setPeerStatus(s));
      p.onMessage((msg) => {
        if (msg.type === "state" || msg.type === "full_state") {
          setPeerLog((prev) => [JSON.stringify(msg.payload), ...prev].slice(0, 10));
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join.");
    }
  }

  function leavePeer() {
    peerRef.current?.destroy();
    peerRef.current = null;
    setPeerStatus(null);
    setPeerLog([]);
    setMode("idle");
  }

  return (
    <main id="main" className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      <Link
        href="/"
        className="inline-flex min-h-tap items-center font-serif text-fluid-sm italic text-inkMute transition-colors hover:text-inkSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        ← Back to home
      </Link>

      <header className="mb-10 mt-6 border-b border-rule/40 pb-8">
        <p className="poster-eyebrow">Network spike</p>
        <h1 className="poster-h2 mt-3">Party mode lab</h1>
        <p className="mt-3 font-serif text-fluid-base italic leading-relaxed text-inkMute">
          A standalone test of the WebRTC layer before integrating into the game flow.
          Open this page in two browsers (or on two devices) and exchange messages.
        </p>
      </header>

      {error ? (
        <p
          role="alert"
          className="mb-6 rounded-sharp border border-danger/40 bg-danger/15 px-4 py-3 font-serif text-fluid-sm italic text-danger"
        >
          {error}
        </p>
      ) : null}

      {mode === "idle" ? (
        <div className="space-y-6">
          <section>
            <p className="poster-eyebrow mb-3">Create a room</p>
            <button type="button" className="btn btn-primary" onClick={startHost}>
              Start hosting
            </button>
          </section>

          <section>
            <p className="poster-eyebrow mb-3">Join a room</p>
            <div className="flex flex-wrap gap-2">
              <input
                className="input flex-1 font-mono uppercase"
                placeholder="ABC234"
                value={peerCode}
                onChange={(e) => setPeerCode(e.target.value.toUpperCase().slice(0, 6))}
                maxLength={6}
                aria-label="Room code"
              />
              <button type="button" className="btn" onClick={joinAsPeer}>
                Join
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {mode === "hosting" && hostStatus ? (
        <section className="space-y-5">
          <div>
            <p className="poster-eyebrow mb-2">Your room code</p>
            <p className="font-mono text-poster-lg font-light tracking-[0.25em] text-accentInk break-all">
              {hostStatus.code}
            </p>
            <p className="mt-2 font-serif text-fluid-sm italic text-inkMute">
              {hostStatus.peerCount === 0
                ? "Waiting for peers to connect…"
                : `${hostStatus.peerCount} peer${hostStatus.peerCount === 1 ? "" : "s"} connected.`}
            </p>
          </div>

          <div>
            <p className="poster-eyebrow mb-2">Broadcast a test message</p>
            <div className="flex flex-wrap gap-2">
              <input
                className="input flex-1"
                value={hostMessage}
                onChange={(e) => setHostMessage(e.target.value)}
                aria-label="Test message"
              />
              <button type="button" className="btn btn-primary" onClick={broadcast}>
                Broadcast
              </button>
            </div>
          </div>

          <button type="button" className="btn btn-danger" onClick={stopHost}>
            Stop hosting
          </button>
        </section>
      ) : null}

      {mode === "joining" && peerStatus ? (
        <section className="space-y-5">
          <div>
            <p className="poster-eyebrow mb-2">Connected to room</p>
            <p className="font-mono text-poster-md font-light tracking-[0.2em] text-accentInk break-all">
              {peerStatus.code}
            </p>
            <p className="mt-2 font-serif text-fluid-sm italic text-inkMute">
              {peerStatus.state === "connected"
                ? "Connected."
                : peerStatus.state === "reconnecting"
                  ? `Reconnecting (attempt ${peerStatus.attempts})…`
                  : peerStatus.state === "disconnected"
                    ? "Disconnected."
                    : "Connecting…"}
            </p>
          </div>

          <div>
            <p className="poster-eyebrow mb-2">Received broadcasts</p>
            {peerLog.length === 0 ? (
              <p className="font-serif text-fluid-sm italic text-inkMute">
                No messages yet — host can broadcast above.
              </p>
            ) : (
              <ul className="divide-y divide-rule/40 overflow-hidden rounded-sharp border border-rule/60 bg-paper/30">
                {peerLog.map((m, i) => (
                  <li key={i} className="break-all px-3 py-2 font-mono text-fluid-sm text-inkSoft">
                    {m}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button type="button" className="btn btn-danger" onClick={leavePeer}>
            Leave room
          </button>
        </section>
      ) : null}
    </main>
  );
}
