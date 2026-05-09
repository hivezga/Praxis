import { Pressable, Text, TextInput, View } from "react-native";
import type { ReactNode } from "react";

interface Props {
  label: string;
  value: number;
  onAdjust?: (delta: number) => void;
  onSet?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  hint?: ReactNode;
}

export function Counter({
  label,
  value,
  onAdjust,
  onSet,
  min = 0,
  max = 999,
  step = 1,
  hint,
}: Props) {
  const decDisabled = value <= min;
  const incDisabled = value >= max;

  return (
    <View className="flex-row items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5">
      <View className="flex-1 min-w-0">
        <Text className="text-[10px] font-semibold uppercase tracking-widest text-slate-500" numberOfLines={1}>
          {label}
        </Text>
        {hint != null ? (
          <Text className="mt-0.5 text-[9px] leading-tight text-slate-600">
            {String(hint)}
          </Text>
        ) : null}
      </View>
      <View className="flex-row items-center gap-1">
        <Pressable
          accessibilityLabel={`Decrease ${label}`}
          accessibilityRole="button"
          onPress={() => onAdjust?.(-step)}
          disabled={decDisabled || !onAdjust}
          className={`h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-900 ${decDisabled || !onAdjust ? "opacity-30" : ""}`}
        >
          <Text className="text-base text-slate-300 leading-none">−</Text>
        </Pressable>
        <TextInput
          accessibilityLabel={label}
          keyboardType="numeric"
          value={String(value)}
          onChangeText={(text) => {
            const n = parseInt(text, 10);
            if (!isNaN(n)) onSet?.(Math.min(max, Math.max(min, n)));
          }}
          className="h-8 w-12 rounded-md border border-slate-700 bg-slate-950 text-center font-mono text-base font-semibold text-slate-100"
          selectTextOnFocus
        />
        <Pressable
          accessibilityLabel={`Increase ${label}`}
          accessibilityRole="button"
          onPress={() => onAdjust?.(step)}
          disabled={incDisabled || !onAdjust}
          className={`h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-900 ${incDisabled || !onAdjust ? "opacity-30" : ""}`}
        >
          <Text className="text-base text-slate-300 leading-none">+</Text>
        </Pressable>
      </View>
    </View>
  );
}
