import { Pressable, Text, View } from "react-native";
import { type ReactNode, useState } from "react";

interface Props {
  label?: string;
  children: ReactNode;
  startHidden?: boolean;
}

export function HideCurtain({ label = "Hidden info", children, startHidden = true }: Props) {
  const [hidden, setHidden] = useState(startHidden);
  return (
    <View className="relative">
      <View pointerEvents={hidden ? "none" : "auto"} style={hidden ? { opacity: 0.18 } : undefined}>
        {children}
      </View>
      {hidden ? (
        <Pressable
          accessibilityLabel={`Reveal ${label}`}
          onPress={() => setHidden(false)}
          className="absolute inset-0 items-center justify-center rounded-lg bg-slate-950/40"
        >
          <View className="rounded-md border border-slate-600 bg-slate-900/95 px-3 py-1.5">
            <Text className="text-[10px] font-semibold uppercase tracking-wider text-slate-200">
              Reveal {label}
            </Text>
          </View>
        </Pressable>
      ) : (
        <Pressable
          accessibilityLabel={`Hide ${label}`}
          onPress={() => setHidden(true)}
          className="absolute right-2 top-2 rounded-md border border-slate-600 bg-slate-900/95 px-2 py-1"
        >
          <Text className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">
            Hide {label}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
