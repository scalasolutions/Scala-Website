"use client";

import { useState } from 'react';
import {
  Check,
  Clock,
  Sparkles,
  ShoppingBag,
  Globe,
  Wrench,
  TrendingUp,
  Server,
  Bot,
  HardDrive,
  AtSign,
  KeyRound,
  Mailbox,
  FileText,
  PackageSearch,
  LineChart,
  MessageSquare,
  Headphones,
  Mail,
} from 'lucide-react';
import PublicNav from '@/app/(public)/components/PublicNav';
import PublicFooter from '@/app/(public)/components/PublicFooter';
import LetsTalkBand from '@/app/(public)/components/LetsTalkBand';
import { Reveal, RevealItem } from '@/app/(public)/components/ui/Reveal';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Local presentational helpers — only used on the services page. If any of
// these get reused elsewhere they should graduate to src/components/ui/.
// ---------------------------------------------------------------------------

interface TierCardProps {
  name: string;
  price: string;
  blurb: string;
  bullets: string[];
  meta?: string;
  featured?: boolean;
  badge?: string;
}

function TierCard({ name, price, blurb, bullets, meta, featured, badge }: TierCardProps) {
  return (
    <RevealItem
      className={cn(
        'relative flex flex-col rounded-2xl p-7 transition-colors',
        featured
          ? 'border border-primary/70 bg-card shadow-[0_10px_40px_-12px_rgba(206,248,78,0.35)]'
          : 'glass hover:border-foreground/20'
      )}
    >
      {badge && (
        <div className="absolute -top-3 left-7">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold tracking-wide text-zinc-900">
            {badge}
          </span>
        </div>
      )}

      <div className="mb-5">
        <h4 className="text-base font-semibold tracking-tight text-foreground">{name}</h4>
        <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{blurb}</p>
      </div>

      <div className="mb-6">
        <div className="text-2xl font-semibold tracking-tight text-foreground">{price}</div>
        {meta && (
          <div className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            {meta}
          </div>
        )}
      </div>

      <ul className="space-y-2.5 text-sm text-foreground/90 mb-6 flex-1">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2.5">
            <Check
              className={cn(
                'w-4 h-4 mt-0.5 shrink-0',
                featured ? 'text-foreground' : 'text-muted-foreground'
              )}
            />
            <span className="leading-relaxed">{b}</span>
          </li>
        ))}
      </ul>

      <a
        href="#contact"
        className={cn(
          'mt-auto inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors active-press',
          featured
            ? 'bg-primary text-zinc-900 hover:bg-primary/90'
            : 'border border-border bg-card text-foreground hover:bg-muted/40'
        )}
      >
        Get a quote
      </a>
    </RevealItem>
  );
}

interface AddOnRowProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  price: string;
  meta?: string;
}

function AddOnRow({ icon, title, description, price, meta }: AddOnRowProps) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-border last:border-0">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {icon && (
          <span className="shrink-0 w-9 h-9 rounded-lg bg-muted/50 text-muted-foreground border border-border flex items-center justify-center mt-0.5">
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground">{title}</div>
          {description && (
            <div className="mt-1 text-xs text-muted-foreground leading-relaxed">{description}</div>
          )}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-semibold text-foreground tabular-nums">{price}</div>
        {meta && <div className="mt-0.5 text-[11px] text-muted-foreground">{meta}</div>}
      </div>
    </div>
  );
}

interface AutomationCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  price: string;
  meta?: string;
  bullets: string[];
  featured?: boolean;
  badge?: string;
}

