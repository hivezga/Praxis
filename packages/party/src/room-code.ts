/**
 * Room codes are 6 alphanumeric characters, uppercase, excluding ambiguous
 * glyphs (0/O, 1/I/L). PeerIDs derived from the code are namespaced to avoid
 * collisions on the public PeerJS broker.
 */

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const NAMESPACE = "praxis-hegemony";

export function makeRoomCode(): string {
  let out = "";
  const buf = new Uint8Array(6);
  crypto.getRandomValues(buf);
  for (let i = 0; i < 6; i++) {
    out += ALPHABET[buf[i] % ALPHABET.length];
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
