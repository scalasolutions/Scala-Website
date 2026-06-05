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
import type { MockClient, MockInvoice, MockPartner, MockExpense, MockCapitalInjection, MockPayout, MockClientTask } from './db/queries';
import { getClients, getInvoices, getTickets, getPartners, getExpenses, getCapitalInjections, getPayouts, getClientTasks } from './db/queries';

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
  const startTime = performance.now();

  // Return cached value if still fresh
  const existing = cache.get(key);
  if (existing && existing.expiresAt > now) {
    console.log(
      `%c[Cache Hit] 🎯 Key: "${key}" (Fresh; expires in ${Math.round((existing.expiresAt - now) / 1000)}s)`,
      'color: #10B981; font-weight: bold; background: #ECFDF5; padding: 2px 4px; border-radius: 4px;'
    );
    return existing.value as T;
  }

  // Return in-flight promise if one is already running for this key
  if (inFlight.has(key)) {
    console.log(
      `%c[In-Flight Deduplication] 🤝 Key: "${key}" (Reusing active DB request...)`,
      'color: #3B82F6; font-weight: bold; background: #EFF6FF; padding: 2px 4px; border-radius: 4px;'
    );
    return inFlight.get(key) as Promise<T>;
  }

  console.log(
    `%c[Cache Miss/Stale] ⚡ Key: "${key}" - Fetching fresh ledger data from database...`,
    'color: #F59E0B; font-weight: bold; background: #FFFBEB; padding: 2px 4px; border-radius: 4px;'
  );

  // Launch new fetch and register it as in-flight
  const promise = fetcher()
    .then((value) => {
      const duration = performance.now() - startTime;
      console.log(
        `%c[Fetch Completed] ✅ Key: "${key}" | Duration: ${duration.toFixed(2)}ms (Successfully saved in cache)`,
        'color: #10B981; font-weight: bold; text-decoration: underline; background: #ECFDF5; padding: 2px 4px; border-radius: 4px;'
      );
      cache.set(key, { value, expiresAt: Date.now() + ttlMs });
      inFlight.delete(key);
      // Notify active hooks that fresh data has arrived
      notify(key);
      return value;
    })
    .catch((err) => {
      const duration = performance.now() - startTime;
      console.error(
        `%c[Fetch Failed] ❌ Key: "${key}" | Duration: ${duration.toFixed(2)}ms`,
        'color: #EF4444; font-weight: bold; background: #FEF2F2; padding: 2px 4px; border-radius: 4px;',
        err
      );
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
    console.log(
      `%c[Cache Invalidation] 🧹 Invalidated key: "${key}"`,
      'color: #EC4899; font-weight: bold; background: #FDF2F8; padding: 2px 4px; border-radius: 4px;'
    );
    cache.delete(key);
    // Notify all active hooks subscribed to this key to automatically re-fetch
    notify(key);
  }
}

/** Invalidate everything (e.g. after a bulk operation or sign-out). */
export function clearAllCache(): void {
  console.log(
    `%c[Cache Clear] 🧽 Cleared all entries in the corporate ledger cache`,
    'color: #EC4899; font-weight: bold; background: #FDF2F8; padding: 2px 4px; border-radius: 4px;'
  );
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

  // Only set loading to true if there is absolutely no existing data in cache
  const [loading, setLoading] = useState(() => {
    const existing = cache.get(key);
    return !existing;
  });

  useEffect(() => {
    let active = true;

    async function load(forceRefresh = false) {
      if (!forceRefresh && isFresh()) {
        console.log(`%c[SWR Hook] 🟢 "${key}" (Cache is fresh, skipping background query)`, 'color: #10B981;');
        if (active) setLoading(false);
        return;
      }

      try {
        const existing = cache.get(key);
        // Only trigger loading visual overlay if we don't have any cached data to show
        if (active && !existing) {
          console.log(`%c[SWR Hook] 🔴 "${key}" - Initial Load: No cached data. Rendering loading skeletons...`, 'color: #EF4444; font-weight: bold;');
          setLoading(true);
        } else if (active && existing) {
          console.log(`%c[SWR Hook] 🟣 "${key}" - Stale-While-Revalidate: Instant cache render. Triggering silent background query...`, 'color: #8B5CF6; font-weight: bold;');
        }
        
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
        console.log(`%c[SWR Hook] 🔄 "${key}" Cache Invalidated! Triggering instant re-fetch.`, 'color: #EC4899;');
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
  CLIENT_TASKS: 'admin:client_tasks',
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

export const getCachedClientTasks = (): Promise<any[]> =>
  getCached(CACHE_KEYS.CLIENT_TASKS, getClientTasks);

