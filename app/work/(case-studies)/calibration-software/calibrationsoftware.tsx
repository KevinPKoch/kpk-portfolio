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

const META: Meta = {
  title: 'eeszy - Calibration & Asset Management Platform',
  subtitle:
  'As the UX base for a regulated, data-rich B2B SaaS product, I researched to validate the product scope, designed the product to support regulatory and auditing requirements, and delivered a white-label design system that engineering implemented correctly throughout the product.',
  nda:
  'The product is a business secret; therefore, this case study is anonymized. The screenshots and text are representative, and the numbers included are safe to disclose to protect business information, especially since they are presented in a manner that allows decisions, constraints, and impact to be auditable. ',
  role: [
    'First UX/UI Designer (end-to-end ownership: discovery → system → delivery)',
    'Research lead (survey + interviews + synthesis into priorities and personas)',
    'Workflow design for regulated environments (audit-ready, error-resistant UX)',
    'Design system lead (tokens/variables, components, accessibility, governance)',
    'Developer enablement (handoff, Dev Mode, UI QA, release sign-off)',
  ],
  tools: [
    'Figma + Dev Mode',
    'FigJam (workshops, alignment, roadmaps)',
    'Azure DevOps (stories, acceptance criteria, QA)',
    'WCAG/contrast testing + accessibility checklists',
  ],
  delivered: [
    'Research package: survey + synthesis → insights → prioritized opportunities',
    'Persona-driven scope validation + feature mapping (what to build now vs later)',
    'Competitive review (feature matrix + UX scorecard) → differentiation principles',
    'White-label design system: semantic tokens, component library, states, docs',
    'Implementation-ready UX specs + QA loop that reduced UI inconsistency',
  ],
facts: [
  { label: 'Users', value: 'Company admin, superadmin (eeszy admin), supervisor/approver, technician' },
  { label: 'Research sample', value: 'n=218 total (internal n=81, external n=137)' },
  { label: 'Constraints', value: 'Regulated workflows • auditability • error prevention • white-label theming' },
  { label: 'Timeframe', value: '~2 months for UX foundation & design system' },
],

};


const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

const layout = { page: 'min-h-screen',
  container: 'mx-auto pt-24 w-full max-w-[77rem] px-[var(--grid-margin)]' };

/* -------------------------------- Theme ---------------------------------
   Theme switch is removed. We still support Dark Mode automatically
   (based on OS/browser preference) because Tailwind "dark:" classes
   typically rely on the "dark" class on <html> when darkMode:'class'.
--------------------------------------------------------------------------- */

function useSystemThemeClass() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!media) return;

    const apply = () => {
      document.documentElement.classList.toggle('dark', media.matches);
    };

    apply();

    // Safari < 14 uses addListener/removeListener
    const add = media.addEventListener ? media.addEventListener.bind(media) : (media as any).addListener?.bind(media);
    const remove = media.removeEventListener
      ? media.removeEventListener.bind(media)
      : (media as any).removeListener?.bind(media);

    if (add && remove) {
      const handler = () => apply();
      add('change', handler);
      return () => remove('change', handler);
    }

    return;
  }, []);
}

/* --------------------------------- UI ---------------------------------- */

