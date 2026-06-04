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

// 1. Identify which backup file to restore
const backupFilename = process.argv[2];

if (!backupFilename) {
  console.error("❌ Please specify the backup filename to restore. E.g.,");
  console.error("   npx tsx src/lib/db/restore.ts backup-2026-05-30.json");
  console.error("\n📂 List of available backups:");
  const backupDir = path.join(__dirname, 'backups');
  if (fs.existsSync(backupDir)) {
    const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));
    if (files.length === 0) {
      console.log("   (No backup files found in src/lib/db/backups/)");
    } else {
      files.forEach(f => console.log(`   • ${f}`));
    }
  } else {
    console.log("   (Backups folder 'src/lib/db/backups' does not exist yet.)");
  }
  process.exit(1);
}

const backupFilePath = path.isAbsolute(backupFilename)
  ? backupFilename
  : path.join(__dirname, 'backups', backupFilename);

if (!fs.existsSync(backupFilePath)) {
  console.error(`❌ Backup file not found at: ${backupFilePath}`);
  process.exit(1);
}

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client, { schema });

async function runRestore() {
  console.log(`⚠️  WARNING: Restoring will completely overwrite the existing data in the database.`);
  console.log(`📡 Reading backup snapshot: ${path.basename(backupFilePath)}...`);

  try {
    const rawData = fs.readFileSync(backupFilePath, 'utf-8');
    const backup = JSON.parse(rawData);
    
    if (!backup.data) {
      throw new Error("Invalid backup file format: missing 'data' envelope.");
    }

    const {
      partners = [],
      clients = [],
      invoices = [],
      tickets = [],
      ticketMessages = [],
      expenses = [],
      capitalInjections = [],
      payouts = [],
      invoiceLinePresets = [],
      invoicePagePresets = []
    } = backup.data;

    // --- 1. CLEAN EXISTING DATA IN ORDER OF FOREIGN KEYS (Dependencies first) ---
    console.log("🧹 Wiping existing database records to prevent duplicate constraints...");
    await db.delete(schema.ticketMessages);
    await db.delete(schema.tickets);
    await db.delete(schema.invoices);
    await db.delete(schema.clients);
    await db.delete(schema.partners);
    await db.delete(schema.expenses);
    await db.delete(schema.capitalInjections);
    await db.delete(schema.payouts);
    await db.delete(schema.invoiceLinePresets);
    await db.delete(schema.invoicePagePresets);
    console.log("✅ Wiped existing database clean!");

    // --- 2. RESTORE RECORD LISTS IN ORDER OF INDEPENDENT OR DEPENDENT TABLES ---
    
    // a. Partners & Independent Tables
    if (partners.length > 0) {
      console.log(`👥 Restoring ${partners.length} Affiliate Partners...`);
      await db.insert(schema.partners).values(partners);
    }
    
    // b. Clients (Independent, but referenced by invoices/tickets)
    if (clients.length > 0) {
      console.log(`👥 Restoring ${clients.length} Clients...`);
      // Parse ISO Date strings back to Date objects
      const parsedClients = clients.map((c: any) => ({
        ...c,
        subscriptionStartDate: c.subscriptionStartDate ? new Date(c.subscriptionStartDate) : null,
        tcSignedAt: c.tcSignedAt ? new Date(c.tcSignedAt) : null,
        envRotationLastAt: c.envRotationLastAt ? new Date(c.envRotationLastAt) : null,
        stabilityCheckLastAt: c.stabilityCheckLastAt ? new Date(c.stabilityCheckLastAt) : null,
        expectationsCheckLastAt: c.expectationsCheckLastAt ? new Date(c.expectationsCheckLastAt) : null,
        createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
        updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date()
      }));
      await db.insert(schema.clients).values(parsedClients);
    }

    // c. Invoices (Depends on Clients)
    if (invoices.length > 0) {
      console.log(`🧾 Restoring ${invoices.length} Invoices...`);
      const parsedInvoices = invoices.map((i: any) => ({
        ...i,
        issuedAt: i.issuedAt ? new Date(i.issuedAt) : null,
        dueDate: i.dueDate ? new Date(i.dueDate) : new Date(),
        dpAt: i.dpAt ? new Date(i.dpAt) : null,
        paidAt: i.paidAt ? new Date(i.paidAt) : null,
        createdAt: i.createdAt ? new Date(i.createdAt) : new Date(),
        updatedAt: i.updatedAt ? new Date(i.updatedAt) : new Date()
      }));
      await db.insert(schema.invoices).values(parsedInvoices);
    }

    // d. Tickets (Depends on Clients)
    if (tickets.length > 0) {
      console.log(`🎫 Restoring ${tickets.length} Tickets...`);
      const parsedTickets = tickets.map((t: any) => ({
        ...t,
        createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
        updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date()
      }));
      await db.insert(schema.tickets).values(parsedTickets);
    }

    // e. Ticket Messages (Depends on Tickets)
    if (ticketMessages.length > 0) {
      console.log(`💬 Restoring ${ticketMessages.length} Ticket Conversation Messages...`);
      const parsedMessages = ticketMessages.map((m: any) => ({
        ...m,
        createdAt: m.createdAt ? new Date(m.createdAt) : new Date()
      }));
      await db.insert(schema.ticketMessages).values(parsedMessages);
    }

    // f. Expenses
    if (expenses.length > 0) {
      console.log(`💸 Restoring ${expenses.length} Expenses...`);
      const parsedExpenses = expenses.map((e: any) => ({
        ...e,
        date: e.date ? new Date(e.date) : new Date(),
        createdAt: e.createdAt ? new Date(e.createdAt) : new Date(),
        updatedAt: e.updatedAt ? new Date(e.updatedAt) : new Date()
      }));
      await db.insert(schema.expenses).values(parsedExpenses);
    }

    // g. Capital Injections
    if (capitalInjections.length > 0) {
      console.log(`💰 Restoring ${capitalInjections.length} Capital Injections...`);
      const parsedInjections = capitalInjections.map((inj: any) => ({
        ...inj,
        date: inj.date ? new Date(inj.date) : new Date(),
        createdAt: inj.createdAt ? new Date(inj.createdAt) : new Date(),
        updatedAt: inj.updatedAt ? new Date(inj.updatedAt) : new Date()
      }));
      await db.insert(schema.capitalInjections).values(parsedInjections);
    }

    // h. Payouts
    if (payouts.length > 0) {
      console.log(`💸 Restoring ${payouts.length} Founder Payouts...`);
      const parsedPayouts = payouts.map((p: any) => ({
        ...p,
        date: p.date ? new Date(p.date) : new Date(),
        createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
        updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date()
      }));
      await db.insert(schema.payouts).values(parsedPayouts);
    }

    // i. Presets (Line items & Page descriptions)
    if (invoiceLinePresets.length > 0) {
      console.log(`📦 Restoring ${invoiceLinePresets.length} Service Line Presets...`);
      const parsedLinePresets = invoiceLinePresets.map((lp: any) => ({
        ...lp,
        createdAt: lp.createdAt ? new Date(lp.createdAt) : new Date(),
        updatedAt: lp.updatedAt ? new Date(lp.updatedAt) : new Date()
      }));
      await db.insert(schema.invoiceLinePresets).values(parsedLinePresets);
    }

    if (invoicePagePresets.length > 0) {
      console.log(`📄 Restoring ${invoicePagePresets.length} Agreement Page Presets...`);
      const parsedPagePresets = invoicePagePresets.map((pp: any) => ({
        ...pp,
        updatedAt: pp.updatedAt ? new Date(pp.updatedAt) : new Date()
      }));
      await db.insert(schema.invoicePagePresets).values(parsedPagePresets);
    }

    console.log(`\n🎉 Database fully restored successfully from ${path.basename(backupFilePath)}!`);

  } catch (err) {
    console.error("❌ Database restore failed with error: ", err);
  } finally {
    await client.end();
  }
}

runRestore();
