"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { localStorageAdapter } from "@/lib/store/persistence/localStorage";
import type { GameMeta, GameState } from "@/lib/types/game";

export function SavedGamesList() {
  const [metas, setMetas] = useState<GameMeta[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [sharedId, setSharedId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    const m = await localStorageAdapter.list();
    setMetas(m);
    setLoaded(true);
  }

  async function remove(id: string) {
    await localStorageAdapter.remove(id);
    setMetas((prev) => prev.filter((m) => m.id !== id));
  }

  async function shareGame(id: string) {
    const state = await localStorageAdapter.load(id);
    if (!state) return;
    const stripped = { ...state, history: [] };
    const json = JSON.stringify(stripped);
    const b64 = btoa(unescape(encodeURIComponent(json)));
    const url = `${window.location.origin}/play/import#${b64}`;
    try {
      await navigator.clipboard.writeText(url);
      setSharedId(id);
      setTimeout(() => setSharedId((cur) => (cur === id ? null : cur)), 1500);
    } catch {
      window.prompt("Copy this link to share the game:", url);
    }
  }

  async function exportGame(id: string) {
    const state = await localStorageAdapter.load(id);
    if (!state) return;
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName = state.meta.name.replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
    a.href = url;
    a.download = `praxis-${safeName}-r${state.meta.round}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleImport(file: File) {
    setImportError(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as GameState;
      if (
        !parsed?.meta?.id ||
        !parsed?.meta?.name ||
        typeof parsed?.meta?.round !== "number" ||
        !parsed?.classes
      ) {
        throw new Error("File doesn’t look like a Praxis save.");
      }
      await localStorageAdapter.save(parsed);
      await refresh();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Could not import file.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (!loaded) return null;
  return (
    <section>
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="editorial-eyebrow m-0">Saved games</p>
        <button
          type="button"
          className="btn text-xs"
          onClick={() => fileRef.current?.click()}
        >
          Import save
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleImport(f);
          }}
        />
      </div>

      {importError ? (
        <p className="mb-4 rounded-md border border-rose-700/30 bg-rose-950/20 px-4 py-3 font-serif text-sm italic text-rose-300">
          {importError}
        </p>
      ) : null}

      {metas.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-800/60 bg-slate-900/20 p-8 text-center">
          <p className="font-serif text-sm italic text-slate-500">
            No saved games yet — start one above, or import a save.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-800/40 overflow-hidden rounded-lg border border-slate-800/60 bg-slate-900/30">
          {metas.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-slate-900/50"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-serif text-base font-normal text-slate-100">
                  {m.name}
                </div>
                <div className="mt-1 truncate text-xs text-slate-500">
                  {m.mode === "solo" ? "Solo" : "Party"} · {m.playerCount} players · round{" "}
                  {m.round} · {new Date(m.updatedAt).toLocaleString()}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link href={`/play/${m.id}`} className="btn text-xs">
                  Open
                </Link>
                <button
                  type="button"
                  className="btn btn-ghost text-xs"
                  onClick={() => shareGame(m.id)}
                  title="Copy a share link to clipboard"
                >
                  {sharedId === m.id ? "Copied!" : "Share"}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost text-xs"
                  onClick={() => exportGame(m.id)}
                  title="Download save as JSON"
                >
                  Export
                </button>
                <button
                  type="button"
                  className="btn btn-ghost text-xs text-rose-400/80 hover:text-rose-300"
                  onClick={() => remove(m.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
