import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL || '';

// Prevent accidental connection to the production database from local drizzle-kit runs
if (databaseUrl.includes('ep-royal-butterfly-ao1z6mep') && process.env.ALLOW_PRODUCTION_DB !== 'true' && !process.env.VERCEL) {
  const errorMsg = `
========================================================================
❌ SECURITY BLOCK: ACCIDENTAL PRODUCTION DATABASE CONNECTION PREVENTED
========================================================================
drizzle-kit is attempting to connect to the production Neon database:
  ep-royal-butterfly-ao1z6mep

This action has been blocked to prevent unauthorized schema changes.

If you explicitly intend to push schema updates to production, run:
  ALLOW_PRODUCTION_DB=true npm run db:push
========================================================================
`;
  console.error(errorMsg);
  throw new Error("Connection to production database blocked in local development.");
}

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
});
