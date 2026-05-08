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
      p.onState((payload) => {
        setPeerLog((prev) => [JSON.stringify(payload), ...prev].slice(0, 10));
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
    <main id="main" className="mx-auto max-w-2xl px-6 py-16">
      <Link
        href="/"
        className="font-serif text-xs italic text-slate-500 transition-colors hover:text-slate-300"
      >
        ← Back to home
      </Link>

      <header className="mb-10 mt-6 border-b border-slate-800/40 pb-8">
        <p className="editorial-eyebrow">Network spike</p>
        <h1 className="editorial-h2 mt-3">Party mode lab</h1>
        <p className="mt-3 font-serif text-sm italic leading-relaxed text-slate-500">
          A standalone test of the WebRTC layer before integrating into the game flow.
          Open this page in two browsers (or on two devices) and exchange messages.
        </p>
      </header>

      {error ? (
        <p className="mb-6 rounded-md border border-rose-700/30 bg-rose-950/20 px-4 py-3 font-serif text-sm italic text-rose-300">
          {error}
        </p>
      ) : null}

      {mode === "idle" ? (
        <div className="space-y-6">
          <section>
            <p className="editorial-eyebrow mb-3">Create a room</p>
            <button type="button" className="btn btn-primary" onClick={startHost}>
              Start hosting
            </button>
          </section>

          <section>
            <p className="editorial-eyebrow mb-3">Join a room</p>
            <div className="flex gap-2">
              <input
                className="input font-mono uppercase"
                placeholder="ABC234"
                value={peerCode}
                onChange={(e) => setPeerCode(e.target.value.toUpperCase().slice(0, 6))}
                maxLength={6}
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
            <p className="editorial-eyebrow mb-2">Your room code</p>
            <p className="font-mono text-5xl font-light tracking-[0.3em] text-amber-200">
              {hostStatus.code}
            </p>
            <p className="mt-2 font-serif text-sm italic text-slate-500">
              {hostStatus.peerCount === 0
                ? "Waiting for peers to connect…"
                : `${hostStatus.peerCount} peer${hostStatus.peerCount === 1 ? "" : "s"} connected.`}
            </p>
          </div>

          <div>
            <p className="editorial-eyebrow mb-2">Broadcast a test message</p>
            <div className="flex gap-2">
              <input
                className="input"
                value={hostMessage}
                onChange={(e) => setHostMessage(e.target.value)}
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
            <p className="editorial-eyebrow mb-2">Connected to room</p>
            <p className="font-mono text-3xl font-light tracking-[0.2em] text-amber-200">
              {peerStatus.code}
            </p>
            <p className="mt-2 font-serif text-sm italic text-slate-500">
              {peerStatus.connected ? "Connected." : "Disconnected."}
            </p>
          </div>

          <div>
            <p className="editorial-eyebrow mb-2">Received broadcasts</p>
            {peerLog.length === 0 ? (
              <p className="font-serif text-sm italic text-slate-500">
                No messages yet — host can broadcast above.
              </p>
            ) : (
              <ul className="divide-y divide-slate-800/40 overflow-hidden rounded-md border border-slate-800/60 bg-slate-950/30">
                {peerLog.map((m, i) => (
                  <li key={i} className="px-3 py-2 font-mono text-xs text-slate-300">
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
