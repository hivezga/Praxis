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
      <p className="editorial-eyebrow mb-6">Saved games</p>
      {metas.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-800/60 bg-slate-900/20 p-8 text-center">
          <p className="font-serif text-sm italic text-slate-500">
            No saved games yet — start one above.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-800/40 overflow-hidden rounded-lg border border-slate-800/60 bg-slate-900/30">
          {metas.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-slate-900/50"
            >
              <div className="min-w-0">
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
