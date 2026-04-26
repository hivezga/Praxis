"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { localStorageAdapter } from "@/lib/store/persistence/localStorage";
import type { GameMeta } from "@/lib/types/game";

export function SavedGamesList() {
  const [metas, setMetas] = useState<GameMeta[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void localStorageAdapter.list().then((m) => {
      setMetas(m);
      setLoaded(true);
    });
  }, []);

  async function remove(id: string) {
    await localStorageAdapter.remove(id);
    setMetas((prev) => prev.filter((m) => m.id !== id));
  }

  if (!loaded) return null;
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Saved games</h3>
      {metas.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-4 text-sm text-slate-500">
          No saved games yet. Start one above.
        </p>
      ) : (
        <ul className="divide-y divide-slate-800 overflow-hidden rounded-lg border border-slate-800 bg-slate-900/60">
          {metas.map((m) => (
            <li key={m.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="font-medium text-slate-100">{m.name}</div>
                <div className="text-xs text-slate-500">
                  {m.mode === "solo" ? "Solo" : "Party"} · {m.playerCount} players · round {m.round} · last played{" "}
                  {new Date(m.updatedAt).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/play/${m.id}`} className="btn">
                  Open
                </Link>
                <button type="button" className="btn btn-ghost text-xs text-rose-300" onClick={() => remove(m.id)}>
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
