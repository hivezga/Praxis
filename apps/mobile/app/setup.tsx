import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { engine } from "@/lib/engine";
import { asyncStorageAdapter } from "@/lib/persistence/asyncStorage";
import { useGame } from "@/lib/store";
import type { ClassId, ExpansionFlags, GameMode } from "@/lib/types/game";

const DEFAULT_EXPANSIONS: ExpansionFlags = {
  crisisAndControl: false,
  modules: { automa: false, crisisCards: false, alternativeEvents: false, hiddenAgendas: false, newActionCards: false },
};

const ALL_CLASSES: ClassId[] = ["working", "middle", "capitalist", "state"];

const CLASS_META: Record<ClassId, { label: string; desc: string; activeStyle: string; textStyle: string }> = {
  working:    { label: "Working Class",    desc: "Labor, unions & welfare", activeStyle: "border-working/60 bg-working/10",    textStyle: "text-working" },
  middle:     { label: "Middle Class",     desc: "Companies & savings",     activeStyle: "border-middle/60 bg-middle/10",     textStyle: "text-middle" },
  capitalist: { label: "Capitalist Class", desc: "Capital & revenue",       activeStyle: "border-capitalist/60 bg-capitalist/10", textStyle: "text-capitalist" },
  state:      { label: "The State",        desc: "Treasury & legitimacy",   activeStyle: "border-state/60 bg-state/10",      textStyle: "text-state" },
};

const MODULE_LABELS: Record<keyof ExpansionFlags["modules"], string> = {
  automa:            "Automa (solo opponent)",
  crisisCards:       "Crisis cards",
  alternativeEvents: "Alternative events",
  hiddenAgendas:     "Hidden agendas",
  newActionCards:    "New action cards",
};

export default function SetupScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const initialMode: GameMode = params.mode === "solo" ? "solo" : "party";

  const [mode, setMode] = useState<GameMode>(initialMode);
  const [name, setName] = useState("");
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(4);
  const [classes, setClasses] = useState<Set<ClassId>>(new Set(ALL_CLASSES));
  const [expansions, setExpansions] = useState<ExpansionFlags>(DEFAULT_EXPANSIONS);

  const hydrate = useGame((s) => s.hydrate);

  function toggleClass(c: ClassId) {
    const next = new Set(classes);
    if (next.has(c)) next.delete(c);
    else next.add(c);
    setClasses(next);
  }

  function setExp<K extends keyof ExpansionFlags["modules"]>(key: K, value: boolean) {
    setExpansions((prev) => ({ ...prev, modules: { ...prev.modules, [key]: value } }));
  }

  async function start() {
    const state = engine.createStartingState({
      name: name || undefined,
      mode,
      playerCount,
      classesInPlay: Array.from(classes),
      expansions,
    });
    await asyncStorageAdapter.save(state);
    hydrate(state);
    router.replace("/game");
  }

  return (
    <ScrollView className="flex-1 bg-slate-950" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View className="gap-6">
        {/* Game name */}
        <View>
          <Text className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Game name</Text>
          <TextInput
            placeholder="Tuesday night at Sam's"
            placeholderTextColor="#475569"
            value={name}
            onChangeText={setName}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200"
          />
        </View>

        {/* Mode */}
        <View>
          <Text className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Mode</Text>
          <View className="flex-row gap-3">
            {(["party", "solo"] as GameMode[]).map((m) => (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                className={`flex-1 rounded-xl border p-4 ${mode === m ? "border-indigo-500/60 bg-indigo-600/15" : "border-slate-700 bg-slate-900/60"}`}
              >
                <Text className={`font-medium capitalize ${mode === m ? "text-slate-100" : "text-slate-400"}`}>
                  {m === "party" ? "Party" : "Solo"}
                </Text>
                <Text className="mt-0.5 text-xs text-slate-500">
                  {m === "party" ? "One screen, 2–4 players" : "One player + automa"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Player count */}
        <View>
          <Text className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Player count</Text>
          <View className="flex-row gap-2">
            {([2, 3, 4] as const).map((n) => (
              <Pressable
                key={n}
                onPress={() => setPlayerCount(n)}
                className={`rounded-lg border px-4 py-2 ${playerCount === n ? "border-indigo-600 bg-indigo-600" : "border-slate-700 bg-slate-800"}`}
              >
                <Text className={`text-sm font-medium ${playerCount === n ? "text-white" : "text-slate-400"}`}>
                  {n} players
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Classes */}
        <View>
          <Text className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Classes in play</Text>
          <View className="flex-row flex-wrap gap-2">
            {ALL_CLASSES.map((c) => {
              const active = classes.has(c);
              const meta = CLASS_META[c];
              return (
                <Pressable
                  key={c}
                  onPress={() => toggleClass(c)}
                  className={`w-[48%] rounded-xl border p-3 ${active ? meta.activeStyle : "border-slate-700 bg-slate-900/60"}`}
                >
                  <Text className={`text-sm font-medium ${active ? meta.textStyle : "text-slate-400"}`}>
                    {meta.label}
                  </Text>
                  <Text className={`mt-0.5 text-[10px] ${active ? "opacity-70 text-slate-300" : "text-slate-600"}`}>
                    {meta.desc}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Expansion */}
        <View>
          <Text className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Expansion: Crisis &amp; Control
          </Text>
          <Pressable
            onPress={() => setExpansions((p) => ({ ...p, crisisAndControl: !p.crisisAndControl }))}
            className="flex-row items-center gap-2.5 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5"
          >
            <View className={`h-5 w-5 items-center justify-center rounded border ${expansions.crisisAndControl ? "border-indigo-500 bg-indigo-600" : "border-slate-600 bg-slate-800"}`}>
              {expansions.crisisAndControl ? <Text className="text-xs text-white font-bold">✓</Text> : null}
            </View>
            <Text className="text-sm text-slate-300">Enable Crisis &amp; Control</Text>
          </Pressable>
          {expansions.crisisAndControl ? (
            <View className="mt-2 gap-1.5">
              {(Object.keys(expansions.modules) as (keyof ExpansionFlags["modules"])[]).map((k) => (
                <Pressable
                  key={k}
                  onPress={() => setExp(k, !expansions.modules[k])}
                  className="flex-row items-center gap-2.5 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2"
                >
                  <View className={`h-4 w-4 items-center justify-center rounded border ${expansions.modules[k] ? "border-indigo-500 bg-indigo-600" : "border-slate-600 bg-slate-800"}`}>
                    {expansions.modules[k] ? <Text className="text-[10px] text-white font-bold">✓</Text> : null}
                  </View>
                  <Text className="text-xs text-slate-300">{MODULE_LABELS[k]}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        {/* CTA */}
        <View className="pt-2">
          <Pressable
            onPress={start}
            disabled={classes.size === 0}
            className={`rounded-xl bg-indigo-600 px-6 py-3.5 items-center ${classes.size === 0 ? "opacity-40" : ""}`}
          >
            <Text className="text-base font-semibold text-white">Start game →</Text>
          </Pressable>
          {classes.size === 0 ? (
            <Text className="mt-2 text-center text-xs text-slate-600">Select at least one class to start.</Text>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}
