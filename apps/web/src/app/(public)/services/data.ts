import {
  LayoutTemplate,
  ShoppingBag,
  MonitorSmartphone,
  ServerCog,
  Palette,
  Megaphone,
  BrainCircuit,
  PlusCircle,
  Globe,
  Server,
  TrendingUp,
  Bot,
  Blocks,
  type LucideProps,
} from 'lucide-react';
import type { ComponentType } from 'react';

/* ---------------------------------------------------------------------------
 * Single source of truth for the services catalog. Both the overview at
 * `/services` and the per-group pages at `/services/[group]` read from this
 * file. Prices are always *starting points* (every hard price ends with "+").
 * Brand rule: identity per group comes from its icon and typography only —
 * never a second color, always lime accent.
 * ------------------------------------------------------------------------- */

export type Icon = ComponentType<LucideProps>;

export interface PriceRow {
  name: string;
  price: string;
  detail?: string;
  specs?: string[];
}

export interface AddOnGroup {
  label: string;
  items: string[];
}

export interface Category {
  num: string;
  groupId: string;
  icon: Icon;
  title: string;
  tagline: string;
  hint: string;
  rows?: PriceRow[];
  groups?: AddOnGroup[];
  notes?: string[];
  partners?: string;
}

export interface SolutionGroup {
  id: string;
  pill: string;
  eyebrow: string;
  title: string;
  blurb: string;
  /** Short copy used on the overview card. */
  cardBlurb: string;
  /** Quiet price signal shown on the overview card. */
  hint: string;
  icon: Icon;
}

export const solutionGroups: SolutionGroup[] = [
  {
    id: 'web',
    pill: 'Web',
    eyebrow: 'Web Solutions',
    title: 'Web Solutions',
    blurb: 'Websites, stores, and apps engineered to grow with you — not just launch day.',
    cardBlurb: 'For small businesses, startups, and growing brands.',
    hint: 'From Rp 5jt+',
    icon: Globe,
  },
  {
    id: 'care',
    pill: 'Hosting',
    eyebrow: 'Hosting & Care',
    title: 'Hosting & Care',
    blurb: 'Hosting, monitoring, and maintenance so your site never quietly breaks.',
    cardBlurb: 'For live sites that need monitoring and updates.',
    hint: 'From Rp 150k+ / mo',
    icon: Server,
  },
  {
    id: 'design',
    pill: 'Design',
    eyebrow: 'Design',
    title: 'Design',
    blurb: 'Brand systems, sales decks, and UI that make you look premium everywhere.',
    cardBlurb: 'For founders and brands ready to look the part.',
    hint: 'From Rp 2.5jt+',
    icon: Palette,
  },
  {
    id: 'growth',
    pill: 'Growth',
    eyebrow: 'Growth',
    title: 'Growth',
    blurb: 'Marketing run through our trusted partner network — content to performance.',
    cardBlurb: 'For brands ready to scale reach and revenue.',
    hint: 'Partner quote',
    icon: TrendingUp,
  },
  {
    id: 'ai',
    pill: 'AI',
    eyebrow: 'AI',
    title: 'AI',
    blurb: 'Practical automation and AI that save your team hours every single week.',
    cardBlurb: 'For ops, support, and content teams drowning in repetition.',
    hint: 'From Rp 7.5jt+',
    icon: Bot,
  },
  {
    id: 'addons',
    pill: 'Add-Ons',
    eyebrow: 'Add-Ons',
    title: 'Add-Ons',
    blurb: 'Extras you can layer onto any project — scoped and quoted separately.',
    cardBlurb: 'For extending an existing Scala project.',
    hint: 'Quoted',
    icon: Blocks,
  },
];

