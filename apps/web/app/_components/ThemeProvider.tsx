"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "system" | "dark" | "light";
const STORAGE_KEY = "praxis.theme";

interface Ctx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolved: "dark" | "light";
}

const ThemeCtx = createContext<Ctx | null>(null);

function resolve(theme: Theme): "dark" | "light" {
  if (theme === "system") {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  return theme;
}

function apply(resolved: "dark" | "light") {
  const root = document.documentElement;
  root.classList.remove("theme-light", "dark");
  if (resolved === "light") {
    root.classList.add("theme-light");
  } else {
    root.classList.add("dark");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial = stored ?? "system";
    setThemeState(initial);
    const r = resolve(initial);
    setResolved(r);
    apply(r);
  }, []);

  // React to system changes when in "system" mode.
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => {
      const r = resolve("system");
      setResolved(r);
      apply(r);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  function setTheme(next: Theme) {
    window.localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
    const r = resolve(next);
    setResolved(r);
    apply(r);
  }

  return (
    <ThemeCtx.Provider value={{ theme, setTheme, resolved }}>{children}</ThemeCtx.Provider>
  );
}

export function useTheme(): Ctx {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
