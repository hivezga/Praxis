import { ReactNode } from "react";

interface Props {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: string;
}

export function StatBadge({ label, value, hint, accent }: Props) {
  return (
    <div className="flex flex-col rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2.5">
      <span className="stat-label">{label}</span>
      <span className={`stat-num mt-0.5 ${accent ?? ""}`}>{value}</span>
      {hint ? <span className="mt-0.5 text-[10px] text-slate-600">{hint}</span> : null}
    </div>
  );
}