export const categories: Category[] = [
  {
    num: '01',
    groupId: 'web',
    icon: LayoutTemplate,
    title: 'Websites',
    tagline: 'Fast, scalable websites built to grow with you.',
    hint: 'From Rp 5jt+',
    rows: [
      {
        name: 'Template Site',
        price: 'Rp 5jt+',
        detail: 'Shopify / WordPress setup',
        specs: ['Up to 3 pages', '1 revision round', '~1–2 weeks', 'Mobile-ready', 'Basic SEO'],
      },
      {
        name: 'Starter Website',
        price: 'Rp 10jt+',
        detail: 'Company profile or landing page',
        specs: ['Up to 5 pages', '2 revision rounds', '~2–3 weeks', 'Contact + WhatsApp', 'Google Analytics'],
      },
      {
        name: 'Business Website',
        price: 'Rp 20jt+',
        detail: 'CMS, stronger structure, more pages',
        specs: ['Up to 10 pages', '3 revision rounds', 'CMS + blog', '~4–5 weeks', 'SEO foundation'],
      },
      {
        name: 'Premium Website',
        price: 'Rp 35jt+',
        detail: 'Custom brand experience, scalable',
        specs: ['Unlimited pages', 'Unlimited revisions', 'Custom design system', '~6–10 weeks', 'Multi-language ready'],
      },
    ],
  },
  {
    num: '02',
    groupId: 'web',
    icon: ShoppingBag,
    title: 'E-Commerce',
    tagline: 'Online stores that actually sell.',
    hint: 'From Rp 12jt+',
    rows: [
      {
        name: 'Catalog Store',
        price: 'Rp 12jt+',
        detail: 'Shopify / WooCommerce / Custom',
        specs: ['Up to 100 SKUs', '2GB storage', '2 revision rounds', 'Local payments + COD', 'WhatsApp order alerts'],
      },
      {
        name: 'Full E-Commerce',
        price: 'Rp 25jt+',
        detail: 'Checkout, payments, shipping, accounts',
        specs: ['Up to 500 SKUs', '10GB storage', '3 revision rounds', 'Multi-courier shipping', 'Customer accounts', 'Sales dashboard'],
      },
      {
        name: 'Commerce Ecosystem',
        price: 'Rp 60jt+',
        detail: 'Loyalty, ERP/CRM, warehouse, automation',
        specs: ['Up to 2,500 SKUs', '30GB storage', 'Loyalty + memberships', 'ERP / CRM sync', 'Warehouse + automation'],
      },
      {
        name: 'Enterprise',
        price: 'Custom',
        detail: 'For high-volume, multi-channel operations',
        specs: ['Unlimited SKUs', '100GB+ storage', 'Dedicated tech lead', 'Custom integrations', 'Phased delivery'],
      },
    ],
    notes: ['Overage: Rp 500 / SKU / mo · Rp 50k / GB / mo'],
  },
  {
    num: '03',
    groupId: 'web',
    icon: MonitorSmartphone,
    title: 'Apps & Portals',
    tagline: 'Beyond websites — customer portals, internal systems, mobile apps.',
    hint: 'From Rp 35jt+',
    rows: [
      { name: 'Web App / Portal', price: 'Rp 35jt+', specs: ['Role-based logins', 'Custom dashboards', '~6–10 weeks', 'API integrations', 'Hosted & maintained'] },
      { name: 'Mobile App MVP', price: 'Rp 50jt+', specs: ['iOS + Android', 'Core feature set', '~8–12 weeks', 'Push notifications', 'App store launch'] },
      { name: 'Booking / Loyalty App', price: 'Rp 75jt+', specs: ['Bookings + payments', 'Points & rewards', 'Customer profiles', 'Admin dashboard', 'Analytics'] },
      { name: 'Marketplace Platform', price: 'Custom', specs: ['Multi-vendor', 'Vendor payouts', 'Ratings & reviews', 'Custom logic'] },
      { name: 'Custom Business App', price: 'Custom', specs: ['Scoped to your workflow', 'Dedicated team', 'Long-term roadmap'] },
    ],
    notes: ['Every app needs a custom quote — flows, roles & integrations vary.'],
  },
  {
    num: '04',
    groupId: 'care',
    icon: ServerCog,
    title: 'Hosting & Maintenance',
    tagline: 'Keep your site online, fast, and stable.',
    hint: 'From Rp 150k+ / mo',
    rows: [
      { name: 'Basic Maintenance', price: 'Rp 150k+ / mo', specs: ['Hosting + domain', 'Uptime monitoring', 'Monthly backups', 'Small fixes', 'Email support'] },
      { name: 'Dynamic / CMS Hosting', price: 'From Rp 350k+ / mo', specs: ['Scaled hosting', 'SSL + backups', 'CMS updates', 'Priority fixes', 'Performance checks'] },
      { name: 'Extra Storage', price: '+Rp 25k / mo', detail: 'per 5GB block' },
      { name: 'Business Support Plan', price: 'Custom', specs: ['Dedicated support', 'SLA response times', 'Quarterly roadmap', 'Hands-on changes'] },
    ],
    notes: ['Includes hosting, domain, monitoring, bug fixes, SEO checks & small adjustments.'],
  },
  {
    num: '05',
    groupId: 'design',
    icon: Palette,
    title: 'Digital Design',
    tagline: 'Professional visuals for brand, sales & web.',
    hint: 'From Rp 2.5jt+',
    rows: [
      { name: 'Landing Page Design', price: 'Rp 2.5jt+', specs: ['1 page concept', '2 revision rounds', 'Desktop + mobile', 'Source files'] },
      { name: 'Digital Catalog', price: 'Rp 3jt+', specs: ['Up to 12 spreads', 'Print + digital', '2 revision rounds'] },
      { name: 'Company Profile', price: 'Rp 3.5jt+', specs: ['Up to 16 pages', 'Brand-aligned layout', 'Print-ready'] },
      { name: 'Pitch Deck', price: 'Rp 3.5jt+', specs: ['Up to 15 slides', 'Investor-ready', 'Editable template'] },
      { name: 'Website UI/UX', price: 'Rp 5jt+', specs: ['Up to 8 screens', 'Figma prototype', 'Design system', 'Dev-ready handoff'] },
      { name: 'Brand Guidelines', price: 'Rp 5jt+', specs: ['Logo usage', 'Color + type', 'Voice + assets', 'PDF playbook'] },
    ],
  },
  {
    num: '06',
    groupId: 'growth',
    icon: Megaphone,
    title: 'Digital Marketing',
    tagline: 'Via our trusted partner network.',
    hint: 'Partner quote',
    rows: [
      { name: 'Content Production', price: 'Partner quote', specs: ['Photo / video', 'Social-ready edits'] },
      { name: 'Brand Activation', price: 'Partner quote', specs: ['Events & launches', 'On-ground teams'] },
      { name: 'Performance Marketing', price: 'By scope', specs: ['Paid ads', 'Tracking + reporting'] },
      { name: 'Community Growth', price: 'Partner quote', specs: ['Social growth', 'Engagement'] },
      { name: 'Campaign Planning', price: 'Custom', specs: ['Strategy + calendar', 'Multi-channel'] },
      { name: 'Creative Direction', price: 'Custom', specs: ['Concept + art direction', 'Campaign identity'] },
    ],
    partners: 'Escative (content) · Lit Social (performance)',
    notes: ['Ad spend & influencer fees excluded unless stated.'],
  },
  {
    num: '07',
    groupId: 'ai',
    icon: BrainCircuit,
    title: 'AI Integration',
    tagline: 'Automate repetitive work, smarter workflows.',
    hint: 'From Rp 7.5jt+',
    rows: [
      { name: 'Simple AI Chatbot', price: 'Rp 7.5jt+', specs: ['Trained on your content', 'Bahasa + English', 'Lead capture', 'Hosted for you'] },
      { name: 'FAQ / Support Bot', price: 'Rp 10jt+', specs: ['Answers common questions', 'Human hand-off', 'Web + WhatsApp'] },
      { name: 'AI Workflow Automation', price: 'Rp 15jt+', specs: ['Automate repetitive tasks', 'Tool integrations', 'Hours saved weekly'] },
      { name: 'Internal AI Assistant', price: 'Rp 20jt+', specs: ['Trained on your docs', 'Team-wide access', 'Secure & private'] },
      { name: 'AI Reporting Assistant', price: 'Rp 25jt+', specs: ['Auto-generated reports', 'Data insights', 'Scheduled delivery'] },
      { name: 'Custom AI Agent', price: 'Rp 35jt+', specs: ['Multi-step actions', 'Connected to your systems', 'Continuous tuning'] },
      { name: 'AI System Integration', price: 'Rp 50jt+', specs: ['End-to-end integration', 'Multi-channel', 'Analytics & monitoring'] },
    ],
    notes: ['API usage & third-party subscriptions excluded.'],
  },
  {
    num: '08',
    groupId: 'addons',
    icon: PlusCircle,
    title: 'Optional Add-Ons',
    tagline: 'Mix and match — scoped & quoted separately.',
    hint: 'Quoted',
    groups: [
      { label: 'Website', items: ['extra pages', 'copywriting', 'blog setup', 'multi-language', 'advanced animation', 'SEO', 'redesign'] },
      { label: 'Systems', items: ['CMS dashboard', 'booking', 'loyalty', 'payment gateway', 'CRM', 'WhatsApp automation', 'admin dashboard', 'API integration'] },
      { label: 'Business', items: ['strategy consultation', 'sales funnel', 'campaign landing pages', 'marketing collateral', 'analytics setup'] },
    ],
  },
];

/** Hard prices (Rp / From / +) read as real numbers; soft ones ("Custom",
 *  "Partner quote", "By scope") are de-emphasised. */
export function isHardPrice(price: string) {
  return /^(rp|from|\+)/i.test(price.trim());
}

export function getGroupById(id: string) {
  return solutionGroups.find((g) => g.id === id);
}

export function getCategoriesByGroup(groupId: string) {
  return categories.filter((c) => c.groupId === groupId);
}
