"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

import PublicNav from '@/app/(public)/components/PublicNav';
import PublicFooter from '@/app/(public)/components/PublicFooter';
import { Reveal, RevealItem } from '@/app/(public)/components/ui/Reveal';
import { WipeIn } from '@/app/(public)/components/ui/WipeIn';
import { SectionEyebrow } from '@/app/(public)/components/ui/SectionEyebrow';
import { cn } from '@/lib/utils';

import { solutionGroups, type SolutionGroup } from './data';

/* ---------------------------------------------------------------------------
 * Services overview. Replaces the long single-page catalog with six cards —
 * one per solution area — that lead to dedicated pages where the pricing
 * tables live. Aesthetic mirrors the home-page OfferTile (Design / Build /
 * Grow): rounded surface, lime corner glow, big icon tile + heading + blurb,
 * arrow CTA. Identity per card comes from icon + typography only, never a
 * second hue.
 * ------------------------------------------------------------------------- */

function SolutionCard({ group, active }: { group: SolutionGroup; active: boolean }) {
  const Icon = group.icon;
  return (
    <RevealItem
      distance={28}
      className={cn(
        'group relative rounded-2xl border bg-card/40 overflow-hidden transition-colors duration-500',
        active
          ? 'border-primary/40'
          : 'border-foreground/15 hover:border-primary/40'
      )}
    >
      <Link
        href={`/services/${group.id}`}
        className="relative flex items-center gap-4 sm:gap-5 p-4 sm:p-6 md:p-7 h-full"
      >
        {/* Two-stage lime glow — also lights up while `active` is true, so
            the cycling effect mirrors a hover without needing the cursor. */}
        <div
          aria-hidden
          className={cn(
            'absolute -top-24 -right-24 w-[22rem] h-[22rem] rounded-full blur-[90px] pointer-events-none transition-colors duration-700',
            active ? 'bg-primary/35' : 'bg-primary/20 group-hover:bg-primary/35'
          )}
        />
        <div
          aria-hidden
          className={cn(
            'absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-[80px] pointer-events-none transition-colors duration-700',
            active ? 'bg-primary/[0.12]' : 'bg-primary/[0.07] group-hover:bg-primary/[0.12]'
          )}
        />

        {/* Icon tile — left-anchored so title sits beside it. */}
        <span
          className={cn(
            'relative shrink-0 inline-flex w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl items-center justify-center text-primary-ink dark:text-primary transition-colors duration-500',
            active
              ? 'bg-primary/15 border border-primary/50'
              : 'bg-primary/[0.08] border border-primary/25 group-hover:bg-primary/15 group-hover:border-primary/50'
          )}
        >
          <Icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" strokeWidth={1.6} />
        </span>

        {/* Text column — title + suited-for blurb stacked beside the icon. */}
        <div className="relative flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight text-foreground leading-tight">
            {group.title}
          </h3>
          <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-muted-foreground leading-snug">
            {group.cardBlurb}
          </p>
        </div>

        {/* Arrow on the far right — nudges + tints lime while active or hovered. */}
        <ArrowRight
          className={cn(
            'relative shrink-0 w-4 h-4 sm:w-5 sm:h-5 transition-all duration-500',
            active
              ? 'text-primary-ink dark:text-primary translate-x-1'
              : 'text-muted-foreground group-hover:text-primary-ink dark:group-hover:text-primary group-hover:translate-x-1'
          )}
        />
      </Link>
    </RevealItem>
  );
}

export default function ServicesPage() {
  const reduce = useReducedMotion();
  // Cycle the lime "hover" state across the six cards on a steady stagger so
  // first-time visitors immediately read them as interactive. Pauses entirely
  // for reduced-motion users.
  const [activeIdx, setActiveIdx] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const interval = setInterval(
      () => setActiveIdx((i) => (i + 1) % solutionGroups.length),
      1600,
    );
    return () => clearInterval(interval);
  }, [reduce]);

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-clip">
      {/* ============================== AMBIENT GLOW ==============================
          Same load choreography as the landing-page hero — a main lime aura that
          ignites with a quick scale-and-fade pop, plus two smaller drifting orbs
          that follow a beat later. Skipped under prefers-reduced-motion. */}
      <motion.div
        aria-hidden
        className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-primary/15 blur-[150px] pointer-events-none"
        initial={reduce ? false : { opacity: 0, scale: 0.7 }}
        animate={reduce ? undefined : { opacity: 1, scale: 1 }}
        transition={
          reduce
            ? undefined
            : { duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }
        }
      />
      {!reduce && (
        <>
          {[
            {
              size: 360,
              bg: 'rgba(206, 248, 78, 0.18)',
              blur: 100,
              pos: { left: '10%', top: '2%' },
              drift: { x: [0, 50, -15, 0], y: [0, 25, -10, 0] },
              driftDur: 20,
              ignite: 0.35,
            },
            {
              size: 320,
              bg: 'rgba(206, 248, 78, 0.13)',
              blur: 110,
              pos: { right: '6%', top: '6%' },
              drift: { x: [0, -40, 10, 0], y: [0, -30, 5, 0] },
              driftDur: 22,
              ignite: 0.45,
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
              <motion.div
                className="rounded-full pointer-events-none"
                style={{
                  width: orb.size,
                  height: orb.size,
                  backgroundColor: orb.bg,
                  filter: `blur(${orb.blur}px)`,
                }}
                animate={orb.drift}
                transition={{
                  duration: orb.driftDur,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>
          ))}
        </>
      )}

      <PublicNav />

      {/* ============================== HERO ============================== */}
      <section className="relative px-6 pt-10 pb-8 md:pt-14 md:pb-10 mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <SectionEyebrow number="01" label="Solutions" />
          <WipeIn
            as="h1"
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-foreground leading-[1.02]"
          >
            Our scaling solutions.
          </WipeIn>
          <Reveal delay={0.1}>
            <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
              Six areas of work. Open one to see where pricing starts, what&apos;s
              included at each tier, and the partners we ship with. Every number
              is a starting point — we agree a fixed quote before any work begins.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ============================== CARDS ============================== */}
      <section id="solutions" className="relative px-6 pb-12 md:pb-20 mx-auto max-w-7xl">
        <Reveal
          stagger={0.12}
          delay={0.15}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6"
        >
          {solutionGroups.map((group, i) => (
            <SolutionCard
              key={group.id}
              group={group}
              active={!reduce && i === activeIdx}
            />
          ))}
        </Reveal>
      </section>

      <PublicFooter />
    </div>
  );
}