function PillLink({ href,
  children,
  ariaLabel,
  className }: {
  href: string;
  children: ReactNode;
  ariaLabel?: string;
  className?: string;
}) {
  const isExternal = /^https?:\/\//.test(href);
  const baseClass = cx(
    'inline-flex items-center justify-center rounded-full border border-(--border) bg-(--surface) px-5 py-2 text-sm font-medium text-(--text-strong) transition hover:border-gray-300 hover:bg-(--surface-hover) dark:hover:border-white/20',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ring)',
    className
  );

  if (!isExternal && href.startsWith('#')) {
    // in-page anchor
    return (
      <a href={href} aria-label={ariaLabel} className={baseClass}>
        {children}
      </a>
    );
  }

  if (!isExternal) {
    return (
      <Link href={href} aria-label={ariaLabel} className={baseClass}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} aria-label={ariaLabel} target="_blank" rel="noreferrer" className={baseClass}>
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

      if (docHeight - viewportBottom <= bottomSnapPx) {
        return ids[ids.length - 1] ?? '';
      }

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

/** IMPORTANT: id is placed on inner anchor div so scrollspy works reliably. */
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
          {eyebrow && <p className="text-sm font-semibold uppercase tracking-wider text-(--text-muted)">{eyebrow}</p>}
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

function KeyPoints({ items, centered = false }: { items: string[]; centered?: boolean }) {
  return (
    <ul className={cx('mt-6 space-y-4', centered && 'mx-auto max-w-3xl')}>
      {items.map((text) => {
        const [label, rest] = text.split(/:(.+)/);

        return (
          <li key={text} className="flex gap-4">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-(--bullet)" />
            <span className="text-lg leading-relaxed text-(--text)">
              <strong className="font-semibold text-(--text-strong)">{label}</strong>
              {rest && <>:{rest}</>}
            </span>
          </li>
        );
      })}
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

export function ImageLightbox({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Lock background scroll when open (prevents "scroll behind modal").
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);

      // Simple focus trap within the dialog only
      if (e.key === 'Tab') {
        const root = dialogRef.current;
        if (!root) return;

        const focusable = Array.from(root.querySelectorAll<HTMLElement>('[data-lightbox-focusable="true"]'));
        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="block w-full cursor-zoom-in rounded-xl border border-(--border) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ring)"
        onClick={() => setOpen(true)}
        aria-label={`Open image: ${alt}`}
      >
        <img src={src} alt={alt} className="h-auto w-full rounded-xl" loading="lazy" />
      </button>

      {open && (
        <div
          ref={dialogRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={close}
        >
          <div className="relative max-h-full max-w-full" onClick={(e) => e.stopPropagation()}>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={close}
              className="absolute -top-12 right-0 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              data-lightbox-focusable="true"
              aria-label="Close dialog"
            >
              Close (Esc)
            </button>

            <img src={src} alt={alt} className="max-h-[85vh] max-w-[92vw] rounded-xl shadow-2xl" />

            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center justify-center rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              data-lightbox-focusable="true"
            >
              Open in new tab
            </a>
          </div>
        </div>
      )}
    </>
  );
}

/* ------------------------------ Page ------------------------------------ */
type SurveyCard = { k: string; v: ReactNode; note?: string };

function SurveySnapshot() {
  const cards: SurveyCard[] = [
    { k: 'Study design', v: 'Survey + validation interviews', note: 'Internal + external participants' },
    { k: 'Survey participants', v: 'n=218 total', note: 'Internal n=81 • External n=137' },
    { k: 'Top pain point (internal)', v: 'Perceived performance (69%)', note: 'Long loading times (n=72)' },
    { k: 'Priority signals', v: 'Automation (74%) • Mobile (48%)', note: 'n=50 (subset question)' },
];


  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      {cards.map((card) => (
        <div key={card.k} className="rounded-2xl border border-(--border) bg-(--surface) p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">{card.k}</p>
          <p className="mt-2 text-lg font-semibold text-(--text-strong)">{card.v}</p>
          {card.note && <p className="mt-1 text-sm text-(--text-muted)">{card.note}</p>}
        </div>
      ))}
    </div>
  );
}


export default function CalibrationSoftwareCaseStudy() {
  useSystemThemeClass();

  const prefersReducedMotion = useReducedMotion();

  const toc: TocItem[] = useMemo(
    () => [
      { id: 'quick-view', label: 'Recruiter quick view' },
      { id: 'context', label: 'Context' },
      { id: 'role', label: 'My role & scope' },
      { id: 'process', label: 'Process' },
      { id: 'research', label: 'Research' },
      { id: 'competitive-analysis', label: 'Competitive landscape' },
      { id: 'personas', label: 'Personas & feature mapping' },
      { id: 'color-analysis', label: 'Color analysis' },
      { id: 'brand-identity', label: 'Brand identity' },
      { id: 'design-system', label: 'Design system' },
      { id: 'collaboration', label: 'Collaboration' },
      { id: 'calibration-process', label: 'Calibration workflow' },
      { id: 'device-management', label: 'Device management' },
      { id: 'outcome', label: 'Outcome' },
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
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm font-semibold uppercase tracking-wider text-(--text-muted)">Confidential case study</p>
              </div>

              <h1 className="mt-4 text-balance text-4xl font-extrabold tracking-tight leading-[1.15] text-(--text-strong) sm:text-6xl sm:leading-[1.15] md:text-7xl md:leading-[1.1]">
                {META.title}
              </h1>

              <p className="mt-6 max-w-3xl text-xl leading-relaxed text-(--text)">{META.subtitle}</p>

              {/* At a glance */}
              <MetaGrid items={META.facts.map((f) => ({ k: f.label, v: f.value }))} />

              <div className="mt-10 flex flex-wrap gap-3">
                <PillLink href="#quick-view" className="pill-primary" ariaLabel="Jump to recruiter quick view">
                  Recruiter quick view
                </PillLink>
                <PillLink href="#context">Start reading</PillLink>
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
                <Section id="quick-view" eyebrow="Recruiter quick view" title="What to know in 20 seconds">
                  <div className="grid gap-6 lg:grid-cols-2">
                    <Callout title="Problem">
                      The teams were using existing calibration software that had become complex over time.
                      The workflows, although working, were disjointed, difficult to scale, and plagued by usability problems stemming from legacy behavior, 
                      patterns, and content that were no longer relevant or useful. 
                      The company needed a new UX foundation that could simplify internal workflows, as well as prepare the platform for future external customers.
                    </Callout>

                    <Callout title="My role">
                      I reduced uncertainty and laid the groundwork as the first UX/UI Designer. Through research, I established the scope, designed the workflow, 
                      and created a white-label design system for the engineers.
                    </Callout>

                    <Callout title="What made it hard">
                      The regulated industry, data-rich product, high error costs, and the need to deliver a white-label product from the outset, all with a team that 
                      had not previously worked in a structured design system approach.
                    </Callout>

                    <Callout title="Results">
                      Research established a shared priority list, where internal users ranked "perceived performance" as their top concern (69%, n=72). I used this to 
                      create shippable UX rules and design system patterns, such as loading states, empty states, status consistency, and progressive disclosure (only necessary 
                      information at each step to reduce cognitive load). I wrote these rules as UX acceptance criteria, making it easy for the engineering team to implement these rules across different modules.
                    </Callout>


                  </div>

                  <div className="mt-10 mx-auto max-w-3xl rounded-2xl border border-(--border) bg-(--surface) p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Transparency</p>
                    <p className="mt-2 text-base leading-relaxed text-(--text)">
                      Transparency
                      The work on the UX scope was completed, and it was handed over in an implementation-ready state.
                      Although the product did not get to full market release due to various business reasons, it was built from the start as a system, not as a series of isolated screens. 
                      <br /><br />                      
                      The core workflows, such as the process for device calibration, management of devices and other assets, and support for compliance-critical patterns, were fully designed,
                      validated, and documented. This makes it directly applicable to other regulated, high-data-volume SaaS products where scalability, auditability, and consistency are critical.
                    </p>
                  </div>
                </Section>

                <Section id="context" eyebrow="Context" title="Why the product needed a UX foundation early">
                  <Prose>
                    <p>
                      The product goal was to replace multiple internal and external tools with one platform covering calibration and asset workflows. Unlike a typical 
                      internal tool, this needed to be sellable: consistent UX, scalable information architecture, and brand-safe white-label theming.
                    </p>

                    <p className="mt-5">
                      UX had to be built early to avoid the classic failure mode in enterprise software: features shipping faster than the underlying system, creating 
                      inconsistent screens, increasing training time, and making audits harder.
                    </p>
                  </Prose>
                </Section>

                <Section id="role" eyebrow="Scope" title="My role & responsibilities">
                  <KeyPoints
                    centered
                    items={[
                      'Discovery leadership: planned research, maximized participation, and synthesized results to prioritize and identify constraints',
                      'Workflow ownership: defined the calibration workflow with auditability, prevention of errors, and understandable semantics around the state',
                      'Design system ownership: semantic tokens, components, states, and accessibility rules, along with governance',
                      'Cross-functional alignment: workshops with product, engineering, and architecture teams, as well as the leadership, to resolve ambiguity and create decisions',
                      'Delivery & quality: specs, development handoff, UI QA loop, and sign off to ensure consistency in the implementation',
                    ]}
                  />

                  <div className="mt-10 mx-auto max-w-3xl rounded-2xl border border-(--border) bg-(--surface) p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Important note</p>
                    <p className="mt-2 text-base leading-relaxed text-(--text)">
                      I have consistently been able to translate the stories into UX acceptance criteria and rules around interactions, such as states, validation, and empty/error conditions, to ensure predictability in the decisions around the implementation.
                    </p>
                  </div>
                </Section>

                <Section id="process" eyebrow="Process" title="How the work was structured">
                  <Prose>
                    <p>
                     I organized the work into four stages to ensure traceability of decisions and safe implementation:
                    </p>      

                    <ol className="mt-4 list-decimal space-y-2 pl-6">
                      <li>
                        <strong>Define reality:</strong> map users, constraints, and risks (regulatory + domain complexity)
                      </li>
                      <li>
                        <strong>Validate scope:</strong> research → personas → feature mapping → “now / next / later”
                      </li>
                      <li>
                        <strong>Build the system:</strong> tokens, components, interaction rules, accessibility and governance
                      </li>
                      <li>
                        <strong>Make it shippable:</strong> prototypes + specs + Dev Mode handoff + QA feedback loop
                      </li>
                    </ol>

                    <p className="mt-5">
                      The guiding philosophy: components never depend on raw values; they depend on semantic roles. This ensured white-label theming and dark mode did not harm the product in the future.
                    </p>
                  </Prose>

                  <div className="mt-10">
                    <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">FigJam UX roadmap</p>
                    <p className="mt-2 max-w-3xl text-base leading-relaxed text-(--text)">Click to open the roadmap in full size.</p>

                    <a
                      href="/images/ux-roadmap.png"
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 block overflow-hidden rounded-2xl border border-(--border) bg-(--surface)"
                      aria-label="Open UX roadmap image in full size"
                      title="Open full size"
                    >
                      <img
                        src="/images/ux-roadmap.png"
                        alt="UX/UI project roadmap showing phases: Research & Define, Structure & Design, Prototype & Testing, Finalization & Documentation."
                        className="h-auto w-full"
                        loading="lazy"
                      />
                    </a>

                    <p className="mt-3 text-sm text-(--text-muted)">
                      Tip: for readability, this preview is clickable and opens in a separate tab at full resolution.
                    </p>
                  </div>
                </Section>

                <Section id="research" eyebrow="Research" title="Research inputs that informed product decisions">
                  <Prose>                    
                    <p>
                      Research helped mitigate risk early on. The aim was not to have “nice insights” but to make decisions about scope and ensure workflow accuracy in a regulated setting.
                    </p>

                    <p className="mt-5">
                      Research methods included:
                    </p>
                  </Prose>

                  <KeyPoints
                    centered
                    items={[
                      'Survey of internal + external users (n=218 total: internal n=81, external n=137)',
                      'Primary internal pain point: 69% said long loading times; we focused on providing good performance feedback + predictable loading behavior (n=72)',
                      'Internal priorities (subset question): automation (74%) and mobile usage (48%) (n=50)',
                      'External expectation: 71% said multi-device support was important or very important (n=136)',
                    ]}
                  />

                   <SurveySnapshot />

                  <div className="mt-8 mx-auto max-w-3xl rounded-2xl border border-(--border) bg-(--surface) p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Key outcomes</p>
                    <p className="mt-2 text-base leading-relaxed text-(--text)">
                        The outputs were translated into: (1) personas that matched real workflows, (2) a prioritized feature map, and (3) interaction and terminology decisions 
                        that reduced ambiguity during audits and training.
                    </p>
                  </div>

                  <div className="mt-6 mx-auto max-w-3xl rounded-2xl border border-(--border) bg-(--surface) p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Why this mattered</p>
                    <p className="mt-2 text-base leading-relaxed text-(--text)">
                      By creating a clear research baseline from the outset, the team was able to reduce uncertainty, prevent scope creep, and make informed decisions before development ramped up.
                    </p>
                  </div>
                </Section>

                <Section id="competitive-analysis" eyebrow="Research" title="Understanding the competitive landscape">
                  <Prose>
                    <p>
                      Parallel to the user research, I also performed an extensive analysis of existing calibration and asset management tools. This analysis was not intended for mimicking the features 
                      of the competition, but for identifying the market trends, structural flaws, and areas for significant differentiation.
                    </p>

                    <p className="mt-5">
                      This analysis was performed along two axes: the functional space, as well as the overall UX structure, including the handling of complex workflows, navigation depth, system feedback, 
                      configuration, and scalability for various types of users.
                    </p>
                  </Prose>

                  <div className="mt-10 grid gap-6 lg:grid-cols-2">
                    <Callout title="Methodology">
                      <ul className="list-disc pl-5 text-sm leading-relaxed">
                        <li>Review of the major calibration and asset management tools</li>
                        <li>Feature matrix for comparing the functional space, including overlaps and gaps</li>
                        <li>Scorecard analysis for the overall UX, including clarity, consistency, and overall system structure</li>
                        <li>Identification of overall UX patterns, anti-patterns, and structural flaws</li>
                      </ul>
                    </Callout>

                    <Callout title="Key insights">
                      <p>
                        Many of the solutions were functionally comprehensive but hard to scale from a UX standpoint. Some of the common problems were fragmented navigation, inconsistent terminology, 
                        cluttered screens, and a lack of flexibility in terms of branding and customization.
                      </p>

                      <p className="mt-3">
                        The UX complexity tended to escalate disproportionately with the addition of feature sets, resulting in a steep learning curve and a lack of usability for the non-technical user.
                      </p>
                    </Callout>
                  </div>

                  <div className="mt-10 rounded-2xl border border-(--border) bg-(--surface) p-6">
                    <p className="text-sm font-semibold uppercase tracking-wider text-(--text-muted)">Impact on product decisions</p>
                    <p className="mt-2 text-sm leading-relaxed text-(--text)">
                      As part of the competitive analysis, I found that many tools were feature-rich but difficult to learn due to their structural complexity. I used this information to create a list of product principles:
                    </p>
                      <ul className="mt-4 space-y-2 text-sm leading-relaxed text-(--text)">
                        <li>• reduce navigation depth for daily tasks</li>
                        <li>• standardize terminology and status semantics</li>
                        <li>• design for “safe errors” (validation + confirmations + audit trails)</li>
                        <li>• separate configuration and branding from workflow behavior</li>
                      </ul>
                  </div>
                </Section>

                <Section id="personas" eyebrow="Personas" title="Personas & feature mapping">
                  <Prose>
                    <p>
                      Personas were developed as fictional user representations, based on real internal and external survey data collected for various user roles and organizations. They represent real-world responsibilities,
                      motivations, pain points, and workflows identified during research.
                    </p>

                    <p className="mt-5">
                      Instead of being passive documentation, personas were actively utilized throughout the project to validate scope, prioritize, and align product decisions across design, product management, and engineering teams.
                    </p>
                  </Prose>

                  <KeyPoints
                    centered
                    items={[
                      'Research-driven foundation: personas were developed from survey insights, ensuring product decisions were based on real user behavior, not hypotheses',
                      'Feature re-validation: after persona development, the entire feature set was re-validated and mapped to each persona to ensure relevance, scope, and priority',
                      'Decision support: personas were used as a common point of reference during discussions on trade-offs, complexity, and implementation effort',
                      '  Future readiness: in addition to existing user groups, future personas were established to enable long-term product vision and scalability',
                    ]}
                  />

                  <div className="mt-12">
                    <h3 className="text-lg font-semibold text-(--text)">Example personas</h3>
                    <p className="mt-2 max-w-3xl text-base leading-relaxed text-(--text-muted)">
                      The following personas are some of the key user groups and demonstrate how insights from research were used to inform concrete product and UX decisions. Other personas were developed during the project and are not included here.
                    </p>
                  </div>

                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    <div className="rounded-2xl border border-(--border) bg-(--surface) p-6">
                      <p className="text-sm font-semibold text-(--text)">Operational user</p>
                      <p className="mt-1 text-sm text-(--text-muted)">Everyday hands-on engagement with calibration and asset processes</p>

                      <ul className="mt-4 space-y-2 text-sm leading-relaxed text-(--text)">
                        <li>• Requires quick access to routine tasks and system feedback</li>
                        <li>• Frustrated with disjointed tools and unpredictable UI behavior</li>
                        <li>• Cares about efficiency, accuracy, and predictable processes</li>
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-(--border) bg-(--surface) p-6">
                      <p className="text-sm font-semibold text-(--text)">Supervisory / management user</p>
                      <p className="mt-1 text-sm text-(--text-muted)">System oversight, reporting, and decision-making</p>

                      <ul className="mt-4 space-y-2 text-sm leading-relaxed text-(--text)">
                        <li>• Needs system transparency, consistency, and reliable reporting</li>
                        <li>• Requires confidence in data and process compliance and audibility</li>
                        <li>• Prioritizes clarity over speed, particularly in complex views</li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-8 mx-auto max-w-3xl rounded-2xl border border-(--border) bg-(--surface) p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Key takeaways</p>
                    <p className="mt-2 text-base leading-relaxed text-(--text)">
                      The most important result was what we chose not to build: the persona mapping process clearly indicated which features 
                      were “must-have for compliance,” which were “nice-to-have,” and which would introduce unnecessary complexity with little actual user value.
                    </p>
                  </div>

                  <div className="mt-10 mx-auto max-w-3xl rounded-2xl border border-(--border) bg-(--surface) p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Why it matters</p>
                    <p className="mt-2 text-base leading-relaxed text-(--text)">
                      Aligning features and workflows with personas ensured that functionality served specific user needs, not internal desires. This helped to avoid 
                      scope creep, provided clarity on priorities early on, and established a solid UX foundation that scaled well for different personas, processes, and future users.
                    </p>
                  </div>
                </Section>

                <Section
                  id="color-analysis"
                  eyebrow="Design Decisions"
                  title="Color analysis as a basis for accessibility, clarity, and scalability"
                >
                  <Prose>
                    <p>
                      Prior to designing the design system, I performed a formal color analysis to establish a sound visual foundation for a data-intensive calibration tool. 
                      The objective was not to explore the world of color but to ensure predictable UI behavior for complex data workflows with inherent accessibility and scalability.
                    </p>

                    <p className="mt-5">
                      Color analysis was assessed for contrast needs, semantic interpretation (error, warning, success), and usability in dense table views and form-driven pages. These 
                      needs directly influenced the token design and component behavior in the design system.
                    </p>
                    
                    <p className="mt-5">
                     In this context, color is not a design element but a risk management strategy. Unclear status indicators can lead to actual operational errors. This is why the color 
                     scheme and status indicators were developed as system constraints (contrast limits, focus indication, semantic interpretation) rather than “design choices.”
                    </p>
                  </Prose>

                  <div className="mt-10 grid gap-6 lg:grid-cols-2">
                    <Callout title="Accessibility & system constraints">
                      <ul className="list-disc pl-5 text-sm">
                        <li>Contrast analysis for text, surfaces, and status indicators with WCAG guidelines</li>
                        <li>Focus indication and status differentiation for keyboard accessibility</li>
                        <li>Data-dense UI consistency (tables, forms, validation messages)</li>
                        <li>Designed to be theme-agnostic (light and dark themes)</li>
                      </ul>
                    </Callout>

                    <Callout title="Status colors & error prevention">
                      <p>
                        Status communication received special consideration. In calibration and measurement processes, 
                        feedback should be clear to avoid confusion, especially for error messages, warnings, confirmations, or progress indicators.
                      </p>
                      <p className="mt-3">
                        This ensures semantic meaning is maintained consistently across different modules, independent of subsequent branding decisions.
                      </p>
                    </Callout>
                  </div>

                  <div className="mt-10 grid gap-6 lg:grid-cols-2">
                    <Callout title="Preparation for white-label theming">
                      <p>
                        The color scheme was designed to accommodate subsequent customer branding without modifying components or layouts. It was assumed that 
                        branding would be updated centrally, while interaction behavior or semantic roles remain unaffected.
                      </p>
                    </Callout>

                    <Callout title="How this fed into the design system">
                      <p>
                        The outcome of color analysis was system rules that took the form of semantic roles, state behavior, and contrast boundaries. 
                        This gave rise to a basis for token naming, variable mapping, and component state.
                      </p>
                    </Callout>
                  </div>
                </Section>

                <Section id="brand-identity" eyebrow="Brand identity" title="Logo Design">
                  <Prose>
                    <p>
                      In addition to UX and system design, I also designed the company’s logo. This ensured that there was a foundation in place for 
                      the overall product’s visuals, which later contributed to the design system’s brand section and ensured that the UI could be 
                      branded correctly as the product developed.
                    </p>
                  </Prose>

                  <div className="lighting">
                    <img className="mt-6 h-auto w-[320px]" src="/images/eeszy-logo.svg" alt="eeszy logo" loading="lazy" />
                  </div>

                  <div className="darking">
                    <img
                      className="mt-6 h-auto w-[320px]"
                      src="/images/eeszy-logo-color-white.svg"
                      alt="eeszy logo"
                      loading="lazy"
                    />
                  </div>

                  <div className="mt-10 grid gap-6 lg:grid-cols-2">
                    <Callout title="What I contributed">
                      <ul className="list-disc pl-5 text-sm">
                        <li>Logo creation as part of the product’s visual foundation</li>
                        <li>Early alignment on brand direction to avoid “rebranding later” churn</li>
                        <li>Foundation for consistent usage in UI (product surfaces, navigation, exports)</li>
                      </ul>
                    </Callout>

                    <Callout title="How this connected to the design system">
                      <p>
                        The logo creation contributed to the design system in that the brand elements are seen as a fluid entity that can change, 
                        while the UI remains relatively static and controlled through the design system.
                      </p>
                    </Callout>
                  </div>
                </Section>

                <Section id="design-system" eyebrow="Design System" title="A production-ready design system for white-label products">
                  <Prose>
                    <div className="mt-10 rounded-2xl border border-(--border) bg-(--surface) p-6">
                      <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">What’s inside</p>
                      <p className="mt-2 text-base leading-relaxed text-(--text)">
                        The design system consisted of principles for accessible design, design tokens, typography scale, spacing rules, semantic colors, components, interactive states (hover, focus, disabled, error), 
                        table patterns, form validation, and governance – how to introduce changes safely.
                      </p>
                    </div>
                  
                    <p className="mt-10">
                      From the start, the product has needed a UX base that can accommodate a variety of different modules, user roles, and customer brands. Throughout the early phase of the project, 
                      I have designed and implemented a production-ready design system within Figma, not as a series of UI screens, but as a base for the entire application.
                    </p>

                    <p className="mt-5">
                      The main purpose has been to create a sense of consistency and predictability throughout the application, as well as fast development and testing, and even rebranding for the customer 
                      without having to change any of the underlying elements.
                    </p>

                    <p className="mt-5">
                      To achieve this, the design system has been built as a system of layered variables with four sets or collections: <b>alias, brand, mapped, and responsive.</b>
                    </p>
                  </Prose>

                  <div className="mt-10 grid gap-6 lg:grid-cols-2">
                    <Callout title="Layered Variable Architecture">
                      <p>
                        The design system follows a four-layered variable architecture, with each layer serving a unique purpose. This ensures that changes made to one layer are not propagated randomly into other areas.
                      </p>

                      <ul className="mt-4 list-disc pl-5 text-sm">
                        <li>
                          <strong>alias</strong> - This layer includes fundamental system value sets, such as base color sets, spacing, border, border radius, elevation, and focus.
                        </li>
                        <li>
                          <strong>brand</strong> - This layer includes variables that define the look and feel of a design, such as custom color sets, typography sets, and so on. This layer should be easily swappable for different customers.
                        </li>
                        <li>
                          <strong>mapped</strong> - This layer includes semantic UI roles, such as primary, surface, on-primary, error, and success, with Light and Dark mode. This layer serves as a single point of truth for all components.
                        </li>
                        <li>
                          <strong>responsive</strong> - This layer includes typography and spacing variables, divided into Desktop, Tablet, and Mobile breakpoints.
                        </li>
                      </ul>
                    </Callout>

                    <Callout title="Why this architecture matters">
                      <p>
                        Components are not tied to raw values such as colors, fonts, and sizes, but rather to mappings.
                      </p>
                      <p className="mt-3">
                        This enables central management of things like branding, theming, and dark mode, without affecting component code or increasing risk.
                      </p>
                    </Callout>
                  </div>

                  <div className="mt-10 grid gap-6 lg:grid-cols-2">
                    <Callout title="Token naming (scalable + developer-friendly)">
                      <p>
                        Tokens are named following a strict hierarchy instead of arbitrary names to ensure the system is scalable and searchable.
                      </p>

                      <ul className="mt-4 list-disc pl-5 text-sm leading-relaxed">
                        <li>
                          <strong>Format:</strong>{' '}
                          <code className="rounded bg-black/5 px-1 py-0.5 dark:bg-white/10">
                            $eeszyds-element-category-concept-property-variant
                          </code>
                        </li>
                        <li>
                          <strong>Optional:</strong> <code>-state</code>, <code>-mode</code> (only when it makes sense)
                        </li>
                        <li>
                          <strong>Outcome:</strong> readable, predictable, and easy to relate to the code.
                        </li>
                      </ul>
                    </Callout>

                    <Callout title="How to read tokens (example)">
                      <p>
                        The token naming convention is structured to be readable from left to right, as a sentence. Each part adds meaning without relying on additional documentation or developer-specific conventions.
                      </p>

                      <div className="mt-4 rounded-xl border border-(--border) bg-(--surface) p-4">
                        <code className="text-sm">$eeszyds-button-color-primary-background-hover</code>
                      </div>

                      <ul className="mt-4 list-disc pl-5 text-sm leading-relaxed">
                        <li>
                          <strong>System:</strong> eeszyds - the context where the token is being used
                        </li>
                        <li>
                          <strong>Element:</strong> button - the component being styled
                        </li>
                        <li>
                          <strong>Category:</strong> color - the type of property being styled
                        </li>
                        <li>
                          <strong>Concept:</strong> primary - the meaning of the token
                        </li>
                        <li>
                          <strong>Property:</strong> background  - the specific css property affected
                        </li>
                        <li>
                          <strong>Variant:</strong> hover - the state of the component
                        </li>
                      </ul>

                      <div className="mt-4 rounded-xl border border-(--border) bg-(--surface) p-4">
                        <code className="text-sm">$eeszyds-spacing-lg</code>
                      </div>

                      <p className="mt-3 text-sm leading-relaxed">
                        The same convention applies to non-visual token types such as spacing and typography, ensuring consistency across domains.
                      </p>

                      <p className="mt-4">
                        Components rely on semantic tokens (mapped layer), so branding or theme updates can be done without modifying component logic.
                      </p>
                    </Callout>
                  </div>

                  <div className="mt-10 grid gap-6 lg:grid-cols-2">
                    <Callout title="Spacing & sizing scale (no arbitrary values)">
                      <p>
                        To create layout rhythm and maintain density on data-intensive screens, spacing and sizing follow a single baseline and logical scale. This removes arbitrary values and makes UI changes more reliable across modules.
                      </p>

                      <ul className="mt-4 list-disc pl-5 text-sm leading-relaxed">
                        <li>
                          <strong>Baseline:</strong> 16px (browser default, easy to divide)
                        </li>
                        <li>
                          <strong>Rule:</strong> values are multiples/factors of the baseline — no arbitrary spacing
                        </li>
                        <li>
                          <strong>Behavior:</strong> tighter steps at the low end, larger jumps at the high end
                        </li>
                      </ul>
                    </Callout>

                    <Callout title="Scale (example values)">
                      <div className="rounded-xl border border-(--border) bg-(--surface) p-4">
                        <code className="text-sm">4, 8, 12, 16, 24, 32, 48, 64, 96, 128…</code>
                      </div>

                      <p className="mt-4 text-sm leading-relaxed">
                        This scale is used throughout padding, spacing, component sizing, and responsive design decisions, making the UI more visually consistent and easier to implement and Quality Assurance.
                      </p>
                    </Callout>
                  </div>

                  <div className="mt-12 grid gap-6 lg:grid-cols-2">
                    <Callout title="Developer enablement & handoff">
                      <p>
                        Engineering utilized Figma Dev Mode as the main reference for spacing, sizing, and token usage across modules and features. 
                        Prototypes were used as a common visual and structural reference, and icons and images were directly exportable.
                      </p>
                      <p className="mt-3">
                        This created a single source of truth between design and engineering, allowing for rapid implementation and minimizing UI 
                        inconsistencies during development.
                      </p>
                    </Callout>

                    <Callout title="Governance & quality">
                      <p>
                        To avoid fragmentation as the product grew, the system had guidelines for usage, accessibility, and review processes. 
                        Accessibility was considered a system requirement, not just a final QA process.
                      </p>
                      <p className="mt-3">
                        The behavior of components, interaction states (such as focus, disabled, error), and contrast boundaries were also documented 
                        to ensure consistent implementation across modules, as well as maintainability in the future.
                      </p>
                    </Callout>
                  </div>

                  <div className="mt-10 rounded-2xl border border-(--border) bg-(--surface) p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Impact</p>
                    <p className="mt-2 text-base leading-relaxed text-(--text)">
                      The engineering process helped minimize UI variation in the QA process because components and states were defined once and reused 
                      across multiple modules. Being white-label ready was no longer considered a redesign process but simply configuring token levels.
                    </p>
                  </div>
                </Section>

                <Section id="collaboration" eyebrow="Collaboration" title="Working across product, engineering, and leadership">
                  <Prose>
                    <p>
                      The project was highly cross-functional from the outset. I was the first UX/UI Designer on the eeszy platform, so I worked closely with product management, 
                      engineering, software architecture, and leadership teams to ensure that my work was closely aligned with user needs, technical feasibility, and overall business objectives.
                    </p>

                    <p className="mt-5">
                      The project recognized that UX is a critical part of decision-making, not just a supporting function. So, I worked closely with product management, engineering, and leadership teams 
                      to ensure that my work was closely aligned with overall product strategy and objectives. I developed a shared workflow that I called a “source of truth.” It consisted of decision documentation 
                      using FigJam, Figma component/token development, Dev Mode, and a QA checklist. This workflow allowed us to reduce iterations since I documented my decisions as rules, not opinions.
                    </p>
                  </Prose>

                  <div className="mt-10 grid gap-6 lg:grid-cols-2">
                    <Callout title="Product Management Collaboration">
                      <p>
                        User stories were first identified by the Product Manager, followed by further refinement based on the User Experience aspect. I helped interpret 
                        the requirements as User Flows, Wireframes, and Prototypes, as well as validating them against research findings and personas, thereby providing 
                        clarity before the implementation stage.
                      </p>
                      <p className="mt-3">
                        This helped keep the product decisions user-centric while remaining technically feasible.
                      </p>
                    </Callout>

                    <Callout title="Engineering & Architecture Alignment">
                      <p>
                        Collaborated with the software architect and engineering team to ensure that all UX decisions aligned with the underlying technical 
                        architecture. During this project, I was able to introduce structured workflows in Figma and design system concepts for the team 
                        since they had not used a design system setup in their previous projects.
                      </p>
                      <p className="mt-3">
                        Also, during this project, I was able to review implemented UI and validate component behaviors against the design system.
                      </p>
                    </Callout>

                    <Callout title="Leadership & Stakeholder Alignment">
                      <p>
                        In addition, UX concepts, system decisions, and development progress were also aligned with leadership and key stakeholders 
                        throughout the process, which ensured a shared understanding of the product, its development, and its future direction.
                      </p>
                      <p className="mt-3">
                        By providing transparency into UX decisions, the complexity and size of the project, and the UX process, leadership and 
                        stakeholder alignment were also maintained throughout the process.
                      </p>
                    </Callout>

                    <Callout title="Shared Workflows & Handoffs">
                      <p>
                        Figma was also used as a shared space for cross-functional teams, which ensured that all relevant elements, from research 
                        and design systems, were easily accessible and understood by the engineering team throughout the development process.
                      </p>
                      <p className="mt-3">
                        By providing a structured planning and review process, a traceable workflow from research to release, and a reduced back-and-forth 
                        during development, design decisions could also be scaled without increasing complexity and costs.
                      </p>
                    </Callout>
                  </div>

                  <div className="mt-10 rounded-2xl border border-(--border) bg-(--surface) p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Why this mattered</p>
                    <p className="mt-2 text-base leading-relaxed text-(--text)">
                      The close cooperation between these fields ensured that the UX decisions scaled up with the product, implementation risks were spotted early, 
                      and the software that was produced was coherent despite having multiple pieces, stakeholders, and white-label needs.
                      The mode of cooperation enabled the product to grow in complexity without increasing the cost of coordination and without slowing down development.
                    </p>
                  </div>
                </Section>

                <Section id="calibration-process" eyebrow="Core UX work" title="Designing a compliant and efficient calibration process">
                  <Prose>
                    <p>
                      The calibration process itself was one of the most important aspects of the product. Unlike most CRUD-based enterprise software, 
                      the calibration process is closely tied to international regulations and standards.
                    </p>

                    <p className="mt-5">
                      Before designing any UI, I personally analyzed the relevant calibration regulations and certificate requirements to identify which 
                      steps were mandatory, where flexibility was possible, and how the process would need to scale across international markets.
                    </p>
                  </Prose>

                  <div className="mt-10 grid gap-6 lg:grid-cols-2">
                    <Callout title="Regulatory basis">
                      <p>
                        The process had to be compliant with international calibration regulations and audits. I analyzed the regulations independently, 
                        while the Product Manager independently verified key aspects of the regulations.
                      </p>
                      <p className="mt-3">
                        The resulting process was discussed with calibration technicians and a Senior Metrology Expert (Head of Competences, Methods and Consulting), 
                        who is also active in regulatory bodies.
                      </p>
                    </Callout>

                    <Callout title="Regulation to UX structure">
                      <p>
                        Together with the Product Manager, I extracted the regulatory constraints to a structured end-to-end process. 
                        This diagram was used as a common point of reference before making any UI design decisions.
                      </p>
                    </Callout>
                  </div>

                  <div className="mt-16">
                    <h3 className="text-base font-semibold text-(--text-strong)">Calibration process - structural overview</h3>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-(--text-muted)">
                      This diagram illustrates the complete regulatory calibration process, including guided and quick calibration procedures. 
                      It was used as a common point of reference to align UX, product management, and domain experts before structuring the process into UI.
                    </p>

                    <div className="mt-6 max-w-[420px]">
                      <ImageLightbox
                        src="/images/calibration-process-overview.jpg"
                        alt="Calibration process diagram showing guided and quick calibration paths"
                      />
                    </div>
                    <p className="mt-2 max-w-3xl text-sm text-(--text-muted)">
                      The diagram above is intentionally reduced for size to emphasize the structural design rather than the level of detail. Click on the diagram to view it full size.
                    </p>
                  </div>

                  <div className="mt-16">
                    <h3 className="text-lg font-semibold">Calibration workflow — key UX moments</h3>
                    <p className="mt-2 max-w-3xl text-base leading-relaxed text-(--text-muted)">
                      Instead of showing all the internal steps involved, the following screens show the key UX moments that influenced the usability, compliance, and adoption of the tool.
                    </p>

                    <div className="mt-8 grid gap-10 md:grid-cols-2">
                      <div>
                        <p className="mb-3 text-sm font-semibold">1) Calibration entry: guided vs. quick calibration</p>
                        <ImageLightbox src="/images/frame-entry.png" alt="Calibration entry screen showing guided and quick calibration options" />
                        <p className="mt-2 text-sm text-(--text-muted)">
                          Supports both first-time calibration and recurring calibration events. The full guided flow is always available if device data needs reviewing/updating.
                        </p>
                      </div>

                      <div>
                        <p className="mb-3 text-sm font-semibold">2) Device setup & preparation</p>
                        <ImageLightbox
                          src="/images/frame-device-data.png"
                          alt="Device setup step with system data, environmental conditions, and procedure selection"
                        />
                        <p className="mt-2 text-sm text-(--text-muted)">
                          Data-intensive input structured for regulatory compliance and technician usability.
                        </p>
                      </div>

                      <div>
                        <p className="mb-3 text-sm font-semibold">3) Measurement plan</p>
                        <ImageLightbox
                          src="/images/frame-plan.png"
                          alt="Measurement plan step with predefined blocks, uncertainty budget selection, and validation output"
                        />
                        <p className="mt-2 text-sm text-(--text-muted)">
                          The technician defines the measurement plan by selecting predefined blocks and validated uncertainty budgets. Immediate validation feedback supports execution for compliance without unnecessary complexity.
                        </p>
                      </div>

                      <div>
                        <p className="mb-3 text-sm font-semibold">4) Result & certificate validation</p>
                        <ImageLightbox src="/images/frame-result.png" alt="Calibration result and certificate preview screen" />
                        <p className="mt-2 text-sm text-(--text-muted)">
                          Final review step for audit and certification processes. Designed for clear communication for execution status and traceability.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-14 grid gap-6 lg:grid-cols-2">
                    <Callout title="Guided vs. quick calibration">
                      <p>
                        Supporting both calibration types eliminated redundant data entry for recurring calibration events while still providing the full guided flow for all events to avoid dead ends and constraints.
                      </p>
                    </Callout>

                    <Callout title="Adoption & change resistance">
                      <p>
                        Initially met resistance from some technicians due to existing calibration software usage over the years.
                      </p>
                    </Callout>
                  </div>

                  <div className="mt-12 rounded-2xl border border-(--border) bg-(--surface) p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Why this mattered</p>
                    <p className="mt-2 text-base leading-relaxed text-(--text)">
                      By basing the workflow in regulatory reality and testing it with actual domain experts, the calibration process struck the right balance between compliance, efficiency, and usability. 
                      The UX design scaled well around the world, eliminated redundant work, and remained flexible enough to accommodate actual edge cases.
                    </p>
                  </div>

                  <div className="mt-12 rounded-2xl border border-(--border) bg-(--surface) p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Outcome</p>
                    <p className="mt-2 text-base leading-relaxed text-(--text)">
                      The final workflow minimized cognitive overload by distinguishing between “guided vs quick” paths and maintaining compliance and traceability features.
                    </p>
                  </div>
                </Section>

                <Section id="device-management" eyebrow="Supporting workflows" title="Designing scalable device management in a regulated environment">
                  <Prose>
                    <p>
                      Besides the calibration wizard, the device management aspect became a fundamental part of the product. Every calibration relies on accurate 
                      device information, not just to carry out the task, but also to satisfy audits, traceability, and long-term data integrity with large sets 
                      of devices.
                    </p>

                    <p className="mt-5">
                      The aim of this section was to create a system that is not only fast and efficient for the technicians, who are often under pressure to complete 
                      tasks quickly, but also one that is audit-friendly, scalable, and suitable for a regulated environment where data is crucial.
                    </p>
                  </Prose>

                  <div className="mt-14">
                    <h3 className="text-lg font-semibold">Key UX decisions in device management</h3>
                    <p className="mt-2 max-w-3xl text-base leading-relaxed text-(--text-muted)">
                      I will only highlight the most critical screens, which show the ability to handle large sets of data, audit-friendliness, and close integration with calibration tasks.
                    </p>

                    <div className="mt-8 grid gap-10 md:grid-cols-2">
                      <div>
                        <p className="mb-3 text-sm font-semibold">1) Device overview - clarity at scale</p>

                        <ImageLightbox
                          src="/images/frame-device-list.jpg"
                          alt="Device overview table with filtering, status indicators, and key metadata"
                        />

                        <p className="mt-2 text-sm text-(--text-muted)">
                          The device list has a scalable layout that is particularly useful for a large number of devices. It provides filters, sorting, and status information, which enables
                          the technician to easily identify the next action to be performed.
                        </p>
                      </div>

                      <div>
                        <p className="mb-3 text-sm font-semibold">2) Device details - history, compliance, and actions in context</p>

                        <ImageLightbox
                          src="/images/frame-device-details.jpg"
                          alt="Device detail view with calibration history, certificates, accessories, and actions"
                        />

                        <p className="mt-2 text-sm text-(--text-muted)">
                          The device details page provides a consolidated view of the device details, calibration history, and certificates. It is useful for 
                          audits while allowing the technician to perform direct actions from the same page.
                        </p>

                        <p className="mt-3 text-sm text-(--text-muted)">
                          <strong>Note:</strong> The space in the lower left corner has been left reserved for the upcoming{' '}
                          <strong>Analytics module</strong>, which could include features such as status, risks, and due dates.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 grid gap-6 lg:grid-cols-2">
                    <Callout title="Scalability without loss of control">
                      <p>
                        The UX had to be usable across hundreds or thousands of assets. That meant predictable table behavior, strong filtering patterns, 
                        and a layout that remains usable in a data-rich environment.
                      </p>
                    </Callout>

                    <Callout title="Audit readiness by design">
                      <p>
                        Device management is a direct enabler of compliance: predictable device IDs, calibration intervals, certificate access, and status changes.
                      </p>
                      <p className="mt-3">
                        The detail view is a one-stop shop for everything needed to verify, eliminating the need to jump between tools and the frustration of 
                        “missing context” during audits or investigations.
                      </p>
                    </Callout>
                  </div>

                  <div className="mt-10 rounded-2xl border border-(--border) bg-(--surface) p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Why this mattered</p>
                    <p className="mt-2 text-base leading-relaxed text-(--text)">
                      Reliable calibration workflows rely on reliable information. By making device management a first-class UX problem, rather than just a behind-the-scenes 
                      implementation detail, the system is a huge enabler of compliance, scalability, and seamless integration into the day-to-day life of the technicians.
                    </p>
                  </div>

                  <div className="mt-12 rounded-2xl border border-(--border) bg-(--surface) p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Outcome</p>
                    <p className="mt-2 text-base leading-relaxed text-(--text)">
                      The table + detail patterns helped with quick daily work while keeping the solution audit-friendly: users can find status, history, and certificates 
                      without having to switch applications or lose context.
                    </p>
                  </div>
                </Section>

                <Section id="outcome" eyebrow="Outcome" title="What was delivered – what is valuable">
                  <Prose>
                    <p>
                      I delivered an implementation-ready UX foundation for a regulated B2B SaaS solution: validated scope, audit-friendly workflows, and a 
                      scalable white-label solution. The solution was delivered as a system (tokens, components, interaction rules, QA checklist) instead of 
                      screens, making it reusable for other compliance-driven, data-intensive applications.
                    </p>
                  </Prose>

                  <div className="mt-10 grid gap-6 lg:grid-cols-2">
                    <Callout title="What was delivered">
                      <ul className="list-disc pl-5 text-sm leading-relaxed">
                        <li>Research synthesis + prioritized opportunity map</li>
                        <li>Persona-based feature scope definition ("now/next/later")</li>
                        <li>Calibration workflow structure, aligned to regulatory needs</li>
                        <li>Scalable device management patterns (table, filtering, detail view, history)</li>
                        <li>Design system definition: semantic tokens, components, and states, along with governance</li>
                        <li>Handoff package + QA checklist, used during the implementation phase</li>
                      </ul>
                    </Callout>

                    <Callout title="Why this is still relevant">
                      <p>
                        The end product is not just a list of screens, it's a transferable package of decisions, structures, 
                        and patterns that minimize risk in the world of compliance-driven software.
                      </p>
                      <p className="mt-3">
                        This case shows: "system thinking," excellent UX for complex systems, "design system maturity," 
                        and the ability to "align design to engineering constraints to ship UI consistently."
                      </p>
                    </Callout>
                  </div>

                  <div className="mt-10 grid gap-6 lg:grid-cols-2">
                    <Callout title="What I learned">
                      <ul className="list-disc pl-5 text-sm leading-relaxed">
                        <li>In regulated spaces, clarity is a safety mechanism – status and terms must be clear and unambiguous.</li>
                        <li>White-label limitations are most simply addressed at the token architecture level, rather than at the screen level.</li>
                        <li>Adoption can be facilitated by ensuring that workflows support existing mental models while introducing improved guardrails.</li>
                        <li>Doubts were affirmed in that predictability and trust are more important than speed in adoption.</li>
                      </ul>
                    </Callout>
                  </div>

                  <div className="mt-10 rounded-2xl border border-(--ring) bg-(--surface) p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Final reflection</p>
                    <p className="mt-2 text-base leading-relaxed text-(--text)">
                      This case study illustrates the value of UX in mitigating risk in regulation-driven software by establishing clarity early on, through research, 
                      systems thinking, and tight collaboration with product and engineering teams.
                      <br />
                      <br />
                      This project, even without full market launch, proves my capacity for delivering scalable UX foundations, aligning cross-functional teams, and 
                      delivering implementation-ready systems under real-world constraints.
                      <br />
                      <br />
                      The project centers around transferable structures, such as workflows, interaction rules, and design system governance, which are valuable beyond the product's lifespan.
                    </p>
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link className="pill" href="/#work">
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
            </div>
          </div>

          <SectionDivider />
          <Footer />
        </div>
      </main>
    </>
  );
}