function AutomationCard({
  icon,
  title,
  description,
  price,
  meta,
  bullets,
  featured,
  badge,
}: AutomationCardProps) {
  return (
    <RevealItem
      className={cn(
        'relative flex flex-col rounded-2xl p-7 transition-colors',
        featured
          ? 'border border-primary/70 bg-card shadow-[0_10px_40px_-12px_rgba(206,248,78,0.35)]'
          : 'glass hover:border-foreground/20'
      )}
    >
      {badge && (
        <div className="absolute -top-3 left-7">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold tracking-wide text-zinc-900">
            {badge}
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 mb-2">
            <span
              className={cn(
                'shrink-0 w-9 h-9 rounded-lg flex items-center justify-center border',
                featured
                  ? 'bg-primary/15 text-foreground border-primary/30'
                  : 'bg-muted/50 text-muted-foreground border-border'
              )}
            >
              {icon}
            </span>
            <h4 className="text-base font-semibold tracking-tight text-foreground">{title}</h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>

      <div className="mb-5">
        <div className="text-2xl font-semibold tracking-tight text-foreground">{price}</div>
        {meta && <div className="mt-1 text-[11px] text-muted-foreground">{meta}</div>}
      </div>

      <ul className="space-y-2 text-sm text-foreground/90 flex-1">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2.5">
            <Check
              className={cn(
                'w-3.5 h-3.5 mt-1 shrink-0',
                featured ? 'text-foreground' : 'text-muted-foreground'
              )}
            />
            <span className="leading-relaxed text-xs">{b}</span>
          </li>
        ))}
      </ul>
    </RevealItem>
  );
}

