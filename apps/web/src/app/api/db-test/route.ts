import { NextResponse } from 'next/server';
import * as schema from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  const rawUrl = process.env.DATABASE_URL;
  const isDbConfigured = !!rawUrl && rawUrl !== '';

  // Test 1: raw SQL count
  let rawCountResult: string | null = null;
  let rawCountError: string | null = null;
  try {
    const { db } = await import('@/lib/db');
    const result = await db.execute('SELECT COUNT(*) as count FROM clients');
    rawCountResult = (result as unknown as {count: string}[])[0]?.count ?? null;
  } catch (e: unknown) {
    rawCountError = (e as Error)?.message || String(e);
  }

  // Test 2: Drizzle relational query (same as getClients())
  let drizzleResult: number | null = null;
  let drizzleError: string | null = null;
  try {
    const { db } = await import('@/lib/db');
    const rows = await db.query.clients.findMany({ orderBy: [desc(schema.clients.createdAt)] });
    drizzleResult = rows.length;
  } catch (e: unknown) {
    drizzleError = (e as Error)?.message || String(e);
  }

  // Test 3: isDbConfigured check (what queries.ts sees)
  const urlHost = (() => {
    try { return new URL((rawUrl ?? '').replace('postgresql://', 'https://')).hostname; }
    catch { return 'parse-error'; }
  })();

  return NextResponse.json({
    isDbConfigured,
    urlHost,
    rawSqlCount: rawCountResult,
    rawSqlError: rawCountError,
    drizzleCount: drizzleResult,
    drizzleError: drizzleError,
  });
}
