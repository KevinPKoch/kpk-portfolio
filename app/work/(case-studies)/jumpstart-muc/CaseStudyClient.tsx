'use client';

import type { ReactNode, MouseEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion, useInView } from 'framer-motion';
import Footer from '../../../components/Footer';

type TocItem = { id: string; label: string };
type InfoPair = { k: string; v: ReactNode };

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

const layout = { page: 'min-h-screen',
  container: 'mx-auto pt-24 w-full max-w-[77rem] px-[var(--grid-margin)]' };


// Put the PDF in: /public/work/jumpstart-muc/Jumpstart-Muc-Case-study-GoogleUxCertificate.pdf
const PDF_DOWNLOAD_PATH = '/work/jumpstart-muc/Jumpstart-Muc-Case-study-GoogleUxCertificate.pdf';

/* --------------------------------- UI ---------------------------------- */

function PillLink({ href,
  children,
  ariaLabel,
  download,
  className }: {
  href: string;
  children: ReactNode;
  ariaLabel?: string;
  download?: boolean;
  className?: string;
}) {
  const isExternal = /^https?:\/\//.test(href);

  return (
    <a
      href={href}
      aria-label={ariaLabel}
      download={download}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noreferrer' : undefined}
      className={cx(
        'inline-flex items-center justify-center rounded-full border border-(--border) bg-(--surface) px-5 py-2 text-sm font-medium text-(--text-strong) transition hover:border-gray-300 hover:bg-(--surface-hover) dark:hover:border-white/20',
        className
      )}
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
/**
 * Stable + predictable:
 * - Uses offsetTop scanning (robust for long pages)
 * - Forces last item when user near bottom
 *
 * NOTE:
 * ScrollSpy should ALWAYS be alive (so nav updates while scrolling).
 * Click highlight is handled separately via forcedId to avoid flicker.
 */
function useScrollSpy(ids: string[], headerOffsetPx = 170, bottomSnapPx = 40) {
  const [activeId, setActiveId] = useState<string>(ids[0] ?? '');

  useEffect(() => {
    if (!ids.length) return;

    const doc = document.documentElement;

    const getActive = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const viewportBottom = scrollY + window.innerHeight;
      const docHeight = doc.scrollHeight;

      // near bottom → force last
      if (docHeight - viewportBottom <= bottomSnapPx) {
        return ids[ids.length - 1] ?? '';
      }

      // pick the last section whose top is above the "activation line"
      // (scroll position + sticky header offset). This behaves correctly in both directions.
      const activationY = scrollY + 1; // +1 avoids jitter at exact boundaries
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
        <div
          key={it.k}
          className="rounded-2xl border border-(--border) bg-(--surface) p-5"
        >
          <dt className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">{it.k}</dt>
          <dd className="mt-2 text-sm leading-relaxed text-(--text-strong)">{it.v}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * IMPORTANT: id is placed on inner "anchor div" so scrollspy works reliably.
 */
function Section({ id,
  eyebrow,
  title,
  children }: {
  id: string;
  eyebrow?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="pt-16">
      <div id={id} className="scroll-mt-32">
        <div className="inline-block">
          {eyebrow && (
            <p className="text-sm font-semibold uppercase tracking-wider text-(--text-muted)">{eyebrow}</p>
          )}
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-(--text-strong) sm:text-4xl">{title}</h2>
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
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-(--bullet)" />
          <span className="text-lg leading-relaxed text-(--text)">{t}</span>
        </li>
      ))}
    </ul>
  );
}

function Callout({ title,
  children,
  className }: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('rounded-2xl border border-(--border) bg-(--surface) p-6', className)}>
      <p className="text-sm font-semibold uppercase tracking-wider text-(--text-muted)">{title}</p>
      <div className="mt-3 text-lg leading-relaxed text-(--text)">{children}</div>
    </div>
  );
}

/* ---------------------------- Context chart ---------------------------- */

function MiniBarChart({ title = 'Context: rising demand for integration support',
  subtitle = 'Asylum (initial applications) — 38.9% increase',
  sources = [
    'Federal Office for Migration and Refugees (10/2022)',
    'Massive increase in asylum numbers in Bavaria (07/2022)',
    'Population Migration and Integration in Germany (Destatis, 2022)',
  ] }: {
  title?: string;
  subtitle?: string;
  sources?: string[];
}) {
  const reduce = false;
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartInView = useInView(chartRef, { once: true, amount: 0.3 });


  // Values approximated from the original slide:
  // Jan–Dec 2021 ≈ 115k, Jan–Oct 2022 ≈ 160k (scale max 180k)
  const max = 180_000;
  const values = [
    { label: 'Jan–Dec 2021', value: 115_000, delay: 0 },
    { label: 'Jan–Oct 2022', value: 160_000, delay: 0.16 },
  ] as const;

  const plotTop = 20;
  const plotBottom = 260;
  const plotHeight = 240;

  const barW = 120;
  const barXs = [190, 410];
  const centerXs = [190 + barW / 2, 410 + barW / 2];

  const formatK = (n: number) => `${Math.round(n / 1000)}k`;

  const computed = values.map((d) => {
    const h = (d.value / max) * plotHeight;
    return { ...d, h };
  });

  return (
    <figure className="mt-12 mb-16">
      <div className="rounded-2xl border border-(--border) bg-(--surface) p-6">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold uppercase tracking-wider text-(--text-muted)">{title}</p>
          <p className="text-sm text-(--text-muted)">{subtitle}</p>
        </div>

                <div ref={chartRef} className="mt-6">
          <svg
            viewBox="0 0 720 320"
            className="h-auto w-full"
            role="img"
            aria-label="Bar chart comparing asylum initial applications in Jan–Dec 2021 vs Jan–Oct 2022"
          >

            {/* Grid */}
            {Array.from({ length: 6 }).map((_, i) => {
              const y = plotTop + i * 48;
              return (
                <line
                  key={i}
                  x1="70"
                  x2="690"
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={0.10}
                  strokeWidth="1"
                />
              );
            })}

            {/* Y labels */}
            {[
              { y: 260, t: '0' },
              { y: 212, t: '36k' },
              { y: 164, t: '72k' },
              { y: 116, t: '108k' },
              { y: 68, t: '144k' },
              { y: 20, t: '180k' },
            ].map((l) => (
              <text
                key={l.t}
                x="54"
                y={l.y + 4}
                textAnchor="end"
                fontSize="12"
                fill="currentColor"
                opacity="0.55"
              >
                {l.t}
              </text>
            ))}

            {/* Bars + value labels */}
            {reduce ? (
              <>
                {computed.map((d, i) => (
                  <g key={d.label}>
                    <rect
                      x={barXs[i]}
                      y={plotBottom - d.h}
                      width={barW}
                      height={d.h}
                      rx="0"
                      fill="currentColor"
                      opacity="0.85"
                    />
                    <text
                      x={centerXs[i]}
                      y={plotBottom - d.h - 12}
                      textAnchor="middle"
                      fontSize="14"
                      fill="currentColor"
                      opacity="0.75"
                    >
                      {formatK(d.value)}
                    </text>
                  </g>
                ))}
              </>
            ) : (
<g>
{computed.map((d, i) => {
  const cx = centerXs[i];
  const barX = barXs[i];
  const barY = plotBottom - d.h;

  return (
    <g key={d.label}>
      {/* BAR */}
<motion.rect
  x={barX}
  width={barW}
  rx="0"
  fill="currentColor"
  opacity={0.85}
  initial={{ height: 0, y: plotBottom }}
  animate={chartInView ? { height: d.h, y: barY } : { height: 0, y: plotBottom }}
  transition={ {
    duration: 1.6,
    ease: 'easeOut',
    delay: values[i].delay }}
/>



      {/* LABEL (above the bar) */}
      <motion.text
        x={cx}
        y={barY - 12}
        textAnchor="middle"
        fontSize="14"
        fill="currentColor"
        pointerEvents="none"
        initial={{ opacity: 0 }}
        animate={chartInView ? { opacity: 0.75 } : { opacity: 0 }}
        transition={ {
          duration: 0.5,
          ease: 'easeOut',
          delay: values[i].delay + 0.25 }}
      >
        {formatK(d.value)}
      </motion.text>
    </g>
  );
})}

</g>

            )}

            {/* Baseline */}
            <rect x="70" y="260" width="620" height="1" fill="currentColor" opacity="0.22" />

            {/* X labels */}
            <text x="250" y="300" textAnchor="middle" fontSize="14" fill="currentColor" opacity="0.75">
              {values[0].label}
            </text>
            <text x="470" y="300" textAnchor="middle" fontSize="14" fill="currentColor" opacity="0.75">
              {values[1].label}
            </text>
          </svg>
        </div>
      </div>

      <figcaption className="mt-3 text-sm text-(--text-muted)">Sources: {sources.join(' · ')}</figcaption>
    </figure>
  );
}


