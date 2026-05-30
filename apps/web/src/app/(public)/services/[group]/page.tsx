"use client";

import { use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';

import PublicNav from '@/app/(public)/components/PublicNav';
import PublicFooter from '@/app/(public)/components/PublicFooter';
import { Reveal } from '@/app/(public)/components/ui/Reveal';
import { WipeIn } from '@/app/(public)/components/ui/WipeIn';
import { SectionEyebrow } from '@/app/(public)/components/ui/SectionEyebrow';

import {
  getCategoriesByGroup,
  getGroupById,
  solutionGroups,
} from '../data';
import { CategoryAccordion } from '../components/CategoryAccordion';

/* ---------------------------------------------------------------------------
 * Solution-area detail page. Each of the six groups gets its own route via
 * this dynamic segment, e.g. /services/web, /services/design, /services/ai.
 *
 * Layout mirrors the editorial rhythm of the rest of the public surface:
 * SectionEyebrow + WipeIn h1, descriptive sub-copy, the catalog accordions
 * for this group, and the shared contact CTA at the bottom.
 * ------------------------------------------------------------------------- */

const groupNumbers: Record<string, string> = solutionGroups.reduce(
  (acc, g, i) => {
    acc[g.id] = String(i + 1).padStart(2, '0');
    return acc;
  },
  {} as Record<string, string>,
);

export default function SolutionGroupPage({
  params,
}: {
  params: Promise<{ group: string }>;
}) {
  const { group: groupId } = use(params);
  const group = getGroupById(groupId);
  if (!group) notFound();
  const cats = getCategoriesByGroup(group.id);
  const Icon = group.icon;
  const number = groupNumbers[group.id] ?? '01';

  // Index of this group in the canonical list, so "next solution" wraps.
  const idx = solutionGroups.findIndex((g) => g.id === group.id);
  const next = solutionGroups[(idx + 1) % solutionGroups.length];

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-clip">
      {/* Faint lime "sunset" — the same green glow gradient as the home hero,
          dialed down so it sits quietly behind the page header. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[75vh] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 100% 85% at 50% 0%, rgba(206,248,78,0.16) 0%, rgba(206,248,78,0.09) 26%, rgba(206,248,78,0.04) 50%, rgba(206,248,78,0.015) 70%, transparent 84%)',
        }}
      />

      <PublicNav />

      {/* ============================== HERO ============================== */}
      <section className="relative px-6 pt-24 pb-10 md:pt-32 md:pb-14 mx-auto max-w-7xl">
        <Reveal>
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-primary-ink dark:hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All solutions
          </Link>
        </Reveal>

        <div className="max-w-3xl">
          <SectionEyebrow number={number} label={group.eyebrow} />

          {/* Icon sits inline on the same row as the heading — no container,
              just the bare mark in the lime accent. */}
          <div className="flex items-center gap-4 sm:gap-5">
            <Reveal>
              <Icon
                className="w-9 h-9 sm:w-12 sm:h-12 shrink-0 text-primary-ink dark:text-primary"
                strokeWidth={1.6}
              />
            </Reveal>
            <WipeIn
              as="h1"
              className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-foreground leading-[1.02]"
            >
              {group.title}
            </WipeIn>
          </div>
          <Reveal delay={0.1}>
            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
              {group.blurb}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ============================== CATALOG ============================== */}
      <section id="pricing" className="relative px-6 pb-16 md:pb-20 mx-auto max-w-5xl">
        <Reveal stagger={0.06} className="space-y-3">
          {cats.map((category, i) => (
            <CategoryAccordion
              key={category.num}
              category={category}
              defaultOpen={i === 0}
            />
          ))}
        </Reveal>

        <p className="mt-10 text-xs text-muted-foreground text-center max-w-xl mx-auto leading-relaxed">
          All prices in IDR (<span className="tabular-nums">jt</span> = juta / million). The{' '}
          <span className="text-primary-ink dark:text-primary font-semibold">+</span> means
          starting point — final quote depends on scope, features &amp; complexity.
        </p>
      </section>

      {/* ============================== NEXT SOLUTION ============================== */}
      <section className="relative px-6 pb-12 md:pb-16 mx-auto max-w-5xl">
        <Reveal>
          <Link
            href={`/services/${next.id}`}
            className="group relative flex items-center justify-between gap-6 rounded-2xl border border-border/60 bg-card/40 px-6 py-5 md:px-8 md:py-6 hover:border-primary/30 transition-colors"
          >
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
                Next solution
              </p>
              <p className="text-lg md:text-xl font-semibold text-foreground group-hover:text-primary-ink dark:group-hover:text-primary transition-colors">
                {next.title}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary-ink dark:group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </Link>
        </Reveal>
      </section>

      <PublicFooter />
    </div>
  );
}
