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

