'use client';

import type { ReactNode } from 'react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import Footer from '../components/Footer';

/* --------------------------------- Types -------------------------------- */

type Greeting = { language: string; text: string };

type TabContentEntry = {
  title: ReactNode;
  body: string;
};

type ScrambleRevealOptions = {
  stepMs?: number;
  revealPerTick?: number;
  charset?: string;
  spaceChance?: number;
};

type ThemeMode = 'light' | 'dark';

type WorkCase = {
  id: string;
  href: string;
  indexLabel: string; // "01"
  meta: {
    platform: string; // "Mobile App & Responsive Web"
    tag: string; // "Integration support"
    readTime?: string; // "~8 min read"
  };
  title: string;
  description: string;
  image: {
    src: string;
    alt: string;
  };
  ndaNote?: string; // optional
};

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter((c): c is string => Boolean(c)).join(' ');

/* --------------------------------- Data --------------------------------- */

const GREETINGS: Greeting[] = [
  { language: 'English', text: 'Hello' },
  { language: 'Arabic', text: 'مرحبا' },
  { language: 'Bengali', text: 'হ্যালো' },
  { language: 'French', text: 'Bonjour' },
  { language: 'German', text: 'Hallo' },
  { language: 'Hindi', text: 'नमस्ते' },
  { language: 'Italian', text: 'Ciao' },
  { language: 'Japanese', text: 'こんにちは' },
  { language: 'Korean', text: '안녕하세요' },
  { language: 'Mandarin', text: '你好' },
  { language: 'Persian', text: 'سلام' },
  { language: 'Polish', text: 'Cześć' },
  { language: 'Portuguese', text: 'Olá' },
  { language: 'Russian', text: 'Привет' },
  { language: 'Spanish', text: 'Hola' },
  { language: 'Swahili', text: 'Hujambo' },
  { language: 'Turkish', text: 'Merhaba' },
  { language: 'Urdu', text: 'سلام' },
  { language: 'Vietnamese', text: 'Xin chào' },
];

const TAB_CONTENT = {
  Everyone: {
    title:
      'I’m a digital designer with a strong focus on UX and UI design, working closely with product teams to deliver clear and high-performing digital products in complex environments.',
    body: 'I help teams navigate complexity and make design decisions that support performance, efficiency, and scalable systems.',
  },
  Recruiters: {
    title: 'I create user interfaces that are easy to use and understand, helping users quickly make sense of complex products.',
    body: 'My work spans UX, UI, and design systems across complex digital products.',
  },
  'Product Managers': {
    title: 'I work across UX design, UI design, and design systems, focusing on building scalable solutions for complex digital products.',
    body: 'Working closely with PMs to shape ideas into features that work for users and the business.',
  },
  Developers: {
    title: 'I design with implementation in mind, creating interfaces with clear logic, seamless transitions, and decisions that scale over time.',
    body: 'Built for clean handoffs and real-world implementation.',
  },
  'Design Teams': {
    title: 'I think in systems, not just screens, focusing on consistency, hierarchy, and decisions that scale beyond a single interface. By balancing user needs and long-term value, I help turn ideas into products people actually use.',
    body: 'I care about consistency, hierarchy, and decisions that scale beyond a single interface.',
  },
  Stakeholders: {
    title:'I help turn ideas into usable products by aligning user needs, business goals, and long-term value.',
    body: 'Where user needs and business goals meet long-term product value.',
  },
} as const satisfies Record<string, TabContentEntry>;

type TabKey = keyof typeof TAB_CONTENT;

/* ------------------------------ Constants ------------------------------- */

const BRAND_SHORT = 'KPK';
const BRAND_FULL = 'Kevin Philipp Koch';

const SECTIONS = ['work', 'about', 'contact'] as const;
const SCROLLSPY_TOP = 140;
const CLICK_LOCK_MS = 700;

