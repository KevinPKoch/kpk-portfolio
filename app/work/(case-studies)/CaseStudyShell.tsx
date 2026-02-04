"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import CaseStudyTopNav from "@/app/components/CaseStudyTopNav";


type ThemeMode = "light" | "dark";
const THEME_KEY = "kpk_theme";

function applyTheme(mode: ThemeMode) {
  document.documentElement.classList.toggle("dark", mode === "dark");
  document.documentElement.dataset.theme = mode; // optional, praktisch fürs Debugging
}

function getStoredTheme(): ThemeMode | null {
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    return saved === "light" || saved === "dark" ? saved : null;
  } catch {
    return null;
  }
}

function getSystemTheme(): ThemeMode {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function CaseStudyShell({ children }: { children: ReactNode }) {
  // Wichtig: Default muss SSR-safe sein (kein window Zugriff!)
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  // 1) Beim Mount echtes Theme bestimmen (localStorage -> system)
  useEffect(() => {
    const stored = getStoredTheme();
    const initial = stored ?? getSystemTheme();

    setTheme(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  // 2) Theme Änderungen anwenden + persistieren (aber erst nach Mount)
  useEffect(() => {
    if (!mounted) return;

    applyTheme(theme);
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme, mounted]);

  // 3) Optional: System-Theme-Changes übernehmen, aber nur wenn User nichts gespeichert hat
  useEffect(() => {
    if (!mounted) return;

    const stored = getStoredTheme();
    if (stored) return; // User override wins

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setTheme(mql.matches ? "dark" : "light");

    // Safari fallback
    if (typeof mql.addEventListener === "function") mql.addEventListener("change", onChange);
    else mql.addListener(onChange);

    return () => {
      if (typeof mql.removeEventListener === "function") mql.removeEventListener("change", onChange);
      else mql.removeListener(onChange);
    };
  }, [mounted]);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  // mounted-Guard: verhindert, dass die Nav beim ersten Paint kurz falsches Theme anzeigt
  const safeThemeForUI: ThemeMode = mounted ? theme : "light";

  return (
    <>
      <CaseStudyTopNav theme={safeThemeForUI} onToggleTheme={toggleTheme} />
      <main id="main-content" tabIndex={-1}>{children}</main>
    </>
  );
}
