import type { GameState } from "@/lib/types/game";

/**
 * Defense-in-depth shape check on values returned from WASM.
 *
 * Rust serde guarantees the wire format, but the Bridge (`*_wasm`) returns
 * `JsValue` typed `unknown` to TypeScript. A bad WASM build, a stale
 * cached `.wasm`, or a corrupted `localStorage` snapshot could otherwise
 * silently corrupt the store. This helper throws fast with a clear message
 * so the WASM error path picks it up.
 */
export function assertGameState(value: unknown): asserts value is GameState {
  if (!isGameStateLike(value)) {
    throw new Error("WASM returned a value that does not look like GameState");
  }
}

function isGameStateLike(v: unknown): boolean {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  if (typeof o.meta !== "object" || o.meta === null) return false;
  const meta = o.meta as Record<string, unknown>;
  if (typeof meta.id !== "string" || meta.id.length === 0) return false;
  if (typeof o.classes !== "object" || o.classes === null) return false;
  const classes = o.classes as Record<string, unknown>;
  return (
    typeof classes.working === "object" &&
    typeof classes.middle === "object" &&
    typeof classes.capitalist === "object" &&
    typeof classes.state === "object"
  );
}
