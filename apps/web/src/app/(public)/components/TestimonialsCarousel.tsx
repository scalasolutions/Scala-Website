"use client";

import { Star } from 'lucide-react';

import { Reveal } from './ui/Reveal';
import { WipeIn } from './ui/WipeIn';
import { SectionEyebrow } from './ui/SectionEyebrow';

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

function TestimonialCard({ t }: { t: Testimonial }) {
  const initials = t.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('');

  return (
    <article className="relative w-[360px] md:w-[400px] shrink-0 rounded-3xl border border-foreground/20 bg-card/70 p-7 md:p-8 overflow-hidden backdrop-blur-sm">
      {/* Faint dot grid + lime corner wash — same tech surface as the
          rest of the page, scaled down for a narrower card. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.05] text-foreground"
        style={{
          backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
      <div
        aria-hidden
        className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary/15 blur-[70px] pointer-events-none"
      />

      <div className="relative">
        {/* Yellow stars — 5/5 rating */}
        <div className="flex items-center gap-1 mb-5">
          {[0, 1, 2, 3, 4].map((s) => (
            <Star
              key={s}
              className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400"
              aria-hidden
            />
          ))}
        </div>

        <p className="text-base md:text-[17px] font-medium text-foreground leading-snug line-clamp-6">
          {t.quote}
        </p>

        <div className="mt-7 h-px bg-gradient-to-r from-foreground/25 via-foreground/10 to-transparent" />

        <div className="mt-5 flex items-center gap-3">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-primary/40 to-primary/10 border border-primary/50 flex items-center justify-center text-xs font-semibold text-foreground tracking-tight">
            {initials}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">
              {t.name}
            </div>
            <div className="text-[10px] font-mono tracking-wide text-muted-foreground uppercase truncate">
              {t.role}
              {t.company ? ` · ${t.company}` : ''}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * Continuous testimonial marquee. All cards scroll horizontally end-to-
 * end; the track is duplicated so cards leaving the right edge loop
 * seamlessly back in on the left. Slower than the logo strip —
 * testimonial cards are big enough that the eye needs more time per
 * card.
 */
export default function TestimonialsCarousel({
  eyebrow,
}: {
  eyebrow?: { number: string; label: string };
} = {}) {
  const loop = [...testimonials, ...testimonials];

  return (
    <section className="relative py-12 md:py-16 overflow-hidden">
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="max-w-3xl mb-12 md:mb-16">
          {eyebrow && <SectionEyebrow number={eyebrow.number} label={eyebrow.label} />}
          <WipeIn
            as="h2"
            className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.05]"
          >
            Words from people who pay our invoices.
          </WipeIn>
        </div>
      </div>

      {/* Full-bleed marquee — sits outside the max-width wrapper so the
          cards can travel off either edge of the viewport rather than
          stopping at the container boundary. */}
      <Reveal className="marquee-mask relative overflow-hidden">
        <div className="marquee-track gap-6" style={{ animationDuration: '60s' }}>
          {loop.map((t, i) => (
            <TestimonialCard key={`${t.name}-${i}`} t={t} />
          ))}
        </div>
      </Reveal>
    </section>
  );
}
