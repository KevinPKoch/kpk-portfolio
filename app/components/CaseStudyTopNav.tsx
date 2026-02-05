"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type ThemeMode = "light" | "dark";

type ScrambleRevealOptions = {
  stepMs?: number;
  revealPerTick?: number;
  charset?: string;
  spaceChance?: number;
};

const BRAND_SHORT = "KPK";
const BRAND_FULL = "Kevin Philipp Koch";

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* -------------------------- Scramble Reveal Hook ------------------------- */

function useScrambleReveal(targetText: string, active: boolean, opts: ScrambleRevealOptions = {}) {
  const {
    stepMs = 18,
    revealPerTick = 1,
    charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    spaceChance = 0.12,
  } = opts;

  const [value, setValue] = useState<string>(BRAND_SHORT);

  useEffect(() => {
    if (!active) return;

    let rafId = 0;
    let timeoutId = 0;
    let revealCount = 0;
    let cancelled = false;

    const randChar = () => charset[Math.floor(Math.random() * charset.length)];
    const buildScramble = (remaining: number) =>
      Array.from({ length: remaining }, () => (Math.random() < spaceChance ? " " : randChar())).join("");

    const tick = () => {
      if (cancelled) return;

      revealCount = Math.min(targetText.length, revealCount + revealPerTick);

      const revealed = targetText.slice(0, revealCount);
      const remaining = targetText.length - revealCount;

      if (remaining <= 0) {
        setValue(targetText);
        return;
      }

      setValue(revealed + buildScramble(remaining));

      timeoutId = window.setTimeout(() => {
        rafId = window.requestAnimationFrame(tick);
      }, stepMs);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (rafId) window.cancelAnimationFrame(rafId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [active, targetText, stepMs, revealPerTick, charset, spaceChance]);

  return active ? value : BRAND_SHORT;
}

/* ------------------------------- UI pieces -------------------------------- */

function ThemeIcon({ mode }: { mode: ThemeMode }) {
  const isDark = mode === "dark";
  return isDark ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 13.2A8.5 8.5 0 0 1 10.8 3a6.5 6.5 0 1 0 10.2 10.2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function CaseStudyTopNav({
  theme,
  onToggleTheme,
}: {
  theme: ThemeMode;
  onToggleTheme: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  // Brand hover/focus state
  const [brandActive, setBrandActive] = useState(false);
  const brandDisplay = useScrambleReveal(BRAND_FULL, brandActive);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 420px)");
    const update = () => setIsCompact(mq.matches);
    update();

    if (typeof mq.addEventListener === "function") mq.addEventListener("change", update);
    else mq.addListener(update);

    return () => {
      if (typeof mq.removeEventListener === "function") mq.removeEventListener("change", update);
      else mq.removeListener(update);
    };
  }, []);

  return (
    <header
      className={cx(
        "fixed top-0 left-0 z-50 w-full transition-colors duration-200",
        scrolled ? "bg-(--header-bg) backdrop-blur" : "bg-transparent"
      )}
    >
      <nav
        aria-label="Case study"
        className="mx-auto flex h-[72px] max-w-[var(--canvas-max)] items-center justify-between px-[var(--grid-margin)]"
      >
        {/* KPK BrandMark (replaces Back link) */}
        <Link
          href="/#work"
          onMouseEnter={() => !isCompact && setBrandActive(true)}
          onMouseLeave={() => setBrandActive(false)}
          onFocus={() => !isCompact && setBrandActive(true)}
          onBlur={() => setBrandActive(false)}
          className={cx(
            "whitespace-nowrap select-none text-sm font-semibold tracking-tight text-(--text-strong) sm:text-base",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ring)",
            "focus-visible:ring-offset-4 focus-visible:ring-offset-(--bg)"
          )}
          aria-label={BRAND_FULL}
          title={BRAND_FULL}
        >
          <motion.span className="inline-block" initial={false} animate={{ opacity: 1 }} transition={{ duration: 0.12 }}>
            {!isCompact && brandActive ? brandDisplay : BRAND_SHORT}
          </motion.span>
        </Link>

        <div className="flex items-center gap-3">
          <a className="pill" href="/download/kevin-p-koch-cv-en.pdf" target="_blank" rel="noreferrer" download>
            CV
          </a>
          <a className="pill" href="mailto:hello@kevinpkoch.com">
            Email
          </a>

          <button
            type="button"
            onClick={onToggleTheme}
            className={cx(
              "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition",
              "border-(--border) bg-(--surface) text-(--text)",
              "hover:bg-(--surface-hover)",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ring)",
              "focus-visible:ring-offset-4 focus-visible:ring-offset-(--bg)"
            )}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            <ThemeIcon mode={theme} />
            <span className="hidden sm:inline">{theme === "dark" ? "Dark" : "Light"}</span>
          </button>
      </div>
      </nav>
      
    </header>
  );
}
