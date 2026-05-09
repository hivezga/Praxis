/**
 * Token-bucket rate limiter — one bucket per peer.
 *
 * - Bucket capacity = `burst` tokens.
 * - Refills at `refillPerSecond` tokens/sec (continuous).
 * - `tryConsume(peerId)` returns true if a token was available.
 *
 * Used by the host to drop floods from a single peer before they
 * reach the game-state machine.
 */

export interface RateLimiterOptions {
  /** Burst capacity (max tokens at any instant). */
  burst: number;
  /** Steady-state refill rate. */
  refillPerSecond: number;
}

interface Bucket {
  tokens: number;
  updatedMs: number;
}

export class RateLimiter {
  private readonly burst: number;
  private readonly refillPerMs: number;
  private buckets = new Map<string, Bucket>();

  constructor({ burst, refillPerSecond }: RateLimiterOptions) {
    this.burst = burst;
    this.refillPerMs = refillPerSecond / 1000;
  }

  tryConsume(peerId: string, nowMs: number = Date.now()): boolean {
    const bucket = this.buckets.get(peerId) ?? {
      tokens: this.burst,
      updatedMs: nowMs,
    };
    const elapsed = Math.max(0, nowMs - bucket.updatedMs);
    bucket.tokens = Math.min(this.burst, bucket.tokens + elapsed * this.refillPerMs);
    bucket.updatedMs = nowMs;
    if (bucket.tokens < 1) {
      this.buckets.set(peerId, bucket);
      return false;
    }
    bucket.tokens -= 1;
    this.buckets.set(peerId, bucket);
    return true;
  }

  reset(peerId: string): void {
    this.buckets.delete(peerId);
  }

  clear(): void {
    this.buckets.clear();
  }
}
