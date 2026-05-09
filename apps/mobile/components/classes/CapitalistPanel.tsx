import { Text, TextInput, View } from "react-native";
import { ClassPanelShell } from "./ClassPanelShell";
import { Counter } from "@/components/shared/Counter";
import { HideCurtain } from "@/components/shared/HideCurtain";
import { StorageGrid } from "./StorageGrid";
import { useGame, useGameState } from "@/lib/store";
import type { Good } from "@/lib/types/game";

export function CapitalistPanel() {
  const state = useGameState();
  const adjust = useGame((s) => s.adjustClassNumber);
  const setVal = useGame((s) => s.setClassNumber);
  const setText = useGame((s) => s.setClassString);
  const apply = useGame((s) => s.apply);
  if (!state) return null;
  const c = state.classes.capitalist;
  return (
    <ClassPanelShell classId="capitalist">
      <View className="flex-row flex-wrap gap-2">
        <View className="w-[48%]"><Counter label="Revenue"      value={c.revenue}              onAdjust={(d) => adjust("capitalist", "revenue", d)}              onSet={(v) => setVal("capitalist", "revenue", v)} max={9999} /></View>
        <View className="w-[48%]"><Counter label="Capital"      value={c.capital}              onAdjust={(d) => adjust("capitalist", "capital", d)}              onSet={(v) => setVal("capitalist", "capital", v)} max={9999} /></View>
        <View className="w-[48%]"><Counter label="VP track"     value={c.vp}                   onAdjust={(d) => adjust("capitalist", "vp", d)}                   onSet={(v) => setVal("capitalist", "vp", v)} /></View>
        <View className="w-[48%]"><Counter label="Loans"        value={c.loans}                onAdjust={(d) => adjust("capitalist", "loans", d)}                onSet={(v) => setVal("capitalist", "loans", v)} /></View>
        <View className="w-[48%]"><Counter label="Voting cubes" value={c.votingCubesInBag}     onAdjust={(d) => adjust("capitalist", "votingCubesInBag", d)}     onSet={(v) => setVal("capitalist", "votingCubesInBag", v)} /></View>
        <View className="w-[48%]"><Counter label="Bill markers" value={c.billMarkersAvailable} onAdjust={(d) => adjust("capitalist", "billMarkersAvailable", d)} onSet={(v) => setVal("capitalist", "billMarkersAvailable", v)} max={3} /></View>
      </View>

      <StorageGrid
        values={{ food: c.storage.food, luxury: c.storage.luxury, health: c.storage.health, education: c.storage.education, influence: c.storage.influence }}
        labels={{ food: "Food", luxury: "Luxury", health: "Health", education: "Education", influence: "Influence" }}
        onAdjust={(k, d) => apply({ type: "adjustStorage", classId: "capitalist", good: k as Good, delta: d }, `capitalist.storage.${k} ${d}`)}
        onSet={(k, v) => {
          const cur = (c.storage as unknown as Record<string, number>)[k] ?? 0;
          apply({ type: "adjustStorage", classId: "capitalist", good: k as Good, delta: Math.max(0, v) - cur }, `capitalist.storage.${k} = ${v}`);
        }}
      />

      <View>
        <Text className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Free Trade Zone
        </Text>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Counter
              label="FTZ — Food"
              value={c.storage.freeTradeZone.food}
              onAdjust={(d) => apply({ type: "adjustFreeTradeZone", good: "food", delta: d }, `capitalist.ftz.food ${d}`)}
              onSet={(v) => apply({ type: "adjustFreeTradeZone", good: "food", delta: v - c.storage.freeTradeZone.food }, `capitalist.ftz.food = ${v}`)}
            />
          </View>
          <View className="flex-1">
            <Counter
              label="FTZ — Luxury"
              value={c.storage.freeTradeZone.luxury}
              onAdjust={(d) => apply({ type: "adjustFreeTradeZone", good: "luxury", delta: d }, `capitalist.ftz.luxury ${d}`)}
              onSet={(v) => apply({ type: "adjustFreeTradeZone", good: "luxury", delta: v - c.storage.freeTradeZone.luxury }, `capitalist.ftz.luxury = ${v}`)}
            />
          </View>
        </View>
      </View>

      <View>
        <Text className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Companies ({c.companies.length})
        </Text>
        {c.companies.length === 0 ? (
          <Text className="text-xs text-slate-600">No companies built.</Text>
        ) : (
          <View className="gap-1.5">
            {c.companies.map((co) => (
              <View key={co.id} className="flex-row items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
                <Text className="flex-1 text-sm text-slate-200" numberOfLines={1}>{co.label}</Text>
                <Text className="shrink-0 font-mono text-[10px] text-slate-500">
                  Ind {co.industry} · L{co.wageLevel} · {co.workersAssigned}W{co.onStrike ? " · strike" : ""}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <HideCurtain label="hand">
        <View>
          <Text className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Hand size</Text>
          <Counter
            label="Cards in hand"
            value={c.handSize}
            onAdjust={(d) => adjust("capitalist", "handSize", d)}
            onSet={(v) => setVal("capitalist", "handSize", v)}
            max={20}
          />
        </View>
      </HideCurtain>

      <View>
        <Text className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Notes</Text>
        <TextInput
          multiline
          placeholder="Strategy notes, reminders…"
          placeholderTextColor="#475569"
          value={c.notes}
          onChangeText={(t) => setText("capitalist", "notes", t)}
          className="min-h-16 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200"
          textAlignVertical="top"
        />
      </View>
    </ClassPanelShell>
  );
}
