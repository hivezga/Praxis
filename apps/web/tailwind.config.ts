import type { Config } from "tailwindcss";

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
        working:    { DEFAULT: "#dc2626", soft: "#fee2e2" }, // red-600
        middle:     { DEFAULT: "#16a34a", soft: "#dcfce7" }, // green-600
        capitalist: { DEFAULT: "#2563eb", soft: "#dbeafe" }, // blue-600
        state:      { DEFAULT: "#9333ea", soft: "#f3e8ff" }, // purple-600

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
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
