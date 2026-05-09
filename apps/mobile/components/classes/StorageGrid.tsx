import { Text, View } from "react-native";
import { Counter } from "@/components/shared/Counter";

type StorageMap = Record<string, number>;

interface Props {
  title?: string;
  values: StorageMap;
  labels?: Partial<Record<string, string>>;
  onAdjust: (key: string, delta: number) => void;
  onSet: (key: string, value: number) => void;
}

export function StorageGrid({ title = "Storage", values, labels, onAdjust, onSet }: Props) {
  const keys = Object.keys(values);
  return (
    <View>
      {title ? (
        <Text className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          {title}
        </Text>
      ) : null}
      <View className="flex-row flex-wrap gap-2">
        {keys.map((k) => (
          <View key={k} className="w-[48%]">
            <Counter
              label={labels?.[k] ?? k}
              value={values[k]}
              onAdjust={(d) => onAdjust(k, d)}
              onSet={(v) => onSet(k, v)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}
