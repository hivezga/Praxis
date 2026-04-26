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
        // Subtle class accents — utilitarian, not the game's actual palette.
        working: { DEFAULT: "#b91c1c", soft: "#fee2e2" },
        middle: { DEFAULT: "#15803d", soft: "#dcfce7" },
        capitalist: { DEFAULT: "#1d4ed8", soft: "#dbeafe" },
        state: { DEFAULT: "#7e22ce", soft: "#f3e8ff" },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
