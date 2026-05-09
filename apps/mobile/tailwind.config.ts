import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        working:    { DEFAULT: "#ef4444", soft: "#fee2e2" },
        middle:     { DEFAULT: "#22c55e", soft: "#dcfce7" },
        capitalist: { DEFAULT: "#60a5fa", soft: "#dbeafe" },
        state:      { DEFAULT: "#c084fc", soft: "#f3e8ff" },
      },
      fontFamily: {
        mono: ["SpaceMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
