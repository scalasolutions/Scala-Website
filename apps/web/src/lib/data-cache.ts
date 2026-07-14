/**
 * data-cache.ts
 * ---------------------------------------------------------------------------
 * A lightweight, client-side, TTL-based in-memory cache for admin data fetches
 * with Stale-While-Revalidate (SWR) and Pub/Sub mechanics for React.
 *
 * Goals:
 *  • Prevent duplicate network requests when multiple components on the same
 *    page call the same query function within the TTL window.
 *  • Deduplicate *in-flight* requests — if two components call getCachedClients()
 *    at the same moment, only one actual fetch fires; both callers await the
 *    same Promise.
 *  • Allow mutations (create/update/delete) to invalidate specific keys so the
 *    next read always gets fresh data.
 *  • Provide a hook useAdminData() that offers instant rendering via a
 *    synchronous cache lookup, background updates (SWR), and cross-component sync.
 */

import { useState, useEffect } from 'react';
import type { MockClient, MockInvoice, MockPartner, MockExpense, MockCapitalInjection, MockPayout } from './db/queries';
import { getClients, getInvoices, getTickets, getPartners, getExpenses, getCapitalInjections, getPayouts, getClientTasks, getInvoiceLinePresets, getInvoicePagePresets } from './db/queries';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

type FetcherFn<T> = () => Promise<T>;

const cache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

const DEFAULT_TTL_MS = 30_000; // 30 seconds
const LOCAL_STORAGE_KEY_PREFIX = 'scala_cache:';

// Verbose cache tracing — opt in via NEXT_PUBLIC_CACHE_DEBUG=1. Off in production.
const DEBUG = process.env.NEXT_PUBLIC_CACHE_DEBUG === '1';
const trace = DEBUG
  ? (...args: unknown[]) => console.log('[cache]', ...args)
  : () => {};

// ---------------------------------------------------------------------------
// Pub/Sub Subscription Manager
// ---------------------------------------------------------------------------
const listeners = new Map<string, Set<() => void>>();

export function subscribe(key: string, callback: () => void): () => void {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(callback);
  return () => {
    const current = listeners.get(key);
    if (!current) return;
    current.delete(callback);
    if (current.size === 0) listeners.delete(key);
  };
}

export function notify(key: string): void {
  listeners.get(key)?.forEach((cb) => cb());
}

// ---------------------------------------------------------------------------
// localStorage persistence
// ---------------------------------------------------------------------------

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d*)?(?:Z|[-+]\d{2}:?\d{2})?$/;

function jsonReviver(_key: string, value: unknown) {
  if (typeof value === 'string' && ISO_DATE_RE.test(value)) {
    return new Date(value);
  }
  return value;
}

function saveToLocalStorage(key: string, entry: CacheEntry<unknown>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + key, JSON.stringify(entry));
  } catch (err) {
    console.error(`Failed to persist cache key "${key}":`, err);
  }
}

function readFromLocalStorage(key: string): CacheEntry<unknown> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + key);
    return raw ? (JSON.parse(raw, jsonReviver) as CacheEntry<unknown>) : null;
  } catch {
    return null;
  }
}

export function initializeCacheFromLocalStorage() {
  if (typeof window === 'undefined') return;
  try {
    let restored = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const fullKey = localStorage.key(i);
      if (!fullKey || !fullKey.startsWith(LOCAL_STORAGE_KEY_PREFIX)) continue;
      const entry = readFromLocalStorage(fullKey.slice(LOCAL_STORAGE_KEY_PREFIX.length));
      if (entry) {
        cache.set(fullKey.slice(LOCAL_STORAGE_KEY_PREFIX.length), entry);
        restored++;
      }
    }
    if (restored > 0) trace(`restored ${restored} entries from localStorage`);
  } catch (err) {
    console.error('Failed to restore cache from localStorage:', err);
  }
}

