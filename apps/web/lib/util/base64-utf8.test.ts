import { describe, expect, it } from "vitest";

import { decode, encode } from "./base64-utf8";

describe("base64-utf8 round-trip", () => {
  it("preserves emoji", () => {
    const input = "play 🎲 then 🎯";
    expect(decode(encode(input))).toBe(input);
  });

  it("preserves non-ASCII Latin", () => {
    const input = "café résumé piñata";
    expect(decode(encode(input))).toBe(input);
  });

  it("preserves CJK", () => {
    const input = "中文 漢字 한글 日本語";
    expect(decode(encode(input))).toBe(input);
  });

  it("preserves apostrophes and newlines", () => {
    const input = "don’t — line one\nline two";
    expect(decode(encode(input))).toBe(input);
  });

  it("round-trips a real-shaped JSON payload", () => {
    const obj = {
      meta: { id: "g1", name: "Mañana 🎲", round: 3 },
      classes: { working: { vp: 12, money: 30 } },
    };
    const json = JSON.stringify(obj);
    expect(JSON.parse(decode(encode(json)))).toEqual(obj);
  });
});
