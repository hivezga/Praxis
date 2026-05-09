import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Modal } from "@/components/shared/Modal";
import { POLICIES, POLICIES_BY_ID } from "@/lib/data/policies";
import { useGame, useGameState } from "@/lib/store";
import type { ClassId, PolicyId, PolicySection } from "@/lib/types/game";

const CLASSES: ClassId[] = ["working", "middle", "capitalist", "state"];

const CLASS_BADGE_BG: Record<ClassId, string> = {
  working:    "bg-working/15 border-working/30",
  middle:     "bg-middle/15 border-middle/30",
  capitalist: "bg-capitalist/15 border-capitalist/30",
  state:      "bg-state/15 border-state/30",
};

const CLASS_TEXT: Record<ClassId, string> = {
  working:    "text-working",
  middle:     "text-middle",
  capitalist: "text-capitalist",
  state:      "text-state",
};

export function BillsPanel() {
  const state = useGameState();
  const propose = useGame((s) => s.proposeBill);
  const remove = useGame((s) => s.removeBill);
  const [open, setOpen] = useState(false);
  const [policyId, setPolicyId] = useState<PolicyId>("taxation");
  const [section, setSection] = useState<PolicySection>("B");
  const [proposer, setProposer] = useState<ClassId>("working");
  const [immediateVote, setImmediateVote] = useState(false);
  if (!state) return null;
  return (
    <View className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Pending Bills
        </Text>
        <Pressable
          onPress={() => setOpen(true)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1"
        >
          <Text className="text-xs font-medium text-slate-200">+ Propose</Text>
        </Pressable>
      </View>

      {state.bills.length === 0 ? (
        <Text className="rounded-lg border border-dashed border-slate-800 p-3 text-xs text-slate-500 text-center">
          No bills proposed.
        </Text>
      ) : (
        <View className="gap-2">
          {state.bills.map((b) => (
            <View
              key={b.id}
              className="flex-row items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5"
            >
              <View className="flex-1 min-w-0">
                <View className="flex-row flex-wrap items-center gap-1">
                  <Text className="font-mono text-[10px] text-slate-500">
                    {POLICIES_BY_ID[b.policyId].number}.
                  </Text>
                  <Text className="text-xs text-slate-200">{POLICIES_BY_ID[b.policyId].name}</Text>
                  <Text className="text-xs text-slate-600">→</Text>
                  <Text className="font-mono text-xs font-semibold text-amber-300">{b.proposedSection}</Text>
                </View>
                <View className="mt-1 flex-row items-center gap-1.5">
                  <View className={`rounded border px-1.5 py-0.5 ${CLASS_BADGE_BG[b.proposedBy]}`}>
                    <Text className={`text-[9px] font-semibold uppercase tracking-wide ${CLASS_TEXT[b.proposedBy]}`}>
                      {b.proposedBy}
                    </Text>
                  </View>
                  {b.immediateVote ? (
                    <Text className="text-[9px] text-slate-500">· immediate vote</Text>
                  ) : null}
                </View>
              </View>
              <Pressable
                onPress={() => remove(b.id)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1"
              >
                <Text className="text-xs text-rose-400">Remove</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Propose Bill"
        footer={
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setOpen(false)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2"
            >
              <Text className="text-sm font-medium text-slate-300">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                propose({ policyId, proposedSection: section, proposedBy: proposer, immediateVote });
                setOpen(false);
              }}
              className="rounded-lg border border-indigo-600 bg-indigo-600 px-4 py-2"
            >
              <Text className="text-sm font-semibold text-white">Propose</Text>
            </Pressable>
          </View>
        }
      >
        <View className="gap-4">
          <View>
            <Text className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Policy</Text>
            <View className="rounded-lg border border-slate-700 bg-slate-800">
              <Picker
                selectedValue={policyId}
                onValueChange={(v) => setPolicyId(v as PolicyId)}
                dropdownIconColor="#94a3b8"
                style={{ color: "#e2e8f0" }}
              >
                {POLICIES.map((p) => (
                  <Picker.Item key={p.id} label={`${p.number}. ${p.name}`} value={p.id} color="#e2e8f0" />
                ))}
              </Picker>
            </View>
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Move to</Text>
              <View className="rounded-lg border border-slate-700 bg-slate-800">
                <Picker
                  selectedValue={section}
                  onValueChange={(v) => setSection(v as PolicySection)}
                  dropdownIconColor="#94a3b8"
                  style={{ color: "#e2e8f0" }}
                >
                  <Picker.Item label="A" value="A" color="#e2e8f0" />
                  <Picker.Item label="B" value="B" color="#e2e8f0" />
                  <Picker.Item label="C" value="C" color="#e2e8f0" />
                </Picker>
              </View>
            </View>
            <View className="flex-1">
              <Text className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Proposed by</Text>
              <View className="rounded-lg border border-slate-700 bg-slate-800">
                <Picker
                  selectedValue={proposer}
                  onValueChange={(v) => setProposer(v as ClassId)}
                  dropdownIconColor="#94a3b8"
                  style={{ color: "#e2e8f0" }}
                >
                  {CLASSES.map((c) => (
                    <Picker.Item key={c} label={c.charAt(0).toUpperCase() + c.slice(1)} value={c} color="#e2e8f0" />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
          <Pressable
            onPress={() => setImmediateVote((v) => !v)}
            className="flex-row items-center gap-2"
          >
            <View className={`h-5 w-5 items-center justify-center rounded border ${immediateVote ? "border-indigo-500 bg-indigo-600" : "border-slate-600 bg-slate-800"}`}>
              {immediateVote ? <Text className="text-xs text-white font-bold">✓</Text> : null}
            </View>
            <Text className="text-xs text-slate-300 flex-1">
              Immediate vote (spend 1 Influence to skip Elections)
            </Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}
