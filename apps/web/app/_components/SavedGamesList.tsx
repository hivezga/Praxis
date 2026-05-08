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
      <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
        Saved games
      </h3>
      {metas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-6 text-center text-sm text-slate-600">
          No saved games yet. Start one above.
        </div>
      ) : (
        <ul className="divide-y divide-slate-800/60 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
          {metas.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-4 px-4 py-3.5">
              <div className="min-w-0">
                <div className="truncate font-medium text-slate-100">{m.name}</div>
                <div className="mt-0.5 truncate text-xs text-slate-500">
                  {m.mode === "solo" ? "Solo" : "Party"} · {m.playerCount}p · round{" "}
                  {m.round} · {new Date(m.updatedAt).toLocaleString()}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link href={`/play/${m.id}`} className="btn text-xs">
                  Open
                </Link>
                <button
                  type="button"
                  className="btn btn-ghost text-xs text-rose-400 hover:text-rose-300"
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
