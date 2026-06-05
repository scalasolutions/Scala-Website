import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { checkDatabaseSafety } from './security';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL is not defined in your .env.local file.");
  process.exit(1);
}

// Apply database connection safety guard
checkDatabaseSafety(connectionString);

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client, { schema });

async function runBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, 'backups');
  
  // Custom backup filename can be provided as argument: npx tsx backup.ts [custom-name]
  const customName = process.argv[2];
  const filename = customName 
    ? `${customName}.json` 
    : `backup-${timestamp}.json`;
  
  const backupFilePath = path.join(backupDir, filename);

  console.log(`📡 Fetching live database records for backup: ${filename}...`);

  try {
    // Ensure the backups directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Helper to query tables safely (in case they don't exist yet on the target DB schema)
    const safeQuery = async <T>(queryPromise: Promise<T>, tableName: string): Promise<T | any[]> => {
      try {
        return await queryPromise;
      } catch (err: any) {
        console.warn(`⚠️ Warning: Could not fetch table "${tableName}". It may not exist in this database. Skipping...`);
        return [];
      }
    };

    // Query all tables in a single operation
    const [
      clientsList,
      invoicesList,
      ticketsList,
      ticketMessagesList,
      expensesList,
      capitalInjectionsList,
      payoutsList,
      invoiceLinePresetsList,
      invoicePagePresetsList,
      partnersList,
      clientTasksList
    ] = await Promise.all([
      safeQuery(db.select().from(schema.clients), 'clients'),
      safeQuery(db.select().from(schema.invoices), 'invoices'),
      safeQuery(db.select().from(schema.tickets), 'tickets'),
      safeQuery(db.select().from(schema.ticketMessages), 'ticketMessages'),
      safeQuery(db.select().from(schema.expenses), 'expenses'),
      safeQuery(db.select().from(schema.capitalInjections), 'capitalInjections'),
      safeQuery(db.select().from(schema.payouts), 'payouts'),
      safeQuery(db.select().from(schema.invoiceLinePresets), 'invoiceLinePresets'),
      safeQuery(db.select().from(schema.invoicePagePresets), 'invoicePagePresets'),
      safeQuery(db.select().from(schema.partners), 'partners'),
      safeQuery(db.select().from(schema.clientTasks), 'clientTasks')
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      data: {
        clients: clientsList,
        invoices: invoicesList,
        tickets: ticketsList,
        ticketMessages: ticketMessagesList,
        expenses: expensesList,
        capitalInjections: capitalInjectionsList,
        payouts: payoutsList,
        invoiceLinePresets: invoiceLinePresetsList,
        invoicePagePresets: invoicePagePresetsList,
        partners: partnersList,
        clientTasks: clientTasksList
      }
    };

    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8');
    
    console.log(`\n🎉 Backup fully completed successfully!`);
    console.log(`📂 Location: ${path.relative(process.cwd(), backupFilePath)}`);
    console.log(`📊 Statistics:`);
    console.log(`   • Clients: ${clientsList.length}`);
    console.log(`   • Invoices: ${invoicesList.length}`);
    console.log(`   • Support Tickets: ${ticketsList.length}`);
    console.log(`   • Ticket Messages: ${ticketMessagesList.length}`);
    console.log(`   • Client Tasks: ${clientTasksList.length}`);
    console.log(`   • Partners: ${partnersList.length}`);
    console.log(`   • Expenses: ${expensesList.length}`);
    console.log(`   • Presets: ${invoiceLinePresetsList.length + invoicePagePresetsList.length}`);
    
  } catch (err) {
    console.error("❌ Database dump failed with error: ", err);
  } finally {
    await client.end();
  }
}

runBackup();
