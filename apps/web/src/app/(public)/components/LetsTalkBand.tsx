import { Mail, MessageCircle } from 'lucide-react';

import { Reveal } from './ui/Reveal';
import { WipeIn } from './ui/WipeIn';
import { SectionEyebrow } from './ui/SectionEyebrow';

/**
 * Contact section — follows the editorial rhythm of Ways we scale, the
 * stats counter, and the FAQ: section padding, max-w-7xl container, title
 * block on the left with CTAs floated to the right of the same row.
 *
 * No card, no border, no inner glow — the page itself is the canvas.
 */
export default function LetsTalkBand({
  eyebrow,
}: {
  eyebrow?: { number: string; label: string };
} = {}) {
  return (
    <section id="contact" className="relative px-6 py-12 md:py-16">
      <div className="relative mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div className="max-w-3xl">
            {eyebrow && <SectionEyebrow number={eyebrow.number} label={eyebrow.label} />}
            <WipeIn
              as="h2"
              className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.05]"
            >
              Let&apos;s scale.
            </WipeIn>
            <Reveal delay={0.1}>
              <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed">
                Not sure which fits? Tell us what you&apos;re building. You&apos;ll have a proposal
                in your inbox within 48 hours — no sales pressure, no obligation, no
                ghosting.
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.15} className="shrink-0">
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="https://wa.me/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-zinc-900 font-medium text-sm transition-colors hover:bg-primary/90 active-press"
              >
                <MessageCircle className="w-4 h-4" />
                Chat on WhatsApp
              </a>
              <a
                href="mailto:hello@scalasolutions.id"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border/60 bg-card/40 text-foreground font-medium text-sm transition-colors hover:bg-card/60 active-press"
              >
                <Mail className="w-4 h-4" />
                Email us
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