const LINKS = {
  email: 'mailto:hello@kevinpkoch.com',
  linkedin: 'https://www.linkedin.com/in/kevin-philipp-koch/',
  xing: 'https://www.xing.com/profile/KevinPhilipp_Koch/',
} as const;

const THEME_KEY = 'kpk_theme';

/* ------------------------------ Work data ------------------------------ */

const WORK_CASES: WorkCase[] = [
  {
    id: 'eeszy',
    href: '/work/calibration-software',
    indexLabel: '01',
    meta: {
      platform: 'B2B SaaS',
      tag: 'Calibration & Testing',
      readTime: '~9–12 min read',
    },
    title: 'Calibration Software Platform',
    description:
      'A UX foundation and software UI for a regulated calibration system, built with a purpose-built design system, research-driven scoping, compliant audit trails, and a flexible white-label design language.',
    image: {
      src: '/images/calibration-platform.png',
      alt: 'Calibration Platform – Dashboard Preview',
    },
  },
  {
    id: 'dex',
    href: '/work/decentralized-exchange',
    indexLabel: '02',
    meta: {
      platform: 'Trading Platform',
      tag: 'UI Design & Design System',
      readTime: '~6 min read',
    },
    title: 'UI for Traders Who Move Fast',
    description:
      'A trading interface built for speed and clarity, with a strong focus on usability in high-pressure situations. Based on a scalable design system and a clear visual hierarchy, the product supports complex trading flows across both web and mobile.',
    image: {
      src: '/images/decentralized-exchange.png',
      alt: 'Decentralized Derivatives Exchange – UI Preview',
    },
  },
  {
    id: 'jumpstart',
    href: '/work/jumpstart-muc',
    indexLabel: '03',
    meta: {
      platform: 'Mobile App & Responsive Web',
      tag: 'Integration support',
      readTime: '~8 min read',
    },
    title: 'Designing an integration companion for newcomers in Germany',
    description:
      'A mobile app and responsive web concept designed to help refugees and immigrants navigate bureaucracy and access essential information in Germany, starting in Munich. The project is grounded in user research, interviews, and an unmoderated usability study, which informed key design decisions such as guest access, clear progress visibility, and built-in support mechanisms.',
    image: {
      src: '/images/jumpstart-muc.png',
      alt: 'Jumpstart MUC – App Preview',
    },
  },
];


/* --------------------------------- Theme -------------------------------- */

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';

  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // ignore
  }

  const prefersDark =
    window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;
  return prefersDark ? 'dark' : 'light';
}

function applyTheme(mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', mode === 'dark');
}

/* --------------------------------- UI ---------------------------------- */

const layout = {
  page: 'min-h-screen',
  container: 'mx-auto w-full max-w-[77rem] px-[var(--grid-margin)]',
  // Mobile: start the hero higher so the greeting doesn't sit too far down.
  hero: 'pt-[40px] sm:pt-[160px] pb-14 sm:pb-16',
};

const text = {
  /* Fluid type scales better across mobile/tablet/desktop */
  // Mobile: slightly larger greeting + safer line-height to avoid clipping scripts like Hindi.
  h1: 'mb-6 sm:mb-10 overflow-visible text-balance font-extrabold tracking-tight text-(--text-strong) text-[clamp(3.5rem,10vw,7.25rem)] leading-[1.05] sm:leading-[0.95]',
  title:
  'mb-4 font-semibold leading-tight text-(--text-strong) text-[1.6rem] sm:text-[clamp(1.75rem,3vw,3.25rem)]',
  body: 'text-[15px] sm:text-[clamp(0.95rem,1.1vw,1.05rem)] leading-relaxed text-(--text-muted)',
};

const tabs = {
  // Mobile: tabs should take less vertical space and read like a compact nav.
  wrap: 'mb-4 flex w-full flex-wrap gap-x-6 gap-y-1 text-[15px] sm:text-lg',
  btnBase: 'border-b-2 border-transparent py-0.5 font-medium leading-tight transition',
  btnActive: 'font-semibold tracking-tight text-(--accent)',
  btnInactive: 'text-(--text-faint) hover:text-(--accent)',
};

