"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  ArrowRight,
  MessageCircle,
  Sparkles,
  Wrench,
  TrendingUp,
  Server,
  MapPin,
  HandshakeIcon,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';
import LetsTalkBand from '@/components/LetsTalkBand';
import MouseSpotlight from '@/components/MouseSpotlight';
import TrustedMarquee from '@/components/TrustedMarquee';
import StatsCounter from '@/components/StatsCounter';
import ProcessTimeline from '@/components/ProcessTimeline';
import TestimonialsCarousel from '@/components/TestimonialsCarousel';
import FAQAccordion from '@/components/FAQAccordion';
import GrowthChart from '@/components/GrowthChart';
import GrowthSparkline from '@/components/GrowthSparkline';
import { useReveal } from '@/lib/useReveal';

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
        // Defer the phase/word advance so we're not calling setState
        // synchronously inside the effect body (lint: set-state-in-effect).
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
    <span className="text-primary text-glow-lime">
      {text}
      <span
        aria-hidden
        className="inline-block w-[3px] h-[0.9em] bg-primary align-[-0.05em] ml-1 cursor-blink shadow-[0_0_8px_rgba(206,248,78,0.3)]"
      />
    </span>
  );
}

/**
 * Bento tile used in the "What we do" section. Three sizes are supported
 * via the `span` prop — the layout is a 6-col grid so spans of 6 / 3 / 2 / 4
 * compose cleanly across breakpoints.
 */
interface BentoTileProps {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  bullets?: string[];
  className?: string;
  /** Optional visual flourish slotted into the bottom-right of the tile. */
  flourish?: React.ReactNode;
}

function BentoTile({
  icon,
  eyebrow,
  title,
  description,
  bullets,
  className = '',
  flourish,
}: BentoTileProps) {
  const { ref, inView } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`reveal ${inView ? 'in-view' : ''} lift-card relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-7 md:p-8 ${className}`}
    >
      <div className="relative z-10">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-foreground dark:text-primary mb-6">
          {icon}
        </div>
        <p className="text-[11px] uppercase tracking-[0.16em] text-primary font-medium mb-2">
          {eyebrow}
        </p>
        <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground mb-3">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
          {description}
        </p>

        {bullets && bullets.length > 0 && (
          <ul className="mt-6 space-y-2.5">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm text-foreground/85">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                <span className="leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {flourish && (
        <div className="absolute bottom-0 right-0 pointer-events-none opacity-90">
          {flourish}
        </div>
      )}
    </div>
  );
}

