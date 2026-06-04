import { NextResponse } from 'next/server';

export async function GET() {
  const rawUrl = process.env.DATABASE_URL;
  
  if (!rawUrl) {
    return NextResponse.json({ error: 'DATABASE_URL is not set', configured: false });
  }

  const url = rawUrl.replace(/[&?]channel_binding=[^&]*/g, '');
  
  try {
    // Dynamically import to catch module-level errors
    const { db } = await import('@/lib/db');
    const result = await db.execute('SELECT COUNT(*) as count FROM clients');
    return NextResponse.json({ 
      ok: true, 
      clientCount: (result as unknown as {count: string}[])[0]?.count,
      urlHost: new URL(url.replace('postgresql://', 'https://')).hostname,
    });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ 
      ok: false, 
      error: err?.message || String(e),
      urlHost: (() => { try { return new URL(rawUrl.replace('postgresql://', 'https://')).hostname; } catch { return 'parse-error'; } })(),
    });
  }
}
