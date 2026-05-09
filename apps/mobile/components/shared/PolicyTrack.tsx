import { Pressable, Text, View } from "react-native";
import type { PolicySection } from "@/lib/types/game";
import type { PolicyDefinition } from "@/lib/data/policies";

interface Props {
  policy: PolicyDefinition;
  position: PolicySection;
  pendingPosition?: PolicySection;
  onChange?: (next: PolicySection) => void;
}

const SECTIONS: PolicySection[] = ["A", "B", "C"];

export function PolicyTrack({ policy, position, pendingPosition, onChange }: Props) {
  return (
    <View className="rounded-xl border border-slate-800 bg-slate-950 p-3">
      <View className="mb-2 flex-row items-start justify-between gap-2">
        <View className="flex-1 min-w-0">
          <Text className="text-[10px] font-semibold uppercase tracking-wider text-slate-400" numberOfLines={1}>
            {policy.number}. {policy.name}
          </Text>
          <Text className="mt-0.5 text-[9px] text-slate-600">
            {policy.axis === "leftRight" ? "Socialism ↔ Neoliberal" : "National ↔ Global"}
          </Text>
        </View>
        <Text className="shrink-0 font-mono text-sm font-semibold text-slate-300">{position}</Text>
      </View>
      <View className="flex-row gap-1">
        {SECTIONS.map((s) => {
          const active = s === position;
          const pending = s === pendingPosition && s !== position;
          return (
            <Pressable
              key={s}
              accessibilityLabel={`Set ${policy.name} to section ${s}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              onPress={() => onChange?.(s)}
              className={`flex-1 rounded-md border px-1 py-2 ${
                active
                  ? "border-indigo-500 bg-indigo-600/25"
                  : pending
                    ? "border-amber-500/50 bg-amber-500/10"
                    : "border-slate-700 bg-slate-900"
              }`}
            >
              <Text className={`font-mono text-[9px] font-semibold uppercase opacity-60 ${active ? "text-slate-100" : pending ? "text-amber-300" : "text-slate-400"}`}>
                {s}
              </Text>
              <Text className={`mt-0.5 text-[9px] leading-tight ${active ? "text-slate-100" : pending ? "text-amber-300" : "text-slate-400"}`} numberOfLines={2}>
                {policy.sections[s].label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
