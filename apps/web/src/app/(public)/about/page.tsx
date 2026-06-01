"use client";

import { motion, useReducedMotion } from 'motion/react';

import PublicNav from '@/app/(public)/components/PublicNav';
import PublicFooter from '@/app/(public)/components/PublicFooter';
import LetsTalkBand from '@/app/(public)/components/LetsTalkBand';
import { Reveal } from '@/app/(public)/components/ui/Reveal';
import { WipeIn } from '@/app/(public)/components/ui/WipeIn';
import { SectionEyebrow } from '@/app/(public)/components/ui/SectionEyebrow';

/* ---------------------------------------------------------------------------
 * About — editorial, big-type, single ambient glow. Mirrors the home/services
 * rhythm (max-w-7xl, section eyebrows, WipeIn headings) but stays subtractive:
 * one aura, generous whitespace, no stacked flourishes.
 * ------------------------------------------------------------------------- */

const PRINCIPLES = [
  {
    title: 'Fixed quotes, no surprises.',
    body: 'Every number on the site is a starting point. We agree a fixed price before any work begins — so the scope is clear and the invoice never moves.',
  },
  {
    title: 'Built to grow with you.',
    body: 'Websites, stores, and internal tools shipped on foundations that hold up as you scale — not throwaway templates you outgrow in a year.',
  },
  {
    title: 'Small team, direct line.',
    body: 'You talk to the people building it. No account-manager telephone game, no ghosting — just a tight feedback loop from brief to launch.',
  },
];

export default function AboutPage() {
  const reduce = useReducedMotion();

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-clip">
      {/* Single lime aura — one flourish, not a stack. */}
      <motion.div
        aria-hidden
        className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-primary/15 blur-[150px] pointer-events-none"
        initial={reduce ? false : { opacity: 0, scale: 0.7 }}
        animate={reduce ? undefined : { opacity: 1, scale: 1 }}
        transition={reduce ? undefined : { duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      />

      <PublicNav />

      {/* ============================== HERO ============================== */}
      <section className="relative px-6 pt-12 pb-10 md:pt-20 md:pb-16 mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <SectionEyebrow number="01" label="About" />
          <WipeIn
            as="h1"
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tight text-foreground leading-[1.0]"
          >
            Software that helps you scale.
          </WipeIn>
          <Reveal delay={0.1}>
            <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Scala is a small studio building websites, online stores, and the
              internal tools growing businesses run on. We ship work that&apos;s
              fast, considered, and built to last — then we stick around to help
              it grow.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ============================== PRINCIPLES ============================== */}
      <section className="relative px-6 py-12 md:py-20 mx-auto max-w-7xl">
        <SectionEyebrow number="02" label="How we work" />
        <div className="mt-10 md:mt-14 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.title} delay={0.1 + i * 0.08}>
              <div>
                <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground leading-tight">
                  {p.title}
                </h3>
                <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                  {p.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============================== CONTACT ============================== */}
      <LetsTalkBand eyebrow={{ number: '03', label: "Let's talk" }} />

      <PublicFooter />
    </div>
  );
}
