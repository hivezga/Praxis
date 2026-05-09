import type { Config } from "tailwindcss";
import containerQueries from "@tailwindcss/container-queries";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Faction accents — picked to read on both light and dark backgrounds.
        // Doctrinal hex values; do not change.
        // DEFAULT is the doctrinal hex — used for stripes, rails, identity
        // marks. `-deep` is a darker AA-passing shade for text/headers on
        // light surfaces. `-soft` is the pastel tint. `-ink` is the
        // text-on-deep contrast colour (near-white but tinted to match).
        working:    { DEFAULT: "#dc2626", deep: "#991b1b", soft: "#fee2e2", ink: "#fef2f2" }, // red-600 / red-800
        middle:     { DEFAULT: "#16a34a", deep: "#166534", soft: "#dcfce7", ink: "#f0fdf4" }, // green-600 / green-800
        capitalist: { DEFAULT: "#2563eb", deep: "#1e40af", soft: "#dbeafe", ink: "#eff6ff" }, // blue-600 / blue-800
        state:      { DEFAULT: "#9333ea", deep: "#6b21a8", soft: "#f3e8ff", ink: "#faf5ff" }, // purple-600 / purple-800

        // Semantic tokens backed by CSS vars in globals.css.
        // Format: rgb triplet without alpha, so Tailwind's /<alpha> still works.
        paper:        "rgb(var(--paper) / <alpha-value>)",
        paperSoft:    "rgb(var(--paper-soft) / <alpha-value>)",
        surface:      "rgb(var(--surface) / <alpha-value>)",
        surfaceSoft:  "rgb(var(--surface-soft) / <alpha-value>)",
        surfaceMute:  "rgb(var(--surface-mute) / <alpha-value>)",
        ink:          "rgb(var(--ink) / <alpha-value>)",
        inkSoft:      "rgb(var(--ink-soft) / <alpha-value>)",
        inkMute:      "rgb(var(--ink-mute) / <alpha-value>)",
        inkSubtle:    "rgb(var(--ink-subtle) / <alpha-value>)",
        rule:         "rgb(var(--rule) / <alpha-value>)",
        ruleStrong:   "rgb(var(--rule-strong) / <alpha-value>)",
        accent:       "rgb(var(--accent) / <alpha-value>)",
        accentSoft:   "rgb(var(--accent-soft) / <alpha-value>)",
        accentInk:    "rgb(var(--accent-ink) / <alpha-value>)",
        danger:       "rgb(var(--danger) / <alpha-value>)",
        dangerSoft:   "rgb(var(--danger-soft) / <alpha-value>)",
        positive:     "rgb(var(--positive) / <alpha-value>)",
        positiveSoft: "rgb(var(--positive-soft) / <alpha-value>)",
        warning:      "rgb(var(--warning) / <alpha-value>)",
        warningSoft:  "rgb(var(--warning-soft) / <alpha-value>)",
      },
      fontFamily: {
        sans:    ["var(--font-sans)",    "ui-sans-serif", "system-ui", "sans-serif"],
        mono:    ["var(--font-mono)",    "ui-monospace", "SFMono-Regular", "monospace"],
        serif:   ["var(--font-serif)",   "ui-serif", "Georgia", "serif"],
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Fluid scale — clamp(min, preferred, max). Use these instead of fixed
        // text-{size} on prose and headings so layout survives 80–200% zoom.
        "fluid-xs":   ["clamp(0.6875rem, 0.6vw + 0.55rem, 0.75rem)",  { lineHeight: "1.4" }],
        "fluid-sm":   ["clamp(0.75rem,   0.85vw + 0.6rem, 0.875rem)", { lineHeight: "1.45" }],
        "fluid-base": ["clamp(0.875rem,  1vw + 0.7rem,    1rem)",     { lineHeight: "1.55" }],
        "fluid-lg":   ["clamp(1rem,      1.5vw + 0.7rem,  1.25rem)",  { lineHeight: "1.55" }],
        "fluid-xl":   ["clamp(1.125rem,  2vw + 0.7rem,    1.5rem)",   { lineHeight: "1.4" }],
        "poster-md":  ["clamp(1.25rem,   3vw + 0.5rem,    1.875rem)", { lineHeight: "1.05" }],
        "poster-lg":  ["clamp(1.875rem,  5vw + 0.5rem,    3.5rem)",   { lineHeight: "0.95" }],
        "poster-xl":  ["clamp(2.5rem,    8vw + 0.5rem,    5rem)",     { lineHeight: "0.9"  }],
      },
      boxShadow: {
        // Flat, hard-edged offset — no blur. Civic-poster CTA cue.
        poster:      "3px 3px 0 0 rgb(var(--ink) / 0.85)",
        "poster-sm": "2px 2px 0 0 rgb(var(--ink) / 0.7)",
      },
      borderRadius: {
        // Sharper edges than default — pamphlet feel.
        sharp: "2px",
      },
      minHeight: {
        // 44 px = WCAG 2.2 AA tap target.
        tap: "44px",
      },
      minWidth: {
        tap: "44px",
      },
    },
  },
  plugins: [containerQueries],
};

export default config;
