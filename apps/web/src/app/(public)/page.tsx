"use client";

import Link from 'next/link';
import { useState, useEffect, useRef, type ReactNode } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from 'motion/react';
import { ArrowRight, MessageCircle } from 'lucide-react';

import PublicNav from '@/app/(public)/components/PublicNav';
import PublicFooter from '@/app/(public)/components/PublicFooter';
import LetsTalkBand from '@/app/(public)/components/LetsTalkBand';
import TrustedMarquee from '@/app/(public)/components/TrustedMarquee';
import StatsCounter from '@/app/(public)/components/StatsCounter';
import TestimonialsCarousel from '@/app/(public)/components/TestimonialsCarousel';
import FAQAccordion from '@/app/(public)/components/FAQAccordion';
import GrowthChart from '@/app/(public)/components/GrowthChart';
import { Reveal, RevealItem } from '@/app/(public)/components/ui/Reveal';
import { WipeIn } from '@/app/(public)/components/ui/WipeIn';
import { SectionEyebrow } from '@/app/(public)/components/ui/SectionEyebrow';
import { CardGraphic, type CardGraphicKind } from '@/app/(public)/components/ui/CardGraphics';

// ---------------------------------------------------------------------------
// Local presentational helpers — only used on this landing page.
// ---------------------------------------------------------------------------

/**
 * Typewriter that cycles through a list of words: types each one out,
 * holds, deletes, then advances. Lime blinking caret pins the brand color
 * without overwhelming the headline.
 */
function TypewriterWord({ words }: { words: string[] }) {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<'typing' | 'holding' | 'deleting'>('typing');

  useEffect(() => {
    const current = words[wordIndex];
    let delay = 110;
    if (phase === 'typing') {
      if (text === current) {
        delay = 1400;
        const t = setTimeout(() => setPhase('deleting'), delay);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setText(current.slice(0, text.length + 1)), delay);
      return () => clearTimeout(t);
    }
    if (phase === 'deleting') {
      if (text === '') {
        const t = setTimeout(() => {
          setPhase('typing');
          setWordIndex((i) => (i + 1) % words.length);
        }, 0);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setText(current.slice(0, text.length - 1)), 55);
      return () => clearTimeout(t);
    }
  }, [text, phase, wordIndex, words]);

  return (
    <span className="text-primary-ink dark:text-primary text-glow-lime inline-block min-h-[1.15em] align-middle">
      {text || '\u200B'}
      <span
        aria-hidden
        className="inline-block w-[4px] h-[0.85em] bg-primary align-[-0.05em] ml-2 cursor-blink shadow-[0_0_8px_rgba(206,248,78,0.3)]"
      />
    </span>
  );
}

/**
 * Flat "what we do" tile — hairline border, a small abstract SVG, and
 * type-led hierarchy. No lift-card hover halo. The graphic is the only
 * decorative element.
 */
interface OfferTileProps {
  kind: CardGraphicKind;
  title: string;
  description: string;
}

function OfferTile({ kind, title, description }: OfferTileProps) {
  return (
    <RevealItem
      distance={48}
      className="relative rounded-2xl border border-foreground/15 bg-card/40 p-6 sm:p-8 md:p-9 overflow-hidden"
    >
      {/* Two-stage lime glow — big primary spotlight in the top-right plus a
          smaller cool wash in the bottom-left so the card has real depth
          instead of a flat surface. */}
      <div
        aria-hidden
        className="absolute -top-24 -right-24 w-[22rem] h-[22rem] rounded-full bg-primary/30 blur-[90px] pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-primary/10 blur-[80px] pointer-events-none"
      />
      <div className="relative mb-6" aria-hidden>
        <CardGraphic kind={kind} />
      </div>
      <h3 className="relative text-xl sm:text-2xl md:text-[28px] font-semibold tracking-tight text-foreground leading-[1.15]">
        {title}
      </h3>
      <p className="relative mt-3 sm:mt-4 text-sm sm:text-[15px] text-muted-foreground leading-relaxed">
        {description}
      </p>
    </RevealItem>
  );
}

// ---------------------------------------------------------------------------
// Hero choreography — staggered entrance via motion variants.
// ---------------------------------------------------------------------------

const heroContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.1,
      staggerChildren: 0.12,
    },
  },
};

const heroItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
  },
};

function HeroChild({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div variants={heroItem} className={className}>
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Card data — six "ways we help" buckets.
// ---------------------------------------------------------------------------

const offerCards: OfferTileProps[] = [
  {
    kind: 'design',
    title: 'Design.',
    description:
      'Brand systems, identity, and UI that don’t look like a template — built to scale with you.',
  },
  {
    kind: 'build',
    title: 'Build.',
    description:
      'Marketing sites, storefronts, and internal tools — engineered for the long haul, not just launch day.',
  },
  {
    kind: 'grow',
    title: 'Grow.',
    description:
      'SEO that ranks, email that converts, and automations that compound — pipeline that fills itself.',
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LandingPage() {
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);

  // Hero parallax: as the page scrolls, the headline + subtext drift up
  // gently. Spring-smoothed so it never feels mechanical.
  const { scrollY } = useScroll();
  const rawHeroY = useTransform(scrollY, [0, 500], [0, -70]);
  const heroY = useSpring(rawHeroY, { stiffness: 120, damping: 24, mass: 0.4 });
  const rawHeroOpacity = useTransform(scrollY, [0, 400], [1, 0.55]);
  const heroOpacity = useSpring(rawHeroOpacity, {
    stiffness: 120,
    damping: 24,
    mass: 0.4,
  });

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-clip">
      <PublicNav />

      {/* ============================== HERO ============================== */}
      <section className="relative min-h-screen flex flex-col justify-center px-6 pt-28 pb-16 md:pt-32 md:pb-20 overflow-hidden">
        {/* Quiet lime aura behind the headline — ignites on load. */}
        <motion.div
          aria-hidden
          className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-primary/[0.06] blur-[160px] pointer-events-none"
          initial={reduce ? false : { opacity: 0, scale: 0.7 }}
          animate={reduce ? undefined : { opacity: 1, scale: 1 }}
          transition={
            reduce
              ? undefined
              : { duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }
          }
        />

        {/* "Sunset" — wide, deep warm-lime gradient anchored at the bottom
            of the hero. Brightest around the CTA, stretching past the
            viewport edges so the falloff feels natural. Booms in just
            after the headline starts to appear. */}
        <motion.div
          aria-hidden
          className="absolute -inset-x-[15%] bottom-0 h-[80%] pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 110% 120% at 50% 110%, rgba(206,248,78,0.32) 0%, rgba(206,248,78,0.18) 25%, rgba(206,248,78,0.08) 50%, rgba(206,248,78,0.03) 70%, transparent 88%)',
          }}
          initial={reduce ? false : { opacity: 0 }}
          animate={reduce ? undefined : { opacity: 1 }}
          transition={
            reduce
              ? undefined
              : { duration: 1.2, delay: 0.25, ease: [0.16, 1, 0.3, 1] }
          }
        />

        {/* Drifting "gooey" lime orbs — each one ignites with a quick
            scale-and-fade pop, then settles into a slow asynchronous
            drift so the glow feels alive and organic. Skipped entirely
            under reduced motion. */}
        {!reduce && (
          <>
            {[
              {
                size: 520,
                bg: 'rgba(206, 248, 78, 0.20)',
                blur: 110,
                pos: { left: '8%', top: '22%' },
                ignite: 0.3,
              },
              {
                size: 460,
                bg: 'rgba(206, 248, 78, 0.15)',
                blur: 110,
                pos: { right: '6%', top: '30%' },
                ignite: 0.4,
              },
              {
                size: 420,
                bg: 'rgba(206, 248, 78, 0.20)',
                blur: 100,
                pos: { left: '38%', bottom: '8%' },
                ignite: 0.5,
              },
            ].map((orb, i) => (
              <motion.div
                key={i}
                aria-hidden
                className="absolute pointer-events-none"
                style={orb.pos}
                initial={{ opacity: 0, scale: 0.55 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.1, delay: orb.ignite, ease: [0.16, 1, 0.3, 1] }}
              >
                <div
                  className={`rounded-full pointer-events-none animate-orb-${i + 1}`}
                  style={{
                    width: orb.size,
                    height: orb.size,
                    backgroundColor: orb.bg,
                    filter: `blur(${orb.blur}px)`,
                  }}
                />
              </motion.div>
            ))}
          </>
        )}

        <div className="relative mx-auto max-w-7xl">
          <motion.div
            ref={heroRef}
            style={reduce ? undefined : { y: heroY, opacity: heroOpacity, willChange: 'transform, opacity' }}
            variants={heroContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center text-center"
          >
            <HeroChild>
              <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[104px] font-semibold tracking-tight leading-[0.95] text-foreground max-w-6xl">
                Scale your business
                <span className="block mt-3 md:mt-4 min-h-[1.15em] whitespace-nowrap">
                  with <TypewriterWord words={['Scala', 'Websites', 'Stores', 'Systems']} />
                </span>
              </h1>
            </HeroChild>

            <HeroChild className="mt-10 md:mt-12">
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
                Websites, stores, and internal tools — built to grow with you.
              </p>
            </HeroChild>

            <HeroChild className="mt-12">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Link
                  href="/services"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-zinc-900 font-medium text-sm transition-colors hover:bg-primary/90 active-press"
                >
                  See services &amp; pricing
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="https://wa.me/61481949464"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border bg-card/60 text-foreground font-medium text-sm transition-colors hover:bg-muted/40 active-press"
                >
                  <MessageCircle className="w-4 h-4" />
                  Talk to us
                </a>
              </div>
            </HeroChild>

          </motion.div>

          {/* Chart sits OUTSIDE the parallax wrapper so it doesn't inherit
              the hero's opacity fade-out on scroll (which was making the
              card and its labels look washed out by the time the user
              reached it). Has its own scroll-triggered rise-up entrance —
              starts slightly sunken with a forward tilt, lifts to flat
              as it enters the viewport like a 3D card being raised. */}
          <motion.div
            className="mt-16 md:mt-20 w-full"
            initial={reduce ? false : { opacity: 0, y: 90, rotateX: 14 }}
            whileInView={
              reduce ? undefined : { opacity: 1, y: 0, rotateX: 0 }
            }
            viewport={{ once: true, amount: 0.2 }}
            transition={
              reduce
                ? undefined
                : { duration: 1.0, ease: [0.16, 1, 0.3, 1] }
            }
            style={
              reduce
                ? undefined
                : { transformPerspective: 1200, transformOrigin: 'center bottom' }
            }
          >
            <GrowthChart />
          </motion.div>
        </div>
      </section>

      {/* ============================== TRUSTED MARQUEE ============================== */}
      <TrustedMarquee />

      {/* ============================== WAYS WE SCALE ============================== */}
      <section id="services" className="relative px-6 pt-2 pb-12 md:pt-4 md:pb-16">
        <div className="relative mx-auto max-w-7xl">
          <div className="mb-12 md:mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="max-w-3xl">
              <SectionEyebrow number="01" label="Ways we scale" />
              <WipeIn as="h2" className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.05]">
                Ways we scale.
              </WipeIn>
              <Reveal delay={0.1}>
                <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed">
                  Most of our work falls into one of these buckets. Start with one and add others
                  later — there&apos;s no lock-in and no surprise bills.
                </p>
              </Reveal>
            </div>
            <Reveal delay={0.15} className="shrink-0">
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-zinc-900 font-medium text-sm transition-colors hover:bg-primary/90 active-press"
              >
                See services &amp; pricing
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Reveal>
          </div>

          <Reveal stagger={0.22} delay={0.1} className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {offerCards.map((card) => (
              <OfferTile key={card.kind} {...card} />
            ))}
          </Reveal>
        </div>
      </section>

      {/* ============================== STATS COUNTER ============================== */}
      <StatsCounter eyebrow={{ number: '02', label: 'By the numbers' }} />

      {/* ============================== TESTIMONIALS — hidden, component kept ==============================
      <TestimonialsCarousel eyebrow={{ number: '03', label: 'In their words' }} />
      ============================================================================================ */}

      {/* ============================== FAQ ============================== */}
      <div id="faq">
        <FAQAccordion eyebrow={{ number: '03', label: 'Common questions' }} />
      </div>

      <LetsTalkBand eyebrow={{ number: '04', label: 'Contact' }} />

      <PublicFooter />
    </div>
  );
}
