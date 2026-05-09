/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, StaleWhileRevalidate } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Versioned WASM cache so a fresh deploy picks up new bytes within one
// navigation cycle even if the chunk filename is reused for any reason.
const WASM_CACHE_VERSION = "v1";

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url }) => url.pathname.endsWith(".wasm"),
      handler: new StaleWhileRevalidate({
        cacheName: `wasm-${WASM_CACHE_VERSION}`,
      }),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
