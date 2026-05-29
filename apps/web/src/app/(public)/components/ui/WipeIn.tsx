"use client";

import { motion, useReducedMotion, type Variants } from 'motion/react';
import type { ReactNode } from 'react';

/**
 * Wipe-in heading reveal — content is masked from the bottom-up and
 * uncovers on scroll-into-view. The text simultaneously translates up
 * a few pixels so the reveal has both a clip and a settle motion.
 *
 * Use it for section <h2> elements on the public marketing routes.
 * Honors `prefers-reduced-motion` by rendering the content unwrapped.
 */
interface WipeInProps {
  children: ReactNode;
  className?: string;
  /** Delay before the wipe starts, in seconds. */
  delay?: number;
  /** Element to render as. Defaults to a block-level div. */
  as?: 'div' | 'span' | 'h1' | 'h2' | 'h3';
}

export function WipeIn({
  children,
  className,
  delay = 0,
  as = 'div',
}: WipeInProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  const variants: Variants = {
    hidden: {
      clipPath: 'inset(100% 0 0 0)',
      y: 18,
      opacity: 0,
    },
    visible: {
      clipPath: 'inset(0% 0 0 0)',
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.85,
        ease: [0.16, 1, 0.3, 1],
        delay,
      },
    },
  };

  const MotionTag = motion[as] as typeof motion.div;

  return (
    <MotionTag
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 'some', margin: '0px 0px 10% 0px' }}
      // Padding-top trick so descenders aren't clipped by inset(100%).
      style={{ paddingBottom: '0.08em' }}
    >
      {children}
    </MotionTag>
  );
}
