"use client";

import { HideCurtain } from "@/components/shared/HideCurtain";
import { useShouldHideClass } from "@/lib/store";
import type { ClassId } from "@/lib/types/game";

interface Props {
  classId: ClassId;
  value: string;
  onChange(text: string): void;
}

/**
 * Notes textarea that hides itself behind a curtain when another player owns
 * this faction in a party room.
 */
export function NotesField({ classId, value, onChange }: Props) {
  const hide = useShouldHideClass(classId);
  const inner = (
    <div>
      <div className="panel-title">Notes</div>
      <textarea
        className="input min-h-[60px]"
        placeholder="Strategy notes, reminders…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
  if (!hide) return inner;
  return <HideCurtain label="notes">{inner}</HideCurtain>;
}
