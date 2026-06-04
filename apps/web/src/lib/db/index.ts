import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { checkDatabaseSafety } from './security';

// Strip channel_binding param — not supported by postgres-js and causes Neon connections to fail
const rawConnectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/scala_dashboard';
const connectionString = rawConnectionString.replace(/[&?]channel_binding=[^&]*/g, '');

// Apply database connection safety guard
checkDatabaseSafety(connectionString);

// For serverless environments like Vercel, use connection pool or single-connection
// depending on context. Under postgres-js, we define the client:
const client = postgres(connectionString, {
  max: 10,          // Connection pool size limit
  connect_timeout: 15, // 15s timeout — Neon serverless can take 5–10s to wake from idle
});

export const db = drizzle(client, { schema });

export * from './schema';
