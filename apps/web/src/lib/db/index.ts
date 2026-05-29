import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/scala_dashboard';

// For serverless environments like Vercel, use connection pool or single-connection
// depending on context. Under postgres-js, we define the client:
const client = postgres(connectionString, {
  max: 10, // Connection pool size limit
});

export const db = drizzle(client, { schema });

export * from './schema';
