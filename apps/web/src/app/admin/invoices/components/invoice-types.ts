// Shared types and utilities for the invoice feature

// Re-exported from the shared utils module so invoice components can keep
// importing it from here.
export { formatCurrencyIDR } from '@/lib/utils';

export interface InvoiceLineItem {
  name: string;
  description?: string;
  price: number;
  quantity: number;
}

// Generates a short client reference code like APK-01 from a company name + invoice number
export const getClientRefCode = (name: string, invoiceNum: string): string => {
  const cleanName = name.replace(/[^a-zA-Z\s]/g, '');
  const words = cleanName.split(/\s+/).filter(Boolean);
  let initials = '';
  if (words.length >= 2) {
    initials = words.map(w => w[0]).join('').substring(0, 3).toUpperCase();
  } else if (words.length === 1) {
    initials = words[0].substring(0, 3).toUpperCase();
  } else {
    initials = 'INV';
  }
  const match = invoiceNum.match(/\d+$/);
  const numStr = match ? match[0] : '01';
  const numVal = parseInt(numStr, 10);
  return `${initials}-${String(numVal).padStart(2, '0')}`;
};

// Formats a date as DD/MM/YYYY
export const formatDateClean = (d: Date | string | null | undefined): string => {
  if (!d) return 'Draft';
  const date = new Date(d);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};

// Returns Tailwind class string for a status badge
export const getStatusBadge = (stat: string): string => {
  switch (stat) {
    case 'paid':
      return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
    case 'partially_paid':
      return 'bg-primary-soft text-primary-ink border-primary-ink/20';
    case 'issued':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'past_due':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'draft':
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};
