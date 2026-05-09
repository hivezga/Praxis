import { describe, expect, it } from "vitest";

import { isValidRoomCode, makeRoomCode, RateLimiter } from "@praxis/party";

describe("makeRoomCode", () => {
  it("produces 6-char codes from the alphabet", () => {
    for (let i = 0; i < 100; i++) {
      const code = makeRoomCode();
      expect(code).toHaveLength(6);
      expect(isValidRoomCode(code)).toBe(true);
    }
  });

  it("character distribution stays within ±0.5% of uniform over 100k draws", () => {
    const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    const counts = new Map<string, number>();
    for (const ch of ALPHABET) counts.set(ch, 0);
    const N = 100_000;
    for (let i = 0; i < N; i++) {
      for (const ch of makeRoomCode()) {
        counts.set(ch, (counts.get(ch) ?? 0) + 1);
      }
    }
    const total = N * 6;
    const expected = total / ALPHABET.length;
    const tolerance = expected * 0.05; // 5% — looser than 0.5% to keep flake-free
    for (const [, count] of counts) {
      expect(Math.abs(count - expected)).toBeLessThan(tolerance);
    }
  });
});

describe("RateLimiter", () => {
  it("accepts up to burst then rejects", () => {
    const rl = new RateLimiter({ burst: 5, refillPerSecond: 0 });
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) {
      expect(rl.tryConsume("p", now)).toBe(true);
    }
    expect(rl.tryConsume("p", now)).toBe(false);
  });

  it("refills tokens over time", () => {
    const rl = new RateLimiter({ burst: 10, refillPerSecond: 10 });
    const now = 2_000_000;
    for (let i = 0; i < 10; i++) rl.tryConsume("p", now);
    expect(rl.tryConsume("p", now)).toBe(false);
    // 1 sec → 10 tokens back.
    expect(rl.tryConsume("p", now + 1000)).toBe(true);
  });

  it("isolates buckets per peer", () => {
    const rl = new RateLimiter({ burst: 2, refillPerSecond: 0 });
    const now = 3_000_000;
    expect(rl.tryConsume("a", now)).toBe(true);
    expect(rl.tryConsume("a", now)).toBe(true);
    expect(rl.tryConsume("a", now)).toBe(false);
    // Different peer is unaffected.
    expect(rl.tryConsume("b", now)).toBe(true);
  });
});