interface SectionLeadProps {
  eyebrow: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

/**
 * Airy section lead — tiny lime eyebrow, icon row, big tight heading,
 * width-constrained sub. Used to open each top-level pricing band.
 */
function SectionLead({ eyebrow, icon, title, description }: SectionLeadProps) {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="text-foreground dark:text-primary">{icon}</span>
        <p className="text-[11px] uppercase tracking-[0.16em] text-primary font-medium">
          {eyebrow}
        </p>
      </div>
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground leading-tight">
        {title}
      </h2>
      <p className="mt-5 text-base text-muted-foreground max-w-xl leading-relaxed">
        {description}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ServicesPage() {
  const [activeBuild, setActiveBuild] = useState<'websites' | 'ecommerce' | 'internal'>('websites');

  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-300 overflow-x-hidden">
      {/* Hero ambient glow — same calm treatment as the landing page */}
      <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-primary/10 blur-[140px] pointer-events-none" />

      <PublicNav
        links={[
          { href: '/', label: 'Home' },
          { href: '#pricing', label: 'Pricing' },
          { href: '#contact', label: 'Contact' },
        ]}
      />

      {/* ============================== HERO ============================== */}
      <section className="relative px-6 pt-24 pb-16 md:pt-32 md:pb-20 mx-auto max-w-7xl">
        <Reveal className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.16em] text-primary font-medium mb-3">
            Pricing
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-foreground leading-[1.08]">
            Honest, transparent pricing.
          </h1>
          <p className="mt-7 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Every price below is a starting point. After a short discovery call we agree on a fixed
            quote so you know exactly what you&apos;re paying — before any work begins.
          </p>

          {/* How pricing works — inline note */}
          <div className="glass mt-9 inline-flex items-start gap-3 rounded-xl px-4 py-3 text-xs text-muted-foreground max-w-2xl">
            <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0 text-foreground" />
            <span className="leading-relaxed">
              All amounts are in IDR. Timelines start once we have your brand assets and content.
              Revisions are bundled into each tier — extras are billed at our hourly rate.
            </span>
          </div>
        </Reveal>
      </section>

      {/* ============================== BUILD ============================== */}
      <section
        id="pricing"
        className="relative px-6 py-24 md:py-28 border-t border-border/60"
      >
        <div className="absolute top-1/3 left-[-10%] w-[600px] h-[500px] rounded-full bg-primary/[0.06] blur-[140px] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl">
          <div className="flex items-end justify-between mb-14 flex-wrap gap-6">
            <SectionLead
              eyebrow="Build"
              icon={<Wrench className="w-4 h-4" />}
              title="Build the thing."
              description="One-time projects to launch a website, online store, or custom internal tool."
            />

            {/* Build tabs */}
            <div className="inline-flex rounded-xl border border-border bg-background/60 p-1 text-xs">
              {[
                { id: 'websites', label: 'Websites', icon: <Globe className="w-3.5 h-3.5" /> },
                { id: 'ecommerce', label: 'E-Commerce', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
                { id: 'internal', label: 'Internal Tools', icon: <Wrench className="w-3.5 h-3.5" /> },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveBuild(t.id as typeof activeBuild)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors active-press',
                    activeBuild === t.id
                      ? 'bg-primary text-zinc-900'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {activeBuild === 'websites' && (
            <Reveal stagger={0.07} className="grid md:grid-cols-3 gap-5">
              <TierCard
                name="Starter Presence"
                price="Rp 5.000.000"
                blurb="A clean, professional one-page site to put your business online."
                meta="~2–3 weeks · 2 rounds of revisions"
                bullets={[
                  'Single landing page',
                  'Mobile responsive design',
                  'Contact form & WhatsApp link',
                  'Basic SEO setup',
                  'Hosting setup (first month free)',
                ]}
              />
              <TierCard
                name="Business Website"
                price="Rp 10.000.000"
                blurb="A multi-page site for established businesses ready to grow online."
                meta="~3–5 weeks · 3 rounds of revisions"
                featured
                badge="Most popular"
                bullets={[
                  'Up to 8 pages (About, Services, etc.)',
                  'Custom design tailored to your brand',
                  'Blog or news section',
                  'Google Analytics & Search Console',
                  'WhatsApp & email enquiry routing',
                  'Performance & accessibility tuning',
                ]}
              />
              <TierCard
                name="Premium Experience"
                price="Rp 20.000.000"
                blurb="A fully bespoke website for brands that need standout design and custom features."
                meta="~6–10 weeks · scoped revisions"
                bullets={[
                  'Fully custom design system',
                  'Booking, member areas, or calculators',
                  'CMS so your team can edit content',
                  'Multi-language (Bahasa + English)',
                  'Full SEO & analytics setup',
                ]}
              />
            </Reveal>
          )}

          {activeBuild === 'ecommerce' && (
            <Reveal stagger={0.07} className="grid md:grid-cols-3 gap-5">
              <TierCard
                name="Catalog Store"
                price="Rp 12.000.000"
                blurb="Get selling online quickly with a tidy storefront and local payment options."
                meta="~3–4 weeks · 2 rounds of revisions"
                bullets={[
                  'Up to 30 products',
                  'Indonesian payment gateways (Midtrans/Xendit)',
                  'Cash on delivery & bank transfer',
                  'Order notifications via WhatsApp',
                  'Basic shipping integration',
                ]}
              />
              <TierCard
                name="Full E-Commerce"
                price="Rp 25.000.000"
                blurb="A polished store built to scale, with smarter checkout and operations."
                meta="~5–7 weeks · 3 rounds of revisions"
                featured
                badge="Most popular"
                bullets={[
                  'Unlimited products & categories',
                  'Discount codes, vouchers, bundles',
                  'Multi-courier shipping (JNE, J&T, etc.)',
                  'Customer accounts & order history',
                  'Inventory & low-stock alerts',
                  'Sales dashboard for your team',
                ]}
              />
              <TierCard
                name="Commerce Ecosystem"
                price="Rp 60.000.000"
                blurb="Multi-vendor or subscription stores with custom logic and integrations."
                meta="~8–12 weeks · phased delivery"
                bullets={[
                  'Multi-vendor or subscription billing',
                  'Custom checkout flows',
                  'Loyalty programs & memberships',
                  'POS or warehouse integrations',
                  'Dedicated technical lead',
                ]}
              />
            </Reveal>
          )}

          {activeBuild === 'internal' && (
            <Reveal stagger={0.07} className="grid md:grid-cols-3 gap-5">
              <TierCard
                name="Admin Dashboard"
                price="Rp 6.000.000"
                blurb="Replace a messy spreadsheet with a clean web app your team will actually use."
                meta="~3–4 weeks · 2 rounds of revisions"
                bullets={[
                  'Login & role-based access',
                  'Custom forms & lists',
                  'Export to Excel / PDF',
                  'Email or WhatsApp notifications',
                  'Hosted on secure cloud',
                ]}
              />
              <TierCard
                name="Operational System"
                price="Rp 15.000.000"
                blurb="A central tool for orders, clients, or stock — built around how your team works."
                meta="~5–7 weeks · 3 rounds of revisions"
                featured
                badge="Best value"
                bullets={[
                  'Multiple modules (CRM, orders, inventory)',
                  'Dashboards & reporting',
                  'Integrations (WhatsApp, accounting, etc.)',
                  'Training session for your team',
                  'First 3 months of support included',
                ]}
              />
              <TierCard
                name="Custom System / ERP"
                price="Rp 50.000.000"
                blurb="A full custom platform for complex operations or product workflows."
                meta="~3–6 months · phased delivery"
                bullets={[
                  'Dedicated product & engineering team',
                  'Custom integrations with your tools',
                  'Audit-ready security & permissions',
                  'On-site or remote rollout',
                  'Long-term roadmap partnership',
                ]}
              />
            </Reveal>
          )}
        </div>
      </section>

      {/* ============================== GROW ============================== */}
      <section className="relative px-6 py-24 md:py-28 border-t border-border/60">
        <div className="absolute top-1/4 right-[-10%] w-[600px] h-[500px] rounded-full bg-primary/[0.05] blur-[140px] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl">
          <Reveal>
            <SectionLead
              eyebrow="Grow"
              icon={<TrendingUp className="w-4 h-4" />}
              title="Bring in more customers."
              description="Add-ons and monthly services that help people find you, hear from you, and buy more often."
            />
          </Reveal>

          {/* SEO & Marketing à la carte */}
          <Reveal className="mt-14 rounded-2xl border border-border bg-card p-7">
            <div className="mb-5">
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                SEO &amp; Marketing
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Pick what you need. We can also bundle these into a monthly plan.
              </p>
            </div>
            <div>
              <AddOnRow
                icon={<LineChart className="w-4 h-4" />}
                title="SEO Foundation Setup"
                description="Technical audit, on-page fixes, sitemap, and analytics. The base that everything else builds on."
                price="From Rp 2.000.000"
                meta="one-time"
              />
              <AddOnRow
                icon={<TrendingUp className="w-4 h-4" />}
                title="Monthly SEO Growth"
                description="Ongoing content, link building, and reporting. Cancel anytime."
                price="From Rp 2.000.000 / mo"
                meta="3-month minimum"
              />
              <AddOnRow
                icon={<Mailbox className="w-4 h-4" />}
                title="Email Marketing Setup"
                description="Templates, automations, and list setup on your preferred platform."
                price="From Rp 2.000.000"
                meta="one-time"
              />
              <AddOnRow
                icon={<Mail className="w-4 h-4" />}
                title="Monthly Email Marketing"
                description="Newsletter writing, design, and scheduling — handled for you."
                price="From Rp 1.000.000 / mo"
                meta="month-to-month"
              />
              <AddOnRow
                icon={<FileText className="w-4 h-4" />}
                title="SEO Article Writing"
                description="SEO-friendly articles in Bahasa or English, written and optimized."
                price="Rp 300.000"
                meta="per article"
              />
              <AddOnRow
                icon={<PackageSearch className="w-4 h-4" />}
                title="Product Upload Service"
                description="We handle the tedious work of getting your catalog online — photos, titles, and copy."
                price="Rp 5.000"
                meta="per SKU"
              />
            </div>
          </Reveal>

          {/* AI & Automation cards */}
          <div className="mt-10">
            <Reveal className="mb-5">
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                AI &amp; Automation
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-md">
                Small, practical tools that save your team hours every week.
              </p>
            </Reveal>

            <Reveal stagger={0.07} className="grid md:grid-cols-3 gap-5">
              <AutomationCard
                icon={<MessageSquare className="w-4 h-4" />}
                title="AI Chatbot Setup"
                description="A friendly chat widget trained on your products, FAQs, and policies — live on your site."
                price="Rp 8.000.000"
                meta="one-time setup"
                bullets={[
                  'Custom-trained on your content',
                  'Bahasa + English support',
                  'Lead capture & email routing',
                  'Hosted & maintained for you',
                ]}
              />
              <AutomationCard
                icon={<Bot className="w-4 h-4" />}
                title="WhatsApp Automation"
                description="Auto-replies to common questions, books appointments, and hands off to a human when needed."
                price="Rp 3.000.000"
                meta="one-time setup"
                featured
                badge="Recommended"
                bullets={[
                  'WhatsApp Business API setup',
                  'Templated quick replies',
                  'Appointment booking flow',
                  'Hand-off to a real person on tricky questions',
                ]}
              />
              <AutomationCard
                icon={<Headphones className="w-4 h-4" />}
                title="AI Support System"
                description="A full customer support assistant trained on your business — across web, WhatsApp, and email."
                price="Rp 25.000.000"
                meta="one-time · monthly retainer optional"
                bullets={[
                  'Multi-channel (web, WhatsApp, email)',
                  'Connected to your order or CRM data',
                  'Conversation analytics & insights',
                  'Continuous training & tuning',
                ]}
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================== RUN ============================== */}
      <section className="relative px-6 py-24 md:py-28 border-t border-border/60">
        <div className="absolute top-1/3 left-[-10%] w-[600px] h-[500px] rounded-full bg-primary/[0.05] blur-[140px] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl">
          <Reveal>
            <SectionLead
              eyebrow="Run"
              icon={<Server className="w-4 h-4" />}
              title="Keep it running smoothly."
              description="Hosting, email, security, and ongoing support — so you never have to wonder if your site is still working."
            />
          </Reveal>

          {/* Infrastructure rows */}
          <Reveal className="mt-14 rounded-2xl border border-border bg-card p-7">
            <div className="mb-5">
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                Infrastructure
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Reliable, fast hosting with no hidden bills. We handle the technical bits.
              </p>
            </div>
            <div>
              <AddOnRow
                icon={<Server className="w-4 h-4" />}
                title="Managed Hosting"
                description="Fast, secure hosting tuned for your site. Includes SSL, backups, and uptime monitoring."
                price="From Rp 300.000 / mo"
                meta="month-to-month"
              />
              <AddOnRow
                icon={<AtSign className="w-4 h-4" />}
                title="Business Email"
                description="Professional inboxes on your own domain (you@yourbusiness.com), with calendar and contacts."
                price="From Rp 20.000 / user / mo"
                meta="billed monthly"
              />
              <AddOnRow
                icon={<HardDrive className="w-4 h-4" />}
                title="Cloud Storage"
                description="Reliable storage for product photos, documents, and customer files."
                price="Usage-based"
                meta="from Rp 50 / GB / mo"
              />
              <AddOnRow
                icon={<KeyRound className="w-4 h-4" />}
                title="Security & 2FA Setup"
                description="Two-factor authentication, password hygiene review, and access audit for your team."
                price="From Rp 1.500.000"
                meta="one-time"
              />
            </div>
          </Reveal>

          {/* Ongoing Support tiers */}
          <div className="mt-10">
            <Reveal className="mb-5">
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                Ongoing Support
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                A monthly plan so you always have someone to call when things change.
              </p>
            </Reveal>

            <Reveal stagger={0.07} className="grid md:grid-cols-3 gap-5">
              <TierCard
                name="Essential Care"
                price="Rp 500.000 / mo"
                blurb="The basics — updates, backups, and a place to ask questions."
                meta="month-to-month"
                bullets={[
                  'Software & security updates',
                  'Weekly backups',
                  'Up to 1 hour of small changes / month',
                  'Email support (next business day)',
                ]}
              />
              <TierCard
                name="Growth Support"
                price="Rp 1.500.000 / mo"
                blurb="For sites that are part of your daily business and need quicker help."
                meta="month-to-month"
                featured
                badge="Recommended"
                bullets={[
                  'Everything in Essential Care',
                  'Up to 4 hours of changes / month',
                  'Same-day response (business hours)',
                  'Monthly performance & SEO report',
                  'WhatsApp support channel',
                ]}
              />
              <TierCard
                name="Digital Partnership"
                price="Rp 5.000.000 / mo"
                blurb="For growing businesses — we act as your part-time tech team."
                meta="3-month minimum"
                bullets={[
                  'Everything in Growth Support',
                  'Up to 12 hours of work / month',
                  'Priority response within 2 hours',
                  'Quarterly strategy & roadmap session',
                  'Dedicated point of contact',
                ]}
              />
            </Reveal>
          </div>
        </div>
      </section>

      <Reveal>
        <LetsTalkBand />
      </Reveal>

      <PublicFooter />
    </div>
  );
}
