"use client";

import { useState, type ComponentType } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  Briefcase,
  Calendar,
  Check,
  Clock,
  Code,
  CreditCard,
  FileText,
  Gauge,
  Globe,
  HardDrive,
  Languages,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  LineChart,
  Lock,
  Map,
  Megaphone,
  MessageCircle,
  Monitor,
  Package,
  Palette,
  Plug,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Search,
  Server,
  Shield,
  Smartphone,
  Sparkles,
  Star,
  Truck,
  UserPlus,
  Users,
  Workflow,
  Zap,
  type LucideProps,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isHardPrice, type Category, type PriceRow } from '../data';

type SpecIcon = ComponentType<LucideProps>;

/* Keyword → lucide icon. First match wins, so order matters — narrower
 * patterns before broader ones. Falls back to `Check` when nothing fits. */
const SPEC_ICON_RULES: Array<[RegExp, SpecIcon]> = [
  [/\b(page|screen|spread|slide)s?\b/i, FileText],
  [/\brevision/i, RotateCcw],
  [/\bweek|day\b|timeline|response time|sla/i, Clock],
  [/\bsku|catalog\b/i, Package],
  [/\b\d+\s*(gb|mb|tb)|storage\b/i, HardDrive],
  [/\bpayment|checkout|payout|cod\b/i, CreditCard],
  [/shipping|courier|warehouse|delivery/i, Truck],
  [/uptime|monitor/i, Activity],
  [/hosting|hosted/i, Server],
  [/backup/i, Save],
  [/api|integration/i, Plug],
  [/notification|alert|push/i, Bell],
  [/dashboard/i, LayoutDashboard],
  [/support/i, LifeBuoy],
  [/analytics|report|insight|tracking|data/i, BarChart3],
  [/whatsapp/i, MessageCircle],
  [/contact|lead capture/i, UserPlus],
  [/account|login|profile|customer|user|auth|role/i, Users],
  [/language|bahasa|english/i, Languages],
  [/secure|private|ssl|cert/i, Shield],
  [/team|dedicated/i, Users],
  [/campaign|marketing|brand activation/i, Megaphone],
  [/\b(ai|bot|chatbot|trained|smart)\b/i, Bot],
  [/automation|automate|hours saved/i, Zap],
  [/workflow/i, Workflow],
  [/loyalty|reward|membership|points/i, Star],
  [/lock|cms/i, Lock],
  [/roadmap|strategy|plan/i, Map],
  [/figma|prototype|design system|brand|color|type|playbook|guideline/i, Palette],
  [/print/i, Printer],
  [/photo|video|content|creative|art direction|edit/i, Sparkles],
  [/social|community|engagement|growth/i, LineChart],
  [/sales|revenue|funnel/i, LineChart],
  [/booking/i, Calendar],
  [/mobile|ios|android|app store/i, Smartphone],
  [/desktop/i, Monitor],
  [/seo/i, Search],
  [/web|website|http/i, Globe],
  [/dev|code|handoff/i, Code],
  [/performance/i, Gauge],
  [/multi|cross|channel|scoped|custom|business|enterprise/i, Layers],
  [/scope|business/i, Briefcase],
];

function pickSpecIcon(spec: string): SpecIcon {
  for (const [rx, Icon] of SPEC_ICON_RULES) {
    if (rx.test(spec)) return Icon;
  }
  return Check;
}

/* ---------------------------------------------------------------------------
 * One tier inside an open category. Mobile-first: name + price sit on a
 * baseline-aligned row that wraps gracefully; detail and indicative spec
 * chips stack underneath. Never scrolls sideways.
 * ------------------------------------------------------------------------- */