/* ------------------------------ Motion helpers --------------------------- */

function useMotion(reduced: boolean) {
  const fadeUp = {
    hidden: { opacity: 0, y: reduced ? 0 : 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' as const } },
  };

  const stagger = {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: reduced ? undefined : { staggerChildren: 0.06, delayChildren: 0.05 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: reduced ? 0 : 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.24, ease: 'easeOut' as const } },
  };

  return { fadeUp, stagger, item };
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


/* --------------------------------- Page --------------------------------- */
function MockupGallery({ title,
  images,
  className }: {
  title: string;
  className?: string;
  images: Array<{ src: string; alt: string; label?: string }>;
}) {
  const [active, setActive] = useState(0);
  const total = images.length;

  const prev = () => setActive((i) => (i - 1 + total) % total);
  const next = () => setActive((i) => (i + 1) % total);

  const current = images[active];

  return (
    <div className={cx(className)}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-(--text-muted)">{title}</p>
          <p className="mt-1 text-sm text-(--text-muted)">
            Screen {active + 1} of {total}
            {current.label ? ` · ${current.label}` : ''}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={prev}
            className="rounded-full border border-(--border) bg-(--surface) px-4 py-2 text-sm font-medium text-(--text-strong) hover:bg-(--surface-hover)"
            aria-label="Previous screen"
          >
            ← Prev
          </button>
          <button
            type="button"
            onClick={next}
            className="rounded-full border border-(--border) bg-(--surface) px-4 py-2 text-sm font-medium text-(--text-strong) hover:bg-(--surface-hover)"
            aria-label="Next screen"
          >
            Next →
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-3xl border border-(--border) bg-(--surface)">
        <div className="relative w-full aspect-video">
          <Image
            src={current.src}
            alt={current.alt}
            fill
            className="object-contain p-6"
            sizes="(min-width: 1024px) 1000px, 100vw"
            priority={false}
          />
        </div>
      </div>

      {/* Dots */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {images.map((img, i) => {
          const isActive = i === active;
          return (
            <button
              key={img.src}
              type="button"
              onClick={() => setActive(i)}
              className={cx(
                'h-2.5 w-2.5 rounded-full border transition',
                isActive
                  ? 'bg-(--text-strong) border-(--text-strong)'
                  : 'bg-transparent border-(--border) hover:bg-(--surface-hover)'
              )}
              aria-label={`Go to screen ${i + 1}${img.label ? `: ${img.label}` : ''}`}
            />
          );
        })}
      </div>

      {/* Thumbnails */}
      <div className="mt-4 overflow-x-auto">
        <div className="flex min-w-max gap-3 pb-2">
          {images.map((img, i) => {
            const isActive = i === active;
            return (
              <button
                key={img.src}
                type="button"
                onClick={() => setActive(i)}
                className={cx(
                  'overflow-hidden rounded-2xl border bg-(--surface) transition',
                  isActive ? 'border-(--text-strong)' : 'border-(--border) hover:bg-(--surface-hover)'
                )}
                aria-label={`Select ${img.label ?? `screen ${i + 1}`}`}
              >
                <div className="relative h-[88px] w-[140px]">
                  <Image src={img.src} alt={img.alt} fill className="object-contain p-2" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function CaseStudyClient() {
  const toc: TocItem[] = useMemo(
    () => [
      { id: 'quick-view', label: 'Recruiter Quick View' },
      { id: 'overview', label: 'Overview' },
      { id: 'role', label: 'My role & responsibilities' },
      { id: 'research', label: 'Research & insights' },
      { id: 'personas', label: 'Personas' },
      { id: 'competitive-audit', label: 'Competitive Audit' },
      { id: 'ideation', label: 'Ideation' },
      { id: 'digital-wireframes', label: 'Digital wireframes' },
      { id: 'lowfi-prototype', label: 'Low-fidelity prototype' },
      { id: 'usability-study', label: 'Usability study' },
      { id: 'mockups', label: 'Mockups' },
      { id: 'hifi-prototype', label: 'High-fidelity prototype' },
      { id: 'accessibility', label: 'Accessibility' },
      { id: 'responsive-design', label: 'Responsive designs' },
      { id: 'takeaways', label: 'Impact and learnings' },
    ],
    []
  );

  const ids = useMemo(() => toc.map((t) => t.id), [toc]);

  const { activeId, setActiveId } = useScrollSpy(ids, 170, 40);

  const [forcedId, setForcedId] = useState<string | null>(null);
  const forcedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (forcedTimerRef.current != null) {
        window.clearTimeout(forcedTimerRef.current);
      }
    };
  }, []);

  const navActiveId = forcedId ?? activeId;

  const prefersReducedMotion = useReducedMotion();
  const { fadeUp, stagger, item } = useMotion(Boolean(prefersReducedMotion));

  const onTocClick = (id: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    // immediate highlight (click)
    setForcedId(id);
    setActiveId(id);

    if (forcedTimerRef.current != null) {
      window.clearTimeout(forcedTimerRef.current);
    }

    // after smooth scroll, let scrollspy take over again
    forcedTimerRef.current = window.setTimeout(() => {
      setForcedId(null);
    }, 900);

    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const isScrolled = useIsScrolled(8);

  return (
    <>
      <SkipToContent />

      <main className={cx(layout.page, 'kpk-page')}>
        <div className="kpk-canvas">

        {/* Hero */}
        <section className={cx(layout.container, 'pt-8 pb-14')}>
          <motion.div variants={fadeUp} initial="hidden" animate="show">
            <p className="text-sm font-semibold uppercase tracking-wider text-(--text-muted)">Case study</p>

            <h1 className="mt-4 text-balance text-4xl font-extrabold tracking-tight leading-[1.15] text-(--text-strong) sm:text-6xl sm:leading-[1.15] md:text-7xl md:leading-[1.1]">
              Helping Immigrants Find Their Way in Germany
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-relaxed text-(--text)">
              An inclusive UX case study: Clarity, Accessibility, Reality Constraints<br /><br />
              Many immigrants in Germany face the challenge of finding their way in the country, including the challenges of language barriers and understanding how basic systems 
              in the country function. Jumpstart-Muc was designed to help immigrants find their way in Germany through an accessible user experience.
            </p>

            <MetaGrid
              items={[
                { k: 'Client / context', v: 'Non-profit concept for focused on integration, orientation and access to local services for refugees in Munich' },
                { k: 'Duration', v: 'November 2022 to December 2022' },
                { k: 'Role',
                  v: 'End-to-end UX Design process' },
                { k: 'Tools / methods',
             v: (
                 <ul className="list-disc pl-5 space-y-1">
                    <li>User interviews & online survey (Reddit)</li>
                    <li>Affinity mapping (Miro)</li>
                    <li>Competitive analysis</li>
                    <li> Wireframing & Prototyping</li>
                    <li>Remote usability testing</li>
                  </ul>
                ) },
              ]}
            />

            <div className="mt-10 flex flex-wrap gap-3">
              <PillLink
                href="#quick-view"
                className="pill-primary"
                ariaLabel="Jump to recruiter quick view"
              >
                Recruiter quick view
              </PillLink>

              <PillLink href="#overview">Start reading</PillLink>
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
                <motion.div className="grid gap-6 lg:grid-cols-2" variants={stagger} initial="hidden" animate="show">
                  <motion.div variants={item}>
                    <Callout title="Problem">
                      New arrivals often lack knowledge about where to access trustworthy information or whom to turn to when facing the German bureaucracy.
                    </Callout>
                  </motion.div>

                  <motion.div variants={item}>
                    <Callout title="Solution">
                      A mobile-centric website that integrates necessary information with a community of volunteers, even for those with limited language proficiency.
                    </Callout>
                  </motion.div>

                  <motion.div variants={item}>
                    <Callout title="Evidence">
                      User interviews, Reddit survey, affinity mapping, and remote usability testing (5 participants).
                    </Callout>
                  </motion.div>

                  <motion.div variants={item}>
                    <Callout title="VALIDATION">
                      The project gained interest from an organization that focuses on integration, and I was able to share anonymized findings from my research.
                    </Callout>
                  </motion.div>
                </motion.div>
              </Section>

              <Section id="overview" eyebrow="Overview" title="Problem, goal, and why it matters">
                <Prose>
                  <p>
                    <span className="font-semibold text-(--text-strong)">Problem.</span> With the rise of immigrants and refugees, the need for 
                    integration support has also risen. There are many people who are not aware of how to access necessary information regarding integration programs.
                  </p>
                  <p className="mt-5">
                    <span className="font-semibold text-(--text-strong)">Goal.</span> Create an app as well as an associated website that assists immigrants and refugees 
                    in accessing the necessary information, as well as providing them with a network of volunteers who are willing to assist them in various categories. 
                    A rating/ranking system for the volunteers should also be incorporated in order to avoid any form of abuse. Accessibility is an essential requirement 
                    for the project, as well as partnerships/publicity.
                  </p>
                </Prose>

                <KeyPoints
                  items={[
                    'Easy access through the website, app, or digital terminal.',
                    'Volunteer network for assistance in various categories, rating/ranking for volunteers.',
                    'Accessibility as an essential requirement, partnerships/publicity as the adoption factor.',
                  ]}
                />

                <MiniBarChart />
              <Prose>
                  <p className="mt-5">
                    <span className="font-semibold text-(--text-strong)">Constraints.</span> This project has been developed as an end-to-end case study 
                    as part of the Google UX Design Certificate.
                  </p>
              </Prose>

                  {/* Transparency note */}
                  <div className="mt-8 rounded-2xl border border-(--border) bg-(--surface) p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Transparency</p>
                    <p className="mt-2 text-sm leading-relaxed text-(--text)">
                      This case study was developed as part of the Google UX Certificate and is informed by actual user research and usability testing. 
                      Jumpstart-Muc is a fictional idea that I am currently developing as a personal MVP.
                    </p>
                  </div>
              </Section>

              <Section id="role" eyebrow="My role" title="Scope and responsibilities">
                <Prose>
                  <p>
                    I was the UX researcher and designer, responsible for the app and responsive web design from start to finish.
                  </p>
                </Prose>

                <div className="mt-8 rounded-2xl border border-(--border) bg-(--surface) p-6">
                  <p className="text-sm font-semibold uppercase tracking-wider text-(--text-muted)">
                    Responsibilities
                  </p>
                  <ul className="mt-4 space-y-2 list-disc pl-5 text-lg leading-relaxed text-(--text)">
                    <li>Conducting interviews</li>
                    <li>Paper and digital wireframing</li>
                    <li>Low and high-fidelity prototyping</li>
                    <li>Conducting usability studies</li>
                    <li>Addressing accessibility</li>
                    <li>Iterating on designs</li>
                    <li>Deciding on information architecture</li>
                    <li>Responsive design</li>
                  </ul>
                </div>
              </Section>

              <Section id="research" eyebrow="Understanding the user" title="Research summary, audit, and ideation">
                <Prose>
                  <p>
                    To inform the product strategy with actual user needs, I integrated exploratory research from a high-engagement Munich Reddit 
                    thread with qualitative synthesis through affinity mapping. The aim was to identify patterns of pain points prior to designing solutions.
                  </p>

                  <p className="mt-5">
                    <span className="font-semibold text-(--text-strong)">Scope note:</span> Though similar patterns emerged in follow-up Reddit threads and polls, 
                    this case study is purposefully scoped to the Munich setting to ensure that the solution remains rooted in a particular local environment 
                    (services, red tape, and integration points).
                  </p>
                </Prose>

                {/* Signals + framing */}
                <motion.div className="mt-10 grid gap-6 lg:grid-cols-2" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }}>
                  <motion.div variants={item}>
                      <Callout title="Exploratory signal (Reddit — Munich)">
                        <p className="text-base leading-relaxed">
                          <span className="font-semibold text-(--text-strong)">Why it matters:</span>{" "}
                          The organic engagement on the exploratory signal confirmed the relevance and urgency of the problem space for the target audience.
                        </p>

                        <ul className="mt-4 space-y-2 text-base leading-relaxed text-(--text)">
                          <li>• Views: <span className="font-semibold text-(--text-strong)">24,000</span></li>
                          <li>• Upvotes: <span className="font-semibold text-(--text-strong)">78</span></li>
                          <li>• Comments: <span className="font-semibold text-(--text-strong)">87</span></li>
                          <li>• Upvote ratio: <span className="font-semibold text-(--text-strong)">87.5%</span></li>
                        </ul>
                      </Callout>
                  </motion.div>

                  <motion.div variants={item}>
                    <Callout title="Why this approach is valid">
                      <p>
                        Reddit allowed for access to raw, experience-driven feedback from immigrants who are actively dealing with the Munich context. Affinity mapping 
                        assisted in interpreting dispersed qualitative feedback to ensure that the findings were consistent and actionable for product development.
                      </p>
                    </Callout>
                  </motion.div>
                </motion.div>

                {/* Reddit evidence image */}
                <motion.figure className="mt-10" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
                  <div className="overflow-hidden rounded-2xl border border-(--border) bg-(--surface)">
                    <Image
                      src="/images/reddit-reach.png"
                      alt="Reddit engagement metrics from r/Munich thread showing 24K views, 78 upvotes, 87 comments and 87.5% upvote ratio"
                      className="h-auto w-full"
                      width={1600}
                      height={900}
                      loading="lazy"
                    />
                  </div>
                  <figcaption className="mt-3 text-sm text-(--text-muted)">
                    Reddit analytics from the Munich thread were used as exploratory data for qualitative analysis.
                  </figcaption>
                </motion.figure>

                {/* Affinity mapping synthesis */}
                <div className="mt-12">
                  <Prose>
                    <p>
                      I conducted a qualitative analysis of the feedback using affinity mapping. Feedback statements were grouped according 
                      to recurring themes to ensure that systemic issues were identified rather than mere complaints.
                    </p>
                  </Prose>

                  <div className="mt-8 grid gap-6 lg:grid-cols-2">
                    <Callout title="Themes that were identified as recurring">
                      <ul className="mt-2 space-y-2 text-lg leading-relaxed text-(--text)">
                        <li>
                          <span className="font-semibold text-(--text-strong)">Language barriers</span> – English support is unreliable; translation is not sufficient without context.
                        </li>
                        <li>
                          <span className="font-semibold text-(--text-strong)">Bureaucracy</span> – unclear processes, long waiting times, and confusion about whom to contact.
                        </li>
                        <li>
                          <span className="font-semibold text-(--text-strong)">Social integration</span> – feelings of isolation, difficulty meeting people, and confusion about social norms.
                        </li>
                        <li>
                          <span className="font-semibold text-(--text-strong)">Everyday orientation</span> – healthcare, housing, transportation, and local regulations.
                        </li>
                      </ul>
                    </Callout>

                    <Callout title="Key insight">
                      The fundamental problem was not simply lack of information, but lack of orientation and confidence. 
                      Language and bureaucracy went hand-in-hand to create stress and hinder integration.
                    </Callout>
                  </div>
                </div>

                {/* Affinity overview image */}
                <motion.figure className="mt-10" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
                  <div className="overflow-hidden rounded-2xl border border-(--border) bg-(--surface)">
                    <Image
                      src="/images/affinity-overview.png"
                      alt="Affinity map overview grouped into four themes: language barrier, social, bureaucracy, and miscellaneous everyday orientation"
                      className="h-auto w-full"
                      width={1600}
                      height={900}
                      loading="lazy"
                    />
                  </div>
                  <figcaption className="mt-3 text-sm text-(--text-muted)">
                    Affinity Map Overview: Clustering Qualitative Findings for Four Dominant Themes
                  </figcaption>
                </motion.figure>

                {/* Optional: one zoom detail (recommended) */}
                <motion.figure className="mt-10" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
                  <div className="overflow-hidden rounded-2xl border border-(--border) bg-(--surface)">
                    <Image
                      src="/images/affinity-detail-social.png"
                      alt="Affinity map overview highlighting social challenges and opportunities for connection"
                      className="h-auto w-full"
                      width={1600}
                      height={900}
                      loading="lazy"
                    />
                  </div>
                  <figcaption className="mt-3 text-sm text-(--text-muted)">
                    Affinity Map Overview: Recurring Social Issues and Unmet Needs for Connection and Belonging
                  </figcaption>
                </motion.figure>

                {/* Design implications */}
                <div className="mt-12 grid gap-6 lg:grid-cols-2">
                  <Callout title="Design Implications">
                    <ul className="mt-3 space-y-2 text-lg leading-relaxed text-(--text)">
                      <li>• Design for flows over features</li>
                      <li>• Design for plain language and contextual explanations, not just translation</li>
                      <li>• Design for clear starting points (“what to do first”) and clear progress indicators</li>
                      <li>• Design for trust through transparency, structure, and clear steps</li>
                    </ul>
                  </Callout>

                  <Callout title="From Research to Ideation">
                    The findings informed the direction for the solution: 
                    <ul className="mt-3 space-y-2 text-lg leading-relaxed text-(--text)">
                      <li>• Reduce uncertainty through structured flows</li>
                      <li>• Reduce barriers to action through language-aware design</li>
                      <li>• Facilitate integration through a human layer of help for where systems are hardest to use (volunteers)</li>
                    </ul>
                  </Callout>
                </div>

                {/* Strong CTA */}
                <div className="mt-10 flex flex-wrap gap-3">
                  <PillLink href="#ideation" ariaLabel="Jump to ideation section">
                    See how this informed the design
                  </PillLink>
                </div>
              </Section>

              {/* PERSONAS */}
              <Section id="personas" eyebrow="Personas" title="Two User Realities That Influenced the UX">
                <Prose>
                  <p>
                    I used two user realities to ensure that the decisions made were informed by real-world integration scenarios:{" "}
                    <span className="font-semibold text-(--text-strong)">socialization + language practice</span> vs{" "}
                    <span className="font-semibold text-(--text-strong)">bureaucracy + reliable guidance</span>. These two user realities 
                    both describe high-stress situations in which the UX has a direct impact on the user’s confidence or time-to-action.
                  </p>
                </Prose>

                <div className="mt-10 space-y-10">
                  {/* PERSONA 1 */}
                  <article className="rounded-3xl border border-(--border) bg-(--surface) p-7 sm:p-8">
                    <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Persona 1</p>
                    <h3 className="mt-2 text-3xl font-semibold tracking-tight text-(--text-strong)">Oluchi Quansah</h3>

                    <p className="mt-3 max-w-3xl text-lg leading-relaxed text-(--text)">
                      A Somali teacher in Munich who would like to make social connections and improve her language skills through relevant local activities.
                    </p>

                    {/* Problem statement */}
                    <div className="mt-6 rounded-2xl border border-(--border) bg-(--surface-muted) p-6">
                      <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Problem Statement</p>
                      <p className="mt-3 text-base leading-relaxed text-(--text)">
                        Oluchi is having trouble finding trustworthy, accessible means of socializing with others. The language barrier is causing 
                        even the simplest of socialization processes to become intimidating and laborious for her.
                      </p>
                    </div>

                    {/* Portrait + Snapshot BELOW (prevents overflow into TOC) */}
                    <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr] lg:items-start">
                      <div className="overflow-hidden rounded-2xl border border-(--border) bg-(--surface)">
                        <div className="relative aspect-[4/5] w-full">
                          <Image
                            src="/images/persona-oluchi-portrait.webp"
                            alt="Persona portrait: Oluchi Quansah"
                            fill
                            sizes="(min-width: 1024px) 220px, 100vw"
                            className="object-cover"
                            priority={false}
                          />
                        </div>
                      </div>

                      <div className="rounded-2xl border border-(--border) bg-(--surface-muted) p-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Snapshot</p>
                        <dl className="mt-4 grid gap-3 text-sm text-(--text)">
                          <div className="grid grid-cols-[120px_1fr] gap-3">
                            <dt className="font-semibold text-(--text-strong)">Age</dt>
                            <dd>36</dd>
                          </div>
                          <div className="grid grid-cols-[120px_1fr] gap-3">
                            <dt className="font-semibold text-(--text-strong)">Location</dt>
                            <dd>Munich (Pasing)</dd>
                          </div>
                          <div className="grid grid-cols-[120px_1fr] gap-3">
                            <dt className="font-semibold text-(--text-strong)">Occupation</dt>
                            <dd>Teacher</dd>
                          </div>
                          <div className="grid grid-cols-[120px_1fr] gap-3">
                            <dt className="font-semibold text-(--text-strong)">Primary need</dt>
                            <dd>Social integration + language practice</dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    {/* Quote */}
                    <div className="mt-6 rounded-2xl border border-(--border) bg-(--surface-muted) p-6">
                      <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Representative Quote</p>
                      <p className="mt-3 text-lg leading-relaxed text-(--text)">
                        “One of the main advantages of making friends from different cultures is the amount of knowledge you gather.”
                      </p>
                    </div>

                    {/* Goals + Frustrations */}
                    <div className="mt-6 grid gap-6 lg:grid-cols-2">
                      <div className="rounded-2xl border border-(--border) bg-(--surface-muted) p-6">
                        <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Goals</p>
                        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-(--text)">
                          <li>Make new friends</li>
                          <li>Improve language skills through real-world interactions</li>
                        </ul>
                      </div>

                      <div className="rounded-2xl border border-(--border) bg-(--surface-muted) p-6">
                        <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Frustrations</p>
                        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-(--text)">
                          <li>Socialization is difficult because of the language barrier</li>
                          <li>Finding English-speaking services is time-consuming</li>
                        </ul>
                      </div>
                    </div>
                  </article>

                  {/* PERSONA 2 */}
                  <article className="rounded-3xl border border-(--border) bg-(--surface) p-7 sm:p-8">
                    <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Persona 2</p>
                    <h3 className="mt-2 text-3xl font-semibold tracking-tight text-(--text-strong)">Alina Kovalenko</h3>

                    <p className="mt-3 max-w-3xl text-lg leading-relaxed text-(--text)">
                      A Ukrainian refugee in Munich who requires clear step-by-step assistance with dealing with German bureaucracy and finding appropriate contact points.
                    </p>

                    {/* Problem statement */}
                    <div className="mt-6 rounded-2xl border border-(--border) bg-(--surface-muted) p-6">
                      <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Problem Statement</p>
                      <p className="mt-3 text-base leading-relaxed text-(--text)">
                        Alina Kovalenko faces difficulties with German bureaucracy. She finds that a lack of clear roles, instructions, and information leads to confusion 
                        when dealing with bureaucracy.
                      </p>
                    </div>

                    {/* Portrait + Snapshot BELOW (prevents overflow into TOC) */}
                    <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr] lg:items-start">
                      <div className="overflow-hidden rounded-2xl border border-(--border) bg-(--surface)">
                        <div className="relative aspect-[4/5] w-full">
                          <Image
                            src="/images/persona-alina-portrait.webp"
                            alt="Persona portrait: Alina Kovalenko"
                            fill
                            sizes="(min-width: 1024px) 220px, 100vw"
                            className="object-cover"
                            priority={false}
                          />
                        </div>
                      </div>

                      <div className="rounded-2xl border border-(--border) bg-(--surface-muted) p-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Snapshot</p>
                        <dl className="mt-4 grid gap-3 text-sm text-(--text)">
                          <div className="grid grid-cols-[120px_1fr] gap-3">
                            <dt className="font-semibold text-(--text-strong)">Age</dt>
                            <dd>20</dd>
                          </div>
                          <div className="grid grid-cols-[120px_1fr] gap-3">
                            <dt className="font-semibold text-(--text-strong)">Location</dt>
                            <dd>Munich (Feldmoching)</dd>
                          </div>
                          <div className="grid grid-cols-[120px_1fr] gap-3">
                            <dt className="font-semibold text-(--text-strong)">Occupation</dt>
                            <dd>Currently none</dd>
                          </div>
                          <div className="grid grid-cols-[120px_1fr] gap-3">
                            <dt className="font-semibold text-(--text-strong)">Primary need</dt>
                            <dd>Bureaucracy navigation + confidence</dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    {/* Quote */}
                    <div className="mt-6 rounded-2xl border border-(--border) bg-(--surface-muted) p-6">
                      <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Representative Quote</p>
                      <p className="mt-3 text-lg leading-relaxed text-(--text)">
                        “It’s not easy to start over in a new place. I wish from the bottom of my heart that love and justice will prevail.”
                      </p>
                    </div>

                    {/* Goals + Frustrations */}
                    <div className="mt-6 grid gap-6 lg:grid-cols-2">
                      <div className="rounded-2xl border border-(--border) bg-(--surface-muted) p-6">
                        <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Goals</p>
                        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-(--text)">
                          <li>Understand German bureaucracy</li>
                          <li>Find a job</li>
                        </ul>
                      </div>

                      <div className="rounded-2xl border border-(--border) bg-(--surface-muted) p-6">
                        <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Frustrations</p>
                        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-(--text)">
                          <li>Where to book appointments for each task</li>
                          <li>Lack of step-by-step guide</li>
                        </ul>
                      </div>
                    </div>
                  </article>

                  {/* Why it matters */}
                  <div className="rounded-2xl border border-(--border) bg-(--surface) p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Why this was important to the solution</p>
                    <p className="mt-3 text-sm leading-relaxed text-(--text)">
                      These personas were designed to be complementary to one another, with one being optimized for feelings of <span className="font-semibold text-(--text-strong)">belonging</span> and 
                      the other for survival in the <span className="font-semibold text-(--text-strong)">bureaucracy</span>. This helped to ensure that the solution was not a generic “info app” 
                      but instead kept the user’s decisions in the context of real-world, high-stakes moments.
                    </p>
                  </div>
                </div>
              </Section>

              <Section id="competitive-audit" eyebrow="Research" title="Competitive Audit">
                <Prose>
                  <p>
                    In order to understand what was already out there and to identify areas for differentiation, 
                    I performed a competitive audit of several platforms that offered integration, support, or information services to migrants and refugees.
                  </p>

                  <p className="mt-5">
                    The aim of this competitive audit was not to steal someone else’s ideas, but rather to identify areas in which the usability, accessibility, 
                    and clarity of solutions could be improved, particularly for users with lower language proficiency or higher cognitive loads.
                  </p>
                </Prose>

                <div className="mt-10 grid gap-6 lg:grid-cols-2">
                  <Callout title="What I Analyzed">
                    <ul className="mt-3 list-disc pl-5 space-y-2 text-lg leading-relaxed text-(--text)">
                      <li>Information architecture and clarity on integration platforms</li>
                      <li>Accessibility features (language support, contrast, screen reader friendliness)</li>
                      <li>Navigation patterns and user flow</li>
                      <li>Usefulness vs. feature bloat</li>
                      <li>Consistency between mobile and desktop interfaces</li>
                      <li>Trust and credibility through design, tone, and transparency </li>
                    </ul>
                  </Callout>

                  <Callout title="Key insights gathered from the audit">
                    <ul className="mt-3 list-disc pl-5 space-y-2 text-lg leading-relaxed text-(--text)">
                      <li>Information is available, but rarely presented as a guided journey</li>
                      <li>Accessibility is an afterthought, not an essential design principle</li>
                      <li>Navigation is often overloaded</li>
                      <li>Strong branding, but not always associated with clarity</li>
                      <li>Users are expected to understand bureaucracy, not guided through it</li>
                    </ul>
                  </Callout>
                </div>

                <div className="mt-10 rounded-2xl border border-(--border) bg-(--surface) p-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Design takeaway</p>
                  <p className="mt-3 text-lg leading-relaxed text-(--text)">
                    The audit reinforced the notion that the greatest opportunity was not adding more features, but reducing the overall 
                    friction by providing more clarity, guided journeys, and human-readable explanations instead of dense blocks of information. 
                    This directly influenced the design of the information architecture and interactions for Jumpstart-Muc.
                  </p>
                </div>
              </Section>

              <Section id="ideation" eyebrow="Ideation" title="From insights to solution ideas">
                {/* Intro */}
                <Prose>
                  <p>
                    Following the competitive audit and the identification of gaps in existing solutions, I conducted a brief ideation process 
                    to examine how these issues might be resolved in a more accessible and user-friendly manner.
                  </p>

                  <p className="mt-5">
                    he aim was not to create final screen designs but to rapidly investigate potential solutions and interaction patterns, 
                    with a primary emphasis on{" "}
                    <span className="font-semibold text-(--text-strong)">
                      accessibility, simplicity, and utility.
                    </span>.
                  </p>
                </Prose>

                {/* Callouts */}
                <div className="mt-10 grid gap-6 lg:grid-cols-2">
                  <Callout title="Ideation focus">
                    <ul className="mt-3 list-disc pl-5 space-y-2 text-lg leading-relaxed text-(--text)">
                      <li>Simplifying cognitive load with straightforward flows</li>
                      <li>Communicating complex information in a more understandable visual form</li>
                      <li>Accommodating users with limited language skills</li>
                      <li>Creating features that don't feel overwhelming but helpful</li>
                    </ul>
                  </Callout>

                  <Callout title="Methodology used">
                    <p>
                      I conducted a paper-based ideation exercise in the style of a <span className="font-semibold text-(--text-strong)">Crazy 8</span>{" "}
                      to rapidly investigate and compare several ideas.
                    </p>
                  </Callout>
                </div>

                {/* Full-width figure */}
                <figure className="mt-10">
                  <div className="overflow-hidden rounded-3xl border border-(--border) bg-(--surface)">
                    <div className="relative aspect-[16/9] w-full">
                      <Image
                        src="/images/ideation-sketches.jpg"
                        alt="Early ideation sketches exploring navigation, features, and accessibility concepts"
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 1000px, 100vw"
                        priority={false}
                      />
                    </div>
                  </div>

                  <figcaption className="mt-3 max-w-3xl text-sm text-(--text-muted)">
                    Early ideation sketches exploring navigation structure, accessibility features,
                    and user flows before moving into digital wireframes.
                  </figcaption>
                </figure>

                {/* Bridge to next step (optional but recommended) */}
                <div className="mt-10">
                  <Callout title="What this led to">
                    The concepts I developed directly influenced the creation of the first digital wireframes, particularly for aspects 
                    such as step-by-step information, simplified navigation, and mobile-first layout.
                  </Callout>
                </div>
              </Section>

              <Section id="digital-wireframes" eyebrow="Design" title="Digital wireframes">
              
                  <p className="text-lg leading-relaxed text-(--text) max-w-3xl">
                    After ideating and creating paper concepts for the Jumpstart Muc app, I developed the first digital wireframes for the app. 
                    The aim was to create an easy-to-follow and understandable structure for integrating tasks, even for those with limited language proficiency.
                  </p>

                {/* Balanced cards row */}
                <div className="mt-10 grid gap-6 lg:grid-cols-2">
                  <Callout title="What I focused on">
                    The aspects I focused on for this part of the project included:
                    <ul className="mt-3 space-y-2 text-base leading-relaxed text-(--text) list-disc pl-5">
                      <li>Task-first navigation – to avoid confusion about where to start</li>
                      <li>Highly scannable navigation categories with clear entry points</li>
                      <li>Guidance rather than information-heavy pages</li>
                      <li>Trust aspects such as clarity, structure, and predictability</li>
                    </ul>
                  </Callout>

                  <Callout title="How it connects to the research">
                    The creation of the wireframes directly addresses the major concern for users: overwhelming information. 
                    I focused on creating clear entry points and flows rather than information density.
                  </Callout>
                </div>

                {/* Image block last (full width, clean) */}
                <figure className="mt-10">
                  <div className="overflow-hidden rounded-3xl border border-(--border) bg-(--surface)">
                    <div className="relative aspect-[16/9] w-full">
                      <Image
                        src="/images/digital-wireframes.jpg"
                        alt="Digital wireframes of the Jumpstart-Muc app with annotated feature areas"
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 1000px, 100vw"
                        priority={false}
                      />
                    </div>
                  </div>
                  <figcaption className="mt-3 text-sm text-(--text-muted)">
                    Initial wireframes to translate audit + ideation findings into a scannable, task-first format.
                  </figcaption>
                </figure>
              </Section>

              <Section id="lowfi-prototype" eyebrow="Prototype" title="Low-fidelity prototype">
                {/* Content wrapper to control vertical rhythm */}
                <div className="pt-4 pb-20">
                  {/* Image */}
                  <figure>
                    <div className="overflow-hidden rounded-3xl border border-(--border) bg-(--surface)">
                      <div className="relative aspect-video w-full">
                        <Image
                          src="/images/lowfi-prototype.jpg"
                          alt="Low-fidelity prototype overview showing connected screens and user flow"
                          fill
                          className="object-cover"
                          sizes="(min-width: 1024px) 1000px, 100vw"
                          priority={false}
                        />
                      </div>
                    </div>

                    <figcaption className="mt-3 text-sm text-(--text-muted)">
                      A high-fidelity prototype to integrate the entire flow with post-test refinements.
                    </figcaption>
                  </figure>

                  {/* Text + Callout */}
                  <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
                    <div className="max-w-3xl text-lg leading-relaxed text-(--text)">
                      <p>
                        In preparation for usability testing, I built a low-fidelity prototype to link the user journey end-to-end. 
                        The objective was to ensure usability before spending time on visual design.
                      </p>

                      <p className="mt-5">
                        This helped me to test whether users can confidently move through a wide category to the correct action, 
                        such as seeking help, understanding requirements, and identifying the correct next step.
                      </p>
                    </div>

                    <Callout title="What the low-fi prototype validated">
                      <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-(--text)">
                        <li>Does the category structure align with user expectations?</li>
                        <li>Are labels clear to users without prior knowledge of the system?</li>
                        <li>Can users successfully complete tasks without backtracking?</li>
                        <li>Where do users seem uncertain or hesitant?</li>
                      </ul>
                    </Callout>
                  </div>

                  {/* CTA – intentionally separated */}
                  <div className="mt-8 flex flex-wrap gap-3">
                    <PillLink
                      href="https://www.figma.com/proto/6P2CQbc8EfSr9el5FvbqFU/figma-file?page-id=0%3A1&node-id=1-4&p=f&viewport=402%2C599%2C0.21&t=3NHB6Z9WuamUPM9Q-1&scaling=scale-down&content-scaling=fixed&starting-point-node-id=1%3A4"
                      className="pill-primary"
                      ariaLabel="View prototype context in case study PDF"
                    >
                      View low-fidelity prototype
                    </PillLink>
                  </div>
                </div>
              </Section>

              <Section id="usability-study" eyebrow="Usability study" title="Parameters and findings">
                {/* Parameters */}
                <div className="mt-2">
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-(--border) bg-(--surface) p-6 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-(--surface-circle)">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M9 6h10M9 10h10M9 14h10M9 18h10"
                            stroke="#374151"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <path
                            d="M5 6h.01M5 10h.01M5 14h.01M5 18h.01"
                            stroke="#374151"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                      <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-(--text-muted)">Study type</p>
                      <p className="mt-2 text-base leading-relaxed text-(--text-strong)">Unmoderated usability study</p>
                    </div>

                    <div className="rounded-2xl border border-(--border) bg-(--surface) p-6 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-(--surface-circle)">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11Z"
                            stroke="#374151"
                            strokeWidth="2"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M12 11.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                            stroke="#374151"
                            strokeWidth="2"
                          />
                        </svg>
                      </div>
                      <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-(--text-muted)">Location</p>
                      <p className="mt-2 text-base leading-relaxed text-(--text-strong)">Germany, remote</p>
                    </div>

                    <div className="rounded-2xl border border-(--border) bg-(--surface) p-6 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-(--surface-circle)">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M16 11c1.66 0 3-1.57 3-3.5S17.66 4 16 4s-3 1.57-3 3.5S14.34 11 16 11Z"
                            stroke="#374151"
                            strokeWidth="2"
                          />
                          <path
                            d="M8 11c1.66 0 3-1.57 3-3.5S9.66 4 8 4 5 5.57 5 7.5 6.34 11 8 11Z"
                            stroke="#374151"
                            strokeWidth="2"
                          />
                          <path
                            d="M3 20c0-3 2.5-5 5-5"
                            stroke="#374151"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <path
                            d="M21 20c0-3-2.5-5-5-5"
                            stroke="#374151"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <path
                            d="M8 20c0-3 2-5 4-5s4 2 4 5"
                            stroke="#374151"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                      <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-(--text-muted)">Participants</p>
                      <p className="mt-2 text-base leading-relaxed text-(--text-strong)">5 participants</p>
                    </div>

                    <div className="rounded-2xl border border-(--border) bg-(--surface) p-6 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-(--surface-circle)">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M12 8v5l3 2"
                            stroke="#374151"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                            stroke="#374151"
                            strokeWidth="2"
                          />
                        </svg>
                      </div>
                      <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-(--text-muted)">Length</p>
                      <p className="mt-2 text-base leading-relaxed text-(--text-strong)">10–30 minutes</p>
                    </div>
                  </div>
                </div>

                {/* Findings */}
                <div className="mt-12">
                  <Prose>
                    <p>These were the main findings uncovered by the usability study:</p>
                  </Prose>

                  <div className="mt-8 grid gap-6 lg:grid-cols-3">
                    <div className="rounded-2xl border border-(--border) bg-(--surface) p-7 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-(--surface-circle) text-lg font-semibold text-(--text-circle)">
                        1
                      </div>
                      <p className="mt-6 text-lg font-semibold text-(--text-strong)">Overview &amp; Documents</p>
                      <p className="mt-3 text-base leading-relaxed text-(--text)">
                        People want to see an indication of how many questions are yet to come.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-(--border) bg-(--surface) p-7 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-(--surface-circle) text-lg font-semibold text-(--text-circle)">
                        2
                      </div>
                      <p className="mt-6 text-lg font-semibold text-(--text-strong)">Overview &amp; Documents</p>
                      <p className="mt-3 text-base leading-relaxed text-(--text)">
                        People want to share the overview question results with their community of volunteers to get quick help.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-(--border) bg-(--surface) p-7 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-(--surface-circle) text-lg font-semibold text-(--text-circle)">
                        3
                      </div>
                      <p className="mt-6 text-lg font-semibold text-(--text-strong)">Login</p>
                      <p className="mt-3 text-base leading-relaxed text-(--text)">
                        People want to be able to use the app as a guest without needing to create an account.
                      </p>
                    </div>
                  </div>
                </div>
              </Section>

              <Section id="mockups" eyebrow="Design" title="Mockups">
                {/* Intro */}
                <p className="max-w-3xl text-lg leading-relaxed text-(--text)">
                  In line with the usability study, I have made some improvements to reduce friction and make some of these major actions more visible, 
                  particularly at moments of high uncertainty.
                </p>

                {/* BEFORE / AFTER (top) */}
                <div className="mt-10 grid gap-6 lg:grid-cols-2">
                  <figure className="overflow-hidden rounded-3xl border border-(--border) bg-(--surface)">
                    <div className="p-5 pb-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Before usability study</p>
                    </div>
                    <div className="relative aspect-[4/3] w-full">
                      <Image
                        src="/images/lofi-1-before.png"
                        alt="Before usability study: login and entry screen"
                        fill
                        className="object-contain p-6"
                        sizes="(min-width: 1024px) 520px, 100vw"
                        priority={false}
                      />
                    </div>
                  </figure>

                  <figure className="overflow-hidden rounded-3xl border border-(--border) bg-(--surface)">
                    <div className="p-5 pb-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">After usability study</p>
                    </div>
                    <div className="relative aspect-[4/3] w-full">
                      <Image
                        src="/images/hifi-1-after.png"
                        alt="After usability study: improved login and entry screen including guest access"
                        fill
                        className="object-contain p-6"
                        sizes="(min-width: 1024px) 520px, 100vw"
                        priority={false}
                      />
                    </div>
                  </figure>
                </div>

                <figcaption className="mt-3 text-sm text-(--text-muted)">
                  Example of an iteration based on usability testing.
                </figcaption>

                {/* What changed / Why */}
                <div className="mt-10 grid gap-6 lg:grid-cols-2">
                  <Callout title="What changed after testing">
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-(--text)">
                      <li>Guest access to reduce the “account wall”</li>
                      <li>Clearer visual hierarchy and scan-friendly layout</li>
                      <li>Better labels and entry points for major actions</li>
                      <li>More information at moments of decision to reduce uncertainty</li>
                    </ul>
                  </Callout>

                  <Callout title="Why it works better">
                    The above design reduces friction by making it clear ‘what’s next’ and making the first step clear – this is 
                    particularly important for people with limited language confidence or unfamiliarity with bureaucracy.
                  </Callout>
                </div>

                {/* GALLERY (bottom) */}
                <MockupGallery
                  className="mt-12"
                  title="Final screen flow (click through)"
                  images={ [
                    {
                      src: "/images/hifi-1-after.png",
                      alt: "Final mockup: entry screen with language selection and guest option",
                      label: "Entry" },
                    { src: "/images/hifi-3.png",
                      alt: "Final mockup: home with primary categories",
                      label: "Home" },
                    { src: "/images/hifi-5.png",
                      alt: "Final mockup: select a theme list",
                      label: "Themes" },
                    { src: "/images/hifi-4.png",
                      alt: "Final mockup: task list and progress",
                      label: "Tasks" },
                    { src: "/images/hifi-6.png",
                      alt: "Final mockup: progress and badges",
                      label: "Progress" },
                  ]}
                />
              </Section>

              <Section id="hifi-prototype" eyebrow="Final design" title="High-fidelity prototype">
                {/* Content wrapper to control vertical rhythm */}
                <div className="pt-4 pb-20">
                  {/* Image */}
                  <figure>
                    <div className="overflow-hidden rounded-3xl border border-(--border) bg-(--surface)">
                      <div className="relative aspect-video w-full">
                        <Image
                          src="/images/hifi-prototype.jpg"
                          alt="Hi-fidelity prototype overview showing connected screens and user flow"
                          fill
                          className="object-cover"
                          sizes="(min-width: 1024px) 1000px, 100vw"
                          priority={false}
                        />
                      </div>
                    </div>

                    <figcaption className="mt-3 text-sm text-(--text-muted)">
                      High-fidelity prototype that connects the entire flow with the final UI and post-test refinements.
                    </figcaption>
                  </figure>

                  {/* Text + Callout */}
                  <div className="mt-12 grid gap-8 lg:items-start">
                    <div className="text-lg leading-relaxed text-(--text)">
                      <p>
                        The final design prioritizes ease of understanding, predictability, and anxiety reduction, especially when dealing with unfamiliar systems.
                      </p>
                    </div>
                  </div>

                  {/* CTA – intentionally separated */}
                  <div className="mt-8 flex flex-wrap gap-3">
                    <PillLink
                      href="https://www.figma.com/proto/6P2CQbc8EfSr9el5FvbqFU/figma-file?page-id=66%3A1058&node-id=66-1249&viewport=3518%2C1684%2C0.76&t=rT8a6SfXrN46BpJy-1&scaling=scale-down&content-scaling=fixed&starting-point-node-id=66%3A1335"
                      className="pill-primary"
                      ariaLabel="View prototype context in case study PDF"
                    >
                      View high-fidelity prototype
                    </PillLink>
                  </div>
                </div>
              </Section>

              <Section id="accessibility" eyebrow="Accessibility" title="Accessibility considerations">
                <div className="mt-10 grid gap-6 lg:grid-cols-3">
                  {/* Item 1 */}
                  <div className="rounded-2xl border border-(--border) bg-(--surface) p-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-(--surface-circle) text-sm font-semibold text-(--text-circle)">
                      1
                    </div>
                    <p className="mt-5 text-base leading-relaxed text-(--text)">
                      Made the product accessible to the visually impaired by ensuring that there is alt text provided to the images so that screen readers can read them.
                    </p>
                  </div>

                  {/* Item 2 */}
                  <div className="rounded-2xl border border-(--border) bg-(--surface) p-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-(--surface-circle) text-sm font-semibold text-(--text-circle)">
                      2
                    </div>
                    <p className="mt-5 text-base leading-relaxed text-(--text)">
                      Used icons to help the user navigate the product.
                    </p>
                  </div>

                  {/* Item 3 */}
                  <div className="rounded-2xl border border-(--border) bg-(--surface) p-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-(--surface-circle) text-sm font-semibold text-(--text-circle)">
                      3
                    </div>
                    <p className="mt-5 text-base leading-relaxed text-(--text)">
                      Made sure the text is readable to the user by ensuring that it meets the WCAG (Web Content Accessibility Guidelines) standard.
                    </p>
                  </div>
                </div>

                <div className="mt-10 max-w-3xl">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">
                  Why this mattered
                </h4>
                <p className="mt-3 text-base leading-relaxed text-(--text)">
                  The product's accessibility was crucial to this project because the product will be used by people who might be in unfamiliar situations, 
                  and there is also the possibility that the user will not be able to communicate in the language of the product. So, the product's aim is 
                  not just to be accessible, but also to be emotionally accessible to the user.
                </p>
              </div>
              </Section>

              <Section id="responsive-design" eyebrow="Design" title="Responsive designs">
                <div className="max-w-3xl">
                  <p className="text-lg leading-relaxed text-(--text)">
                   The product was responsively designed to accommodate the needs of mobile, tablet, and desktop usage scenarios. Each of these screen sizes was 
                   considered a unique experience rather than just a scaled-up version of the interface.
                  </p>
                </div>

                {/* Visual overview */}
                <figure className="mt-10">
                  <div className="overflow-hidden rounded-3xl border border-(--border) bg-(--surface)">
                    <div className="relative aspect-video w-full">
                      <Image
                        src="/images/responsive-overview.png"
                        alt="Responsive layouts for mobile, tablet, and desktop"
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 1000px, 100vw"
                      />
                    </div>
                  </div>
                  <figcaption className="mt-3 text-sm text-(--text-muted)">
                    Responsive layouts optimized for mobile, tablet, and desktop usage.
                  </figcaption>
                </figure>

                {/* Key decisions */}
                <div className="mt-10 grid gap-6 md:grid-cols-3">
                  <div className="rounded-xl border border-(--border) bg-(--surface) p-6">
                    <h4 className="font-semibold text-(--text)">Mobile-first</h4>
                    <p className="mt-2 text-sm leading-relaxed text-(--text-muted)">
                      Focus was to ensure easy access, actions, and minimal cognitive load, especially in stressful situations.
                    </p>
                  </div>

                  <div className="rounded-xl border border-(--border) bg-(--surface) p-6">
                    <h4 className="font-semibold text-(--text)">Tablet Optimization</h4>
                    <p className="mt-2 text-sm leading-relaxed text-(--text-muted)">
                      Maximized content visibility and grouping while ensuring the interface remained touch-friendly.
                    </p>
                  </div>

                  <div className="rounded-xl border border-(--border) bg-(--surface) p-6">
                    <h4 className="font-semibold text-(--text)">Desktop Adaptation</h4>
                    <p className="mt-2 text-sm leading-relaxed text-(--text-muted)">
                      Expanding the layout to include a stronger hierarchy and room to provide contextual guidance, yet avoiding overwhelming the user.
                    </p>
                  </div>
                </div>
              </Section>

<Section id="takeaways" eyebrow="Conclusion" title="Impact & key takeaways">
  <div className="max-w-3xl">
    <p className="text-lg leading-relaxed text-(--text)">
      This project showed the value of a UX process in solving complex, emotionally charged issues in a straightforward and usable way. Every decision is informed 
      by the needs of real users, and the final product is assumption-free, clear, confident, and accessible.
    </p>
  </div>

  <div className="mt-10 grid gap-6 lg:grid-cols-2">
    <Callout title="Impact">
      <p className="text-base leading-relaxed text-(--text)">
        The users found it{" "}
        <span className="font-semibold text-(--text-strong)">
          easier to understand and less overwhelming
        </span>{" "}
        than existing solutions. They knew what to do next, 
        thanks to the structured process, without needing to know the system.
      </p>

      <blockquote className="mt-5 rounded-2xl border border-(--border) bg-(--surface) p-5">
        <p className="text-base leading-relaxed text-(--text-strong)">
          “The Jumpstart-Muc app helps me get all the important information in one application.”
        </p>
      </blockquote>
    </Callout>

    <Callout title="What I learned as a UX designer">
      <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-(--text)">
        <li>Structure & clarity are more important than visual complexity</li>
        <li>Guided flows are better than feature-rich dashboards</li>
        <li>Testing early is worth it to prevent costly design mistakes later</li>
        <li>Accessibility is a design mindset, not a checklist</li>
      </ul>
    </Callout>
  </div>

  <div className="mt-10 grid gap-6 lg:grid-cols-2">
    <Callout title="What I would do next">
      <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-(--text)">
        <li>Conduct the second usability testing with real migrants</li>
        <li>Test the onboarding process, including language switching</li>
        <li>Test the logic of the volunteer matching process</li>
        <li>Investigate partnerships with local organizations</li>
      </ul>
    </Callout>

    <Callout
      title="Key takeaway"
      className="relative overflow-hidden ring-1 ring-(--ring) bg-(--surface)"
    >
      <p className="text-base leading-relaxed text-(--text)">
        UX is not about adding more features, it’s about eliminating uncertainty, and this project was a great reminder of that.
      </p>
    </Callout>
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

                        const base = 'block rounded-lg px-3 py-2 text-sm transition-colors';
                        const hover = 'hover:bg-(--surface-hover) hover:text-(--text-strong)';
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
                  <div className="flex flex-wrap gap-3">
                    <Link className="pill" href="/#work">
                      ← Back to work
                    </Link>
                  </div>
          </div>
        </div>

        <SectionDivider />
        <Footer />
      </div>
      </main>
    </>
  );
}
