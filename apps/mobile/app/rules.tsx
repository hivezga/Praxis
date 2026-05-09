import { type ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";

export default function RulesScreen() {
  return (
    <ScrollView className="flex-1 bg-slate-950" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text className="text-xs text-slate-500 mb-4">
        Distilled from the official rulebooks. Use the rulebook for definitive answers.
      </Text>

      <View className="gap-4">
        <Block title="Tax multiplier">
          <Text className="text-sm text-slate-300 mb-2">
            Multiplier = <Text className="font-semibold">Tax base</Text> + <Text className="font-semibold">Health modifier</Text> + <Text className="font-semibold">Education modifier</Text>
          </Text>
          <Table
            headers={["Track position", "Tax base", "Welfare mod"]}
            rows={[["Section A", "3", "+2"], ["Section B", "2", "+1"], ["Section C", "1", "0"]]}
          />
          <Text className="mt-2 text-xs text-slate-500">Range: 1 (low tax + private) to 7 (high tax + universal)</Text>
        </Block>

        <Block title="Wages by labor market">
          <Table
            headers={["Labor market", "Minimum wage"]}
            rows={[["Section A", "L3 (highest)"], ["Section B", "L2 or L3"], ["Section C", "Any (L1 ok)"]]}
          />
        </Block>

        <Block title="Public services cost">
          <Table
            headers={["Section", "Policy", "Cost per use"]}
            rows={[["A", "Universal", "Free (State pays)"], ["B", "Subsidized", "$5 to State"], ["C", "Private", "$10 to companies"]]}
          />
        </Block>

        <Block title="Foreign trade tariffs">
          <Table
            headers={["Section", "Food", "Luxury", "Deals/round"]}
            rows={[["A", "+$10", "+$6", "0"], ["B", "+$5", "+$3", "1"], ["C", "none", "none", "2"]]}
          />
        </Block>

        <Block title="VP scoring per round">
          <View className="gap-2">
            {[
              { label: "Working class", color: "text-working", text: "VP for each Prosperity step gained (= new value); +2 VP per active Trade Union (≥4 workers); +1 VP per $10 cash" },
              { label: "Middle class", color: "text-middle", text: "VP for Prosperity steps; +1 VP per 2 storage goods; +1 VP per $15 cash" },
              { label: "Capitalist class", color: "text-capitalist", text: "VP from Wealth table based on Capital value" },
              { label: "State", color: "text-state", text: "VP = sum of two lowest Legitimacy values; +1 VP per Political Agenda match; +1 VP per $30 in Treasury at game end" },
            ].map((item) => (
              <View key={item.label}>
                <Text className={`text-sm font-semibold ${item.color}`}>{item.label}</Text>
                <Text className="text-sm text-slate-300 leading-relaxed">{item.text}</Text>
              </View>
            ))}
          </View>
        </Block>

        <Block title="End-game policy bonuses">
          <Table
            headers={["Policies in section", "1", "2", "3", "4", "5"]}
            rows={[
              ["Working (A)", "1", "4", "8", "12", "18"],
              ["Middle (B)", "1", "3", "6", "10", "15"],
              ["Capitalist (C)", "1", "4", "8", "12", "18"],
            ]}
          />
        </Block>
      </View>
    </ScrollView>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <Text className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">{title}</Text>
      <View className="gap-2">{children}</View>
    </View>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <View>
      <View className="flex-row border-b border-slate-800 pb-1.5 mb-1">
        {headers.map((h, i) => (
          <Text key={h} className={`flex-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 ${i > 0 ? "text-right" : ""}`}>
            {h}
          </Text>
        ))}
      </View>
      {rows.map((row, i) => (
        <View key={i} className="flex-row py-1.5 border-b border-slate-800/40">
          {row.map((cell, j) => (
            <Text key={j} className={`flex-1 text-sm ${j === 0 ? "text-slate-300" : "font-mono text-slate-400 text-right"}`}>
              {cell}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}
