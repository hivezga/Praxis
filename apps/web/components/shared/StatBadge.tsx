import { ReactNode } from "react";

interface Props {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: string;
}

export function StatBadge({ label, value, hint, accent }: Props) {
  return (
    <div className="flex min-w-0 flex-col rounded-sharp border border-rule/50 bg-paper/40 px-3 py-2.5">
      <span className="stat-label">{label}</span>
      <span className={`stat-num mt-0.5 ${accent ?? ""}`}>{value}</span>
      {hint ? <span className="mt-0.5 text-[10px] text-inkMute">{hint}</span> : null}
    </div>
  );
}
