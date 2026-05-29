"use client";

import { motion, useReducedMotion } from 'motion/react';
import type { SVGProps } from 'react';

/**
 * Static "web mockup" graphics for the "Ways we scale" cards. Each
 * animation matches what the card is selling:
 *  - Design → marching-ants selection outline traces the top artboard
 *  - Build  → pieces of a page wipe in one by one (hero, then lines)
 *  - Grow   → the line chart literally draws itself up to the peak,
 *             with milestone dots popping in as the line reaches them
 *
 * Honors `prefers-reduced-motion` by rendering everything static.
 */

export type CardGraphicKind = 'design' | 'build' | 'grow';

const LIME = '#CEF84E';

export function CardGraphic({
  kind,
  className,
}: {
  kind: CardGraphicKind;
  className?: string;
}) {
  const cls = `w-28 h-28 md:w-32 md:h-32 ${className ?? ''}`;
  const reduce = useReducedMotion() ?? false;

  switch (kind) {
    case 'design':
      return <DesignGraphic className={cls} reduce={reduce} />;
    case 'build':
      return <BuildGraphic className={cls} reduce={reduce} />;
    case 'grow':
      return <GrowGraphic className={cls} reduce={reduce} />;
  }
}

type GraphicProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  reduce: boolean;
};

// ---------------------------------------------------------------------------
// Design — marching-ants selection outline circling the top artboard, the
// universal "this is selected in a design tool" signal. Single linear
// strokeDashoffset; deliberately calm.
// ---------------------------------------------------------------------------

