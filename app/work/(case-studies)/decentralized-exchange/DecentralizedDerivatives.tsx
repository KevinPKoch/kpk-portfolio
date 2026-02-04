'use client';

import type { ReactNode, MouseEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import Footer from '../../../components/Footer';

type TocItem = { id: string; label: string };
type InfoPair = { k: string; v: ReactNode };

type Meta = {
  title: string;
  subtitle: string;
  nda: string;
  role: string[];
  tools: string[];
  delivered: string[];
  facts: Array<{ label: string; value: string }>;
};

type Decision = { title: string; rationale: string; tradeoff: string };
type Outcome = { label: string; evidence: string; howWeKnew?: string };

const META: Meta = {
  title: 'Decentralized Derivatives Exchange',
  subtitle: 'End-to-end delivery: design system, mobile-first prototypes, and the production Next.js trading UI.',
  nda:
    'Company confidential: logos, company names, and certain UI details are anonymized. Only selected highlights are shown.',
  role: ['UX/UI Design', 'Design System', 'Wireframing', 'Prototyping', 'Frontend (Next.js 13 + Tailwind)'],
  tools: ['Figma', 'Next.js 13', 'TypeScript', 'Tailwind CSS'],
  delivered: [
    'Design system created and implemented within the product for a unified UI.',
    'Mobile-first wireframes and prototypes created for website, as well as trading UI.',
    'Frontend built from scratch using Next.js 13, TypeScript, and Tailwind CSS.',
    'SDK team collaborated with to incorporate and customize provided toolset.',
  ],
  facts: [
    { label: 'Platform', value: 'Web + Mobile' },
    { label: 'Scope', value: 'Design system, wireframes, prototypes, and frontend build' },
    { label: 'Stack', value: 'Next.js 13, TypeScript, Tailwind CSS' },
  ],
};

const CONTEXT = {
  problem:
    'Trading UIs are most likely to fail when there is a sense of urgency. One needs to act fast, understand risk at all times, and avoid making incorrect selections, especially for mobile devices.',
  users: [
    'Active traders who value speed and simplicity in a volatile market',
    'Mobile users who need the full trading experience, not a lite version',
    'Customizers and power users who rely on layout and patterns',
  ],
  constraints: [
    'Information density of real-time data (prices, positions, risk) without overwhelming the user',
    'Responsiveness, mobile-first, and trading experience optimization, all while maintaining core trading efficiency',
    'SDK-provided modules had to be integrated and, in some cases, customized',
  ],
  topTasks: [
    'Choose market and view price context quickly',
    'Place/edit orders with minimal delay',
    'Set risk limits (TP/SL) and confirm leverage inputs',
    'View positions, PnL, and liquidation risk at a glance',
    'Seamlessly transition between desktop and mobile with similar mental models',
  ],
  decisions: [
    {
      title: 'Trader-first information hierarchy',
      rationale:
        'Prioritized the most time-sensitive signals (price context, position state, risk) so users can confirm decisions quickly. The demos show how the UI keeps the core decision-making elements in consistent positions.',
      tradeoff:
        'Less space for secondary content; moved non-critical info into contextual areas to keep the main surface focused.',
    },
    {
      title: 'Consistent “order intent” pattern across screens',
      rationale:
        'Unified the order form interaction model (inputs → validation → confirmation states) to reduce errors and cognitive load. This consistency is visible in both the desktop and mobile demos.',
      tradeoff:
        'Some UI flexibility sacrificed for predictability; supported advanced controls without breaking the core pattern.',
    },
    {
      title: 'Mobile-first without feature cuts',
      rationale:
        'Designed mobile flows to support the same core trading tasks as desktop, focusing on step reduction and safe defaults while keeping the mental model consistent across breakpoints.',
      tradeoff:
        'More complex responsive behavior; mitigated via component-driven layout rules and deliberate breakpoint testing.',
    },
    {
      title: 'Performance budget as a product requirement',
      rationale:
        'Trading UX suffers if the UI is slow; built with performance in mind (layout stability, efficient rendering, sensible loading), then validated via Lighthouse/PageSpeed.',
      tradeoff:
        'More engineering discipline required; kept patterns simple and measurable to avoid regressions.',
    },
  ] satisfies Decision[],
  outcomes: [
    {
      label: 'Faster “time-to-action” in core flows',
      evidence: 'Fewer steps, keeping primary actions accessible from consistent positions across desktop and mobile.',
      howWeKnew: 'Confirmed via demo flow review + internal dogfooding & QA tests against top tasks.',
    },
    {
      label: 'Lowered cognitive load',
      evidence: 'Consistent hierarchy, component behavior, & confirmation/validation states.',
      howWeKnew: 'Validated through repeated cross-device walkthroughs & consistency tests across key screens.',
    },
    {
      label: 'Reduced risk of misclicks & input errors',
      evidence: 'Clear affordances, safe defaults, & highly visible confirmation/risk indicators.',
      howWeKnew: 'Reviewed for edge cases (leverage, TP/SL, confirmations) during implementation & testing.',
    },
    {
      label: 'Measurable frontend quality',
      evidence: 'Strong performance, accessibility, best practices, & SEO ratings from PageSpeed Insights.',
      howWeKnew: 'Measured via PageSpeed Insights/Lighthouse testing on representative pages.',
    },
  ] satisfies Outcome[],
};

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

const layout = {
  page: 'min-h-screen',
  container: 'mx-auto pt-24 w-full max-w-[77rem] px-[var(--grid-margin)]',
};

function isExternalHref(href: string) {
  return /^https?:\/\//.test(href);
}

/* --------------------------------- UI ---------------------------------- */

function PillLink({
  href,
  children,
  ariaLabel,
  download,
  className,
}: {
  href: string;
  children: ReactNode;
  ariaLabel?: string;
  download?: boolean;
  className?: string;
}) {
  const external = isExternalHref(href);
  const base =
    'inline-flex items-center justify-center rounded-full border border-(--border) bg-(--surface) px-5 py-2 text-sm font-medium text-(--text-strong) transition hover:border-gray-300 hover:bg-(--surface-hover) dark:hover:border-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ring)';

  // This component is primarily used for hash-links (smooth scroll).
  if (!external) {
    return (
      <a href={href} aria-label={ariaLabel} download={download} className={cx(base, className)}>
        {children}
      </a>
    );
  }

  return (
    <a
      href={href}
      aria-label={ariaLabel}
      download={download}
      target="_blank"
      rel="noreferrer"
      className={cx(base, className)}
    >
      {children}
    </a>
  );
}

function SectionDivider() {
  return <div className="border-t border-(--border)" />;
}

function SkipToContent() {
  return (
    <a
      href="#content"
      className={cx(
        'sr-only focus:not-sr-only',
        'fixed left-4 top-4 z-60 rounded-full border border-(--border)',
        'bg-(--header-bg) px-4 py-2 text-sm font-medium text-(--text-strong) backdrop-blur',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ring)'
      )}
    >
      Skip to content
    </a>
  );
}