function PriceLine({ row }: { row: PriceRow }) {
  const hard = isHardPrice(row.price);
  return (
    <li className="relative py-6 md:py-8 first:pt-2 md:first:pt-3 last:pb-2 border-b border-border/30 last:border-0">
      <h4 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground leading-tight">
        {row.name}
      </h4>

      <div
        className={cn(
          'mt-2 tabular-nums leading-none',
          hard
            ? 'text-lg md:text-xl font-medium text-foreground/85'
            : 'text-xs font-medium uppercase tracking-wide text-muted-foreground'
        )}
      >
        {row.price}
      </div>

      {row.detail && (
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          {row.detail}
        </p>
      )}

      {row.specs && (
        <ul className="mt-4 space-y-1.5">
          {row.specs.map((spec) => {
            const SpecIconCmp = pickSpecIcon(spec);
            return (
              <li
                key={spec}
                className="flex items-center gap-2.5 text-sm text-muted-foreground leading-snug"
              >
                <SpecIconCmp
                  className="w-[18px] h-[18px] shrink-0 text-primary-ink dark:text-primary"
                  strokeWidth={1.75}
                />
                <span>{spec}</span>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

/* ---------------------------------------------------------------------------
 * One category = one accordion row. Same mechanics as the home-page FAQ:
 * height-auto expand, plus → close rotation, lime corner glow on open.
 * ------------------------------------------------------------------------- */
export function CategoryAccordion({
  category,
  defaultOpen,
}: {
  category: Category;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const reduce = useReducedMotion();
  const panelId = `cat-panel-${category.num}`;
  const buttonId = `cat-button-${category.num}`;
  const CatIcon = category.icon;

  return (
    <div
      className={cn(
        'group relative rounded-2xl border bg-card/40 overflow-hidden transition-colors duration-300',
        open ? 'border-primary/40' : 'border-border/60 hover:border-primary/30'
      )}
    >
      <div
        aria-hidden
        className={cn(
          'absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[80px] pointer-events-none bg-primary transition-opacity duration-500',
          open ? 'opacity-20' : 'opacity-0 group-hover:opacity-10'
        )}
      />

      <h3 className="relative">
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-3 md:gap-5 text-left p-4 md:p-6 cursor-pointer"
        >
          <span
            className={cn(
              'shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-colors duration-300 border',
              open
                ? 'bg-primary text-zinc-900 border-primary'
                : 'bg-primary/[0.07] text-primary-ink dark:text-primary border-primary/20 group-hover:bg-primary/10'
            )}
          >
            <CatIcon className="w-5 h-5 md:w-[22px] md:h-[22px]" strokeWidth={1.75} />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-base md:text-2xl font-semibold tracking-tight text-foreground leading-tight">
              {category.title}
            </span>
            <span className="mt-0.5 md:mt-1 block text-xs md:text-sm text-muted-foreground leading-snug line-clamp-1">
              {category.tagline}
            </span>
          </span>

          <span className="shrink-0 text-[11px] sm:text-sm font-medium tabular-nums text-muted-foreground text-right">
            {category.hint}
          </span>

          <motion.span
            aria-hidden
            className="shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full border flex items-center justify-center"
            animate={{
              rotate: open ? 45 : 0,
              borderColor: open ? 'rgba(206, 248, 78, 0.55)' : 'rgba(148, 163, 184, 0.28)',
              backgroundColor: open ? 'rgba(206, 248, 78, 0.12)' : 'transparent',
              color: open ? '#CEF84E' : '#94a3b8',
            }}
            transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 26, mass: 0.6 }}
          >
            <Plus className="w-4 h-4" />
          </motion.span>
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            key="content"
            initial={reduce ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={reduce ? { opacity: 0, height: 0 } : { opacity: 0, height: 0 }}
            transition={
              reduce
                ? { duration: 0 }
                : {
                    height: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
                    opacity: { duration: 0.25, ease: 'easeOut' },
                  }
            }
            style={{ overflow: 'hidden' }}
            className="relative"
          >
            <div className="px-4 pb-5 md:px-6 md:pb-7">
              <div className="pl-[3.25rem] md:pl-[4.25rem] pt-1">
                {category.rows && (
                  <ul>
                    {category.rows.map((row) => (
                      <PriceLine key={row.name} row={row} />
                    ))}
                  </ul>
                )}

                {category.groups && (
                  <div className="space-y-5 pt-2">
                    {category.groups.map((group) => (
                      <div key={group.label}>
                        <div className="text-[11px] uppercase tracking-[0.14em] text-primary-ink dark:text-primary font-semibold mb-2.5">
                          {group.label}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {group.items.map((item) => (
                            <span
                              key={item}
                              className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs text-foreground/90"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {category.partners && (
                  <p className="mt-4 text-xs text-muted-foreground">
                    Partners:{' '}
                    <span className="text-foreground dark:text-primary font-medium">
                      {category.partners}
                    </span>
                  </p>
                )}

                {category.notes?.map((note) => (
                  <p key={note} className="mt-3 text-xs italic text-muted-foreground leading-relaxed">
                    {note}
                  </p>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
