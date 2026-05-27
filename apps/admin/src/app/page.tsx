"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  ArrowRight,
  Moon,
  Sun,
  Lock,
  Check,
  MessageCircle,
  Mail,
  Sparkles,
  ShoppingBag,
  Globe,
  Wrench,
  TrendingUp,
  Server,
  Clock,
  MapPin,
  HandshakeIcon,
  ShieldCheck,
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
} from 'lucide-react';
import ScalaLogo from '@/components/ui/ScalaLogo';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Local presentational helpers — only used on this landing page. If any of
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
    <div
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
    </div>
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
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border bg-card p-7 transition-colors',
        featured
          ? 'border-primary/70 shadow-[0_10px_40px_-12px_rgba(206,248,78,0.35)]'
          : 'border-border hover:border-foreground/15'
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
    </div>
  );
}

interface PillarCardProps {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}

function PillarCard({ icon, eyebrow, title, description }: PillarCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-7 hover:border-foreground/15 transition-colors h-full">
      <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-zinc-900 dark:text-primary mb-5">
        {icon}
      </div>
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-medium mb-1.5">
        {eyebrow}
      </p>
      <h3 className="text-lg font-semibold tracking-tight text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LandingPage() {
  const [isDark, setIsDark] = useState(true);
  const [activeBuild, setActiveBuild] = useState<'websites' | 'ecommerce' | 'internal'>('websites');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      setIsDark(false);
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark');
    } else {
      setIsDark(true);
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-300 overflow-x-hidden">
      {/* Single subtle ambient glow — kept calm so it reads premium, not gamer. */}
      <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-primary/10 blur-[140px] pointer-events-none" />

      {/* ============================== NAV ============================== */}
      <header className="glass-strong sticky top-0 z-50 w-full">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <ScalaLogo variant="full" className="h-7" />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#services" className="hover:text-foreground transition-colors">Services</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-border bg-card/60 text-muted-foreground hover:text-foreground transition-colors active-press"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card/60 text-foreground text-sm font-medium hover:bg-muted/40 transition-colors active-press"
            >
              <Lock className="w-3.5 h-3.5" />
              Client Login
            </Link>
          </div>
        </div>
      </header>

      {/* ============================== HERO ============================== */}
      <section className="relative px-6 pt-24 pb-24 md:pt-36 md:pb-32 mx-auto max-w-7xl">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="glass inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs text-muted-foreground mb-8 animate-fade-up stagger-1">
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
            Based in Indonesia. Built for businesses that want to grow.
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight max-w-4xl leading-[1.08] text-foreground animate-fade-up stagger-2">
            Software built to{' '}
            <span className="relative inline-block">
              <span className="relative z-10">scale</span>
              <span className="absolute inset-x-0 bottom-1 h-3 bg-primary/70 -z-0 rounded-sm" />
            </span>{' '}
            your business.
          </h1>

          <p className="mt-7 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed animate-fade-up stagger-3">
            Websites, stores, and internal tools — built to grow with you.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 w-full sm:w-auto animate-fade-up stagger-4">
            <a
              href="#pricing"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-zinc-900 font-medium text-sm transition-colors hover:bg-primary/90 active-press"
            >
              See pricing
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="https://wa.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border bg-card/60 text-foreground font-medium text-sm transition-colors hover:bg-muted/40 active-press"
            >
              <MessageCircle className="w-4 h-4" />
              Talk to us
            </a>
          </div>

          {/* Trust strip — subtle, no fake logos. */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground animate-fade-up stagger-5">
            <span className="inline-flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" /> Jakarta-based team
            </span>
            <span className="hidden sm:inline text-border">·</span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5" /> Fixed quotes, no surprises
            </span>
            <span className="hidden sm:inline text-border">·</span>
            <span className="inline-flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> Fast local response
            </span>
          </div>
        </div>
      </section>

      {/* ============================== WHAT WE DO ============================== */}
      <section id="services" className="relative px-6 py-24 border-t border-border/60">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl mb-14">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-medium mb-3">
              What we do
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              Three simple ways we help.
            </h2>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              Most of our work falls into one of these buckets. You can start with one and add others
              later — there&apos;s no lock-in and no surprise bills.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <div className="animate-fade-up stagger-1">
              <PillarCard
                icon={<Wrench className="w-5 h-5" />}
                eyebrow="Build"
                title="We make it"
                description="Company websites, online stores, and internal tools that handle the day-to-day work for your team."
              />
            </div>
            <div className="animate-fade-up stagger-2">
              <PillarCard
                icon={<TrendingUp className="w-5 h-5" />}
                eyebrow="Grow"
                title="We bring customers"
                description="SEO, email marketing, and AI automation so people find you, hear from you, and buy more often."
              />
            </div>
            <div className="animate-fade-up stagger-3">
              <PillarCard
                icon={<Server className="w-5 h-5" />}
                eyebrow="Run"
                title="We keep it working"
                description="Hosting, business email, security, and ongoing care so your site stays fast, safe, and up to date."
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============================== PRICING ============================== */}
      <section id="pricing" className="relative px-6 py-24 border-t border-border/60 bg-card/30">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl mb-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-medium mb-3">
              Pricing
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              Honest prices. No surprises.
            </h2>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              Every price below is a starting point. After a short discovery call we agree on a fixed
              quote so you know exactly what you&apos;re paying — before any work begins.
            </p>
          </div>

          {/* How pricing works — inline note */}
          <div className="mt-8 mb-20 inline-flex items-start gap-3 rounded-xl border border-border bg-background/60 px-4 py-3 text-xs text-muted-foreground max-w-2xl">
            <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0 text-foreground" />
            <span className="leading-relaxed">
              All amounts are in IDR. Timelines start once we have your brand assets and content.
              Revisions are bundled into each tier — extras are billed at our hourly rate.
            </span>
          </div>

          {/* ----------------------- BUILD ----------------------- */}
          <div className="mb-24">
            <div className="flex items-end justify-between mb-10 flex-wrap gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="w-4 h-4 text-muted-foreground" />
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-medium">
                    Build
                  </p>
                </div>
                <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                  Build the thing
                </h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-xl">
                  One-time projects to launch a website, online store, or custom internal tool.
                </p>
              </div>

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
              <div className="grid md:grid-cols-3 gap-5">
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
              </div>
            )}

            {activeBuild === 'ecommerce' && (
              <div className="grid md:grid-cols-3 gap-5">
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
              </div>
            )}

            {activeBuild === 'internal' && (
              <div className="grid md:grid-cols-3 gap-5">
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
              </div>
            )}
          </div>

          {/* ----------------------- GROW ----------------------- */}
          <div className="mb-24">
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-medium">
                  Grow
                </p>
              </div>
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                Bring in more customers
              </h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-xl">
                Add-ons and monthly services that help people find you, hear from you, and buy more often.
              </p>
            </div>

            {/* SEO & Marketing à la carte */}
            <div className="rounded-2xl border border-border bg-card p-7 mb-8">
              <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h4 className="text-base font-semibold tracking-tight text-foreground">
                    SEO & Marketing
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Pick what you need. We can also bundle these into a monthly plan.
                  </p>
                </div>
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
            </div>

            {/* AI & Automation cards */}
            <div>
              <div className="mb-5 flex items-end justify-between flex-wrap gap-3">
                <div>
                  <h4 className="text-base font-semibold tracking-tight text-foreground">
                    AI & Automation
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground max-w-md">
                    Small, practical tools that save your team hours every week.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-5">
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
              </div>
            </div>
          </div>

          {/* ----------------------- RUN ----------------------- */}
          <div>
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-2">
                <Server className="w-4 h-4 text-muted-foreground" />
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-medium">
                  Run
                </p>
              </div>
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                Keep it running smoothly
              </h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-xl">
                Hosting, email, security, and ongoing support — so you never have to wonder if your site is still working.
              </p>
            </div>

            {/* Infrastructure rows */}
            <div className="rounded-2xl border border-border bg-card p-7 mb-8">
              <div className="mb-5">
                <h4 className="text-base font-semibold tracking-tight text-foreground">
                  Infrastructure
                </h4>
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
            </div>

            {/* Ongoing Support tiers */}
            <div>
              <div className="mb-5">
                <h4 className="text-base font-semibold tracking-tight text-foreground">
                  Ongoing Support
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  A monthly plan so you always have someone to call when things change.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-5">
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
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================== WHY SCALA ============================== */}
      <section id="why" className="relative px-6 py-24 border-t border-border/60">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl mb-14">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-medium mb-3">
              Why Scala
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              We&apos;re a team you can actually talk to.
            </h2>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              Big agencies disappear after launch. Freelancers vanish when life gets busy. We sit
              somewhere in between — small enough to care, structured enough to stick around.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="animate-fade-up stagger-1">
              <PillarCard
                icon={<MapPin className="w-5 h-5" />}
                eyebrow="01"
                title="Local team, fast response"
                description="Based in Jakarta. We answer messages in your timezone, in Bahasa or English."
              />
            </div>
            <div className="animate-fade-up stagger-2">
              <PillarCard
                icon={<ShieldCheck className="w-5 h-5" />}
                eyebrow="02"
                title="Fixed quotes, no surprises"
                description="One number, agreed upfront. If the scope grows, we agree on the price before we start."
              />
            </div>
            <div className="animate-fade-up stagger-3">
              <PillarCard
                icon={<HandshakeIcon className="w-5 h-5" />}
                eyebrow="03"
                title="We stick around after launch"
                description="Most of our work is for clients we've worked with for over a year. We're in it for the long run."
              />
            </div>
            <div className="animate-fade-up stagger-4">
              <PillarCard
                icon={<Sparkles className="w-5 h-5" />}
                eyebrow="04"
                title="Plain language, always"
                description="No jargon. We'll explain what we're doing, why it matters, and what it costs."
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============================== CTA BAND ============================== */}
      <section id="contact" className="relative px-6 py-24 border-t border-border/60">
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
                Tell us what you&apos;re building. We&apos;ll send a fixed quote within 48 hours — no sales
                pressure, no obligation.
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

      {/* ============================== FOOTER ============================== */}
      <footer className="px-6 py-12 border-t border-border/60 bg-card/30">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <ScalaLogo variant="mark-only" className="h-6" />
            <div className="text-sm">
              <div className="font-medium text-foreground">Scala</div>
              <div className="text-xs text-muted-foreground">Software that helps you scale.</div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Scala Solutions. All rights reserved.
          </div>

          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <a href="#services" className="hover:text-foreground transition-colors">Services</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
            <Link href="/login" className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
              <Lock className="w-3 h-3" /> Client Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
