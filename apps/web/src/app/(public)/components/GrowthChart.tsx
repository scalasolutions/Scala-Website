"use client";

import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { Sparkles } from 'lucide-react';

/**
 * Growth-curve dataset for the hero centerpiece. The actual numbers are
 * illustrative — they describe the *shape* of a thing scaling, which is the
 * whole point of the visual. Monthly cadence over 12 months.
 */
const data = [
  { month: 'Jan', revenue: 12, customers: 8 },
  { month: 'Feb', revenue: 14, customers: 11 },
  { month: 'Mar', revenue: 18, customers: 15 },
  { month: 'Apr', revenue: 22, customers: 19 },
  { month: 'May', revenue: 28, customers: 22 },
  { month: 'Jun', revenue: 34, customers: 28 },
  { month: 'Jul', revenue: 42, customers: 33 },
  { month: 'Aug', revenue: 51, customers: 41 },
  { month: 'Sep', revenue: 62, customers: 48 },
  { month: 'Oct', revenue: 76, customers: 58 },
  { month: 'Nov', revenue: 88, customers: 71 },
  { month: 'Dec', revenue: 104, customers: 86 },
];

/**
 * Animated area chart presented as a hero centerpiece. The curve grows in on
 * mount (recharts default animation, tuned slower so the rise reads as
 * "growth"), and the surrounding card carries pulsing live-data accents to
 * sell the metaphor: your business, scaling.
 */
export default function GrowthChart() {
  // Force a remount of the chart shortly after first paint so the grow-in
  // animation runs reliably (recharts' initial run-in can be missed if the
  // container resizes mid-mount).
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setVersion(1), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Outer ambient glow under the card */}
      <div className="absolute inset-0 -z-10 rounded-3xl bg-primary/10 blur-2xl scale-95" />

      <div className="glass relative rounded-3xl p-5 md:p-7 overflow-hidden">
        {/* Top meta row: looks like a tiny app dashboard, but keeps the
            language aspirational rather than making a specific claim. */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-70 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Your business · trending up
            </span>
          </div>

          <div className="flex items-center gap-5 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-primary shadow-[0_0_8px_rgba(206,248,78,0.6)]" />
              <span className="text-muted-foreground">Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-foreground/40" />
              <span className="text-muted-foreground">Customers</span>
            </div>
          </div>
        </div>

        {/* Aspirational headline — no specific claim, just the vibe. */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-2">
          <div>
            <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
              Watch your business grow.
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              The curve we&apos;re hired to draw — month by month, customer by customer.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Sparkles className="w-3 h-3 text-primary-ink dark:text-primary" />
            <span>Illustrative — every business is different</span>
          </div>
        </div>

        {/* The chart itself — fixed height so SSR layout is stable */}
        <div className="h-[220px] md:h-[260px] mt-2 -ml-3 pointer-events-none select-none">
          <ResponsiveContainer width="100%" height="100%" key={version}>
            <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="growthLime" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#CEF84E" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#CEF84E" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="growthGhost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#94a3b8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis hide />
              {/* No Tooltip — the chart is purely illustrative, so hovering
                  should not reveal any numeric values. The "Illustrative" hint
                  in the header already sets the expectation. */}
              {/* Sessions area sits behind the revenue area in a muted hue. */}
              <Area
                type="monotone"
                dataKey="customers"
                stroke="rgba(148, 163, 184, 0.6)"
                strokeWidth={1.5}
                fill="url(#growthGhost)"
                animationDuration={2200}
                animationEasing="ease-out"
                activeDot={false}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#CEF84E"
                strokeWidth={2.5}
                fill="url(#growthLime)"
                animationDuration={2600}
                animationEasing="ease-out"
                activeDot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Subtle baseline grid implied by faint hairlines */}
        <div className="pointer-events-none absolute inset-x-7 bottom-12 h-px bg-border/40" />
      </div>
    </div>
  );
}
