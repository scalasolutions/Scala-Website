/**
 * Security utility to prevent accidental connection to the production database from local environment.
 */
export function checkDatabaseSafety(url: string | undefined): void {
  if (!url) return;

  // Identify if the URL points to the production Neon PostgreSQL database
  const isProdDb = url.includes('ep-royal-butterfly-ao1z6mep');
  const isBypassed = process.env.ALLOW_PRODUCTION_DB === 'true';

  if (isProdDb && !isBypassed) {
    // We are running locally if:
    // - VERCEL environment variable is not set to '1'
    // - OR we are running in development NODE_ENV
    // - OR we are running a local CLI script/migration tool (where VERCEL is not set)
    const isRunningLocally = !process.env.VERCEL || process.env.VERCEL !== '1';

    if (isRunningLocally) {
      const errorMsg = `
========================================================================
❌ SECURITY BLOCK: ACCIDENTAL PRODUCTION DATABASE CONNECTION PREVENTED
========================================================================
You are attempting to connect to the production Neon database:
  ep-royal-butterfly-ao1z6mep

from a local development environment. This action has been blocked to
prevent accidental data loss, schema corruption, or unauthorized modifications
on the live production database.

To resolve this issue, please follow one of these steps:

1. Local Development Mode (Recommended):
   - Comment out or remove DATABASE_URL in your .env.local file.
   - The application will automatically run in "In-Memory Mock Fallback Mode"
     so you can test all features safely.
   - Alternatively, point DATABASE_URL to a local PostgreSQL instance:
     DATABASE_URL="postgresql://postgres:postgres@localhost:5432/scala_dev"

2. Pull Production Data & Restore Locally (Best Practice):
   - Step A: Pull production data safely to a local snapshot file:
     ALLOW_PRODUCTION_DB=true DATABASE_URL="[production-url]" npm run db:backup
   - Step B: Configure DATABASE_URL in your .env.local to your local DB.
   - Step C: Restore the backup locally:
     npm run db:restore [backup-file-name.json]

3. Run Database Scripts on Production (Admin Only):
   - If you explicitly intend to sync schema or backup production data,
     prepend ALLOW_PRODUCTION_DB=true to your command:
     
     ALLOW_PRODUCTION_DB=true npm run db:push
     ALLOW_PRODUCTION_DB=true npm run db:backup
========================================================================
`;
      console.error(errorMsg);
      throw new Error("Connection to production database blocked in local development.");
    }
  }
}
