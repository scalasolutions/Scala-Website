"use client";

import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import { useReveal } from '@/lib/useReveal';
import { WipeIn } from './ui/WipeIn';
import { SectionEyebrow } from './ui/SectionEyebrow';

interface Stat {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: string;
  meta?: string;
}

/* ---------------------------------------------------------------------------
 * OdometerGauge — minimal half-circle dial. The lime arc fills in lockstep
 * with page scroll: empty when the cell first enters the viewport, fully
 * drawn by the time it reaches the centre.
 * ------------------------------------------------------------------------- */
function OdometerGauge({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  // Geometry
  const cx = 110;
  const cy = 120;
  const R = 95;
  const ARC = Math.PI * R; // half-circumference
  const fillRatio = Math.max(0, Math.min(1, value / 100));
  const targetOffset = ARC * (1 - fillRatio);

  // Scroll-driven fill. 0 progress = element just entered the bottom of the
  // viewport; 1 = element's top has reached the vertical centre.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'start center'],
  });

  const rawOffset = useTransform(scrollYProgress, [0, 1], [ARC, targetOffset]);
  const smoothedOffset = useSpring(rawOffset, {
    stiffness: 80,
    damping: 22,
    mass: 0.6,
  });

  return (
    <div ref={ref} className="w-full" aria-hidden>
      <svg viewBox="0 0 220 145" className="w-full h-auto block">
        {/* Track */}
        <path
          d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.12"
          strokeWidth="14"
          strokeLinecap="round"
          className="text-foreground"
        />

        {/* Fill — strokeDashoffset is driven by scroll progress */}
        <motion.path
          d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="14"
          strokeLinecap="round"
          className="text-primary"
          strokeDasharray={ARC}
          style={{
            strokeDashoffset: reduce ? targetOffset : smoothedOffset,
            filter:
              'drop-shadow(0 0 12px rgb(var(--primary-rgb, 163 230 53) / 0.55))',
          }}
        />
      </svg>

      {/* Scale legend */}
      <div className="mt-1 flex justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70 px-1">
        <span>0%</span>
        <span>50%</span>
        <span className="text-primary">99.9</span>
      </div>
    </div>
  );
}

function CountUp({ stat, inView }: { stat: Stat; inView: boolean }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setCurrent(stat.value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, stat.value]);

  const formatted = current.toLocaleString('en-US', {
    minimumFractionDigits: stat.decimals ?? 0,
    maximumFractionDigits: stat.decimals ?? 0,
  });

  return (
    <div className="flex items-baseline gap-1">
      {stat.prefix && (
        <span className="text-xl sm:text-2xl md:text-3xl font-medium text-muted-foreground">
          {stat.prefix}
        </span>
      )}
      <span className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-semibold tracking-tight tabular-nums leading-[0.9] text-foreground">
        {formatted}
      </span>
      {stat.suffix && (
        <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-primary-ink dark:text-primary text-glow-lime">
          {stat.suffix}
        </span>
      )}
    </div>
  );
}

const uptime: Stat = {
  value: 99.9,
  decimals: 1,
  suffix: '%',
  label: 'Uptime in 2025',
  meta: 'Across all hosted sites',
};

export default function StatsCounter({
  eyebrow,
}: {
  eyebrow?: { number: string; label: string };
} = {}) {
  const reduce = useReducedMotion();
  const { ref, inView } = useReveal<HTMLDivElement>();

  return (
    <section className="relative px-6 py-12 md:py-16">
      <div className="relative mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-10 gap-y-12 items-end">
          {/* Title — left */}
          <div className="md:col-span-5">
            {eyebrow && <SectionEyebrow number={eyebrow.number} label={eyebrow.label} />}
            <WipeIn
              as="h2"
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-semibold tracking-tight text-foreground leading-[1.02]"
            >
              Scale with confidence.
            </WipeIn>
          </div>

          {/* Stat — right */}
          <motion.div
            ref={ref}
            initial={reduce ? undefined : { opacity: 0, y: 24 }}
            animate={
              reduce
                ? undefined
                : { opacity: inView ? 1 : 0, y: inView ? 0 : 24 }
            }
            transition={
              reduce
                ? undefined
                : { duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }
            }
            className="md:col-span-7"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-6 md:gap-8">
              <div>
                <CountUp stat={uptime} inView={inView} />
                <p className="mt-3 text-base md:text-lg font-medium text-foreground/90">
                  {uptime.label}
                </p>
                {uptime.meta && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {uptime.meta}
                  </p>
                )}
              </div>
              <div className="w-44 md:w-52 lg:w-60 shrink-0">
                <OdometerGauge value={uptime.value} />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
