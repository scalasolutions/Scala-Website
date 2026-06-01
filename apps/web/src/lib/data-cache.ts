/**
 * data-cache.ts
 * ---------------------------------------------------------------------------
 * A lightweight, client-side, TTL-based in-memory cache for admin data fetches
 * upgraded with Stale-While-Revalidate (SWR) and Pub/Sub mechanics for React.
 *
 * Goals:
 *  • Prevent duplicate network requests when multiple components on the same
 *    page call the same query function within the TTL window.
 *  • Deduplicate *in-flight* requests — if two components call getCachedClients()
 *    at the same moment, only one actual fetch fires; both callers await the
 *    same Promise.
 *  • Allow mutations (create/update/delete) to invalidate specific keys so the
 *    next read always gets fresh data.
 *  • Provide a custom hook useAdminData() that offers instant rendering via
 *    synchronous cache lookup, background updates (SWR), and cross-component syncing.
 */

import { useState, useEffect } from 'react';
import type { MockClient, MockInvoice, MockPartner, MockExpense, MockCapitalInjection, MockPayout } from './db/queries';
import { getClients, getInvoices, getTickets, getPartners, getExpenses, getCapitalInjections, getPayouts } from './db/queries';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

type FetcherFn<T> = () => Promise<T>;

const cache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

const DEFAULT_TTL_MS = 30_000; // 30 seconds

// ---------------------------------------------------------------------------
// Pub/Sub Subscription Manager
// ---------------------------------------------------------------------------
const listeners = new Map<string, Set<() => void>>();

export function subscribe(key: string, callback: () => void): () => void {
  if (!listeners.has(key)) {
    listeners.set(key, new Set());
  }
  listeners.get(key)!.add(callback);
  return () => {
    listeners.get(key)?.delete(callback);
    if (listeners.get(key)?.size === 0) {
      listeners.delete(key);
    }
  };
}

export function notify(key: string): void {
  listeners.get(key)?.forEach((cb) => cb());
}

// ---------------------------------------------------------------------------
// Core Cache Methods
// ---------------------------------------------------------------------------

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
  const promise = fetcher()
    .then((value) => {
      cache.set(key, { value, expiresAt: now + ttlMs });
      inFlight.delete(key);
      // Notify active hooks that fresh data has arrived
      notify(key);
      return value;
    })
    .catch((err) => {
      inFlight.delete(key);
      throw err;
    });

  inFlight.set(key, promise);
  return promise;
}

/**
 * Immediately invalidate one or more cache keys.
 * Call this after any mutation (create/update/delete) so the next read
 * always fetches fresh data and notifies active subscribers to sync.
 */
export function invalidateCache(...keys: string[]): void {
  for (const key of keys) {
    cache.delete(key);
    // Notify all active hooks subscribed to this key to automatically re-fetch
    notify(key);
  }
}

/** Invalidate everything (e.g. after a bulk operation or sign-out). */
export function clearAllCache(): void {
  cache.clear();
}

// ---------------------------------------------------------------------------
// Custom React Hook for SWR & Pub/Sub
// ---------------------------------------------------------------------------
export function useAdminData<T>(
  key: string,
  fetcher: FetcherFn<T>,
  options?: { ttl?: number }
) {
  // Synchronous cache lookup on init prevents loading state flash if data is available
  const [data, setData] = useState<T | null>(() => {
    const existing = cache.get(key);
    if (existing) {
      return existing.value as T;
    }
    return null;
  });

  // Check if current cache entry is fresh
  const isFresh = () => {
    const existing = cache.get(key);
    return !!(existing && existing.expiresAt > Date.now());
  };

  const [loading, setLoading] = useState(() => !isFresh());

  useEffect(() => {
    let active = true;

    async function load(forceRefresh = false) {
      if (!forceRefresh && isFresh()) {
        if (active) setLoading(false);
        return;
      }

      try {
        if (active) setLoading(true);
        const val = await getCached(key, fetcher, options?.ttl);
        if (active) {
          setData(val);
          setLoading(false);
        }
      } catch (err) {
        console.error(`useAdminData loading error for key ${key}:`, err);
        if (active) setLoading(false);
      }
    }

    load();

    // Subscribe to cache changes/invalidations
    const unsubscribe = subscribe(key, () => {
      if (!active) return;
      const existing = cache.get(key);
      if (existing) {
        setData(existing.value as T);
        setLoading(false);
      } else {
        // Cache was invalidated! Trigger background refetch
        load(true);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [key, fetcher, options?.ttl]);

  // Trigger cache invalidation or optimistic manual updates
  const mutate = async (optimisticData?: T) => {
    if (optimisticData !== undefined) {
      cache.set(key, {
        value: optimisticData,
        expiresAt: Date.now() + (options?.ttl ?? DEFAULT_TTL_MS),
      });
      setData(optimisticData);
      setLoading(false);
      notify(key);
    } else {
      invalidateCache(key);
    }
  };

  return { data, loading, mutate };
}

// ---------------------------------------------------------------------------
// Typed cache-aware wrappers for the hot admin query functions.
// Import these instead of calling the raw query functions directly when
// you want cross-component caching.
// ---------------------------------------------------------------------------

export const CACHE_KEYS = {
  CLIENTS: 'admin:clients',
  INVOICES: 'admin:invoices',
  TICKETS: 'admin:tickets',
  PARTNERS: 'admin:partners',
  EXPENSES: 'admin:expenses',
  INJECTIONS: 'admin:injections',
  PAYOUTS: 'admin:payouts',
} as const;

export const getCachedClients = (): Promise<MockClient[]> =>
  getCached(CACHE_KEYS.CLIENTS, getClients);

export const getCachedInvoices = (): Promise<(MockInvoice & { client?: MockClient })[]> =>
  getCached(CACHE_KEYS.INVOICES, getInvoices as () => Promise<(MockInvoice & { client?: MockClient })[]>);

export const getCachedTickets = (): Promise<any[]> =>
  getCached(CACHE_KEYS.TICKETS, getTickets);

export const getCachedPartners = (): Promise<MockPartner[]> =>
  getCached(CACHE_KEYS.PARTNERS, getPartners as () => Promise<MockPartner[]>);

export const getCachedExpenses = (): Promise<MockExpense[]> =>
  getCached(CACHE_KEYS.EXPENSES, getExpenses as () => Promise<MockExpense[]>);

export const getCachedInjections = (): Promise<MockCapitalInjection[]> =>
  getCached(CACHE_KEYS.INJECTIONS, getCapitalInjections as () => Promise<MockCapitalInjection[]>);

export const getCachedPayouts = (): Promise<MockPayout[]> =>
  getCached(CACHE_KEYS.PAYOUTS, getPayouts as () => Promise<MockPayout[]>);
