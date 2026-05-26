import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not defined in the environment.");
  process.exit(1);
}

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client, { schema });

async function seed() {
  console.log("🌱 Starting Neon PostgreSQL database seeding...");

  try {
    // 1. Clean existing records to prevent unique constraints
    console.log("🧹 Cleaning existing database records...");
    await db.delete(schema.ticketMessages);
    await db.delete(schema.tickets);
    await db.delete(schema.invoices);
    await db.delete(schema.clients);

    // 2. Insert Premium Clients
    console.log("👥 Seeding Client Accounts...");
    const clientRecords = await db.insert(schema.clients).values([
      {
        id: 'c1111111-1111-1111-1111-111111111111',
        name: 'Fredrick Yang',
        email: 'fredrick@anakweb.com',
        phone: '+628123456789',
        companyName: 'Anak Web',
        websiteAddress: 'https://anakweb.com',
        status: 'active'
      },
      {
        id: 'c2222222-2222-2222-2222-222222222222',
        name: 'Sarah Connor',
        email: 'sarah@cyberdyne.co',
        phone: '+14159998888',
        companyName: 'Cyberdyne Systems',
        websiteAddress: 'https://cyberdyne.co',
        status: 'active'
      },
      {
        id: 'c3333333-3333-3333-3333-333333333333',
        name: 'Tony Stark',
        email: 'tony@starkindustries.com',
        phone: '+12128889999',
        companyName: 'Stark Industries',
        websiteAddress: 'https://starkindustries.com',
        status: 'inactive'
      },
      {
        id: 'c4444444-4444-4444-4444-444444444444',
        name: 'Bruce Wayne',
        email: 'bruce@wayneenterprises.com',
        phone: '+13125550100',
        companyName: 'Wayne Enterprises',
        websiteAddress: 'https://wayneenterprises.com',
        status: 'pending'
      },
      {
        id: 'c5555555-5555-5555-5555-555555555555',
        name: 'Aspire Premier Korea',
        email: 'billing@aspirepremier.kr',
        phone: '+8221234567',
        companyName: 'Aspire Premier Korea',
        websiteAddress: 'https://aspirepremier.kr',
        status: 'active'
      }
    ]).returning();

    console.log(`✅ Successfully seeded ${clientRecords.length} clients!`);

    // 3. Insert Invoices
    console.log("🧾 Seeding Invoices...");
    const invoiceRecords = await db.insert(schema.invoices).values([
      {
        id: '11111111-1111-1111-1111-111111111111',
        clientId: 'c1111111-1111-1111-1111-111111111111',
        invoiceNumber: 'INV-2026-001',
        subtotal: 12500000,
        tax: 1375000,
        total: 13875000,
        status: 'paid',
        itemsJson: JSON.stringify([
          { name: 'Managed Cloud Hosting - Professional Plan', price: 7500000, quantity: 1 },
          { name: 'Premium Tech Support Service SLA (Month)', price: 5000000, quantity: 1 }
        ]),
        issuedAt: new Date('2026-05-01T09:00:00Z'),
        dueDate: new Date('2026-05-15T09:00:00Z'),
        paidAt: new Date('2026-05-10T15:30:00Z'),
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        clientId: 'c2222222-2222-2222-2222-222222222222',
        invoiceNumber: 'INV-2026-002',
        subtotal: 9000000,
        tax: 990000,
        total: 9990000,
        status: 'issued',
        itemsJson: JSON.stringify([
          { name: 'Custom React Frontend Development', price: 9000000, quantity: 1 }
        ]),
        issuedAt: new Date('2026-05-20T10:00:00Z'),
        dueDate: new Date('2026-06-03T10:00:00Z'),
        paidAt: null
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        clientId: 'c1111111-1111-1111-1111-111111111111',
        invoiceNumber: 'INV-2026-003',
        subtotal: 5000000,
        tax: 550000,
        total: 5550000,
        status: 'past_due',
        itemsJson: JSON.stringify([
          { name: 'SEO Optimization Package & Content Audit', price: 5000000, quantity: 1 }
        ]),
        issuedAt: new Date('2026-04-10T09:00:00Z'),
        dueDate: new Date('2026-04-24T09:00:00Z'),
        paidAt: null
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        clientId: 'c3333333-3333-3333-3333-333333333333',
        invoiceNumber: 'INV-2026-004',
        subtotal: 25000000,
        tax: 2750000,
        total: 27750000,
        status: 'draft',
        itemsJson: JSON.stringify([
          { name: 'Enterprise Architecture & SLA Advisory Retainer', price: 25000000, quantity: 1 }
        ]),
        issuedAt: null,
        dueDate: new Date('2026-06-15T12:00:00Z'),
        paidAt: null
      },
      {
        id: '55555555-5555-5555-5555-555555555555',
        clientId: 'c5555555-5555-5555-5555-555555555555',
        invoiceNumber: 'INV-2026-005',
        subtotal: 7000000,
        tax: 770000,
        total: 7770000,
        status: 'paid',
        itemsJson: JSON.stringify([
          { 
            name: 'Starter Company Profile Package', 
            description: 'Landing Page, Up to 10 Pages\nMobile Responsive\nCustom UI/UX Designs & Animations\nSEO Optimization', 
            price: 5500000, 
            quantity: 1 
          },
          { 
            name: 'Basic Maintenance', 
            description: 'Dependency & Stability checks\nPerformance checks\nBug & Critical Issue fixes\nSEO Optimality checks', 
            price: 125000, 
            quantity: 12 
          }
        ]),
        issuedAt: new Date('2026-05-25T09:00:00Z'),
        dueDate: new Date('2026-06-09T09:00:00Z'),
        paidAt: new Date('2026-05-26T15:30:00Z')
      }
    ]).returning();

    console.log(`✅ Successfully seeded ${invoiceRecords.length} invoices!`);

    // 4. Insert Support Tickets
    console.log("🎫 Seeding Tickets Queue...");
    const ticketRecords = await db.insert(schema.tickets).values([
      {
        id: 'a1111111-1111-1111-1111-111111111111',
        clientId: 'c1111111-1111-1111-1111-111111111111',
        title: 'Payment Gateway Integration Fails (500 Error)',
        description: 'We are consistently receiving a 500 Server Error response from the checkout webhook whenever a transaction is completed through Midtrans.',
        status: 'open',
        priority: 'urgent',
        category: 'technical',
      },
      {
        id: 'a2222222-2222-2222-2222-222222222222',
        clientId: 'c2222222-2222-2222-2222-222222222222',
        title: 'Tax miscalculation on Invoice INV-2026-002',
        description: 'The tax percentage was set at 11% but it seems to have calculated 12.5% on the raw total. Please double check the item listing math.',
        status: 'in_progress',
        priority: 'medium',
        category: 'billing',
      },
      {
        id: 'a3333333-3333-3333-3333-333333333333',
        clientId: 'c3333333-3333-3333-3333-333333333333',
        title: 'Request custom domain setup',
        description: 'We need to migrate our server alias to use star-dashboard.starkindustries.com instead of our old CMS endpoint.',
        status: 'resolved',
        priority: 'high',
        category: 'technical',
      }
    ]).returning();

    console.log(`✅ Successfully seeded ${ticketRecords.length} support tickets!`);

    // 5. Insert Ticket Messages Logs
    console.log("💬 Seeding Ticket Thread logs...");
    await db.insert(schema.ticketMessages).values([
      {
        id: 'e1111111-1111-1111-1111-111111111111',
        ticketId: 'a1111111-1111-1111-1111-111111111111',
        senderType: 'client',
        senderName: 'Fredrick Yang',
        message: 'We are consistently receiving a 500 Server Error response from the checkout webhook whenever a transaction is completed through Midtrans. This blocks user checkouts.'
      },
      {
        id: 'e2222222-2222-2222-2222-222222222222',
        ticketId: 'a1111111-1111-1111-1111-111111111111',
        senderType: 'admin',
        senderName: 'Scala Support',
        message: 'Hi Fredrick, thank you for raising this. I am checking the webhook receiver logs right now. It looks like it could be a signature key verification mismatch. I will update you in a few.'
      },
      {
        id: 'e3333333-3333-3333-3333-333333333333',
        ticketId: 'a1111111-1111-1111-1111-111111111111',
        senderType: 'client',
        senderName: 'Fredrick Yang',
        message: 'Thanks for the quick reply. Yes, we did regenerate our Midtrans Merchant API keys yesterday, that might indeed be the culprit!'
      },
      {
        id: 'e4444444-4444-4444-4444-444444444444',
        ticketId: 'a2222222-2222-2222-2222-222222222222',
        senderType: 'client',
        senderName: 'Sarah Connor',
        message: 'The tax percentage was set at 11% but it seems to have calculated 12.5% on the raw total. Please double check the item listing math.'
      }
    ]);

    console.log("🎉 Database fully populated with initial seed data successfully!");
  } catch (err) {
    console.error("❌ Seeding failed with error: ", err);
  } finally {
    await client.end();
  }
}

seed();
