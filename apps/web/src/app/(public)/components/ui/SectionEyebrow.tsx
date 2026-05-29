"use client";

import { motion, useReducedMotion, type Variants } from 'motion/react';

/**
 * Big numeric section opener — replaces the old small-eyebrow pattern.
 *
 * Renders the section number as oversized display type sitting directly
 * above the section's <h2>. The numeral IS the subtitle — no small
 * uppercase label, no slash, no lime hairline. The h2 next to it names
 * the section, so we don't duplicate the label here.
 *
 * The `label` prop is accepted for backward compatibility with existing
 * call-sites (page.tsx, StatsCounter, ProcessTimeline, TestimonialsCarousel,
 * FAQAccordion) but is no longer rendered — keeping the API stable while
 * we change the visual treatment.
 *
 * Example:
 *   <SectionEyebrow number="01" label="Ways we help" />
 *   <h2>Ways we help.</h2>
 */
export function SectionEyebrow({
  number,
  className,
}: {
  number: string;
  /** Kept for API compatibility — no longer rendered. */
  label?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();

  const variants: Variants = {
    hidden: {
      clipPath: 'inset(100% 0 0 0)',
      y: 14,
      opacity: 0,
    },
    visible: {
      clipPath: 'inset(0% 0 0 0)',
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.75,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  if (reduce) {
    return (
      <div className={`mb-4 md:mb-6 ${className ?? ''}`}>
        <span className="block text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight tabular-nums leading-[0.95] text-primary-ink dark:text-primary text-glow-lime">
          {number}
        </span>
      </div>
    );
  }

  return (
    <motion.div
      className={`mb-4 md:mb-6 ${className ?? ''}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4, margin: '0px 0px -10% 0px' }}
      variants={variants}
      style={{ paddingBottom: '0.08em' }}
    >
      <span className="block text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight tabular-nums leading-[0.95] text-primary-ink dark:text-primary text-glow-lime">
        {number}
      </span>
    </motion.div>
  );
}
