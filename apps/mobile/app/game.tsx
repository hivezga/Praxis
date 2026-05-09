import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { GlobalBoardPanel } from "@/components/board/GlobalBoardPanel";
import { RoundPhaseHeader } from "@/components/board/RoundPhaseHeader";
import { CapitalistPanel } from "@/components/classes/CapitalistPanel";
import { MiddlePanel } from "@/components/classes/MiddlePanel";
import { StatePanel } from "@/components/classes/StatePanel";
import { WorkingPanel } from "@/components/classes/WorkingPanel";
import { EndRoundWizard } from "@/components/endRound/EndRoundWizard";
import { useGameState } from "@/lib/store";
import type { ClassId } from "@/lib/types/game";

type Tab = ClassId | "global";

const CLASS_LABEL: Record<ClassId, string> = {
  working:    "Working",
  middle:     "Middle",
  capitalist: "Capitalist",
  state:      "State",
};

const CLASS_ACTIVE: Record<ClassId, string> = {
  working:    "border-working/70 bg-working/20",
  middle:     "border-middle/70 bg-middle/20",
  capitalist: "border-capitalist/70 bg-capitalist/20",
  state:      "border-state/70 bg-state/20",
};

const CLASS_TEXT: Record<ClassId, string> = {
  working:    "text-working",
  middle:     "text-middle",
  capitalist: "text-capitalist",
  state:      "text-state",
};

export default function GameScreen() {
  const state = useGameState();
  const [endRoundOpen, setEndRoundOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("global");

  if (!state) {
    router.replace("/");
    return null;
  }

  const activeClasses = state.meta.classesInPlay;

  const renderTab = () => {
    if (activeTab === "global") return <GlobalBoardPanel />;
    if (activeTab === "working") return <WorkingPanel />;
    if (activeTab === "middle") return <MiddlePanel />;
    if (activeTab === "capitalist") return <CapitalistPanel />;
    if (activeTab === "state") return <StatePanel />;
    return null;
  };

  return (
    <View className="flex-1 bg-slate-950">
      {/* Back + game name */}
      <View className="flex-row items-center justify-between px-4 pt-2 pb-1 bg-slate-950 border-b border-slate-800/50">
        <Pressable onPress={() => router.back()} className="py-1">
          <Text className="text-sm text-slate-500">← Games</Text>
        </Pressable>
        <Text className="text-sm font-semibold text-slate-300 flex-1 text-center" numberOfLines={1}>
          {state.meta.name}
        </Text>
        <Text className="text-xs text-slate-600 w-16 text-right">
          {state.meta.mode === "solo" ? "Solo" : "Party"} · {state.meta.playerCount}p
        </Text>
      </View>

      <RoundPhaseHeader onOpenEndRound={() => setEndRoundOpen(true)} />

      {/* Tab switcher */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-none border-b border-slate-800/60 bg-slate-950"
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 6 }}
      >
        <Pressable
          onPress={() => setActiveTab("global")}
          className={`rounded-lg border px-3 py-1.5 ${
            activeTab === "global"
              ? "border-slate-600 bg-slate-700"
              : "border-slate-700 bg-slate-900"
          }`}
        >
          <Text className={`text-xs font-medium ${activeTab === "global" ? "text-slate-100" : "text-slate-500"}`}>
            Board
          </Text>
        </Pressable>
        {activeClasses.map((c) => (
          <Pressable
            key={c}
            onPress={() => setActiveTab(c)}
            className={`rounded-lg border px-3 py-1.5 ${
              activeTab === c ? CLASS_ACTIVE[c] : "border-slate-700 bg-slate-900"
            }`}
          >
            <Text className={`text-xs font-medium ${activeTab === c ? CLASS_TEXT[c] : "text-slate-500"}`}>
              {CLASS_LABEL[c]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 12, paddingBottom: 32 }}>
        {renderTab()}
      </ScrollView>

      <EndRoundWizard open={endRoundOpen} onClose={() => setEndRoundOpen(false)} />
    </View>
  );
}
