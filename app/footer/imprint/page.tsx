'use client';

import React, { useEffect, useMemo, useState } from 'react';
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

const BRAND_SHORT = 'KPK';
const BRAND_FULL = 'Kevin Philipp Koch';

const THEME_KEY = 'kpk_theme';

const USE_RECAPTCHA = false;

const RECAPTCHA_SITE_KEY = 'YOUR_RECAPTCHA_SITE_KEY'; // placeholder

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';

  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // ignore
  }

  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;
  return prefersDark ? 'dark' : 'light';
}

function applyTheme(mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', mode === 'dark');
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

/* -------------------------- Scramble Reveal Hook ------------------------- */

function useScrambleReveal(targetText: string, active: boolean, opts: ScrambleRevealOptions = {}) {
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
      Array.from({ length: remaining }, () => (Math.random() < spaceChance ? ' ' : randChar())).join('');

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

/* -------------------------------- Theme UI ------------------------------- */

function ThemeToggle({ mode, onToggle }: { mode: ThemeMode; onToggle: () => void }) {
  const isDark = mode === 'dark';

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cx(
        'pill inline-flex items-center gap-2',
        'rounded-full border border-(--border) bg-(--surface) px-4 py-2 text-sm font-medium text-(--text-strong)',
        'transition hover:bg-(--surface-hover)'
      )}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? (
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
      )}
      <span className="hidden sm:inline">{isDark ? 'Dark' : 'Light'}</span>
    </button>
  );
}

