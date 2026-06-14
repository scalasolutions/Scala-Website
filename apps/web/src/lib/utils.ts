import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Composes Tailwind class strings: clsx for conditional joining,
 * twMerge for resolving conflicting Tailwind utilities.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Shared hover treatment for clickable table/list rows. A clearly visible lift
// without overwhelming the row — uses a soft lime tint so the row reads as
// "interactive" without competing with selected states.
export const TABLE_ROW_HOVER =
  'hover:bg-primary/10 hover:border-primary/20 transition-colors';

export interface SubscriptionClient {
  subscriptionStartDate: Date | null | string;
  subscriptionMonths: number | null;
}

// Helper to compute subscription remaining months
export function getSubscriptionRemainingMonths(client: SubscriptionClient) {
  if (!client.subscriptionStartDate || client.subscriptionMonths === null || client.subscriptionMonths === undefined) {
    return null;
  }
  const start = new Date(client.subscriptionStartDate);
  const now = new Date();
  
  // Calculate difference in months
  const yearDiff = now.getFullYear() - start.getFullYear();
  const monthDiff = now.getMonth() - start.getMonth();
  const elapsedMonths = yearDiff * 12 + monthDiff;
  
  const remaining = client.subscriptionMonths - elapsedMonths;
  return Math.max(0, remaining);
}

// Format a number as Indonesian Rupiah currency, e.g. "Rp 1.500.000".
export function formatCurrencyIDR(val: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);
}

// Format a value for an Indonesian amount input field: strips non-digits and
// applies thousands grouping, e.g. "1.500.000". Returns '' for empty input.
export function formatInputNumberIDR(val: number | string): string {
  if (val === undefined || val === null || val === '') return '';
  const num = String(val).replace(/[^0-9]/g, '');
  if (!num) return '';
  return new Intl.NumberFormat('id-ID').format(Number(num));
}

// Parse a grouped/formatted amount string back into a number, e.g. "1.500.000" -> 1500000.
// Returns 0 for empty or non-numeric input.
export function parseNumberInputIDR(val: string): number {
  const digits = val.replace(/[^0-9]/g, '');
  return digits ? Number(digits) : 0;
}

// Invoice statuses that represent money still owed (issued, overdue, or partly paid).
export const OUTSTANDING_INVOICE_STATUSES = ['issued', 'past_due', 'partially_paid'] as const;

// Whether an invoice still has an outstanding balance to collect.
export function isOutstandingInvoice(invoice: { status: string }): boolean {
  return (OUTSTANDING_INVOICE_STATUSES as readonly string[]).includes(invoice.status);
}

// A task is "urgent" if it is past its target date or has gone untouched for
// more than a week (and is not already achieved).
export function isTaskUrgent(task: {
  status?: string;
  targetDate?: Date | string | null;
  updatedAt?: Date | string | null;
  createdAt?: Date | string | null;
}): boolean {
  if (task.status === 'achieved') return false;

  const now = new Date();
  if (task.targetDate) {
    const dueDate = new Date(task.targetDate);
    if (dueDate < now) return true;
  }

  const updatedDate = new Date(task.updatedAt || task.createdAt || now);
  const daysDiff = (now.getTime() - updatedDate.getTime()) / (1000 * 3600 * 24);
  return daysDiff > 7;
}

// Generate a strong random password containing lowercase, uppercase, numbers, and symbols
export function generateStrongPassword() {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  let password = '';
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  const allChars = lowercase + uppercase + numbers + symbols;
  for (let i = 0; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

