"use client";

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
    <div>
      {title ? <div className="panel-title">{title}</div> : null}
      <div className="grid grid-cols-2 gap-2 @md:grid-cols-3">
        {keys.map((k) => (
          <Counter
            key={k}
            label={labels?.[k] ?? k}
            value={values[k]}
            onAdjust={(d) => onAdjust(k, d)}
            onSet={(v) => onSet(k, v)}
          />
        ))}
      </div>
    </div>
  );
}