// Bootstrap cache from localStorage if running in the browser
if (typeof window !== 'undefined') {
  initializeCacheFromLocalStorage();
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

  const existing = cache.get(key);
  if (existing && existing.expiresAt > now) {
    trace(`hit "${key}" (fresh ${Math.round((existing.expiresAt - now) / 1000)}s)`);
    return existing.value as T;
  }

  const pending = inFlight.get(key);
  if (pending) {
    trace(`dedup "${key}" (reusing in-flight request)`);
    return pending as Promise<T>;
  }

  trace(`miss "${key}" (fetching)`);
  const promise = fetcher()
    .then((value) => {
      // Only write to the cache if this promise is still the active in-flight request.
      // If the cache was invalidated/primed during this request, discard the stale result.
      if (inFlight.get(key) === promise) {
        const entry = { value, expiresAt: Date.now() + ttlMs };
        cache.set(key, entry);
        saveToLocalStorage(key, entry);
        inFlight.delete(key);
        notify(key);
      } else {
        trace(`discard stale/invalidated in-flight request for "${key}"`);
      }
      return value;
    })
    .catch((err) => {
      if (inFlight.get(key) === promise) {
        inFlight.delete(key);
      }
      throw err;
    });

  inFlight.set(key, promise);
  return promise;
}

/**
 * Immediately invalidate one or more cache keys.
 * Call this after any mutation (create/update/delete) so the next read
 * always fetches fresh data and notifies active subscribers to sync.
 *
 * Entries are marked stale (expiresAt = 0) rather than deleted so reader hooks
 * can still render the last known value instantly while revalidating.
 */
export function invalidateCache(...keys: string[]): void {
  for (const key of keys) {
    trace(`invalidate "${key}"`);
    const entry = cache.get(key) ?? readFromLocalStorage(key);
    if (entry) {
      entry.expiresAt = 0;
      cache.set(key, entry);
      saveToLocalStorage(key, entry);
    }
    inFlight.delete(key); // Cancel/discard any pending stale requests
    notify(key);
  }
}

/** Invalidate everything (e.g. after a bulk operation or sign-out). */
export function clearAllCache(): void {
  trace('clear all');
  cache.clear();
  inFlight.clear();
  if (typeof window === 'undefined') return;
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(LOCAL_STORAGE_KEY_PREFIX)) toRemove.push(k);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    console.error('Failed to clear localStorage cache:', err);
  }
}

/** Manually seed or update a cache entry and notify active React components. */
export function primeCache(key: string, value: unknown, ttlMs: number = DEFAULT_TTL_MS): void {
  trace(`prime "${key}"`);
  const entry = { value, expiresAt: Date.now() + ttlMs };
  cache.set(key, entry);
  saveToLocalStorage(key, entry);
  inFlight.delete(key); // Cancel/discard any pending stale requests
  notify(key);
}

/** Synchronously read a value from the cache, even if stale, for instant SWR renders. */
export function getCachedSync<T>(key: string): T | null {
  const existing = cache.get(key);
  return existing ? (existing.value as T) : null;
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

  // Synchronous cache lookup on init prevents a loading flash when data exists.
  const [data, setData] = useState<T | null>(() => {
    if (!enabled) return null;
    return (cache.get(actualKey)?.value as T) ?? null;
  });

  // Only show loading when there is no existing data at all.
  const [loading, setLoading] = useState(() => enabled && !cache.has(actualKey));

  useEffect(() => {
    if (!enabled) return;
    let active = true;

    const isFresh = () => {
      const existing = cache.get(actualKey);
      return !!(existing && existing.expiresAt > Date.now());
    };

    async function load(forceRefresh = false) {
      if (!forceRefresh && isFresh()) {
        if (active) setLoading(false);
        return;
      }
      try {
        if (active && !cache.has(actualKey) && !data) setLoading(true);
        const val = await getCached(actualKey, fetcher, options?.ttl);
        if (active) {
          setData(val);
          setLoading(false);
        }
      } catch (err) {
        console.error(`useAdminData load error for "${actualKey}":`, err);
        if (active) setLoading(false);
      }
    }

    load();

    const unsubscribe = subscribe(actualKey, () => {
      if (!active) return;
      const existing = cache.get(actualKey);
      if (existing && existing.expiresAt > Date.now()) {
        setData(existing.value as T);
        setLoading(false);
      } else {
        load(true);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [actualKey, fetcher, options?.ttl, enabled]);

  // Invalidate, or apply an optimistic value immediately.
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
