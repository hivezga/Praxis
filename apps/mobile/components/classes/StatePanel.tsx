import { Text, TextInput, View } from "react-native";
import { ClassPanelShell } from "./ClassPanelShell";
import { Counter } from "@/components/shared/Counter";
import { useGame, useGameState } from "@/lib/store";
import type { ClassId } from "@/lib/types/game";

const OTHERS: Exclude<ClassId, "state">[] = ["working", "middle", "capitalist"];

const LEGIT_LABEL: Record<Exclude<ClassId, "state">, string> = {
  working:    "vs Working",
  middle:     "vs Middle",
  capitalist: "vs Capitalist",
};

export function StatePanel() {
  const state = useGameState();
  const adjust = useGame((s) => s.adjustClassNumber);
  const setVal = useGame((s) => s.setClassNumber);
  const setText = useGame((s) => s.setClassString);
  const apply = useGame((s) => s.apply);
  if (!state) return null;
  const sc = state.classes.state;
  return (
    <ClassPanelShell classId="state">
      <View className="flex-row flex-wrap gap-2">
        <View className="w-[48%]"><Counter label="Treasury"         value={sc.treasury}             onAdjust={(d) => adjust("state", "treasury", d)}             onSet={(v) => setVal("state", "treasury", v)} max={9999} /></View>
        <View className="w-[48%]"><Counter label="VP track"         value={sc.vp}                   onAdjust={(d) => adjust("state", "vp", d)}                   onSet={(v) => setVal("state", "vp", v)} /></View>
        <View className="w-[48%]">
          <Counter
            label="Personal influence"
            value={sc.storage.influence}
            onAdjust={(d) => apply({ type: "adjustStorage", classId: "state", good: "influence", delta: d }, `state.storage.influence ${d}`)}
            onSet={(v) => apply({ type: "adjustStorage", classId: "state", good: "influence", delta: v - sc.storage.influence }, `state.storage.influence = ${v}`)}
          />
        </View>
        <View className="w-[48%]"><Counter label="Loans"        value={sc.loans}               onAdjust={(d) => adjust("state", "loans", d)}               onSet={(v) => setVal("state", "loans", v)} /></View>
        <View className="w-[48%]"><Counter label="Bill markers" value={sc.billMarkersAvailable} onAdjust={(d) => adjust("state", "billMarkersAvailable", d)} onSet={(v) => setVal("state", "billMarkersAvailable", v)} max={3} /></View>
      </View>

      <View>
        <Text className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Legitimacy (current)
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {OTHERS.map((c) => (
            <View key={c} className="w-[30%]">
              <Counter
                label={LEGIT_LABEL[c]}
                value={sc.legitimacy[c]}
                hint={`+${sc.legitimacyTokens[c]} perm`}
                onAdjust={(d) => apply({ type: "adjustLegitimacy", fromClass: c, delta: d }, `state.legitimacy.${c} ${d}`)}
                onSet={(v) => apply({ type: "adjustLegitimacy", fromClass: c, delta: v - sc.legitimacy[c] }, `state.legitimacy.${c} = ${v}`)}
              />
            </View>
          ))}
        </View>
      </View>

      <View>
        <Text className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Legitimacy tokens (permanent)
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {OTHERS.map((c) => (
            <View key={c} className="w-[30%]">
              <Counter
                label={LEGIT_LABEL[c]}
                value={sc.legitimacyTokens[c]}
                onAdjust={(d) => apply({ type: "adjustLegitimacyTokens", fromClass: c, delta: d }, `state.legitimacyTokens.${c} ${d}`)}
                onSet={(v) => apply({ type: "adjustLegitimacyTokens", fromClass: c, delta: v - sc.legitimacyTokens[c] }, `state.legitimacyTokens.${c} = ${v}`)}
              />
            </View>
          ))}
        </View>
      </View>

      <View>
        <Text className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Storage</Text>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Counter
              label="Food"
              value={sc.storage.food}
              onAdjust={(d) => apply({ type: "adjustStorage", classId: "state", good: "food", delta: d }, `state.storage.food ${d}`)}
              onSet={(v) => apply({ type: "adjustStorage", classId: "state", good: "food", delta: v - sc.storage.food }, `state.storage.food = ${v}`)}
            />
          </View>
          <View className="flex-1">
            <Counter
              label="Luxury"
              value={sc.storage.luxury}
              onAdjust={(d) => apply({ type: "adjustStorage", classId: "state", good: "luxury", delta: d }, `state.storage.luxury ${d}`)}
              onSet={(v) => apply({ type: "adjustStorage", classId: "state", good: "luxury", delta: v - sc.storage.luxury }, `state.storage.luxury = ${v}`)}
            />
          </View>
        </View>
      </View>

      <View>
        <Text className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Notes</Text>
        <TextInput
          multiline
          placeholder="Strategy notes, reminders…"
          placeholderTextColor="#475569"
          value={sc.notes}
          onChangeText={(t) => setText("state", "notes", t)}
          className="min-h-16 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200"
          textAlignVertical="top"
        />
      </View>
    </ClassPanelShell>
  );
}
