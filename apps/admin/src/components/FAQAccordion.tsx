"use client";

import { Plus } from 'lucide-react';

interface QA {
  q: string;
  a: string;
}

const faqs: QA[] = [
  {
    q: 'How fast can you start?',
    a: 'Most small projects start within a week. You get a proposal back within 48 hours of your first message, and we break ground as soon as you give the green light.',
  },
  {
    q: 'Do you only build websites, or also internal tools?',
    a: 'Both. About a third of our work is internal dashboards, CRMs, and ops tools — anything that replaces a spreadsheet or a manual workflow.',
  },
  {
    q: 'What happens after launch?',
    a: 'We hand over docs, train your team, and offer an optional small monthly care plan. No obligation — many clients self-serve and we keep the door open for changes.',
  },
  {
    q: 'How do you handle pricing?',
    a: 'We agree on the number before we start, and we get paid in milestones tied to real deliverables. If the scope evolves mid-project, we talk it through before anything changes — no hourly clocks, no creeping invoices.',
  },
  {
    q: 'Where are you based and what languages do you work in?',
    a: 'Jakarta, Indonesia. Our team works in Bahasa Indonesia and English. We answer messages during local business hours and most async queries within a few hours.',
  },
  {
    q: 'Can you work with our existing developers or designers?',
    a: 'Yes. We slot into existing teams, code reviews, and design systems all the time. We can also lead the build if your team would rather focus elsewhere.',
  },
];

/**
 * Lightweight accordion using native `<details>` for accessibility — keyboard
 * support, semantics, and reduced-motion fallbacks come for free. We only
 * style chrome and animate the open transition.
 */
export default function FAQAccordion() {
  return (
    <section className="relative px-6 py-28 md:py-32 border-t border-border/60 overflow-hidden">
      {/* Glow stack: lime sits behind the centered column, sky on the
          opposite corner so the section breathes asymmetrically. */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-primary/[0.06] blur-[140px] pointer-events-none" />
      <div className="absolute top-[5%] left-[-8%] w-[380px] h-[380px] rounded-full bg-sky-400/[0.06] blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[5%] right-[-8%] w-[380px] h-[380px] rounded-full bg-amber-300/[0.05] blur-[130px] pointer-events-none" />

      <div className="relative mx-auto max-w-4xl">
        <div className="mb-14 text-center">
          <p className="text-[11px] uppercase tracking-[0.16em] text-primary font-medium mb-3">
            Frequently asked
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground leading-tight">
            Questions we get a lot.
          </h2>
        </div>

        <div className="divide-y divide-border/60 border-y border-border/60">
          {faqs.map((item) => (
            <details key={item.q} className="group py-5 px-1">
              <summary className="flex items-center justify-between gap-6 text-left">
                <span className="text-base md:text-lg font-medium tracking-tight text-foreground group-open:text-primary transition-colors">
                  {item.q}
                </span>
                <span className="accordion-chev shrink-0 w-8 h-8 rounded-full border border-border bg-card/60 flex items-center justify-center text-muted-foreground group-open:border-primary/50 group-open:text-primary group-open:bg-primary/10 transition-colors">
                  <Plus className="w-4 h-4" />
                </span>
              </summary>
              <div className="accordion-body pt-3 pr-12">
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {item.a}
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
