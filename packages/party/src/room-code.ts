/**
 * Room codes are 6 alphanumeric characters, uppercase, excluding ambiguous
 * glyphs (0/O, 1/I/L). PeerIDs derived from the code are namespaced to avoid
 * collisions on the public PeerJS broker.
 */

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const NAMESPACE = "praxis-hegemony";

export function makeRoomCode(): string {
  // Rejection sampling: bytes ≥ MAX_VALID would skew the distribution
  // toward the lower part of ALPHABET (modulo bias), so resample them.
  const N = ALPHABET.length;
  const MAX_VALID = Math.floor(256 / N) * N;
  let out = "";
  const buf = new Uint8Array(1);
  while (out.length < 6) {
    crypto.getRandomValues(buf);
    if (buf[0] < MAX_VALID) {
      out += ALPHABET[buf[0] % N];
    }
  }
  return out;
}

export function peerIdFromCode(code: string): string {
  return `${NAMESPACE}-${code.toUpperCase()}`;
}

export function isValidRoomCode(code: string): boolean {
  if (code.length !== 6) return false;
  for (const ch of code.toUpperCase()) {
    if (!ALPHABET.includes(ch)) return false;
  }
  return true;
}