/* --------------------------------- Hooks -------------------------------- */

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

function useGreetingRotation(intervalMs = 4000) {
  const [index, setIndex] = useState<number>(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % GREETINGS.length);
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [intervalMs]);

  return index;
}

function useScrollTopVisibility(thresholdPx = 12) {
  const [visible, setVisible] = useState<boolean>(true);

  useEffect(() => {
    const sync = () => setVisible(window.scrollY < thresholdPx);
    sync();
    window.addEventListener('scroll', sync, { passive: true });
    return () => window.removeEventListener('scroll', sync);
  }, [thresholdPx]);

  return visible;
}

function useIsScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return scrolled;
}

/* ------------------------------ UI Helpers ------------------------------ */

function SectionDivider() {
  return <div className="border-t border-(--border)" />;
}

function PillLink({ href, children }: { href: string; children: ReactNode }) {
  const isExternal = /^https?:\/\//.test(href);
  return (
    <a
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noreferrer' : undefined}
      className="inline-flex items-center justify-center rounded-full border border-(--border) bg-(--surface) px-5 py-2 text-sm font-medium text-(--text-strong) transition hover:border-gray-300 hover:bg-(--surface-hover) dark:hover:border-white/20"
    >
      {children}
    </a>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  const isExternal = /^https?:\/\//.test(href);
  return (
    <a
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noreferrer' : undefined}
      className="text-(--text-muted) hover:text-(--accent)"
    >
      {children}
    </a>
  );
}

function ThemeToggle({
  mode,
  onToggle,
}: {
  mode: ThemeMode;
  onToggle: () => void;
}) {
  const isDark = mode === 'dark';

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cx(
        'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition',
        'border-(--border)',
        'bg-(--surface)',
        'text-(--text)',
        'hover:bg-(--surface-hover)',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-4 focus-visible:ring-offset-(--bg)'
      )}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M21 13.2A8.5 8.5 0 0 1 10.8 3a6.5 6.5 0 1 0 10.2 10.2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"
            stroke="currentColor"
            strokeWidth="2"
          />
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

/* ------------------------------ Components ------------------------------ */

function BrandMark() {
  const [active, setActive] = useState<boolean>(false);
  const [isCompact, setIsCompact] = useState(false);
  const display = useScrambleReveal(BRAND_FULL, active);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 420px)');
    const update = () => setIsCompact(mq.matches);
    update();

    if (typeof mq.addEventListener === 'function') mq.addEventListener('change', update);
    else mq.addListener(update);

    return () => {
      if (typeof mq.removeEventListener === 'function') mq.removeEventListener('change', update);
      else mq.removeListener(update);
    };
  }, []);

  const scrollTopSmooth = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={scrollTopSmooth}
      onMouseEnter={() => !isCompact && setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => !isCompact && setActive(true)}
      onBlur={() => setActive(false)}
      className={cx(
        'whitespace-nowrap select-none text-sm font-semibold tracking-tight text-(--text-strong) sm:text-base',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-4 focus-visible:ring-offset-(--bg)'
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
        {!isCompact && active ? display : BRAND_SHORT}
      </motion.span>
    </button>
  );
}

