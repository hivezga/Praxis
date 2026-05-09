import type { PeerOptions } from "peerjs";

/**
 * Builds PeerJS options consumed by both `RoomHost` and `RoomPeer`.
 *
 * Defaults to the public PeerJS broker (`0.peerjs.com`) but allows full
 * override via env vars for self-hosted brokers:
 *   - NEXT_PUBLIC_PEERJS_HOST   (e.g. "broker.praxis.example")
 *   - NEXT_PUBLIC_PEERJS_PORT   (number)
 *   - NEXT_PUBLIC_PEERJS_PATH   (default "/")
 *   - NEXT_PUBLIC_PEERJS_SECURE ("true" | "false")
 *
 * ICE config seeds Google STUN + Open Relay TURN (free public TURN service
 * from openrelayproject.org). Symmetric NATs (mobile hotspots, some routers)
 * cannot establish a direct WebRTC connection without TURN — without these
 * servers, friends behind such NATs see "connection rejected" errors.
 *
 * For production, swap in a paid TURN provider via env vars:
 *   - NEXT_PUBLIC_TURN_URL      (e.g. "turn:global.relay.metered.ca:80")
 *   - NEXT_PUBLIC_TURN_USERNAME
 *   - NEXT_PUBLIC_TURN_PASSWORD
 */

interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

const DEFAULT_ICE_SERVERS: IceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:global.stun.twilio.com:3478" },
  // Open Relay free public TURN. Best-effort — falls back to STUN-only if down.
  // Verify availability at https://www.metered.ca/tools/openrelay/.
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

function readEnv(name: string): string | undefined {
  // process.env is statically replaced at build time; runtime fallback to
  // globalThis lets test harnesses inject overrides without rebuilding.
  const fromBuild = (typeof process !== "undefined" ? process.env?.[name] : undefined) as
    | string
    | undefined;
  if (fromBuild) return fromBuild;
  const g = globalThis as Record<string, unknown>;
  const fromGlobal = g[name];
  return typeof fromGlobal === "string" ? fromGlobal : undefined;
}

function customIceServers(): IceServer[] | null {
  const url = readEnv("NEXT_PUBLIC_TURN_URL");
  if (!url) return null;
  return [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: url,
      username: readEnv("NEXT_PUBLIC_TURN_USERNAME") ?? undefined,
      credential: readEnv("NEXT_PUBLIC_TURN_PASSWORD") ?? undefined,
    },
  ];
}

function brokerOptions(): Partial<PeerOptions> {
  const host = readEnv("NEXT_PUBLIC_PEERJS_HOST");
  if (!host) return {};
  const portRaw = readEnv("NEXT_PUBLIC_PEERJS_PORT");
  const port = portRaw ? Number(portRaw) : undefined;
  const path = readEnv("NEXT_PUBLIC_PEERJS_PATH") ?? "/";
  const secureRaw = readEnv("NEXT_PUBLIC_PEERJS_SECURE");
  const secure =
    secureRaw === undefined ? undefined : secureRaw.toLowerCase() === "true";
  return {
    host,
    ...(port !== undefined && Number.isFinite(port) ? { port } : {}),
    path,
    ...(secure !== undefined ? { secure } : {}),
  };
}

/**
 * Returns the merged PeerJS options object. Pass the result to
 * `new Peer(id, opts)` or `new Peer(opts)`.
 */
export function peerOptions(): PeerOptions {
  return {
    ...brokerOptions(),
    config: {
      iceServers: customIceServers() ?? DEFAULT_ICE_SERVERS,
    },
  };
}
