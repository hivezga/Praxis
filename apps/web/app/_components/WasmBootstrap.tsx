"use client";

import { useEffect } from "react";
import { initWasm } from "@/lib/wasm";

export function WasmBootstrap() {
  useEffect(() => {
    initWasm().catch(console.error);
  }, []);
  return null;
}