function DesignGraphic({ reduce, ...props }: GraphicProps) {
  const cycle = 5;

  // Corners of the top artboard — these are the reference points the
  // designer "places" before connecting them with the traced outline.
  const corners: { cx: number; cy: number }[] = [
    { cx: 34, cy: 46 },
    { cx: 90, cy: 46 },
    { cx: 90, cy: 84 },
    { cx: 34, cy: 84 },
  ];

  return (
    <svg viewBox="0 0 100 100" aria-hidden {...props}>
      {/* Back + middle artboards — static layers behind the active one. */}
      <rect
        x="14"
        y="14"
        width="56"
        height="38"
        rx="4"
        fill="none"
        stroke={LIME}
        strokeOpacity="0.4"
      />
      <rect
        x="24"
        y="30"
        width="56"
        height="38"
        rx="4"
        fill={LIME}
        fillOpacity="0.18"
        stroke={LIME}
        strokeOpacity="0.55"
      />

      {/* Top artboard — fill only appears AFTER the trace completes. */}
      <motion.rect
        x="34"
        y="46"
        width="56"
        height="38"
        rx="4"
        fill={LIME}
        initial={reduce ? false : { fillOpacity: 0 }}
        animate={reduce ? undefined : { fillOpacity: [0, 0, 0.7, 0.7, 0] }}
        transition={
          reduce
            ? undefined
            : {
                duration: cycle,
                repeat: Infinity,
                times: [0, 0.65, 0.78, 0.95, 1],
                ease: 'easeOut',
              }
        }
      />

      {/* Corner reference dots — fade in first; the trace doesn't begin
          until they're placed. */}
      {corners.map(({ cx, cy }) => (
        <motion.circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r="2.6"
          fill={LIME}
          initial={reduce ? false : { opacity: 0 }}
          animate={reduce ? undefined : { opacity: [0, 1, 1, 0] }}
          transition={
            reduce
              ? undefined
              : {
                  duration: cycle,
                  repeat: Infinity,
                  times: [0, 0.08, 0.95, 1],
                  ease: 'easeOut',
                }
          }
        />
      ))}

      {/* Clockwise trace — held empty while the dots appear, then draws
          the outline, holds, retracts, resets. Synced to the same 5s
          cycle as Build and Grow. */}
      <motion.path
        d="M 38 46 L 86 46 A 4 4 0 0 1 90 50 L 90 80 A 4 4 0 0 1 86 84 L 38 84 A 4 4 0 0 1 34 80 L 34 50 A 4 4 0 0 1 38 46 Z"
        fill="none"
        stroke={LIME}
        strokeOpacity="0.95"
        strokeWidth="1.4"
        strokeLinecap="round"
        initial={reduce ? false : { pathLength: 0 }}
        animate={reduce ? undefined : { pathLength: [0, 0, 1, 1, 0] }}
        transition={
          reduce
            ? undefined
            : {
                duration: cycle,
                repeat: Infinity,
                times: [0, 0.1, 0.65, 0.95, 1],
                ease: 'easeOut',
              }
        }
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Build — a page being constructed. The chrome stays put; the hero block
// scale-fades in first, then three content lines wipe in left-to-right
// one after another, hold, fade out, restart.
// ---------------------------------------------------------------------------

function BuildGraphic({ reduce, ...props }: GraphicProps) {
  const cycle = 5;

  const lines: { y: number; width: number; fillOpacity: number; start: number }[] = [
    { y: 68, width: 60, fillOpacity: 0.4, start: 0.34 },
    { y: 78, width: 44, fillOpacity: 0.26, start: 0.52 },
  ];

  return (
    <svg viewBox="0 0 100 100" aria-hidden {...props}>
      {/* Static window chrome */}
      <rect
        x="6"
        y="14"
        width="88"
        height="74"
        rx="6"
        fill="none"
        stroke={LIME}
        strokeOpacity="0.35"
      />
      <line x1="6" y1="28" x2="94" y2="28" stroke={LIME} strokeOpacity="0.25" />
      <circle cx="13" cy="21" r="2" fill={LIME} fillOpacity="0.7" />
      <circle cx="20" cy="21" r="2" fill={LIME} fillOpacity="0.4" />
      <circle cx="27" cy="21" r="2" fill={LIME} fillOpacity="0.25" />

      {/* Hero block — pops in first */}
      <motion.rect
        x="14"
        y="36"
        width="52"
        height="22"
        rx="3"
        fill={LIME}
        fillOpacity="0.9"
        style={{ originX: '40px', originY: '47px' }}
        initial={reduce ? false : { opacity: 0, scale: 0.85 }}
        animate={
          reduce
            ? undefined
            : {
                opacity: [0, 0, 1, 1, 0],
                scale: [0.85, 0.85, 1, 1, 0.85],
              }
        }
        transition={
          reduce
            ? undefined
            : {
                duration: cycle,
                repeat: Infinity,
                times: [0, 0.06, 0.18, 0.88, 1],
                ease: 'easeOut',
              }
        }
      />

      {/* Content lines — wipe in left-to-right, staggered */}
      {lines.map(({ y, width, fillOpacity, start }) => (
        <motion.rect
          key={y}
          x="14"
          y={y}
          width={width}
          height="3"
          rx="1.5"
          fill={LIME}
          fillOpacity={fillOpacity}
          style={{ originX: '14px', originY: `${y}px` }}
          initial={reduce ? false : { scaleX: 0, opacity: 0 }}
          animate={
            reduce
              ? undefined
              : {
                  scaleX: [0, 0, 1, 1, 1],
                  opacity: [0, 0, 1, 1, 0],
                }
          }
          transition={
            reduce
              ? undefined
              : {
                  duration: cycle,
                  repeat: Infinity,
                  times: [0, start, start + 0.08, 0.88, 1],
                  ease: 'easeOut',
                }
          }
        />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Grow — the chart actually grows. The line draws itself from origin to
// peak via motion's `pathLength` (which handles dasharray/dashoffset
// internally), with milestone dots popping in as the line reaches them
// and the endpoint halo blooming when the line hits the peak.
// ---------------------------------------------------------------------------

function GrowGraphic({ reduce, ...props }: GraphicProps) {
  const cycle = 5;

  const dots: { cx: number; cy: number; fillOpacity: number; start: number }[] = [
    { cx: 34, cy: 64, fillOpacity: 0.55, start: 0.14 },
    { cx: 54, cy: 48, fillOpacity: 0.75, start: 0.26 },
    { cx: 74, cy: 32, fillOpacity: 0.9, start: 0.38 },
  ];

  return (
    <svg viewBox="0 0 100 100" aria-hidden {...props}>
      {/* Static grid + baseline */}
      <line x1="10" y1="30" x2="90" y2="30" stroke={LIME} strokeOpacity="0.08" />
      <line x1="10" y1="50" x2="90" y2="50" stroke={LIME} strokeOpacity="0.08" />
      <line x1="10" y1="70" x2="90" y2="70" stroke={LIME} strokeOpacity="0.08" />
      <line x1="10" y1="84" x2="90" y2="84" stroke={LIME} strokeOpacity="0.3" />

      {/* Filled area — fades in as the line draws, holds, fades out. */}
      <motion.path
        d="M14,76 L34,64 L54,48 L74,32 L86,18 L86,84 L14,84 Z"
        fill={LIME}
        fillOpacity="0.14"
        initial={reduce ? false : { opacity: 0 }}
        animate={reduce ? undefined : { opacity: [0, 0, 1, 1, 0] }}
        transition={
          reduce
            ? undefined
            : {
                duration: cycle,
                repeat: Infinity,
                times: [0, 0.1, 0.5, 0.9, 1],
                ease: 'easeOut',
              }
        }
      />

      {/* The line itself — draws from origin to peak. */}
      <motion.path
        d="M14,76 L34,64 L54,48 L74,32 L86,18"
        fill="none"
        stroke={LIME}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? false : { pathLength: 0 }}
        animate={reduce ? undefined : { pathLength: [0, 1, 1, 0] }}
        transition={
          reduce
            ? undefined
            : {
                duration: cycle,
                repeat: Infinity,
                times: [0, 0.5, 0.9, 1],
                ease: 'easeInOut',
              }
        }
      />

      {/* Milestone dots — fade in/out in place as the line passes. */}
      {dots.map(({ cx, cy, fillOpacity, start }) => (
        <motion.circle
          key={cx}
          cx={cx}
          cy={cy}
          r="2.2"
          fill={LIME}
          fillOpacity={fillOpacity}
          initial={reduce ? false : { opacity: 0 }}
          animate={reduce ? undefined : { opacity: [0, 0, 1, 1, 0] }}
          transition={
            reduce
              ? undefined
              : {
                  duration: cycle,
                  repeat: Infinity,
                  times: [0, start, start + 0.06, 0.9, 1],
                  ease: 'easeOut',
                }
          }
        />
      ))}

      {/* Endpoint dot — fades in when the line reaches the peak. Sized
          to match the milestone dots so it sits cleanly on the line's
          end rather than feeling offset from it. */}
      <motion.circle
        cx="86"
        cy="18"
        r="2.6"
        fill={LIME}
        initial={reduce ? false : { opacity: 0 }}
        animate={reduce ? undefined : { opacity: [0, 0, 1, 1, 0] }}
        transition={
          reduce
            ? undefined
            : {
                duration: cycle,
                repeat: Infinity,
                times: [0, 0.48, 0.55, 0.9, 1],
                ease: 'easeOut',
              }
        }
      />
    </svg>
  );
}
