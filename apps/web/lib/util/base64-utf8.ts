/**
 * UTF-8 safe base64 encode/decode for share links and exported state.
 *
 * Replaces the deprecated `btoa(unescape(encodeURIComponent(...)))`
 * pattern, which silently corrupts emoji and other non-ASCII characters.
 * Uses `TextEncoder`/`TextDecoder` (available in browsers and Node 18+).
 */

export function encode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
}

export function decode(b64: string): string {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}
