import { Pressable, ScrollView, Text, View } from "react-native";
import { useGame, useGameState } from "@/lib/store";
import type { Phase } from "@/lib/types/game";

const PHASES: { id: Phase; short: string }[] = [
  { id: "preparation", short: "Prep" },
  { id: "action",      short: "Action" },
  { id: "production",  short: "Prod" },
  { id: "elections",   short: "Elect" },
  { id: "scoring",     short: "Score" },
];

export function RoundPhaseHeader({ onOpenEndRound }: { onOpenEndRound: () => void }) {
  const state = useGameState();
  const setPhase = useGame((s) => s.setPhase);
  const setRound = useGame((s) => s.setRound);
  const advancePhase = useGame((s) => s.advancePhase);
  const undo = useGame((s) => s.undo);
  if (!state) return null;
  const { round, phase } = state.meta;
  const canUndo = state.history.length > 0;

  return (
    <View className="border-b border-slate-800 bg-slate-950 px-4 py-2.5">
      {/* Round + Phase row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row items-center gap-4">
          {/* Round */}
          <View className="flex-row items-center gap-2">
            <Text className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Round
            </Text>
            <View className="flex-row gap-1">
              {([1, 2, 3, 4, 5] as const).map((n) => (
                <Pressable
                  key={n}
                  accessibilityLabel={`Round ${n}`}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: round === n }}
                  onPress={() => setRound(n)}
                  className={`h-7 w-7 items-center justify-center rounded-md border ${
                    round === n
                      ? "border-indigo-500 bg-indigo-600"
                      : "border-slate-700 bg-slate-900"
                  }`}
                >
                  <Text className={`text-sm font-semibold ${round === n ? "text-white" : "text-slate-400"}`}>
                    {n}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Phase */}
          <View className="flex-row items-center gap-2">
            <Text className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Phase
            </Text>
            <View className="flex-row gap-1">
              {PHASES.map((p) => (
                <Pressable
                  key={p.id}
                  accessibilityLabel={p.short}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: phase === p.id }}
                  onPress={() => setPhase(p.id)}
                  className={`rounded-md border px-2.5 py-1 ${
                    phase === p.id
                      ? "border-indigo-500 bg-indigo-600"
                      : "border-slate-700 bg-slate-900"
                  }`}
                >
                  <Text className={`text-xs font-medium ${phase === p.id ? "text-white" : "text-slate-400"}`}>
                    {p.short}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action buttons row */}
      <View className="mt-2 flex-row gap-2">
        <Pressable
          accessibilityLabel="Undo last change"
          onPress={undo}
          disabled={!canUndo}
          className={`flex-row items-center rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 ${!canUndo ? "opacity-40" : ""}`}
        >
          <Text className="text-xs font-medium text-slate-200">↶ Undo</Text>
        </Pressable>
        <Pressable
          onPress={advancePhase}
          className="flex-row items-center rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5"
        >
          <Text className="text-xs font-medium text-slate-200">Next →</Text>
        </Pressable>
        <Pressable
          onPress={onOpenEndRound}
          className="flex-row items-center rounded-lg border border-indigo-600 bg-indigo-600 px-3 py-1.5"
        >
          <Text className="text-xs font-semibold text-white">End round</Text>
        </Pressable>
      </View>
    </View>
  );
}