function Header({
  theme,
  onToggleTheme,
}: {
  theme: ThemeMode;
  onToggleTheme: () => void;
}) {
  const [activeSection, setActiveSection] = useState<
    (typeof SECTIONS)[number] | null
  >(null);
  const isScrolled = useIsScrolled(8);

  const clickLockRef = useRef(false);
  const unlockTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const getActiveSection = (): (typeof SECTIONS)[number] | null => {
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      if (atBottom) return SECTIONS[SECTIONS.length - 1];

      let current: (typeof SECTIONS)[number] | null = null;

      for (const id of SECTIONS) {
        const el = document.getElementById(id);
        if (!el) continue;

        const top = el.getBoundingClientRect().top;

        if (top <= SCROLLSPY_TOP) {
          current = id;
        } else {
          break;
        }
      }

      return current;
    };

    const onScroll = () => {
      if (clickLockRef.current) return;
      setActiveSection(getActiveSection());
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    return () => {
      if (unlockTimerRef.current) window.clearTimeout(unlockTimerRef.current);
    };
  }, []);

  const lockClickSpy = () => {
    clickLockRef.current = true;

    if (unlockTimerRef.current) window.clearTimeout(unlockTimerRef.current);
    unlockTimerRef.current = window.setTimeout(() => {
      clickLockRef.current = false;
    }, CLICK_LOCK_MS);
  };

  const scrollToId = (id: (typeof SECTIONS)[number]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const navTo =
    (id: (typeof SECTIONS)[number]) =>
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      setActiveSection(id);
      lockClickSpy();
      scrollToId(id);

      window.setTimeout(() => {
        const target = document.getElementById(id);
        if (target) setActiveSection(id);
      }, CLICK_LOCK_MS);
    };

  const linkClass = (id: (typeof SECTIONS)[number]) =>
    cx(
      'transition',
      'rounded-md px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-4 focus-visible:ring-offset-(--bg)',
      activeSection === id
        ? 'font-bold text-(--accent)'
        : 'font-medium text-(--text-muted) hover:text-(--accent)'
    );

  return (
    <header
      className={cx(
        'sticky top-0 z-50 transition-colors duration-200',
        isScrolled ? 'bg-(--header-bg) backdrop-blur' : 'bg-transparent'
      )}
    >
      <div
        className={cx(
          layout.container,
          'flex items-center justify-between py-4 transition-colors duration-200'
        )}
      >
        <BrandMark />

        <nav aria-label="Primary" className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm sm:text-base">
          <a className={linkClass('work')} href="#work" onClick={navTo('work')}>
            Work
          </a>
          <a className={linkClass('about')} href="#about" onClick={navTo('about')}>
            About
          </a>
          <a
            className={cx(
              'font-medium text-(--text-muted) transition hover:text-(--accent)',
              'rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-4 focus-visible:ring-offset-(--bg)'
            )}
            href="/download/kevin-p-koch-cv-en.pdf"
            target="_blank"
            rel="noreferrer"
            download
          >
            CV
          </a>
          <a
            className={linkClass('contact')}
            href="#contact"
            onClick={navTo('contact')}
          >
            Contact
          </a>

          <div className="ml-1">
            <ThemeToggle mode={theme} onToggle={onToggleTheme} />
          </div>
        </nav>
      </div>
    </header>
  );
}

function TabButton({
  label,
  active,
  onClick,
  tabId,
  panelId,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  tabId: string;
  panelId: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      id={tabId}
      role="tab"
      aria-selected={active}
      aria-controls={panelId}
      className={cx(
        'group relative pb-2',
        tabs.btnBase,
        active ? tabs.btnActive : tabs.btnInactive,
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-4 focus-visible:ring-offset-(--bg)'
      )}
    >
      <span className="relative z-10">{label}</span>

      {!active && (
        <span
          aria-hidden="true"
          className={cx(
            'pointer-events-none absolute left-0 right-0 -bottom-px h-0.5 rounded-full',
            'bg-(--underline)',
            'opacity-0 scale-x-0 origin-left',
            'transition-[transform,opacity] duration-300 ease-out',
            'group-hover:opacity-100 group-hover:scale-x-100'
          )}
        />
      )}

      {active && (
        <motion.span
          layoutId="tab-underline"
          className="absolute left-0 right-0 -bottom-px h-0.5 rounded-full bg-(--accent)"
          transition={{ type: 'spring', stiffness: 520, damping: 42 }}
        />
      )}
    </button>
  );
}

