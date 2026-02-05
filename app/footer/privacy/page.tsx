'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import Footer from '../../components/Footer';

type ThemeMode = 'light' | 'dark';

type ScrambleRevealOptions = {
  stepMs?: number;
  revealPerTick?: number;
  charset?: string;
  spaceChance?: number;
};

const THEME_KEY = 'kpk_theme';

const BRAND_SHORT = 'KPK';
const BRAND_FULL = 'Kevin Philipp Koch';

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem(THEME_KEY);
  return saved === 'dark' || saved === 'light'
    ? saved
    : window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function applyTheme(mode: ThemeMode) {
  document.documentElement.classList.toggle('dark', mode === 'dark');
}

/* -------------------------- Scramble Reveal Hook ------------------------- */

function useScrambleReveal(
  targetText: string,
  active: boolean,
  opts: ScrambleRevealOptions = {}
) {
  const {
    stepMs = 18,
    revealPerTick = 1,
    charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
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
      Array.from({ length: remaining }, () =>
        Math.random() < spaceChance ? ' ' : randChar()
      ).join('');

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

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

/* ------------------------------ Page ------------------------------ */

export default function PrivacyPolicyPage() {
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const [brandActive, setBrandActive] = useState(false);
  const brandDisplay = useScrambleReveal(BRAND_FULL, brandActive);

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen kpk-page">
      <div className="kpk-canvas">
        {/* Header */}
        <div className="mx-auto w-full max-w-[77rem] px-[var(--grid-margin)] pt-8">
          <div className="flex items-center justify-between">
            <Link
              href="/#work"
              onMouseEnter={() => setBrandActive(true)}
              onMouseLeave={() => setBrandActive(false)}
              onFocus={() => setBrandActive(true)}
              onBlur={() => setBrandActive(false)}
              className={cx(
                'whitespace-nowrap select-none text-sm font-semibold tracking-tight text-(--text-strong) sm:text-base',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ring)',
                'focus-visible:ring-offset-4 focus-visible:ring-offset-(--bg)'
              )}
              aria-label={BRAND_FULL}
              title={BRAND_FULL}
            >
              <motion.span
                className="inline-block"
                initial={false}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.12 }}
              >
                {brandActive ? brandDisplay : BRAND_SHORT}
              </motion.span>
            </Link>

            <button
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              className="pill"
            >
              {theme === 'dark' ? 'Dark' : 'Light'}
            </button>
          </div>
        </div>

        {/* Content */}
        <section className="mx-auto w-full max-w-[77rem] px-[var(--grid-margin)] pt-16 pb-24">
          <div className="max-w-3xl space-y-10">
            <h1 className="text-5xl font-extrabold tracking-tight">
              Privacy Policy
            </h1>

            <section>
              <h2 className="text-xl font-semibold">1. General Information</h2>
              <p className="mt-3">
                This website is a personal portfolio used to present professional
                work and projects. Protecting your personal data is important to
                me. This privacy policy explains what data is collected when you
                visit this website and how it is used.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">2. Responsible Person</h2>
              <p className="mt-3">
                Kevin Philipp Koch<br />
                Germany
              </p>
              <p className="mt-2">
                Email:{' '}
                <a href="mailto:hello@kevinpkoch.com" className="underline">
                  hello@kevinpkoch.com
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">3. Hosting</h2>
              <p className="mt-3">
                This website is hosted by Vercel Inc., 440 N Barranca Ave #4133,
                Covina, CA 91723, USA. When visiting this website, technical data
                (server log files) may be processed to ensure the secure and
                reliable operation of the website.
              </p>
              <p className="mt-3">
                The legal basis for this processing is Art. 6(1)(f) GDPR
                (legitimate interest in the secure and efficient provision of
                this website).
              </p>
              <p className="mt-3">
                More information:{' '}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Vercel Privacy Policy
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">
                4. Web Analytics (Vercel)
              </h2>
              <p className="mt-3">
                This website uses Vercel Web Analytics, a cookie-less analytics
                service provided by Vercel Inc. No cookies, user profiles, or
                personal identifiers are used.
              </p>
              <p className="mt-3">
                The collected data is processed in an aggregated and anonymous
                form (e.g. page views, referrer information, device type) and
                does not allow conclusions about individual users.
              </p>
              <p className="mt-3">
                The legal basis for this processing is Art. 6(1)(f) GDPR
                (legitimate interest in analyzing and improving this website).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">5. Contact</h2>
              <p className="mt-3">
                If you contact me by email, the information you provide will be
                used solely to process your request. The data will not be shared
                with third parties and will be deleted when it is no longer
                required.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">6. Your Rights</h2>
              <p className="mt-3">
                You have the right to access, rectify, or delete your personal
                data, as well as the right to object to processing in accordance
                with the GDPR.
              </p>
              <p className="mt-3">
                To exercise your rights, please contact me via email.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">7. Changes</h2>
              <p className="mt-3">
                This privacy policy may be updated if required by law or due to
                technical changes. The current version is always available on
                this website.
              </p>
            </section>

            <div className="flex flex-wrap gap-3">
              <Link className="pill" href="/#work">
                ← Back to work
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}
