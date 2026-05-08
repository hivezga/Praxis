import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brighter faction accents — more readable on #0b0f17 background.
        working:    { DEFAULT: "#ef4444", soft: "#fee2e2" }, // red-500
        middle:     { DEFAULT: "#22c55e", soft: "#dcfce7" }, // green-500
        capitalist: { DEFAULT: "#60a5fa", soft: "#dbeafe" }, // blue-400
        state:      { DEFAULT: "#c084fc", soft: "#f3e8ff" }, // purple-400
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
