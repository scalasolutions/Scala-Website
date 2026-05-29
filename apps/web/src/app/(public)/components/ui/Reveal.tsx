"use client";

import { motion, useReducedMotion, type Variants } from 'motion/react';
import type { ReactNode } from 'react';

/**
 * Section-level fade-up wrapper used on the public marketing routes.
 *
 * - Triggers once when the element enters the viewport (~15% visible).
 * - Translates up ~14px and fades from 0 → 1 over ~550ms, ease-out.
 * - Honors `prefers-reduced-motion` by snapping straight to the resting
 *   state with no transform / no transition.
 * - Optional `stagger` prop turns the wrapper into a parent that staggers
 *   its direct `RevealItem` children (used by the bento grid and FAQ rows).
 */
interface RevealProps {
  children: ReactNode;
  /** Stagger child `RevealItem`s by this much, in seconds. Defaults to 0 (no stagger). */
  stagger?: number;
  /** Override the wrapper element. Defaults to `div`. */
  as?: 'div' | 'section' | 'ul' | 'ol';
  className?: string;
  /** Pixel distance to slide up from. Defaults to 14. */
  distance?: number;
  /** Delay before the animation starts, in seconds. */
  delay?: number;
  id?: string;
}

export function Reveal({
  children,
  stagger = 0,
  as = 'div',
  className,
  distance = 14,
  delay = 0,
  id,
}: RevealProps) {
  const reduce = useReducedMotion();

  const variants: Variants = {
    hidden: {
      opacity: reduce ? 1 : 0,
      y: reduce ? 0 : distance,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: reduce
        ? { duration: 0 }
        : {
            duration: 0.55,
            ease: [0.16, 1, 0.3, 1],
            delay,
            staggerChildren: stagger,
            delayChildren: stagger > 0 ? delay : undefined,
          },
    },
  };

  const MotionTag = motion[as] as typeof motion.div;

  return (
    <MotionTag
      id={id}
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15, margin: '0px 0px -10% 0px' }}
    >
      {children}
    </MotionTag>
  );
}

/**
 * Child item used inside a `<Reveal stagger={…}>` parent. Inherits the
 * parent's `visible` trigger and slides in with the same easing.
 */
export function RevealItem({
  children,
  className,
  as = 'div',
  distance = 12,
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'li';
  distance?: number;
}) {
  const reduce = useReducedMotion();

  const variants: Variants = {
    hidden: {
      opacity: reduce ? 1 : 0,
      y: reduce ? 0 : distance,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: reduce
        ? { duration: 0 }
        : { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const MotionTag = motion[as] as typeof motion.div;

  return (
    <MotionTag className={className} variants={variants}>
      {children}
    </MotionTag>
  );
}
