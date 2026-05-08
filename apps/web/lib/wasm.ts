"use client";

import type * as WasmModule from "hegemony-core";

type Mod = typeof WasmModule;

let _mod: Mod | null = null;
let _promise: Promise<Mod> | null = null;

export async function initWasm(): Promise<Mod> {
  if (!_promise) {
    _promise = (async () => {
      const mod = await import("hegemony-core");
      // The web-target default export is the async init function that loads the WASM binary.
      const initFn = (mod as unknown as { default: () => Promise<unknown> }).default;
      await initFn();
      _mod = mod;
      return mod;
    })();
  }
  return _promise;
}

export function wasm(): Mod {
  if (!_mod) throw new Error("WASM not initialized — ensure WasmBootstrap rendered first");
  return _mod;
}
