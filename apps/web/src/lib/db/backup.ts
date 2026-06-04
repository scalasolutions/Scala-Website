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
      partnersList
    ] = await Promise.all([
      db.select().from(schema.clients),
      db.select().from(schema.invoices),
      db.select().from(schema.tickets),
      db.select().from(schema.ticketMessages),
      db.select().from(schema.expenses),
      db.select().from(schema.capitalInjections),
      db.select().from(schema.payouts),
      db.select().from(schema.invoiceLinePresets),
      db.select().from(schema.invoicePagePresets),
      db.select().from(schema.partners)
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
        partners: partnersList
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
