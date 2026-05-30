/**
 * data-cache.ts
 * ---------------------------------------------------------------------------
 * A lightweight, client-side, TTL-based in-memory cache for admin data fetches.
 *
 * Goals:
 *  • Prevent duplicate network requests when multiple components on the same
 *    page call the same query function within the TTL window.
 *  • Deduplicate *in-flight* requests — if two components call getCachedClients()
 *    at the same moment, only one actual fetch fires; both callers await the
 *    same Promise.
 *  • Allow mutations (create/update/delete) to invalidate specific keys so the
 *    next read always gets fresh data.
 *
 * This is intentionally simple — no persistence, no React context — just a
 * module-level singleton that lives for the duration of the browser session.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

type FetcherFn<T> = () => Promise<T>;

const cache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

const DEFAULT_TTL_MS = 30_000; // 30 seconds

/**
 * Get a value from the cache, or fetch it if missing/expired.
 * In-flight deduplication prevents multiple concurrent requests for the same key.
 */
export async function getCached<T>(
  key: string,
  fetcher: FetcherFn<T>,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<T> {
  const now = Date.now();

  // Return cached value if still fresh
  const existing = cache.get(key);
  if (existing && existing.expiresAt > now) {
    return existing.value as T;
  }

  // Return in-flight promise if one is already running for this key
  if (inFlight.has(key)) {
    return inFlight.get(key) as Promise<T>;
  }

  // Launch new fetch and register it as in-flight
  const promise = fetcher().then((value) => {
    cache.set(key, { value, expiresAt: now + ttlMs });
    inFlight.delete(key);
    return value;
  }).catch((err) => {
    inFlight.delete(key);
    throw err;
  });

  inFlight.set(key, promise);
  return promise;
}

/**
 * Immediately invalidate one or more cache keys.
 * Call this after any mutation (create/update/delete) so the next read
 * always fetches fresh data.
 */
export function invalidateCache(...keys: string[]): void {
  for (const key of keys) {
    cache.delete(key);
    // Note: we intentionally leave in-flight requests running — they will
    // update the cache when they resolve, which is fine.
  }
}

/** Invalidate everything (e.g. after a bulk operation or sign-out). */
export function clearAllCache(): void {
  cache.clear();
}

// ---------------------------------------------------------------------------
// Typed cache-aware wrappers for the four hot admin query functions.
// Import these instead of calling the raw query functions directly when
// you want cross-component caching.
// ---------------------------------------------------------------------------

import type { MockClient, MockInvoice, MockPartner } from './db/queries';
import { getClients, getInvoices, getTickets, getPartners } from './db/queries';

export const CACHE_KEYS = {
  CLIENTS: 'admin:clients',
  INVOICES: 'admin:invoices',
  TICKETS: 'admin:tickets',
  PARTNERS: 'admin:partners',
} as const;

export const getCachedClients = (): Promise<MockClient[]> =>
  getCached(CACHE_KEYS.CLIENTS, getClients);

export const getCachedInvoices = (): Promise<(MockInvoice & { client?: MockClient })[]> =>
  getCached(CACHE_KEYS.INVOICES, getInvoices as () => Promise<(MockInvoice & { client?: MockClient })[]>);

export const getCachedTickets = (): Promise<any[]> =>
  getCached(CACHE_KEYS.TICKETS, getTickets);

export const getCachedPartners = (): Promise<MockPartner[]> =>
  getCached(CACHE_KEYS.PARTNERS, getPartners as () => Promise<MockPartner[]>);
