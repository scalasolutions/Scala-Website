import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { getClients, getInvoices, getTickets, getClientTasks } from './queries';

async function runTest() {
  console.log("DATABASE_URL:", process.env.DATABASE_URL);
  console.log("Measuring query execution times...\n");

  const runs = 3;
  for (let i = 1; i <= runs; i++) {
    console.log(`--- Run ${i} ---`);

    let start = performance.now();
    await getClients();
    console.log(`getClients() took: ${(performance.now() - start).toFixed(2)}ms`);

    start = performance.now();
    await getInvoices();
    console.log(`getInvoices() took: ${(performance.now() - start).toFixed(2)}ms`);

    start = performance.now();
    await getTickets();
    console.log(`getTickets() took: ${(performance.now() - start).toFixed(2)}ms`);

    start = performance.now();
    await getClientTasks();
    console.log(`getClientTasks() took: ${(performance.now() - start).toFixed(2)}ms`);

    console.log();
  }
  process.exit(0);
}

runTest().catch(console.error);
