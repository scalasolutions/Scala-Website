"use client";

import { useEffect, useState } from 'react';
import { useReveal } from '@/lib/useReveal';

interface Stat {
  /** The final value to animate to. Plain number — formatting handled separately. */
  value: number;
  /** Optional decimal places (e.g. 99.9% uses 1). Defaults to 0. */
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: string;
  /** Small caption under the label, e.g. "Across Indonesia". */
  meta?: string;
}

/**
 * Counts each stat up from 0 to its final value the first time the section
 * enters the viewport. Uses requestAnimationFrame with an ease-out curve so
 * larger numbers don't feel linear.
 */
function CountUp({ stat }: { stat: Stat }) {
  const { ref, inView } = useReveal<HTMLDivElement>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!inView) return;

    const duration = 1400;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // ease-out-cubic — fast start, gentle settle. Feels confident, not jumpy.
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
    <div ref={ref} className="pt-7 border-t border-border/60">
      <div className="flex items-baseline gap-1 mb-3">
        {stat.prefix && (
          <span className="text-xl font-medium text-muted-foreground">{stat.prefix}</span>
        )}
        <span className="text-4xl md:text-5xl font-semibold tracking-tight tabular-nums text-foreground">
          {formatted}
        </span>
        {stat.suffix && (
          <span className="text-2xl md:text-3xl font-semibold text-primary text-glow-lime">
            {stat.suffix}
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-foreground/90">{stat.label}</p>
      {stat.meta && (
        <p className="text-xs text-muted-foreground mt-1">{stat.meta}</p>
      )}
    </div>
  );
}

const stats: Stat[] = [
  { value: 50, suffix: '+', label: 'Projects shipped', meta: 'Websites, stores, and tools' },
  { value: 99.9, decimals: 1, suffix: '%', label: 'Uptime in 2025', meta: 'Across all hosted sites' },
  { value: 48, suffix: 'hr', label: 'Proposal turnaround', meta: 'You hear back the same week' },
  { value: 12, suffix: 'x', label: 'Avg client tenure', meta: 'Months — most stay longer' },
];

export default function StatsCounter() {
  return (
    <section className="relative px-6 py-28 md:py-32 border-t border-border/60 overflow-hidden">
      {/* Glow stack: lime center, amber whisper from the upper-right, cyan
          whisper from the lower-left — three offset hues stage the numbers. */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-primary/[0.06] blur-[140px] pointer-events-none" />
      <div className="absolute top-[-10%] right-[-8%] w-[420px] h-[420px] rounded-full bg-amber-300/[0.06] blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-8%] w-[420px] h-[420px] rounded-full bg-sky-400/[0.06] blur-[130px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl">
        <div className="max-w-2xl mb-16">
          <p className="text-[11px] uppercase tracking-[0.16em] text-primary font-medium mb-3">
            By the numbers
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground leading-tight">
            Small team. Serious receipts.
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
          {stats.map((s) => (
            <CountUp key={s.label} stat={s} />
          ))}
        </div>
      </div>
    </section>
  );
}
