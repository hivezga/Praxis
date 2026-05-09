import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { asyncStorageAdapter } from "@/lib/persistence/asyncStorage";
import { useGame } from "@/lib/store";
import type { GameMeta } from "@/lib/types/game";

export default function HomeScreen() {
  const [metas, setMetas] = useState<GameMeta[]>([]);
  const [loaded, setLoaded] = useState(false);
  const load = useGame((s) => s.load);

  useEffect(() => {
    void asyncStorageAdapter.list().then((m) => {
      setMetas(m);
      setLoaded(true);
    });
  }, []);

  async function remove(id: string) {
    await asyncStorageAdapter.remove(id);
    setMetas((prev) => prev.filter((m) => m.id !== id));
  }

  async function openGame(id: string) {
    await load(id);
    router.push("/game");
  }

  return (
    <ScrollView className="flex-1 bg-slate-950" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Hero */}
      <View className="mb-10">
        <Text className="text-4xl font-light tracking-tight text-slate-100">Praxis</Text>
        <Text className="mt-2 text-sm leading-relaxed text-slate-400">
          Companion tracker for{" "}
          <Text className="text-slate-300">Hegemony: Lead Your Class to Victory</Text>
        </Text>
        <Text className="mt-1 text-xs text-slate-600">Unofficial fan project</Text>
      </View>

      {/* Mode cards */}
      <View className="mb-8 gap-3">
        <Pressable
          onPress={() => router.push({ pathname: "/setup", params: { mode: "party" } })}
          className="rounded-xl border border-slate-700 bg-slate-900 p-5"
        >
          <Text className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-indigo-400">
            Party mode
          </Text>
          <Text className="text-xl font-semibold text-slate-100">Around one screen</Text>
          <Text className="mt-1.5 text-sm leading-relaxed text-slate-400">
            2–4 players share a tablet or phone.
          </Text>
          <View className="mt-4 flex-row gap-1.5">
            <View className="h-1 flex-1 rounded-full bg-working/50" />
            <View className="h-1 flex-1 rounded-full bg-middle/50" />
            <View className="h-1 flex-1 rounded-full bg-capitalist/50" />
            <View className="h-1 flex-1 rounded-full bg-state/50" />
          </View>
        </Pressable>

        <Pressable
          onPress={() => router.push({ pathname: "/setup", params: { mode: "solo" } })}
          className="rounded-xl border border-slate-700 bg-slate-900 p-5"
        >
          <Text className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-indigo-400">
            Solo mode
          </Text>
          <Text className="text-xl font-semibold text-slate-100">Just me + automa</Text>
          <Text className="mt-1.5 text-sm leading-relaxed text-slate-400">
            Track your class plus simplified automa. Crisis &amp; Control supported.
          </Text>
        </Pressable>
      </View>

      {/* Saved games */}
      {loaded && (
        <View>
          <Text className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Saved games
          </Text>
          {metas.length === 0 ? (
            <View className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-6">
              <Text className="text-center text-sm text-slate-600">No saved games yet.</Text>
            </View>
          ) : (
            <View className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
              {metas.map((m, i) => (
                <View
                  key={m.id}
                  className={`flex-row items-center justify-between gap-3 px-4 py-3.5 ${i > 0 ? "border-t border-slate-800/60" : ""}`}
                >
                  <View className="flex-1 min-w-0">
                    <Text className="font-medium text-slate-100" numberOfLines={1}>{m.name}</Text>
                    <Text className="mt-0.5 text-xs text-slate-500" numberOfLines={1}>
                      {m.mode === "solo" ? "Solo" : "Party"} · {m.playerCount}p · round {m.round} · {new Date(m.updatedAt).toLocaleString()}
                    </Text>
                  </View>
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => openGame(m.id)}
                      className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5"
                    >
                      <Text className="text-xs font-medium text-slate-200">Open</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => remove(m.id)}
                      className="rounded-lg border border-rose-800/40 bg-rose-900/20 px-3 py-1.5"
                    >
                      <Text className="text-xs font-medium text-rose-400">Delete</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Footer */}
      <View className="mt-10 border-t border-slate-800/60 pt-5">
        <Pressable onPress={() => router.push("/rules")}>
          <Text className="text-sm text-slate-500">Quick rules reference →</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