/* ------------------------- ScrollSpy (stable) ---------------------------- */

function useScrollSpy(ids: string[], headerOffsetPx = 170, bottomSnapPx = 40) {
  const [activeId, setActiveId] = useState<string>(ids[0] ?? '');

  useEffect(() => {
    if (!ids.length) return;

    const doc = document.documentElement;

    const getActive = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const viewportBottom = scrollY + window.innerHeight;
      const docHeight = doc.scrollHeight;

      if (docHeight - viewportBottom <= bottomSnapPx) return ids[ids.length - 1] ?? '';

      const activationY = scrollY + 1;
      let current = ids[0] ?? '';

      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;

        const top = el.offsetTop - headerOffsetPx;
        if (top <= activationY) current = id;
      }

      return current;
    };

    let raf = 0;
    const onScrollOrResize = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const next = getActive();
        setActiveId((prev) => (prev === next ? prev : next));
      });
    };

    onScrollOrResize();
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [ids, headerOffsetPx, bottomSnapPx]);

  return { activeId, setActiveId };
}

/* ------------------------------ Content UI ------------------------------ */

function MetaGrid({ items }: { items: InfoPair[] }) {
  return (
    <dl className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((it) => (
        <div key={it.k} className="rounded-2xl border border-(--border) bg-(--surface) p-5">
          <dt className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">{it.k}</dt>
          <dd className="mt-2 text-sm leading-relaxed text-(--text-strong)">{it.v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-title`} className="pt-16">
      <div id={id} className="scroll-mt-32">
        <div className="inline-block">
          {eyebrow && <p className="text-sm font-semibold uppercase tracking-wider text-(--text-muted)">{eyebrow}</p>}
          <h2 id={`${id}-title`} className="mt-2 text-3xl font-semibold tracking-tight text-(--text-strong) sm:text-4xl">
            {title}
          </h2>
          <div className="mt-4 h-px w-full bg-(--border)" />
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

function Prose({ children }: { children: ReactNode }) {
  return <div className="max-w-3xl text-lg leading-relaxed text-(--text)">{children}</div>;
}

function KeyPoints({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 max-w-3xl space-y-3">
      {items.map((t) => (
        <li key={t} className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-(--bullet)" aria-hidden="true" />
          <span className="text-lg leading-relaxed text-(--text)">{t}</span>
        </li>
      ))}
    </ul>
  );
}

function Callout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-(--border) bg-(--surface) p-6">
      <p className="text-sm font-semibold uppercase tracking-wider text-(--text-muted)">{title}</p>
      <div className="mt-3 text-lg leading-relaxed text-(--text)">{children}</div>
    </div>
  );
}

function Trio({ a, b, c }: { a: ReactNode; b: ReactNode; c: ReactNode }) {
  return <div className="grid gap-6 lg:grid-cols-3">{[a, b, c]}</div>;
}

function CompactList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-(--border) bg-(--surface) p-6">
      <p className="text-sm font-semibold uppercase tracking-wider text-(--text-muted)">{title}</p>
      <ul className="mt-4 space-y-2 text-base leading-relaxed text-(--text)">
        {items.map((it) => (
          <li key={it}>• {it}</li>
        ))}
      </ul>
    </div>
  );
}

function DecisionCard({ d }: { d: Decision }) {
  return (
    <div className="rounded-2xl border border-(--border) bg-(--surface) p-6">
      <div className="text-xl font-semibold text-(--text-strong)">{d.title}</div>
      <div className="mt-3 text-sm leading-relaxed text-(--text)">
        <p className="font-semibold text-(--text-strong)">Rationale</p>
        <p className="mt-1">{d.rationale}</p>
      </div>
      <div className="mt-3 text-sm leading-relaxed text-(--text)">
        <p className="font-semibold text-(--text-strong)">Tradeoff</p>
        <p className="mt-1">{d.tradeoff}</p>
      </div>
    </div>
  );
}

/* ------------------------------ Page ------------------------------------ */

export default function DecentralizedDerivatives() {
  const toc: TocItem[] = useMemo(
    () => [
      { id: 'quick-view', label: 'Recruiter Quick View' },
      { id: 'context', label: 'Problem & Users' },
      { id: 'overview', label: 'What I Delivered' },
      { id: 'process', label: 'Approach' },
      { id: 'decisions', label: 'Key Decisions' },
      { id: 'demo', label: 'Demos' },
      { id: 'impact', label: 'Results' },
    ],
    []
  );

  const ids = useMemo(() => toc.map((t) => t.id), [toc]);
  const { activeId, setActiveId } = useScrollSpy(ids, 170, 40);

  const [forcedId, setForcedId] = useState<string | null>(null);
  const forcedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (forcedTimerRef.current != null) window.clearTimeout(forcedTimerRef.current);
    };
  }, []);

  const navActiveId = forcedId ?? activeId;
  const prefersReducedMotion = useReducedMotion();

  const onTocClick = (id: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setForcedId(id);
    setActiveId(id);

    if (forcedTimerRef.current != null) window.clearTimeout(forcedTimerRef.current);
    forcedTimerRef.current = window.setTimeout(() => setForcedId(null), 900);

    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <SkipToContent />

      <main className={cx(layout.page, 'kpk-page')}>
        <div className="kpk-canvas">
          {/* Hero */}
          <section className={cx(layout.container, 'pt-8 pb-14')}>
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, ease: 'easeOut' }}
            >
              <p className="text-sm font-semibold uppercase tracking-wider text-(--text-muted)">Case study</p>

              <h1 className="mt-4 text-balance text-5xl font-extrabold tracking-tight leading-[1.15] text-(--text-strong) sm:text-6xl sm:leading-[1.15] md:text-7xl md:leading-[1.1]">
                {META.title}
              </h1>

              <p className="mt-6 max-w-3xl text-xl leading-relaxed text-(--text)">{META.subtitle}</p>

              <MetaGrid items={META.facts.map((f) => ({ k: f.label, v: f.value }))} />

              <div className="mt-10 flex flex-wrap gap-3">
                <PillLink href="#quick-view" className="pill-primary" ariaLabel="Jump to recruiter quick view">
                  Recruiter quick view
                </PillLink>
                <PillLink href="#context">Problem & users</PillLink>
                <PillLink href="#demo">Watch demos</PillLink>
              </div>

              <div className="mt-10 max-w-3xl rounded-2xl border border-(--border) bg-(--surface) p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">NDA note</p>
                <p className="mt-2 text-sm leading-relaxed text-(--text)">{META.nda}</p>
              </div>
            </motion.div>
          </section>

          <SectionDivider />

          {/* Content */}
          <div id="content" className={cx(layout.container, '')}>
            <div className="grid gap-10 py-12 lg:grid-cols-[1fr_320px]">
              {/* Main */}
              <article className="min-w-0">
                <Section id="quick-view" eyebrow="Recruiter Quick View" title="What to know in 20 seconds">
                  <Trio
                    a={
                      <Callout title="Project">
                        Decentralized derivatives trading platform with separate web and mobile UX.
                      </Callout>
                    }
                    b={
                      <Callout title="My role">
                        End-to-end delivery: design system, mobile-first wireframes/prototypes, and frontend
                        implementation using Next.js 13 (TypeScript, Tailwind).
                      </Callout>
                    }
                    c={
                      <Callout title="Collaboration">
                        Worked with an SDK team to integrate the supplied modules and adapt them to the product’s UX.
                      </Callout>
                    }
                  />

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <Callout title="Primary focus">
                      Speed, clarity, and error prevention when working under time pressure-particularly on mobile.
                    </Callout>
                    <Callout title="Evidence">
                      Desktop & mobile demos + measurable PageSpeed results are provided below.
                    </Callout>
                  </div>
                </Section>

                <Section id="context" eyebrow="Context" title="Problem, users, and constraints">
                  <Prose>
                    <p>{CONTEXT.problem}</p>
                    <p className="mt-5">
                      Since this is an NDA project, this case study will be focused on decisions, patterns, and 
                      validation rather than specific brand-related information or private data.
                    </p>
                  </Prose>

                  <div className="mt-10 grid gap-6 lg:grid-cols-2">
                    <CompactList title="Primary users" items={CONTEXT.users} />
                    <CompactList title="Top tasks" items={CONTEXT.topTasks} />
                  </div>

                  <div className="mt-6">
                    <CompactList title="Constraints" items={CONTEXT.constraints} />
                  </div>
                </Section>

                <Section id="overview" eyebrow="Overview" title="What I built">
                  <Prose>
                    <p>
                      Designed and implemented a design system for a decentralized derivatives exchange, 
                      used throughout the application.
                    </p>
                    <p className="mt-5">
                      Built mobile-first wireframes and prototypes for the website and trading experience, 
                      and then developed the production UI from scratch using Next.js 13, TypeScript, and Tailwind CSS.
                    </p>
                  </Prose>

                  <KeyPoints
                    items={[
                      'Design system designed and implemented throughout the full product',
                      'Mobile-first wireframes and prototypes for website and trading experience',
                      'Frontend developed from scratch using Next.js 13, TypeScript, and Tailwind CSS',
                      'Collaborated with the SDK team to integrate and customize the tools provided',
                    ]}
                  />

                  <div className="mt-10 rounded-2xl border border-(--border) bg-(--surface) p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Role</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-sm text-(--text)">
                      {META.role.map((role) => (
                        <span key={role} className="rounded-full border border-(--border) bg-(--surface-muted) px-3 py-1">
                          {role}
                        </span>
                      ))}
                    </div>

                    <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Tools</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-sm text-(--text)">
                      {META.tools.map((tool) => (
                        <span key={tool} className="rounded-full border border-(--border) bg-(--surface-muted) px-3 py-1">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                </Section>

                <Section id="process" eyebrow="Approach" title="How I did it">
                  <div className="grid gap-6 lg:grid-cols-2">
                    <Callout title="Fast and safe under pressure">
                      Researched how active traders behave under volatile conditions: rapid scanning, prominent visual anchors, 
                      predictable control placement, and immediate risk exposure.
                    </Callout>

                    <Callout title="Mobile-first without sacrificing capabilities">
                      Designed mobile experiences to maintain efficient trading capabilities (fewer steps, safe defaults, clear 
                      confirmation states) without losing essential functionality.
                    </Callout>
                  </div>

                  <div className="mt-8 rounded-2xl border border-(--border) bg-(--surface) p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">
                      Implementation & engineering collaboration
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-(--text)">
                      Built the frontend using Next.js 13, TypeScript, and Tailwind CSS, collaborating very closely with the 
                      SDK team to integrate the modules and align technical constraints with the UX goals.
                    </p>
                  </div>
                </Section>

                <Section id="decisions" eyebrow="High-signal" title="Key Decisions and Trade-Offs">
                  <Prose>
                    <p>
                      NDA-Safe Summary of Key Decisions that Influenced the UX, Including Rationale and Trade-Offs. The desktop
                      and mobile demos shown below reflect these design decisions in the final product.
                    </p>
                  </Prose>

                  <div className="mt-10 grid gap-6 lg:grid-cols-2">
                    <DecisionCard
                      d={{
                        title: 'Trader-First Information Hierarchy',
                        rationale:
                          'Prioritized critical information, such as price context, active position state, and risk indicators, and positioned these critical signals in stable areas on the screen. This ensures that traders can process critical information within a few seconds, even during periods of high volatility.',
                        tradeoff:
                          'The design sacrificed some real estate for secondary information. Non-critical information was deliberately placed in secondary areas or contextual areas to prioritize critical information in primary areas.',
                      }}
                    />

                    <DecisionCard
                      d={{
                        title: 'Consistent "Order Intent" Pattern Across Screens',
                        rationale:
                          'I standardized the interaction pattern for orders, from entry to validation to confirmation, for both desktop and mobile platforms. Consistent interaction patterns in critical areas reduce cognitive load, prevent errors, and boost trust in high-risk situations.',
                        tradeoff:
                          'Some flexibility in layout was sacrificed for consistency. Advanced features were incorporated without compromising the order intent pattern.',
                      }}
                    />

                    <DecisionCard
                      d={{
                        title: 'Mobile-first without feature removals',
                        rationale:
                          'Introduced mobile-friendly flows to enable the same degree of trading functionality as the desktop version, with a focus on step elimination, safe defaults, and proper confirmation states-without changing the mental model at various breakpoints.',
                        tradeoff:
                          'Added complexity to the responsive design. This problem was solved by following layout constraints using components and breakpoint testing.',
                      }}
                    />

                    <DecisionCard
                      d={{
                        title: 'Performance budget as a product requirement',
                        rationale:
                          'The trading UX will be severely impacted if performance is compromised. The UI was built with performance as a first-class citizen, prioritizing layout stability, rendering, and good loading decisions, and validated using Lighthouse/PageSpeed.',
                        tradeoff:
                          'Enforced better engineering rigor. Patterns were kept simple and quantifiable to avoid performance regressions without slowing down development.',
                      }}
                    />
                  </div>
                </Section>

                <Section id="demo" eyebrow="Evidence" title="Demos">
                  <Prose>
                    <p>Two short videos demonstrating the UI for trading on desktop and mobile.</p>
                  </Prose>

                  <div className="mt-10 grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-(--border) bg-(--surface) p-6">
                      <div className="text-xl font-semibold text-(--text-strong)">Desktop demo</div>
                      <div className="mt-2 text-sm leading-relaxed text-(--text-muted)">
                        Trading UI layout and interaction flow on desktop.
                      </div>
                      <div className="mt-5 overflow-hidden rounded-xl border border-(--border) bg-black/20">
                        <video
                          className="h-auto w-full"
                          src="https://media.kevinpkoch.com/videos/decentralized-desk.mp4"
                          controls
                          playsInline
                          preload="metadata"
                          aria-label="Desktop demo video"
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-(--border) bg-(--surface) p-6">
                      <div className="text-xl font-semibold text-(--text-strong)">Mobile demo</div>
                      <div className="mt-2 text-sm leading-relaxed text-(--text-muted)">
                        Mobile-first approach and responsive design.
                      </div>
                      <div className="mt-5 overflow-hidden rounded-xl border border-(--border) bg-black/20">
                        <video
                          className="h-auto w-full"
                          src="https://media.kevinpkoch.com/videos/decentralized-mobile.mp4"
                          controls
                          playsInline
                          preload="metadata"
                          aria-label="Mobile demo video"
                        />
                      </div>
                    </div>
                  </div>

                </Section>

                <Section id="impact" eyebrow="Results" title="What shipped and what improved">
                  <div className="grid gap-6 lg:grid-cols-2">
                    <Callout title="Deliverables">
                      <ul className="mt-2 space-y-2 text-base leading-relaxed text-(--text)">
                        {META.delivered.map((d) => (
                          <li key={d}>• {d}</li>
                        ))}
                      </ul>
                    </Callout>

                    <Callout title="Performance (PageSpeed Insights)">
                      <ul className="mt-2 space-y-2 text-base leading-relaxed text-(--text)">
                        <li>• 96 Performance</li>
                        <li>• 95 Accessibility</li>
                        <li>• 100 Best Practices</li>
                        <li>• 100 SEO</li>
                      </ul>
                    </Callout>
                  </div>

                  <div className="mt-6 rounded-2xl border border-(--ring) bg-(--surface) p-6">
                    <p className="text-sm font-semibold uppercase tracking-wider text-(--text-muted)">
                      Outcomes
                    </p>
                    <ul className="mt-4 space-y-3 text-base leading-relaxed text-(--text)">
                      {CONTEXT.outcomes.map((o) => (
                        <li key={o.label}>
                          <div>
                            <span className="font-semibold text-(--text-strong)">{o.label}:</span>{' '}
                            <span className="text-(--text)">{o.evidence}</span>
                          </div>
                          {o.howWeKnew && <div className="mt-1 text-xs text-(--text-muted)">How we knew: {o.howWeKnew}</div>}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-10 flex flex-wrap gap-3">
                    <Link className="pill" href="/#work" aria-label="Back to work">
                      ← Back to work
                    </Link>
                  </div>
                </Section>
              </article>

              {/* Sticky TOC */}
              <aside className="lg:pl-2">
                <div className="lg:sticky lg:top-28">
                  <div className="rounded-2xl border border-(--border) bg-(--surface) p-6">
                    <p className="text-sm font-semibold uppercase tracking-wider text-(--text-muted)">On this page</p>

                    <nav aria-label="Table of contents" className="mt-5">
                      <ul className="space-y-1.5">
                        {toc.map((t) => {
                          const active = navActiveId === t.id;

                          const base = 'block rounded-lg px-3 py-2 text-sm transition-colors focus:outline-none';
                          const hover =
                            'hover:bg-(--surface-hover) hover:text-(--text-strong) focus-visible:ring-2 focus-visible:ring-(--ring)';
                          const inactive = 'text-(--text)';
                          const activeCls = 'bg-(--surface-hover) text-(--text-strong) font-semibold';

                          return (
                            <li key={t.id}>
                              <a
                                href={`#${t.id}`}
                                onClick={onTocClick(t.id)}
                                className={cx(base, hover, active ? activeCls : inactive)}
                                aria-current={active ? 'location' : undefined}
                              >
                                {t.label}
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    </nav>
                  </div>
                </div>
              </aside>
            </div>
          </div>

          <SectionDivider />
          <Footer />
        </div>
      </main>
    </>
  );
}
