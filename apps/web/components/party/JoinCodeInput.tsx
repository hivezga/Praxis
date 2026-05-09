"use client";

import {
  ChangeEvent,
  ClipboardEvent,
  KeyboardEvent,
  useEffect,
  useRef,
} from "react";

const ALPHABET = /^[A-Z0-9]$/;

interface Props {
  value: string;
  onChange(next: string): void;
  onComplete?(code: string): void;
  disabled?: boolean;
}

/**
 * 6 single-character boxes that auto-advance focus on entry. Backspace moves
 * focus left; pasting a 6-char code fills every box at once. Calls onComplete
 * the moment the user types the sixth character.
 */
export function JoinCodeInput({ value, onChange, onComplete, disabled }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const padded = value.padEnd(6, " ").slice(0, 6).split("");

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  function setChar(idx: number, char: string) {
    const cleaned = char.toUpperCase();
    if (cleaned && !ALPHABET.test(cleaned)) return;
    const next = padded.slice();
    next[idx] = cleaned || " ";
    const trimmed = next.join("").trimEnd();
    onChange(trimmed);
    if (cleaned && idx < 5) {
      refs.current[idx + 1]?.focus();
      refs.current[idx + 1]?.select();
    } else if (cleaned && idx === 5 && trimmed.length === 6) {
      onComplete?.(trimmed);
    }
  }

  function onKey(idx: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (padded[idx] === " " && idx > 0) {
        e.preventDefault();
        const next = padded.slice();
        next[idx - 1] = " ";
        onChange(next.join("").trimEnd());
        refs.current[idx - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      e.preventDefault();
      refs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < 5) {
      e.preventDefault();
      refs.current[idx + 1]?.focus();
    } else if (e.key === "Enter" && value.length === 6) {
      e.preventDefault();
      onComplete?.(value);
    }
  }

  function onChangeBox(idx: number, e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (raw.length > 1) {
      // Paste of a multi-char code: fill from this box onward.
      const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6 - idx);
      if (!cleaned) return;
      const next = padded.slice();
      for (let i = 0; i < cleaned.length; i++) next[idx + i] = cleaned[i];
      const trimmed = next.join("").trimEnd();
      onChange(trimmed);
      const land = Math.min(5, idx + cleaned.length);
      refs.current[land]?.focus();
      if (trimmed.length === 6) onComplete?.(trimmed);
      return;
    }
    setChar(idx, raw.slice(-1));
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    if (pasted.length === 6) {
      refs.current[5]?.focus();
      onComplete?.(pasted);
    } else {
      refs.current[Math.min(5, pasted.length)]?.focus();
    }
  }

  return (
    <div className="flex justify-between gap-2" role="group" aria-label="Six-character room code">
      {Array.from({ length: 6 }, (_, idx) => {
        const ch = padded[idx];
        return (
          <input
            key={idx}
            ref={(el) => {
              refs.current[idx] = el;
            }}
            value={ch === " " ? "" : ch}
            inputMode="text"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            maxLength={6}
            disabled={disabled}
            aria-label={`Character ${idx + 1}`}
            className="input h-14 w-12 rounded-md text-center font-mono text-2xl uppercase tracking-normal"
            onChange={(e) => onChangeBox(idx, e)}
            onKeyDown={(e) => onKey(idx, e)}
            onPaste={onPaste}
            onFocus={(e) => e.target.select()}
          />
        );
      })}
    </div>
  );
}