interface PillarProps {
  eyebrow: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function Pillar({ eyebrow, icon, title, description }: PillarProps) {
  const { ref, inView } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`reveal ${inView ? 'in-view' : ''} pt-7 border-t border-border/60`}
    >
      <div className="flex items-center gap-3 mb-5">
        <span className="text-[11px] tabular-nums text-muted-foreground tracking-widest">
          {eyebrow}
        </span>
        <span className="text-foreground dark:text-primary">{icon}</span>
      </div>
      <h3 className="text-base font-semibold tracking-tight text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

/**
 * Stacked "windows" flourish — communicates "websites/stores we ship" without
 * needing real screenshots.
 */
function WindowsFlourish() {
  return (
    <div className="relative w-[260px] h-[110px] mr-[-30px] mb-[-20px]">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute rounded-xl border border-border/80 bg-background/70 backdrop-blur-sm shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)]"
          style={{
            top: `${i * 14}px`,
            left: `${i * 22}px`,
            width: '180px',
            height: '90px',
            opacity: 1 - i * 0.18,
          }}
        >
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-border/60">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400/60" />
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
          </div>
          <div className="p-3 space-y-1.5">
            <div className="h-1.5 w-2/3 rounded-full bg-foreground/15" />
            <div className="h-1.5 w-1/2 rounded-full bg-foreground/10" />
            <div className="h-1.5 w-3/5 rounded-full bg-primary/40" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * AI assist flourish — a tiny "drafting reply" widget. A faux CRM card with
 * a sparkle badge, three "typed" lines (the last one still in progress with
 * a blinking lime cursor), and a hint of a "send" action. Communicates
 * "AI does the boring part" without leaning on stock chatbot iconography.
 */
function AIFlourish() {
  return (
    <div className="relative w-[300px] p-5 pr-7 pb-7">
      <div className="relative rounded-xl border border-border/80 bg-background/75 backdrop-blur-sm shadow-[0_12px_32px_-14px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Header bar — looks like a help-desk panel header. */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border/60 bg-card/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Drafting reply
            </span>
          </div>
          {/* Tiny typing-dots indicator */}
          <div className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
            <span
              className="w-1 h-1 rounded-full bg-primary/70 animate-pulse"
              style={{ animationDelay: '120ms' }}
            />
            <span
              className="w-1 h-1 rounded-full bg-primary/40 animate-pulse"
              style={{ animationDelay: '240ms' }}
            />
          </div>
        </div>

        {/* Body — faux text lines. The last line sits next to a blinking cursor
            so the card reads as "writing in progress". */}
        <div className="p-3 space-y-1.5">
          <div className="h-1.5 w-[78%] rounded-full bg-foreground/15" />
          <div className="h-1.5 w-[68%] rounded-full bg-foreground/15" />
          <div className="h-1.5 w-[84%] rounded-full bg-foreground/15" />
          <div className="flex items-center gap-1 pt-0.5">
            <div className="h-1.5 w-[42%] rounded-full bg-primary/60" />
            <span
              aria-hidden
              className="inline-block w-[2px] h-3 bg-primary cursor-blink"
            />
          </div>
        </div>

        {/* Footer — subtle "send" affordance, on-brand lime. */}
        <div className="flex items-center justify-end gap-2 px-3 pb-2 pt-1 border-t border-border/40 bg-card/30">
          <span className="text-[9px] tracking-widest uppercase text-muted-foreground">
            ⏎ Send
          </span>
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-primary/20 border border-primary/40 text-primary">
            <Sparkles className="w-2.5 h-2.5" />
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Server uptime flourish — pulsing dot + tiny log lines, hints at "we keep
 * it running".
 */
function UptimeFlourish() {
  return (
    <div className="w-[200px] p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </span>
        <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          live · 99.99%
        </span>
      </div>
      <div className="grid grid-cols-12 gap-[2px]">
        {Array.from({ length: 36 }).map((_, i) => (
          <span
            key={i}
            className="block h-3 rounded-[1px] bg-primary/70"
            style={{ opacity: i === 22 ? 0.25 : 0.55 + (i % 5) * 0.06 }}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-300 overflow-x-hidden">
      <PublicNav
        links={[
          { href: '/services', label: 'Services' },
          { href: '/services#pricing', label: 'Pricing' },
          { href: '#process', label: 'How we work' },
          { href: '#faq', label: 'FAQ' },
          { href: '#contact', label: 'Contact' },
        ]}
      />

      {/* ============================== HERO ============================== */}
      <section className="relative px-6 pt-20 pb-28 md:pt-32 md:pb-36 overflow-hidden">
        {/* Animated grid background, faded toward edges via the mask. */}
        <div className="absolute inset-0 bg-grid bg-grid-mask pointer-events-none opacity-60" />

        {/* Glow stack: dominant lime top-center, cyan accent low-left,
            warm amber accent low-right — three off-axis hues that frame the
            hero without competing with the lime brand voice. */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[5%] left-[-10%] w-[480px] h-[420px] rounded-full bg-sky-400/10 blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-8%] w-[420px] h-[380px] rounded-full bg-amber-300/[0.08] blur-[140px] pointer-events-none" />

        {/* Mouse-following spotlight */}
        <MouseSpotlight />

        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <div className="glass inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs text-muted-foreground mb-8 animate-fade-up stagger-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-70 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              Based in Indonesia · Booking projects for Q3 2026
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight max-w-5xl leading-[1.05] text-foreground animate-fade-up stagger-2">
              Scale your Business with
              <span className="block mt-2">
                <TypewriterWord words={['Scala', 'Websites', 'Stores', 'Systems']} />
              </span>
            </h1>

            <p className="mt-7 text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed animate-fade-up stagger-3">
              Websites, stores, and internal tools — built to grow with you.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3 w-full sm:w-auto animate-fade-up stagger-4">
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-zinc-900 font-medium text-sm transition-colors hover:bg-primary/90 active-press shadow-[0_8px_30px_-8px_rgba(206,248,78,0.5)]"
              >
                See services &amp; pricing
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://wa.me/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border bg-card/60 text-foreground font-medium text-sm transition-colors hover:bg-muted/40 active-press"
              >
                <MessageCircle className="w-4 h-4" />
                Talk to us
              </a>
            </div>

          </div>

          {/* Hero centerpiece: animated growth chart — "scale your business" made literal. */}
          <div className="mt-20 md:mt-24 animate-fade-up stagger-5">
            <GrowthChart />
          </div>
        </div>
      </section>

      {/* ============================== TRUSTED MARQUEE ============================== */}
      <TrustedMarquee />

      {/* ============================== WHAT WE DO (BENTO) ============================== */}
      <section id="services" className="relative px-6 py-28 md:py-32 border-t border-border/60">
        {/* Glow stack: lime drifts in from the left, cyan whisper from the right. */}
        <div className="absolute top-1/3 left-[-10%] w-[600px] h-[500px] rounded-full bg-primary/[0.07] blur-[140px] pointer-events-none" />
        <div className="absolute top-2/3 right-[-12%] w-[420px] h-[420px] rounded-full bg-sky-400/[0.07] blur-[130px] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-2xl mb-16">
            <p className="text-[11px] uppercase tracking-[0.16em] text-primary font-medium mb-3">
              What we do
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground leading-tight">
              Four ways we help. Mix and match.
            </h2>
            <p className="mt-5 text-base text-muted-foreground max-w-xl leading-relaxed">
              Most of our work falls into one of these buckets. Start with one and add others
              later — there&apos;s no lock-in and no surprise bills.
            </p>
          </div>

          {/* Bento: 6-col grid; "Build" is the featured 4-col tile. */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            <BentoTile
              className="md:col-span-4"
              icon={<Wrench className="w-5 h-5" />}
              eyebrow="Build"
              title="Software that earns its keep."
              description="Beautiful marketing sites, conversion-focused storefronts, and internal tools your team will actually use on a Monday morning."
              bullets={[
                'Lightning-fast marketing sites (under 1s to first paint)',
                'Shopify, Stripe, or fully custom storefronts that sell',
                'CRMs, dashboards & back-office tools that replace the spreadsheet',
              ]}
              flourish={<WindowsFlourish />}
            />
            <BentoTile
              className="md:col-span-2"
              icon={<TrendingUp className="w-5 h-5" />}
              eyebrow="Grow"
              title="Turn strangers into customers."
              description="SEO that ranks, email that converts, and automations that compound — so the pipeline fills itself while you sleep."
              flourish={<GrowthSparkline />}
            />
            <BentoTile
              className="md:col-span-2"
              icon={<Server className="w-5 h-5" />}
              eyebrow="Run"
              title="Always-on, hands-off."
              description="Rock-solid hosting, business email, security patches, and a small team watching the dials — so you can ignore the dashboard."
              flourish={<UptimeFlourish />}
            />
            <BentoTile
              className="md:col-span-4"
              icon={<Sparkles className="w-5 h-5" />}
              eyebrow="AI assist"
              title="AI that pulls its weight — not yours."
              description="We wire intelligence into the places it actually helps: triaging tickets, drafting outreach, summarizing calls, routing leads. Your team stays in the driver&apos;s seat — the bot does the boring parts."
              bullets={[
                'Sounds like you, not like a chatbot',
                'Human-in-the-loop on every important decision',
                'You own the data, the prompts, and the on/off switch',
              ]}
              flourish={<AIFlourish />}
            />
          </div>

          <div className="mt-14">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors group"
            >
              See full services &amp; pricing
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================== STATS COUNTER ============================== */}
      <StatsCounter />

      {/* ============================== PROCESS TIMELINE ============================== */}
      <div id="process">
        <ProcessTimeline />
      </div>

      {/* ============================== WHY SCALA ============================== */}
      <section id="why" className="relative px-6 py-28 md:py-32 border-t border-border/60">
        {/* Glow stack: lime sweeps in from the right, a soft cyan whisper on the lower-left. */}
        <div className="absolute top-1/4 right-[-10%] w-[600px] h-[500px] rounded-full bg-primary/[0.06] blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[5%] left-[-8%] w-[420px] h-[420px] rounded-full bg-sky-400/[0.06] blur-[130px] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-2xl mb-16">
            <p className="text-[11px] uppercase tracking-[0.16em] text-primary font-medium mb-3">
              Why Scala
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground leading-tight">
              We&apos;re a team you can actually talk to.
            </h2>
            <p className="mt-5 text-base text-muted-foreground max-w-xl leading-relaxed">
              Big agencies disappear after launch. Freelancers vanish when life gets busy. We sit
              somewhere in between — small enough to care, structured enough to stick around.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
            <Pillar
              eyebrow="01"
              icon={<MapPin className="w-4 h-4" />}
              title="Local team, fast response"
              description="Based in Jakarta. We answer messages in your timezone, in Bahasa or English."
            />
            <Pillar
              eyebrow="02"
              icon={<ShieldCheck className="w-4 h-4" />}
              title="Transparent from day one"
              description="You see the full plan before we start — scope, timeline, deliverables. No mid-build creep, no surprises on the invoice."
            />
            <Pillar
              eyebrow="03"
              icon={<HandshakeIcon className="w-4 h-4" />}
              title="We stick around after launch"
              description="Most of our work is for clients we've worked with for over a year. We're in it for the long run."
            />
            <Pillar
              eyebrow="04"
              icon={<Sparkles className="w-4 h-4" />}
              title="Plain language, always"
              description="No jargon. We'll explain what we're doing, why it matters, and what it costs."
            />
          </div>
        </div>
      </section>

      {/* ============================== TESTIMONIALS ============================== */}
      <TestimonialsCarousel />

      {/* ============================== FAQ ============================== */}
      <div id="faq">
        <FAQAccordion />
      </div>

      <LetsTalkBand />

      <PublicFooter />
    </div>
  );
}
