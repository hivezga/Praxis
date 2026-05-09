import { Text, View } from "react-native";
import type { ReactNode } from "react";
import { engine } from "@/lib/engine";
import { useGameState } from "@/lib/store";
import type { ClassId } from "@/lib/types/game";

const ACCENT: Record<ClassId, { border: string; headerBg: string; text: string; label: string }> = {
  working:    { border: "border-working/30",    headerBg: "bg-working/10",    text: "text-working",    label: "Working Class"    },
  middle:     { border: "border-middle/30",     headerBg: "bg-middle/10",     text: "text-middle",     label: "Middle Class"     },
  capitalist: { border: "border-capitalist/30", headerBg: "bg-capitalist/10", text: "text-capitalist", label: "Capitalist Class" },
  state:      { border: "border-state/30",      headerBg: "bg-state/10",      text: "text-state",      label: "The State"        },
};

interface Props {
  classId: ClassId;
  children: ReactNode;
}

export function ClassPanelShell({ classId, children }: Props) {
  const state = useGameState();
  const accent = ACCENT[classId];
  const vp = state ? engine.computeVp(state, classId) : null;
  return (
    <View className={`overflow-hidden rounded-xl border ${accent.border} bg-slate-900/60`}>
      <View className={`flex-row items-center justify-between px-4 py-3 ${accent.headerBg} border-b ${accent.border}`}>
        <Text className={`text-xs font-semibold uppercase tracking-widest ${accent.text}`}>
          {accent.label}
        </Text>
        {vp != null ? (
          <View className="flex-row items-baseline gap-1.5">
            <Text className="text-[9px] uppercase tracking-widest text-slate-500">VP</Text>
            <Text className={`font-mono text-2xl font-semibold leading-none ${accent.text}`}>
              {vp.total}
            </Text>
          </View>
        ) : null}
      </View>
      <View className="gap-3 p-4">{children}</View>
    </View>
  );
}
