import { Mail, MessageCircle } from 'lucide-react';

/**
 * The "Let's Talk" CTA band — the design reference the rest of the
 * marketing surface follows. Dark canvas, single lime ambient glow,
 * tiny lime eyebrow, big tight heading, width-constrained sub.
 *
 * Used at the bottom of every public page.
 */
export default function LetsTalkBand() {
  return (
    <section id="contact" className="relative px-6 py-28 border-t border-border/60">
      <div className="mx-auto max-w-5xl">
        <div className="relative rounded-3xl border border-border bg-zinc-950 dark:bg-card p-10 md:p-16 overflow-hidden">
          {/* Decorative ambient glow inside the band */}
          <div className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full bg-primary/20 blur-[100px] pointer-events-none" />

          <div className="relative">
            <p className="text-[11px] uppercase tracking-[0.16em] text-primary font-medium mb-3">
              Let&apos;s talk
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white max-w-2xl leading-tight">
              Not sure which fits? Let&apos;s figure it out together.
            </h2>
            <p className="mt-5 text-base text-white/70 max-w-xl leading-relaxed">
              Tell us what you&apos;re building. You&apos;ll have a proposal in your inbox within 48
              hours — no sales pressure, no obligation, no ghosting.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row gap-3">
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
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/15 bg-white/5 text-white font-medium text-sm transition-colors hover:bg-white/10 active-press"
              >
                <Mail className="w-4 h-4" />
                Email us
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
