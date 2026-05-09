import { Text, TextInput, View } from "react-native";
import { ClassPanelShell } from "./ClassPanelShell";
import { Counter } from "@/components/shared/Counter";
import { StorageGrid } from "./StorageGrid";
import { useGame, useGameState } from "@/lib/store";
import type { Good } from "@/lib/types/game";

export function MiddlePanel() {
  const state = useGameState();
  const adjust = useGame((s) => s.adjustClassNumber);
  const setVal = useGame((s) => s.setClassNumber);
  const setText = useGame((s) => s.setClassString);
  const apply = useGame((s) => s.apply);
  if (!state) return null;
  const m = state.classes.middle;
  return (
    <ClassPanelShell classId="middle">
      <View className="flex-row flex-wrap gap-2">
        <View className="w-[48%]"><Counter label="Money"           value={m.money}                    onAdjust={(d) => adjust("middle", "money", d)}                    onSet={(v) => setVal("middle", "money", v)} /></View>
        <View className="w-[48%]"><Counter label="Capital"         value={m.capital}                  onAdjust={(d) => adjust("middle", "capital", d)}                  onSet={(v) => setVal("middle", "capital", v)} /></View>
        <View className="w-[48%]"><Counter label="Savings"         value={m.savings}                  onAdjust={(d) => adjust("middle", "savings", d)}                  onSet={(v) => setVal("middle", "savings", v)} /></View>
        <View className="w-[48%]"><Counter label="VP track"        value={m.vp}                       onAdjust={(d) => adjust("middle", "vp", d)}                       onSet={(v) => setVal("middle", "vp", v)} /></View>
        <View className="w-[48%]"><Counter label="Prosperity"      value={m.prosperity}               onAdjust={(d) => adjust("middle", "prosperity", d)}               onSet={(v) => setVal("middle", "prosperity", v)} /></View>
        <View className="w-[48%]"><Counter label="Population"      value={m.population}               onAdjust={(d) => adjust("middle", "population", d)}               onSet={(v) => setVal("middle", "population", v)} /></View>
        <View className="w-[48%]"><Counter label="Unemployed"      value={m.unemployedWorkers}        onAdjust={(d) => adjust("middle", "unemployedWorkers", d)}        onSet={(v) => setVal("middle", "unemployedWorkers", v)} /></View>
        <View className="w-[48%]"><Counter label="Skilled (free)"  value={m.unemployedSkilledWorkers} onAdjust={(d) => adjust("middle", "unemployedSkilledWorkers", d)} onSet={(v) => setVal("middle", "unemployedSkilledWorkers", v)} /></View>
        <View className="w-[48%]"><Counter label="Loans"           value={m.loans}                    onAdjust={(d) => adjust("middle", "loans", d)}                    onSet={(v) => setVal("middle", "loans", v)} /></View>
        <View className="w-[48%]"><Counter label="Voting cubes"    value={m.votingCubesInBag}         onAdjust={(d) => adjust("middle", "votingCubesInBag", d)}         onSet={(v) => setVal("middle", "votingCubesInBag", v)} /></View>
        <View className="w-[48%]"><Counter label="Bill markers"    value={m.billMarkersAvailable}     onAdjust={(d) => adjust("middle", "billMarkersAvailable", d)}     onSet={(v) => setVal("middle", "billMarkersAvailable", v)} max={3} /></View>
      </View>

      <StorageGrid
        values={{ food: m.storage.food, luxury: m.storage.luxury, health: m.storage.health, education: m.storage.education, influence: m.storage.influence }}
        labels={{ food: "Food", luxury: "Luxury", health: "Health", education: "Education", influence: "Influence" }}
        onAdjust={(k, d) => apply({ type: "adjustStorage", classId: "middle", good: k as Good, delta: d }, `middle.storage.${k} ${d}`)}
        onSet={(k, v) => {
          const cur = (m.storage as unknown as Record<string, number>)[k] ?? 0;
          apply({ type: "adjustStorage", classId: "middle", good: k as Good, delta: Math.max(0, v) - cur }, `middle.storage.${k} = ${v}`);
        }}
      />

      <View>
        <Text className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Companies ({m.companies.length})
        </Text>
        {m.companies.length === 0 ? (
          <Text className="text-xs text-slate-600">No companies built.</Text>
        ) : (
          <View className="gap-1.5">
            {m.companies.map((c) => (
              <View key={c.id} className="flex-row items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
                <Text className="flex-1 text-sm text-slate-200" numberOfLines={1}>{c.label}</Text>
                <Text className="shrink-0 font-mono text-[10px] text-slate-500">
                  L{c.wageLevel} · {c.workersAssigned}M / {c.workingClassEmployees}W
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View>
        <Text className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Notes</Text>
        <TextInput
          multiline
          placeholder="Strategy notes, reminders…"
          placeholderTextColor="#475569"
          value={m.notes}
          onChangeText={(t) => setText("middle", "notes", t)}
          className="min-h-16 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200"
          textAlignVertical="top"
        />
      </View>
    </ClassPanelShell>
  );
}
