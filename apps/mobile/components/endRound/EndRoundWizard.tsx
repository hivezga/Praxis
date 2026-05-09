import { useMemo, useState, type ReactNode } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Modal } from "@/components/shared/Modal";
import { engine } from "@/lib/engine";
import { useGame, useGameState } from "@/lib/store";
import type { RoundSuggestion } from "@/lib/types/game";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function EndRoundWizard({ open, onClose }: Props) {
  const state = useGameState();
  const apply = useGame((s) => s.apply);
  const advancePhase = useGame((s) => s.advancePhase);

  const suggestion = useMemo(
    () => (state ? engine.computeRoundSuggestion(state) : null),
    [state],
  );

  const [taxToTreasury, setTaxToTreasury] = useState<number | null>(null);
  const [wagesToWorking, setWagesToWorking] = useState<number | null>(null);
  const [welfareFromState, setWelfareFromState] = useState<number | null>(null);
  const [workingProsperity, setWorkingProsperity] = useState<number | null>(null);
  const [middleProsperity, setMiddleProsperity] = useState<number | null>(null);

  if (!state || !suggestion) return null;

  const tT = taxToTreasury ?? suggestion.taxes.totalToTreasury;
  const wW = wagesToWorking ?? suggestion.wages.toWorking;
  const wS = welfareFromState ?? suggestion.welfareCosts.fromState;
  const pW = workingProsperity ?? suggestion.prosperityDelta.working;
  const pM = middleProsperity ?? suggestion.prosperityDelta.middle;

  const totals = {
    workingNet:    wW - suggestion.taxes.workingIncomeTax,
    middleNet:     -suggestion.taxes.middleIncomeTax - suggestion.taxes.middleEmploymentTax,
    capitalistNet: -suggestion.taxes.capitalistIncomeTax - suggestion.taxes.capitalistEmploymentTax,
    stateNet:      tT - wS,
  };

  function reset() {
    setTaxToTreasury(null);
    setWagesToWorking(null);
    setWelfareFromState(null);
    setWorkingProsperity(null);
    setMiddleProsperity(null);
  }

  function handleApply() {
    apply(
      {
        type: "applyEndRound",
        wagesFromCapitalist: suggestion!.wages.fromCapitalist,
        wagesFromMiddle:     suggestion!.wages.fromMiddle,
        wagesToWorking:      wW,
        workingIncomeTax:    suggestion!.taxes.workingIncomeTax,
        middleIncomeTax:     suggestion!.taxes.middleIncomeTax,
        middleEmploymentTax:     suggestion!.taxes.middleEmploymentTax,
        capitalistIncomeTax:     suggestion!.taxes.capitalistIncomeTax,
        capitalistEmploymentTax: suggestion!.taxes.capitalistEmploymentTax,
        totalToTreasury:         tT,
        welfareCost:             wS,
        workingProsperitySteps:  pW,
        middleProsperitySteps:   pM,
      },
      "Apply end-of-round",
    );
    advancePhase();
    reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title={`End of round ${state.meta.round}`}
      footer={
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => { reset(); onClose(); }}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2"
          >
            <Text className="text-sm font-medium text-slate-300">Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handleApply}
            className="rounded-lg border border-indigo-600 bg-indigo-600 px-4 py-2"
          >
            <Text className="text-sm font-semibold text-white">Apply & advance</Text>
          </Pressable>
        </View>
      }
    >
      <View className="gap-5">
        <View className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
          <Text className="text-xs text-slate-400">
            Tax multiplier this round:{" "}
            <Text className="font-mono font-semibold text-slate-200">×{suggestion.taxes.multiplier}</Text>.
            Highlighted fields can be overridden.
          </Text>
        </View>

        <Section title="Taxes → Treasury">
          <View className="flex-row flex-wrap gap-2">
            <StatCell label="Working income"       value={suggestion.taxes.workingIncomeTax} />
            <StatCell label="Middle income"        value={suggestion.taxes.middleIncomeTax} />
            <StatCell label="Middle employment"    value={suggestion.taxes.middleEmploymentTax} />
            <StatCell label="Capitalist income"    value={suggestion.taxes.capitalistIncomeTax} />
            <StatCell label="Capitalist employment" value={suggestion.taxes.capitalistEmploymentTax} />
            <EditableCell label="Total to Treasury" value={tT} onChange={setTaxToTreasury} />
          </View>
        </Section>

        <Section title="Wages">
          <View className="flex-row flex-wrap gap-2">
            <StatCell label="From Capitalist"   value={suggestion.wages.fromCapitalist} />
            <StatCell label="From Middle"       value={suggestion.wages.fromMiddle} />
            <EditableCell label="To Working" value={wW} onChange={setWagesToWorking} />
          </View>
        </Section>

        <Section title="Welfare">
          <EditableCell label="State pays for free services" value={wS} onChange={setWelfareFromState} />
          <Text className="mt-1 text-xs text-slate-500">{suggestion.welfareCosts.notes}</Text>
        </Section>

        <Section title="Prosperity gains">
          <View className="flex-row gap-2">
            <View className="flex-1"><EditableCell label="Working +steps" value={pW} onChange={setWorkingProsperity} /></View>
            <View className="flex-1"><EditableCell label="Middle +steps"  value={pM} onChange={setMiddleProsperity} /></View>
          </View>
        </Section>

        <View className="rounded-xl border border-slate-800 bg-slate-950 p-3">
          <Text className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Net cash impact
          </Text>
          <View className="flex-row gap-2">
            <NetCell label="Working"    value={totals.workingNet} />
            <NetCell label="Middle"     value={totals.middleNet} />
            <NetCell label="Capitalist" value={totals.capitalistNet} />
            <NetCell label="State"      value={totals.stateNet} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View>
      <Text className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">{title}</Text>
      {children}
    </View>
  );
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-1 min-w-[40%] rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5">
      <Text className="text-[10px] font-semibold uppercase tracking-widest text-slate-500" numberOfLines={1}>{label}</Text>
      <Text className="mt-0.5 font-mono text-base font-semibold text-slate-200">{value}</Text>
    </View>
  );
}

function EditableCell({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (next: number | null) => void;
}) {
  return (
    <View className="flex-1 min-w-[40%] rounded-lg border border-indigo-700/40 bg-indigo-950/30 px-3 py-2.5">
      <Text className="text-[10px] font-semibold uppercase tracking-widest text-indigo-300/70" numberOfLines={1}>{label}</Text>
      <TextInput
        keyboardType="numeric"
        value={String(value)}
        onChangeText={(text) => {
          const n = parseInt(text, 10);
          onChange(isNaN(n) ? null : n);
        }}
        className="mt-1 font-mono text-base font-semibold text-slate-200"
        selectTextOnFocus
      />
    </View>
  );
}

function NetCell({ label, value }: { label: string; value: number }) {
  const positive = value >= 0;
  return (
    <View className="flex-1 items-center rounded-lg border border-slate-800 bg-slate-950 py-2">
      <Text className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">{label}</Text>
      <Text className={`mt-0.5 font-mono text-xl font-semibold ${positive ? "text-emerald-400" : "text-rose-400"}`}>
        {positive ? "+" : ""}{value}
      </Text>
    </View>
  );
}
