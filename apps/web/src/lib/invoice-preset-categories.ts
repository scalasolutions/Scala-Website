// Category metadata for invoice line presets. Lives outside `queries.ts`
// because that file is a Server Action module ("use server") and can only
// export async functions — not const objects.

export type InvoiceLinePresetCategory =
  | 'website'
  | 'ecommerce'
  | 'business_systems'
  | 'crm'
  | 'growth'
  | 'ai_automation'
  | 'infrastructure'
  | 'support'
  | 'uncategorized';

export const INVOICE_LINE_PRESET_CATEGORY_LABELS: Record<InvoiceLinePresetCategory, string> = {
  website: 'Website Solutions',
  ecommerce: 'E-Commerce Solutions',
  business_systems: 'Business Systems',
  crm: 'CRM Solutions',
  growth: 'Growth & Marketing',
  ai_automation: 'AI & Automation',
  infrastructure: 'Infrastructure & Security',
  support: 'Ongoing Digital Support',
  uncategorized: 'Uncategorized',
};

export const INVOICE_LINE_PRESET_CATEGORY_ORDER: InvoiceLinePresetCategory[] = [
  'website',
  'ecommerce',
  'business_systems',
  'crm',
  'growth',
  'ai_automation',
  'infrastructure',
  'support',
  'uncategorized',
];
