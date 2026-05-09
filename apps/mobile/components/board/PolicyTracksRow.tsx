import { ScrollView, Text, View } from "react-native";
import { PolicyTrack } from "@/components/shared/PolicyTrack";
import { POLICIES } from "@/lib/data/policies";
import { useGame, useGameState } from "@/lib/store";

export function PolicyTracksRow() {
  const state = useGameState();
  const setPolicy = useGame((s) => s.setPolicy);
  if (!state) return null;
  return (
    <View className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
      <Text className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        Policies
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {POLICIES.map((p) => {
            const pendingBill = state.bills.find((b) => b.policyId === p.id);
            return (
              <View key={p.id} className="w-40">
                <PolicyTrack
                  policy={p}
                  position={state.policies[p.id].position}
                  pendingPosition={pendingBill?.proposedSection}
                  onChange={(next) => setPolicy(p.id, next)}
                />
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
