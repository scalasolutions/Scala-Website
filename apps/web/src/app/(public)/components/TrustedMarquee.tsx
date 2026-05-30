"use client";

import {
  Sparkles,
  ShoppingBag,
  Server,
  Globe,
  Cpu,
  Database,
  Cloud,
  Layers,
  Workflow,
  Boxes,
  Lock,
  Zap,
} from 'lucide-react';

/**
 * Infinite "we work with" / "powered by" strip. Logos are icon+label pairs
 * to stay framework-agnostic and theme-aware (no need to ship dark/light
 * SVGs of every brand). The track is duplicated so the marquee loops
 * seamlessly. Edge fade is applied via `.marquee-mask`.
 */
const items = [
  { icon: <Globe className="w-4 h-4" />, label: 'Next.js' },
  { icon: <Cloud className="w-4 h-4" />, label: 'Vercel' },
  { icon: <Database className="w-4 h-4" />, label: 'PostgreSQL' },
  { icon: <Server className="w-4 h-4" />, label: 'Node' },
  { icon: <Workflow className="w-4 h-4" />, label: 'Stripe' },
  { icon: <Layers className="w-4 h-4" />, label: 'Tailwind' },
  { icon: <Boxes className="w-4 h-4" />, label: 'Drizzle' },
  { icon: <Sparkles className="w-4 h-4" />, label: 'OpenAI' },
  { icon: <Cpu className="w-4 h-4" />, label: 'Anthropic' },
  { icon: <ShoppingBag className="w-4 h-4" />, label: 'Shopify' },
  { icon: <Lock className="w-4 h-4" />, label: 'Auth.js' },
  { icon: <Zap className="w-4 h-4" />, label: 'Resend' },
];

export default function TrustedMarquee() {
  // Duplicate the list once — the keyframe translates -50% which is exactly
  // one copy width, giving a seamless loop.
  const loop = [...items, ...items];

  return (
    <section className="relative px-6 py-10 sm:py-12 md:py-16 overflow-hidden">
      <div className="relative mx-auto max-w-7xl">
        <p className="text-center text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-8">
          The stack we trust to ship fast, secure software
        </p>

        <div className="marquee-mask relative overflow-hidden">
          <div className="marquee-track gap-10">
            {loop.map((item, i) => (
              <div
                key={`${item.label}-${i}`}
                className="flex items-center gap-2.5 px-5 py-2 rounded-full border border-border/70 bg-card/60 text-sm text-muted-foreground whitespace-nowrap shrink-0"
              >
                <span className="text-foreground/80 dark:text-primary">{item.icon}</span>
                <span className="font-medium text-foreground/90">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
