'use client';

import type { ReactNode } from 'react';
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type FooterProps = {
  /** Brand name shown in the copyright line */
  brandFull?: string;
  /** Show the little “Thanks for scrolling” pill (Home only) */
  showScrollThanks?: boolean;
  /** Element id to observe for ScrollThanks */
  scrollThanksTargetId?: string;
  /** How long the pill stays visible (ms) */
  scrollThanksTtlMs?: number;
};

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter((c): c is string => Boolean(c)).join(' ');

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  const isExternal = /^https?:\/\//.test(href);
  return (
    <a
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noreferrer' : undefined}
      className="text-(--text-muted) hover:text-(--accent) rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-4 focus-visible:ring-offset-(--bg)"
    >
      {children}
    </a>
  );
}

function ScrollThanks({
  targetId,
  ttlMs,
}: {
  targetId: string;
  ttlMs: number;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!targetId) return;

    try {
      if (sessionStorage.getItem('kpk_scroll_thanks_shown') === '1') return;
    } catch {
      // ignore
    }

    const el = document.getElementById(targetId);
    if (!el) return;

    let done = false;

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (!done && entry.isIntersecting) {
          done = true;
          setShow(true);
          try {
            sessionStorage.setItem('kpk_scroll_thanks_shown', '1');
          } catch {
            // ignore
          }
          obs.disconnect();
        }
      },
      { threshold: 0, rootMargin: '0px 0px -12% 0px' }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [targetId]);

  useEffect(() => {
    if (!show) return;
    const t = window.setTimeout(() => setShow(false), ttlMs);
    return () => window.clearTimeout(t);
  }, [show, ttlMs]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="absolute left-1/2 top-1/2 z-10 w-[min(560px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2"
        >
          <div className="mx-auto rounded-full border border-(--border) bg-(--pill-bg) px-5 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-(--text)">
                Thanks for scrolling — happy to connect.
              </p>
              <button
                type="button"
                onClick={() => setShow(false)}
                className="rounded-full p-1 text-(--text-faint) hover:text-(--accent) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-4 focus-visible:ring-offset-(--bg)"
                aria-label="Dismiss"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Footer({
  brandFull = 'Kevin Philipp Koch',
  showScrollThanks = false,
  scrollThanksTargetId = 'about-end',
  scrollThanksTtlMs = 4200,
}: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="relative">
      <div className={cx('mx-auto w-full max-w-[77rem] px-[var(--grid-margin)]', 'py-10')}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-(--text-faint)">© {year} {brandFull}</p>

          <div className="flex gap-5 text-sm">
            <FooterLink href="/footer/privacy/">Privacy Policy</FooterLink>
            <FooterLink href="/footer/imprint/">Imprint</FooterLink>
          </div>
        </div>
      </div>

      {showScrollThanks ? (
        <ScrollThanks targetId={scrollThanksTargetId} ttlMs={scrollThanksTtlMs} />
      ) : null}
    </footer>
  );
}
