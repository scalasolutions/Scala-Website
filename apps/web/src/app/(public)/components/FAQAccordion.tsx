"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { Reveal, RevealItem } from './ui/Reveal';
import { WipeIn } from './ui/WipeIn';
import { SectionEyebrow } from './ui/SectionEyebrow';

interface QA {
  q: string;
  a: string;
}

const faqs: QA[] = [
  {
    q: 'How fast can you start?',
    a: 'Most small projects start within a week. You get a proposal back within 48 hours of your first message, and we break ground as soon as you give the green light.',
  },
  {
    q: 'Do you only build websites, or also internal tools?',
    a: 'Both. About a third of our work is internal dashboards, CRMs, and ops tools — anything that replaces a spreadsheet or a manual workflow.',
  },
  {
    q: 'What happens after launch?',
    a: 'We hand over docs, train your team, and offer an optional small monthly care plan. No obligation — many clients self-serve and we keep the door open for changes.',
  },
  {
    q: 'How do you handle pricing?',
    a: 'We agree on the number before we start, and we get paid in milestones tied to real deliverables. If the scope evolves mid-project, we talk it through before anything changes — no hourly clocks, no creeping invoices.',
  },
  {
    q: 'Where are you based and what languages do you work in?',
    a: 'Jakarta, Indonesia. Our team works in Bahasa Indonesia and English. We answer messages during local business hours and most async queries within a few hours.',
  },
  {
    q: 'Can you work with our existing developers or designers?',
    a: 'Yes. We slot into existing teams, code reviews, and design systems all the time. We can also lead the build if your team would rather focus elsewhere.',
  },
];

/**
 * FAQ row — styled as a card to match OfferTile / StatsCounter cells.
 * Border, soft card surface, and a lime corner glow that intensifies on
 * hover and when the panel is open. Plus-icon affordance rotates to a
 * close (×) when the row expands.
 */
function FAQRow({ item, index }: { item: QA; index: number }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const panelId = `faq-panel-${index}`;
  const buttonId = `faq-button-${index}`;

  return (
    <RevealItem
      className={`group relative rounded-2xl border bg-card/40 overflow-hidden transition-colors duration-300 ${
        open
          ? 'border-primary/40'
          : 'border-border/60 hover:border-primary/30'
      }`}
    >
      {/* Lime corner glow — intensifies on hover/open */}
      <div
        aria-hidden
        className={`absolute -top-20 -right-20 w-56 h-56 rounded-full blur-[70px] pointer-events-none transition-opacity duration-500 bg-primary ${
          open
            ? 'opacity-20'
            : 'opacity-0 group-hover:opacity-10'
        }`}
      />
      {/* Soft gradient sweep underneath */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-card/0 via-card/0 to-primary/[0.04] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      />

      <h3 className="relative">
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-6 text-left p-5 md:px-6 md:py-6 cursor-pointer"
        >
          <motion.span
            className="text-base md:text-lg font-medium tracking-tight"
            animate={{
              color: open ? '#CEF84E' : '#f8fafc',
            }}
            whileHover={reduce ? undefined : { color: '#CEF84E' }}
            transition={
              reduce
                ? { duration: 0 }
                : { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
            }
          >
            {item.q}
          </motion.span>

          <motion.span
            className="shrink-0 w-9 h-9 rounded-full border flex items-center justify-center"
            animate={{
              rotate: open ? 45 : 0,
              borderColor: open
                ? 'rgba(206, 248, 78, 0.55)'
                : 'rgba(255, 255, 255, 0.14)',
              backgroundColor: open
                ? 'rgba(206, 248, 78, 0.12)'
                : 'rgba(17, 19, 28, 0.6)',
              color: open ? '#CEF84E' : '#94a3b8',
            }}
            transition={
              reduce
                ? { duration: 0 }
                : {
                    type: 'spring',
                    stiffness: 320,
                    damping: 26,
                    mass: 0.6,
                  }
            }
          >
            <Plus className="w-4 h-4" />
          </motion.span>
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            key="content"
            initial={reduce ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={reduce ? { opacity: 0, height: 0 } : { opacity: 0, height: 0 }}
            transition={
              reduce
                ? { duration: 0 }
                : {
                    height: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
                    opacity: { duration: 0.25, ease: 'easeOut' },
                  }
            }
            style={{ overflow: 'hidden' }}
            className="relative"
          >
            <div className="px-5 pb-6 md:px-6 md:pb-7 pr-12 md:pr-20 -mt-1">
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                {item.a}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </RevealItem>
  );
}

export default function FAQAccordion({
  eyebrow,
}: {
  eyebrow?: { number: string; label: string };
} = {}) {
  return (
    <section className="relative px-6 py-12 md:py-16">
      <div className="relative mx-auto max-w-7xl">
        {/* Header — title left, CTA right, matches Ways we scale rhythm */}
        <div className="mb-12 md:mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-3xl">
            {eyebrow && <SectionEyebrow number={eyebrow.number} label={eyebrow.label} />}
            <WipeIn
              as="h2"
              className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.05]"
            >
              Questions about Scala.
            </WipeIn>
          </div>
          <Reveal delay={0.15} className="shrink-0">
            <Link
              href="#contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-zinc-900 font-medium text-sm transition-colors hover:bg-primary/90 active-press"
            >
              Ask us anything
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Reveal>
        </div>

        {/* FAQ list — card-styled rows in a 2-col bento on desktop */}
        <Reveal
          stagger={0.06}
          className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4"
        >
          {faqs.map((item, i) => (
            <FAQRow key={item.q} item={item} index={i} />
          ))}
        </Reveal>
      </div>
    </section>
  );
}
