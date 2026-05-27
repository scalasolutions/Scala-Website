"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  /** Optional company tag. */
  company?: string;
}

const testimonials: Testimonial[] = [
  {
    quote:
      'They rebuilt our whole storefront in three weeks and we were live before our marketing campaign. Same number from kickoff to launch — no surprises end-to-end.',
    name: 'Maya Sutanto',
    role: 'Founder',
    company: 'Kanara Studio',
  },
  {
    quote:
      'We had three agencies ghost us before Scala. Same scope, half the noise, and the team actually picks up the phone in our timezone.',
    name: 'Dimas Pratama',
    role: 'Operations Lead',
    company: 'Lumira Group',
  },
  {
    quote:
      'The internal CRM they shipped saves the team about six hours a week — and they still answer Slack messages a year later. Worth every rupiah.',
    name: 'Ayu Larasati',
    role: 'COO',
    company: 'Veronia Living',
  },
  {
    quote:
      'Plain English, no buzzwords. They explained trade-offs, gave us choices, and shipped on time. I have already referred two friends.',
    name: 'Kevin Wijaya',
    role: 'Director',
    company: 'Jakarta Outdoor Co.',
  },
];

/**
 * Auto-rotating testimonials carousel with manual prev/next + clickable dots.
 * Pauses while the user hovers the surface. Slides cross-fade rather than
 * slide horizontally so the lime accent and quote glyph remain anchored.
 */
export default function TestimonialsCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback((i: number) => {
    setIndex((i + testimonials.length) % testimonials.length);
  }, []);
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (paused) return;
    timer.current = setTimeout(() => next(), 6500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [index, paused, next]);

  const t = testimonials[index];

  return (
    <section className="relative px-6 py-28 md:py-32 border-t border-border/60 overflow-hidden">
      {/* Glow stack: lime carries the right edge, amber warms the left so the
          card pulls focus to center. */}
      <div className="absolute top-1/4 right-[-10%] w-[600px] h-[500px] rounded-full bg-primary/[0.07] blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[5%] left-[-8%] w-[420px] h-[420px] rounded-full bg-amber-300/[0.07] blur-[130px] pointer-events-none" />

      <div className="relative mx-auto max-w-5xl">
        <div className="max-w-2xl mb-12">
          <p className="text-[11px] uppercase tracking-[0.16em] text-primary font-medium mb-3">
            What people say
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground leading-tight">
            Words from people who pay our invoices.
          </h2>
        </div>

        <div
          className="relative glass rounded-3xl p-8 md:p-12 overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <Quote
            className="absolute top-7 right-7 w-10 h-10 text-primary/30"
            aria-hidden
          />

          {/* Key forces a remount on each rotation so the fade-soft animation
              fires each time the testimonial changes. */}
          <div key={index} className="fade-soft">
            <div className="flex items-center gap-1 mb-6">
              {[0, 1, 2, 3, 4].map((s) => (
                <Star
                  key={s}
                  className="w-3.5 h-3.5 fill-primary text-primary"
                  aria-hidden
                />
              ))}
            </div>

            <p className="text-xl md:text-2xl font-medium tracking-tight text-foreground leading-snug max-w-3xl">
              &ldquo;{t.quote}&rdquo;
            </p>

            <div className="mt-8 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/40 flex items-center justify-center text-sm font-semibold text-foreground">
                {t.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">{t.name}</div>
                <div className="text-xs text-muted-foreground">
                  {t.role}
                  {t.company ? ` · ${t.company}` : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Controls row */}
          <div className="mt-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Go to testimonial ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index
                      ? 'w-8 bg-primary shadow-[0_0_10px_rgba(206,248,78,0.5)]'
                      : 'w-1.5 bg-border hover:bg-foreground/30'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={prev}
                aria-label="Previous testimonial"
                className="w-9 h-9 rounded-full border border-border bg-card/60 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors flex items-center justify-center active-press"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={next}
                aria-label="Next testimonial"
                className="w-9 h-9 rounded-full border border-border bg-card/60 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors flex items-center justify-center active-press"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
