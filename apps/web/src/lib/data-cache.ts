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
import type { MockClient, MockInvoice, MockPartner, MockExpense, MockCapitalInjection, MockPayout, MockClientTask, MockInvoiceLinePreset, MockInvoicePagePreset } from './db/queries';
import { getClients, getInvoices, getTickets, getPartners, getExpenses, getCapitalInjections, getPayouts, getClientTasks, getInvoiceLinePresets, getInvoicePagePresets } from './db/queries';

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
      const entry = { value, expiresAt: Date.now() + ttlMs };
      cache.set(key, entry);
      saveToLocalStorage(key, entry);
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

const LOCAL_STORAGE_KEY_PREFIX = 'scala_cache:';

function jsonReviver(key: string, value: any) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d*)?(?:Z|[-+]\d{2}:?\d{2})?$/.test(value)) {
    return new Date(value);
  }
  return value;
}

function saveToLocalStorage(key: string, entry: CacheEntry<unknown>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + key, JSON.stringify(entry));
  } catch (err) {
    console.error(`Failed to save key "${key}" to localStorage:`, err);
  }
}

export function initializeCacheFromLocalStorage() {
  if (typeof window === 'undefined') return;
  try {
    let restoredCount = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LOCAL_STORAGE_KEY_PREFIX)) {
        const cacheKey = key.slice(LOCAL_STORAGE_KEY_PREFIX.length);
        const raw = localStorage.getItem(key);
        if (raw) {
          const entry = JSON.parse(raw, jsonReviver);
          cache.set(cacheKey, entry);
          restoredCount++;
        }
      }
    }
    if (restoredCount > 0) {
      console.log(`%c[Cache Restore] 🎒 Restored ${restoredCount} entries from localStorage`, 'color: #3B82F6; font-weight: bold; background: #EFF6FF; padding: 2px 4px; border-radius: 4px;');
    }
  } catch (err) {
    console.error("Failed to restore cache from localStorage:", err);
  }
}

// Automatically bootstrap cache from localStorage if running in browser
if (typeof window !== 'undefined') {
  initializeCacheFromLocalStorage();
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
    const existing = cache.get(key);
    if (existing) {
      existing.expiresAt = 0; // Mark as stale instead of deleting so reader hooks can still render it instantly
      saveToLocalStorage(key, existing);
    } else {
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + key);
          if (raw) {
            const entry = JSON.parse(raw, jsonReviver);
            entry.expiresAt = 0;
            saveToLocalStorage(key, entry);
          }
        } catch (err) {
          console.error("Failed to invalidate key in localStorage:", err);
        }
      }
    }
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
  if (typeof window !== 'undefined') {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(LOCAL_STORAGE_KEY_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      console.log(`%c[Cache Clear] 🧹 Wiped all persisted SWR entries from localStorage`, 'color: #EC4899; font-weight: bold;');
    } catch (err) {
      console.error("Failed to clear localStorage cache:", err);
    }
  }
}

/** Manually seed or update a cache entry and notify active React components. */
export function primeCache(key: string, value: unknown, ttlMs: number = DEFAULT_TTL_MS): void {
  console.log(
    `%c[Cache Prime] 🌱 Primed key: "${key}" (expires in ${Math.round(ttlMs / 1000)}s)`,
    'color: #10B981; font-weight: bold; background: #E0F2FE; padding: 2px 4px; border-radius: 4px;'
  );
  const entry = { value, expiresAt: Date.now() + ttlMs };
  cache.set(key, entry);
  saveToLocalStorage(key, entry);
  notify(key);
}

/** Synchronously get a value from the cache, even if it is stale, to support instant SWR renders. */
export function getCachedSync<T>(key: string): T | null {
  const existing = cache.get(key);
  if (existing) {
    return existing.value as T;
  }
  return null;
}



// ---------------------------------------------------------------------------
// Custom React Hook for SWR & Pub/Sub
// ---------------------------------------------------------------------------
export function useAdminData<T>(
  key: string | null,
  fetcher: FetcherFn<T>,
  options?: { ttl?: number; enabled?: boolean }
) {
  const enabled = options?.enabled !== false && key !== null;
  const actualKey = key ?? '';

  // Synchronous cache lookup on init prevents loading state flash if data is available
  const [data, setData] = useState<T | null>(() => {
    if (!enabled) return null;
    const existing = cache.get(actualKey);
    if (existing) {
      return existing.value as T;
    }
    return null;
  });

  // Check if current cache entry is fresh
  const isFresh = () => {
    if (!enabled) return false;
    const existing = cache.get(actualKey);
    return !!(existing && existing.expiresAt > Date.now());
  };

  // Only set loading to true if there is absolutely no existing data in cache
  const [loading, setLoading] = useState(() => {
    if (!enabled) return false;
    const existing = cache.get(actualKey);
    return !existing;
  });

  useEffect(() => {
    if (!enabled) return;
    let active = true;

    async function load(forceRefresh = false) {
      if (!forceRefresh && isFresh()) {
        console.log(`%c[SWR Hook] 🟢 "${actualKey}" (Cache is fresh, skipping background query)`, 'color: #10B981;');
        if (active) setLoading(false);
        return;
      }

      try {
        const existing = cache.get(actualKey);
        // Only trigger loading visual overlay if we don't have any cached data to show AND no active state data
        if (active && !existing && !data) {
          console.log(`%c[SWR Hook] 🔴 "${actualKey}" - Initial Load: No cached data. Rendering loading skeletons...`, 'color: #EF4444; font-weight: bold;');
          setLoading(true);
        } else if (active && existing) {
          console.log(`%c[SWR Hook] 🟣 "${actualKey}" - Stale-While-Revalidate: Instant cache render. Triggering silent background query...`, 'color: #8B5CF6; font-weight: bold;');
        }
        
        const val = await getCached(actualKey, fetcher, options?.ttl);
        if (active) {
          setData(val);
          setLoading(false);
        }
      } catch (err) {
        console.error(`useAdminData loading error for key ${actualKey}:`, err);
        if (active) setLoading(false);
      }
    }

    load();

    // Subscribe to cache changes/invalidations
    const unsubscribe = subscribe(actualKey, () => {
      if (!active) return;
      const existing = cache.get(actualKey);
      if (existing && existing.expiresAt > Date.now()) {
        setData(existing.value as T);
        setLoading(false);
      } else {
        console.log(`%c[SWR Hook] 🔄 "${actualKey}" Cache Invalidated or Stale! Triggering instant re-fetch.`, 'color: #EC4899;');
        load(true);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [actualKey, fetcher, options?.ttl, enabled]);

  // Trigger cache invalidation or optimistic manual updates
  const mutate = async (optimisticData?: T) => {
    if (!enabled) return;
    if (optimisticData !== undefined) {
      cache.set(actualKey, {
        value: optimisticData,
        expiresAt: Date.now() + (options?.ttl ?? DEFAULT_TTL_MS),
      });
      setData(optimisticData);
      setLoading(false);
      notify(actualKey);
    } else {
      invalidateCache(actualKey);
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
  LINE_PRESETS: 'admin:invoice_line_presets',
  PAGE_PRESETS: 'admin:invoice_page_presets',
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

export const getCachedLinePresets = (): Promise<any[]> =>
  getCached(CACHE_KEYS.LINE_PRESETS, getInvoiceLinePresets as any);

export const getCachedPagePresets = (): Promise<any[]> =>
  getCached(CACHE_KEYS.PAGE_PRESETS, getInvoicePagePresets as any);