function ScrollHint() {
  const visible = useScrollTopVisibility(12);

  const scrollDown = () => {
    const work = document.getElementById('work');
    if (work) return work.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={scrollDown}
          aria-label="Scroll down"
          className="mt-32 mx-auto hidden sm:flex flex-col items-center gap-px text-(--text-faint) hover:text-(--accent) focus:outline-none"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <span className="hidden md:block text-[11px] uppercase tracking-[0.28em] text-(--text-dim)">
            Scroll to explore
            <br />
            <span className="opacity-80">selected work</span>
          </span>
          <span className="block w-px h-3 bg-(--border-text)" />
          <motion.svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function Hero({
  tabKeys,
  activeTab,
  setActiveTab,
  greetingText,
  content,
}: {
  tabKeys: TabKey[];
  activeTab: TabKey;
  setActiveTab: (t: TabKey) => void;
  greetingText: string;
  content: TabContentEntry;
}) {
  const tabSlug = (t: string) => t.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return (
    <section className={cx(layout.container, layout.hero)}>
      <AnimatePresence mode="wait">
        <motion.h1
          key={greetingText}
          className={text.h1}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          {greetingText}
        </motion.h1>
      </AnimatePresence>

      <div
        role="tablist"
        aria-label="Audience"
        className={cx(
          tabs.wrap,
          'relative overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
        )}
      >
        {tabKeys.map((tab) => (
          (() => {
            const id = tabSlug(String(tab));
            const tabId = `tab-${id}`;
            const panelId = `panel-${id}`;
            return (
          <TabButton
            key={tab}
            label={tab}
            active={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            tabId={tabId}
            panelId={panelId}
          />
            );
          })()
        ))}
      </div>

      <div
        className="min-h-80"
        role="tabpanel"
        id={`panel-${tabSlug(String(activeTab))}`}
        aria-labelledby={`tab-${tabSlug(String(activeTab))}`}
        tabIndex={0}
      >
        <h2 className={text.title}>{content.title}</h2>
        <p className={text.body}>{content.body}</p>

      </div>

      <ScrollHint />
    </section>
  );
}

/* ----------------------------- Work section ----------------------------- */

function WorkCaseCard({ c }: { c: WorkCase }) {
  return (
    <a
      href={c.href}
      className="group block py-14 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-8 focus-visible:ring-offset-(--bg)"
      aria-label={`Open case study: ${c.title}`}
    >
      <div className="grid items-start gap-10 md:grid-cols-[minmax(0,1fr)_600px]">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-(--text-faint)">
            <span className="font-medium text-(--text-dim)">{c.indexLabel}</span>
            <span>·</span>
            <span>{c.meta.platform}</span>
            <span>·</span>
            <span>{c.meta.tag}</span>
            {c.meta.readTime ? (
              <>
                <span className="hidden sm:inline">·</span>
                <span className="hidden sm:inline">{c.meta.readTime}</span>
              </>
            ) : null}
          </div>

          <h4 className="mb-4 text-3xl font-semibold tracking-tight text-(--text-strong)">
            {c.title}
          </h4>

          <p className="max-w-2xl text-lg leading-relaxed text-(--text-muted)">
            {c.description}
          </p>

          {c.ndaNote ? (
            <p className="mt-4 text-sm text-(--text-faint)">{c.ndaNote}</p>
          ) : null}

          <span className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-(--accent)">
            View case{' '}
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">
              →
            </span>
          </span>
        </div>

        <div className="relative w-full h-full min-h-80 overflow-hidden rounded-2xl border border-(--border) bg-(--surface-subtle) transition-transform duration-300 group-hover:-translate-y-1 case-image-wrap">
          <Image
            src={c.image.src}
            alt={c.image.alt}
            fill
            sizes="(min-width: 768px) 600px, 100vw"
            className="object-contain md:object-cover"
          />
        </div>
      </div>
    </a>
  );
}

function WorkSection() {
  return (
    <section id="work">
      <div className={cx(layout.container, 'py-24')}>
        <div className="flex items-baseline justify-between gap-8">
          <div className="inline-block">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-(--text-faint)">
              Work
            </h2>
            <div className="mt-1 h-px w-full bg-(--border-text)" />
          </div>
          <p className="hidden md:block text-sm text-(--text-faint)">
            Details inside each case.
          </p>
        </div>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-(--text-muted)">
          A carefully chosen selection of work demonstrating my approach to thinking, decision-making, and simplifying complexity into approachable product experiences.
        </p>

        <div className="mt-16 divide-y divide-(--border)">
          {WORK_CASES.map((c) => (
            <WorkCaseCard key={c.id} c={c} />
          ))}
        </div>
      </div>

      <SectionDivider />
    </section>
  );
}

/* ----------------------------- About section ---------------------------- */

function AboutSection() {
  return (
    <section id="about">
      <div className={cx(layout.container, 'py-24')}>
        <div className="flex items-baseline justify-between gap-8">
          <div className="inline-block">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-(--text-faint)">
              About
            </h2>
            <div className="mt-1 h-px w-full bg-(--border-text)" />
          </div>
          <p className="hidden md:block text-sm text-(--text-faint)">
            Product mindset · systems · collaboration
          </p>
        </div>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_420px]">
          <div>
            <p className="max-w-2xl text-xl leading-relaxed text-(--text-strong)">
              I’m a UX/UI designer building digital products for complex environments – where clarity actually counts.
            </p>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-(--text-muted)">
              I’m comfortable working in complex B2B and SaaS products, where requirements are fluid, constraints are real, and systems need to scale. At the same time, 
              I enjoy working on more expressive, product-led experiences, from specialized tools to consumer-facing apps, and adapt my approach to fit the product context and level of complexity.
            </p>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-(--text-muted)">
              My design process is down-to-earth: understand the problem, prototype early, and build repeatable patterns. 
              This allows teams to work faster without sacrificing consistency. Depending on scale and complexity, design systems and prototyping help teams stay aligned and work more efficiently.
            </p>

            <div className="mt-16 max-w-2xl">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-(--text-faint)">
                Design philosophy
              </h3>
              <div className="mt-2 divide-y divide-(--border)">
                <div className="py-2">
                  <p className="text-base font-semibold text-(--text-strong)">
                    Clarity first
                  </p>
                  <p className="mt-2 text-lg leading-relaxed text-(--text-muted)">
                    Good interfaces should be calm and predictable. They don’t need to impress; they should help people make confident decisions.
                  </p>
                </div>
                <div className="py-6">
                  <p className="text-base font-semibold text-(--text-strong)">
                    Designing systems, not individual screens
                  </p>
                  <p className="mt-2 text-lg leading-relaxed text-(--text-muted)">
                    I think in systems of rules, states, components, tokens, and flows rather than individual screens. This supports consistency and scalability across products.
                  </p>
                </div>
                <div className="py-6">
                  <p className="text-base font-semibold text-(--text-strong)">
                    Design with scale in mind
                  </p>
                  <p className="mt-2 text-lg leading-relaxed text-(--text-muted)">
                    Designs should be able to grow with real data, changing feature sets, and increasing product complexity, without requiring constant redesign.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-10">
            <div className="rounded-2xl border border-(--border) bg-(--surface) p-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-(--text-faint)">
                Now
              </p>
              <p className="mt-3 text-lg leading-relaxed text-(--text)">
                Open to new opportunities from Jan 2026.
              </p>
              <p className="mt-2 text-sm text-(--text-faint)">
                UX/UI · Product design · B2B SaaS · Design systems
              </p>
            </div>

            <div className="rounded-2xl border border-(--border) bg-(--surface) p-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-(--text-faint)">
                Outside work
              </p>
              <p className="mt-3 text-lg leading-relaxed text-(--text)">
                Outside of work, I’m always observing design in its many forms, from digital products to fashion, architecture, and visual culture.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-(--text)">
                I naturally notice patterns, layouts, and interactions wherever I go, often finding inspiration in how things are structured, communicated, and experienced in everyday life.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-(--text)">
                Cities like Bangkok, Beijing, and Ho Chi Minh City strongly influence my visual sensibility. Their density, energy, and blend of tradition and futurism shape how I think about hierarchy, contrast, and clarity in UX/UI design.
              </p>
            </div>

            <div className="rounded-2xl border border-(--border) bg-(--surface) p-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-(--text-faint)">
                Working style
              </p>
              <p className="mt-3 text-lg leading-relaxed text-(--text)">
                Collaborative by default, direct in communication, and focused
                on clear decisions.
              </p>
              <p className="mt-2 text-sm text-(--text-faint)">
                I prefer tight feedback loops with PMs and devs, with clear
                decision making and hands-on documentation.
              </p>
            </div>
          </aside>
        </div>

        <div id="about-end" className="h-px w-full" />
      </div>

      <SectionDivider />
    </section>
  );
}

/* ----------------------------- Contact section -------------------------- */

function ContactSection() {
  return (
    <section id="contact">
      <div className={cx(layout.container, 'py-24')}>
        <div className="flex items-baseline justify-between gap-8">
          <div className="inline-block">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-(--text-faint)">
              Contact
            </h2>
            <div className="mt-1 h-px w-full bg-(--border-text)" />
          </div>
          <p className="hidden md:block text-sm text-(--text-faint)">
            Open to conversations
          </p>
        </div>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-(--text-muted)">
          If you’re hiring for a UX/UI or product design role, I’d be happy to connect.{' '}
          <br />
          The best way to reach me is via email.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <PillLink href={LINKS.email}>Email</PillLink>
          <PillLink href={LINKS.linkedin}>LinkedIn</PillLink>
          <PillLink href={LINKS.xing}>XING</PillLink>
        </div>
      </div>

      <SectionDivider />
    </section>
  );
}

/* -------------------------------- Footer -------------------------------- */

// Footer extracted into /app/components/Footer.tsx

/* --------------------------------- Page --------------------------------- */

export default function HomeClient() {
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  const tabKeys = useMemo(() => Object.keys(TAB_CONTENT) as TabKey[], []);
  const [activeTab, setActiveTab] = useState<TabKey>(tabKeys[0] ?? 'Everyone');

  const greetingIndex = useGreetingRotation(4000);
  const greetingText = GREETINGS[greetingIndex]?.text ?? GREETINGS[0]?.text ?? 'Hello,';

  const content = TAB_CONTENT[activeTab] ?? TAB_CONTENT.Everyone;

  return (
    <main id="main-content" tabIndex={-1} className={cx(layout.page, 'kpk-page')}>
      <div className="kpk-canvas">
        <Header theme={theme} onToggleTheme={toggleTheme} />

        <Hero
          tabKeys={tabKeys}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          greetingText={greetingText}
          content={content}
        />

        <SectionDivider />

        <WorkSection />
        <AboutSection />
        <ContactSection />
        <Footer showScrollThanks />
      </div>
    </main>
  );
}

/* ------------------------- Lightweight dev checks ------------------------ */

if (typeof process !== 'undefined' && process?.env?.NODE_ENV !== 'production') {
  if (!Array.isArray(GREETINGS) || GREETINGS.length === 0) {
    throw new Error('GREETINGS must be a non-empty array');
  }
  if (!TAB_CONTENT || Object.keys(TAB_CONTENT).length === 0) {
    throw new Error('TAB_CONTENT must have at least one tab');
  }
  if (!Array.isArray(WORK_CASES) || WORK_CASES.length === 0) {
    throw new Error('WORK_CASES must be a non-empty array');
  }
}