export default function ImprintPage() {
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());
  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  useEffect(() => {
    applyTheme(theme);
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // ----- Form UX state -----
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const formStartedAt = useMemo(() => Date.now(), []);

  useEffect(() => {
    if (!USE_RECAPTCHA) return;
    const s = document.createElement('script');
    s.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(RECAPTCHA_SITE_KEY)}`;
    s.async = true;
    s.defer = true;
    document.body.appendChild(s);

    return () => {
      document.body.removeChild(s);
    };
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');

    const form = e.currentTarget;
    const data = new FormData(form);

    // Timing: include how long the user took (ms)
    data.set('took_ms', String(Date.now() - formStartedAt));

    try {
      const res = await fetch('/send.php', {
        method: 'POST',
        body: data, // multipart/form-data - PHP friendly
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setStatus('error');
        setErrorMsg(json?.error || 'Message could not be sent. Please try again.');
        return;
      }

      setStatus('success');
      form.reset();
    } catch {
      setStatus('error');
      setErrorMsg('Network error. Please try again.');
    }
  }

  // Brand hover/focus state
  const [brandActive, setBrandActive] = useState(false);
  const brandDisplay = useScrambleReveal(BRAND_FULL, brandActive);

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen kpk-page">
      <div className="kpk-canvas">
        {/* Top row */}
        <div className="mx-auto w-full max-w-[77rem] px-[var(--grid-margin)] pt-8">
          <div className="flex items-center justify-between">
            {/* KPK BrandMark (replaces Back link) */}
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
              <motion.span className="inline-block" initial={false} animate={{ opacity: 1 }} transition={{ duration: 0.12 }}>
                {brandActive ? brandDisplay : BRAND_SHORT}
              </motion.span>
            </Link>

            <div className="flex items-center gap-3">
              <ThemeToggle mode={theme} onToggle={toggleTheme} />
            </div>
          </div>
        </div>

        {/* Content */}
        <section className="mx-auto w-full max-w-[77rem] px-[var(--grid-margin)] pt-16 pb-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-(--text-muted)">Legal</p>

            <h1 className="mt-3 text-5xl font-extrabold tracking-tight leading-[1.1] text-(--text-strong)">
              Imprint
            </h1>

            <div className="mt-10 space-y-10 text-lg leading-relaxed text-(--text)">
              <section>
                <h2 className="text-xl font-semibold text-(--text-strong)">Website operator</h2>
                <p className="mt-3">
                  Kevin Philipp Koch <br />
                  Garmischer Allee 15 <br />
                  86438 Kissing <br />
                  Germany
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-(--text-strong)">Contact</h2>
                <p className="mt-3 text-(--text-muted) text-base">
                  You can reach me via email or the contact form.
                </p>

                <p className="mt-3">
                  Email:{' '}
                  <a className="underline hover:text-(--text-strong)" href="mailto:hello@kevinpkoch.com">
                    hello@kevinpkoch.com
                  </a>
                </p>

                {/* Contact form */}
                <form onSubmit={onSubmit} className="mt-6 rounded-2xl border border-(--border) bg-(--surface) p-6">
                  <div className="absolute left-[-10000px] top-auto h-0 w-0 overflow-hidden" aria-hidden="true">
                    <label htmlFor="company">Company</label>
                    <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
                  </div>

                  {/* Optional: reCAPTCHA token placeholder */}
                  <input type="hidden" name="recaptcha_token" value="" />

                  <div className="grid gap-4">
                    <div>
                      <label className="text-sm font-medium text-(--text-strong)" htmlFor="name">
                        Name
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        maxLength={80}
                        className="mt-2 w-full rounded-xl border border-(--border) bg-(--surface) px-4 py-3 text-base text-(--text-strong) outline-none focus:ring-2 focus:ring-(--ring)"
                        placeholder="Your name"
                        autoComplete="name"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-(--text-strong)" htmlFor="email">
                        Email
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        maxLength={120}
                        className="mt-2 w-full rounded-xl border border-(--border) bg-(--surface) px-4 py-3 text-base text-(--text-strong) outline-none focus:ring-2 focus:ring-(--ring)"
                        placeholder="you@example.com"
                        autoComplete="email"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-(--text-strong)" htmlFor="message">
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        maxLength={2000}
                        rows={6}
                        className="mt-2 w-full resize-none rounded-xl border border-(--border) bg-(--surface) px-4 py-3 text-base text-(--text-strong) outline-none focus:ring-2 focus:ring-(--ring)"
                        placeholder="Write your message…"
                      />
                      <p className="mt-2 text-sm text-(--text-muted)">
                        By sending this message, you consent to processing the data solely to respond to your inquiry.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={status === 'sending'}
                        className={cx(
                          'pill rounded-full border border-(--border) bg-(--surface) px-5 py-2 text-sm font-medium text-(--text-strong)',
                          'transition hover:bg-(--surface-hover)',
                          status === 'sending' && 'opacity-60 cursor-not-allowed'
                        )}
                      >
                        {status === 'sending' ? 'Sending…' : 'Send message'}
                      </button>

                      {status === 'success' && <span className="text-sm text-(--text-muted)">✅ Message sent.</span>}
                      {status === 'error' && <span className="text-sm text-red-500">{errorMsg}</span>}
                    </div>
                  </div>
                </form>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-(--text-strong)">Responsible for content</h2>
                <p className="mt-3">Kevin Philipp Koch (address as above)</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-(--text-strong)">Liability for content</h2>
                <p className="mt-3 text-sm text-(--text-muted)">
                  The content of this website has been created with great care. However, no guarantee can be given for
                  accuracy, completeness, or timeliness.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-(--text-strong)">Liability for links</h2>
                <p className="mt-3 text-sm text-(--text-muted)">
                  This website may contain links to external websites. The respective providers are responsible for
                  their content. I have no influence over the content of external pages.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-(--text-strong)">Copyright</h2>
                <p className="mt-3 text-sm text-(--text-muted)">
                  All content and works on this website are subject to copyright law. Any duplication, processing, or
                  distribution requires prior written consent.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-(--text-strong)">Data protection</h2>
                <p className="mt-3 text-sm text-(--text-muted)">
                  Personal data is processed only when you contact me via email or the contact form, and only for the
                  purpose of responding to your inquiry. No tracking, analytics, or marketing cookies are used on this
                  website.
                </p>
              </section>
                                <div className="flex flex-wrap gap-3">
                    <Link className="pill" href="/#work">
                      ← Back to work
                    </Link>
                  </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}
