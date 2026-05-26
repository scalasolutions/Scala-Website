"use server";

import { db } from './index';
import * as schema from './schema';
import { desc, eq } from 'drizzle-orm';

// Check if a real database connection is available and configured
const isDbConfigured = () => {
  return typeof process !== 'undefined' && 
         process.env.DATABASE_URL && 
         process.env.DATABASE_URL !== '' && 
         !process.env.DATABASE_URL.includes('localhost:5432/scala_dashboard');
};

// ============================================================================
// In-Memory Mock Data Fallback
// ============================================================================

export interface MockClient {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  websiteAddress: string | null;
  logoUrl: string | null;
  status: 'pending' | 'active' | 'inactive';
  subscriptionType: 'static' | 'dynamic' | null;
  subscriptionMonths: number | null;
  subscriptionStartDate: Date | null;
  portalPassword: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockInvoice {
  id: string;
  clientId: string;
  invoiceNumber: string;
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'issued' | 'paid' | 'past_due' | 'written_off';
  itemsJson: string;
  issuedAt: Date | null;
  dueDate: Date;
  paidAt: Date | null;
  discountType: 'percentage' | 'fixed' | null;
  discountValue: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockTicket {
  id: string;
  clientId: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'billing' | 'technical' | 'general' | 'feature_request';
  createdAt: Date;
  updatedAt: Date;
}

export interface MockTicketMessage {
  id: string;
  ticketId: string;
  senderType: 'admin' | 'client';
  senderName: string;
  message: string;
  createdAt: Date;
}

// Global In-Memory state for mock data
let mockClients: MockClient[] = [
  {
    id: 'c1111111-1111-1111-1111-111111111111',
    name: 'Fredrick Yang',
    email: 'fredrick@anakweb.com',
    phone: '+628123456789',
    companyName: 'Anak Web',
    websiteAddress: 'https://anakweb.com',
    logoUrl: null,
    status: 'active',
    subscriptionType: 'dynamic',
    subscriptionMonths: 12,
    subscriptionStartDate: new Date('2025-06-01T08:00:00Z'), // Expires June 2026 (~1 month remaining as of May 2026)
    portalPassword: 'scala-fredrick-2026',
    createdAt: new Date('2025-06-01T08:00:00Z'),
    updatedAt: new Date('2026-05-15T08:00:00Z'),
  },
  {
    id: 'c2222222-2222-2222-2222-222222222222',
    name: 'Sarah Connor',
    email: 'sarah@cyberdyne.co',
    phone: '+14159998888',
    companyName: 'Cyberdyne Systems',
    websiteAddress: 'https://cyberdyne.co',
    logoUrl: null,
    status: 'active',
    subscriptionType: 'static',
    subscriptionMonths: 12,
    subscriptionStartDate: new Date('2026-01-01T10:00:00Z'), // Expires Jan 2027 (~7-8 months remaining as of May 2026)
    portalPassword: 'scala-sarah-2026',
    createdAt: new Date('2026-02-10T10:00:00Z'),
    updatedAt: new Date('2026-05-20T10:00:00Z'),
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    name: 'Tony Stark',
    email: 'tony@starkindustries.com',
    phone: '+12128889999',
    companyName: 'Stark Industries',
    websiteAddress: 'https://starkindustries.com',
    logoUrl: null,
    status: 'inactive',
    subscriptionType: null,
    subscriptionMonths: null,
    subscriptionStartDate: null,
    portalPassword: 'scala-tony-2026',
    createdAt: new Date('2025-11-01T09:00:00Z'),
    updatedAt: new Date('2026-04-12T09:00:00Z'),
  },
  {
    id: 'c4444444-4444-4444-4444-444444444444',
    name: 'Bruce Wayne',
    email: 'bruce@wayneenterprises.com',
    phone: '+13125550100',
    companyName: 'Wayne Enterprises',
    websiteAddress: 'https://wayneenterprises.com',
    logoUrl: null,
    status: 'pending',
    subscriptionType: 'static',
    subscriptionMonths: 12,
    subscriptionStartDate: new Date('2026-05-24T14:30:00Z'), // Just started (~12 months remaining)
    portalPassword: 'scala-bruce-2026',
    createdAt: new Date('2026-05-24T14:30:00Z'),
    updatedAt: new Date('2026-05-24T14:30:00Z'),
  },
  {
    id: 'c5555555-5555-5555-5555-555555555555',
    name: 'Aspire Premier Korea',
    email: 'billing@aspirepremier.kr',
    phone: '+8221234567',
    companyName: 'Aspire Premier Korea',
    websiteAddress: 'https://aspirepremier.kr',
    logoUrl: null,
    status: 'active',
    subscriptionType: 'dynamic',
    subscriptionMonths: 3,
    subscriptionStartDate: new Date('2026-04-15T08:00:00Z'), // Expires July 2026 (~1.5 months remaining)
    portalPassword: 'scala-aspire-2026',
    createdAt: new Date('2026-05-20T08:00:00Z'),
    updatedAt: new Date('2026-05-20T08:00:00Z'),
  }
];

let mockInvoices: MockInvoice[] = [
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
    discountType: null,
    discountValue: 0,
    createdAt: new Date('2026-05-01T09:00:00Z'),
    updatedAt: new Date('2026-05-10T15:30:00Z'),
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
    paidAt: null,
    discountType: null,
    discountValue: 0,
    createdAt: new Date('2026-05-20T10:00:00Z'),
    updatedAt: new Date('2026-05-20T10:00:00Z'),
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
    paidAt: null,
    discountType: null,
    discountValue: 0,
    createdAt: new Date('2026-04-10T09:00:00Z'),
    updatedAt: new Date('2026-05-10T09:00:00Z'),
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
    paidAt: null,
    discountType: null,
    discountValue: 0,
    createdAt: new Date('2026-05-25T11:00:00Z'),
    updatedAt: new Date('2026-05-25T11:00:00Z'),
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
    paidAt: new Date('2026-05-26T15:30:00Z'),
    discountType: null,
    discountValue: 0,
    createdAt: new Date('2026-05-25T09:00:00Z'),
    updatedAt: new Date('2026-05-26T15:30:00Z'),
  }
];

let mockTickets: MockTicket[] = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    clientId: 'c1111111-1111-1111-1111-111111111111',
    title: 'Payment Gateway Integration Fails (500 Error)',
    description: 'We are consistently receiving a 500 Server Error response from the checkout webhook whenever a transaction is completed through Midtrans.',
    status: 'open',
    priority: 'urgent',
    category: 'technical',
    createdAt: new Date('2026-05-25T08:30:00Z'),
    updatedAt: new Date('2026-05-25T14:00:00Z'),
  },
  {
    id: 'a2222222-2222-2222-2222-222222222222',
    clientId: 'c2222222-2222-2222-2222-222222222222',
    title: 'Tax miscalculation on Invoice INV-2026-002',
    description: 'The tax percentage was set at 11% but it seems to have calculated 12.5% on the raw total. Please double check the item listing math.',
    status: 'in_progress',
    priority: 'medium',
    category: 'billing',
    createdAt: new Date('2026-05-24T10:15:00Z'),
    updatedAt: new Date('2026-05-25T09:00:00Z'),
  },
  {
    id: 'a3333333-3333-3333-3333-333333333333',
    clientId: 'c3333333-3333-3333-3333-333333333333',
    title: 'Request custom domain setup',
    description: 'We need to migrate our server alias to use star-dashboard.starkindustries.com instead of our old CMS endpoint.',
    status: 'resolved',
    priority: 'high',
    category: 'technical',
    createdAt: new Date('2026-05-10T14:00:00Z'),
    updatedAt: new Date('2026-05-12T16:30:00Z'),
  }
];

let mockTicketMessages: MockTicketMessage[] = [
  {
    id: 'e1111111-1111-1111-1111-111111111111',
    ticketId: 'a1111111-1111-1111-1111-111111111111',
    senderType: 'client',
    senderName: 'Fredrick Yang',
    message: 'We are consistently receiving a 500 Server Error response from the checkout webhook whenever a transaction is completed through Midtrans. This blocks user checkouts.',
    createdAt: new Date('2026-05-25T08:30:00Z'),
  },
  {
    id: 'e2222222-2222-2222-2222-222222222222',
    ticketId: 'a1111111-1111-1111-1111-111111111111',
    senderType: 'admin',
    senderName: 'Scala Support',
    message: 'Hi Fredrick, thank you for raising this. I am checking the webhook receiver logs right now. It looks like it could be a signature key verification mismatch. I will update you in a few.',
    createdAt: new Date('2026-05-25T09:12:00Z'),
  },
  {
    id: 'e3333333-3333-3333-3333-333333333333',
    ticketId: 'a1111111-1111-1111-1111-111111111111',
    senderType: 'client',
    senderName: 'Fredrick Yang',
    message: 'Thanks for the quick reply. Yes, we did regenerate our Midtrans Merchant API keys yesterday, that might indeed be the culprit!',
    createdAt: new Date('2026-05-25T09:40:00Z'),
  },
  {
    id: 'e4444444-4444-4444-4444-444444444444',
    ticketId: 'a2222222-2222-2222-2222-222222222222',
    senderType: 'client',
    senderName: 'Sarah Connor',
    message: 'The tax percentage was set at 11% but it seems to have calculated 12.5% on the raw total. Please double check the item listing math.',
    createdAt: new Date('2026-05-24T10:15:00Z'),
  }
];

// ============================================================================
// Query Executions with Fallback logic
// ============================================================================

// --- CLIENT QUERIES ---
export async function getClients() {
  if (isDbConfigured()) {
    try {
      return await db.query.clients.findMany({
        orderBy: [desc(schema.clients.createdAt)]
      });
    } catch (e) {
      console.warn("DB Query failed, falling back to mock data: ", e);
    }
  }
  return [...mockClients].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getClientById(id: string) {
  if (isDbConfigured()) {
    try {
      const results = await db.select().from(schema.clients).where(eq(schema.clients.id, id));
      return results[0] || null;
    } catch (e) {
      console.warn("DB Query failed, falling back to mock data: ", e);
    }
  }
  return mockClients.find(c => c.id === id) || null;
}

export async function createClient(data: schema.NewClient) {
  if (isDbConfigured()) {
    try {
      const results = await db.insert(schema.clients).values(data).returning();
      return results[0];
    } catch (e) {
      console.warn("DB Insert failed, running mock insert: ", e);
    }
  }
  const newClient: MockClient = {
    id: crypto.randomUUID(),
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    companyName: data.companyName || null,
    websiteAddress: data.websiteAddress || null,
    logoUrl: data.logoUrl || null,
    status: data.status || 'pending',
    subscriptionType: data.subscriptionType || null,
    subscriptionMonths: data.subscriptionMonths !== undefined && data.subscriptionMonths !== null ? Number(data.subscriptionMonths) : null,
    subscriptionStartDate: data.subscriptionStartDate ? new Date(data.subscriptionStartDate) : null,
    portalPassword: data.portalPassword || `scala-${data.name.split(' ')[0].toLowerCase()}-2026`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockClients.push(newClient);
  return newClient;
}

export async function updateClient(id: string, data: Partial<schema.NewClient>) {
  if (isDbConfigured()) {
    try {
      const results = await db.update(schema.clients)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(schema.clients.id, id))
        .returning();
      return results[0];
    } catch (e) {
      console.warn("DB Update failed, running mock update: ", e);
    }
  }
  const idx = mockClients.findIndex(c => c.id === id);
  if (idx !== -1) {
    mockClients[idx] = {
      ...mockClients[idx],
      ...data,
      subscriptionStartDate: data.subscriptionStartDate ? new Date(data.subscriptionStartDate) : mockClients[idx].subscriptionStartDate,
      subscriptionMonths: data.subscriptionMonths !== undefined && data.subscriptionMonths !== null ? Number(data.subscriptionMonths) : mockClients[idx].subscriptionMonths,
      portalPassword: data.portalPassword !== undefined ? data.portalPassword : mockClients[idx].portalPassword,
      updatedAt: new Date()
    } as MockClient;
    return mockClients[idx];
  }
  return null;
}

export async function updateClientStatus(id: string, status: 'pending' | 'active' | 'inactive') {
  if (isDbConfigured()) {
    try {
      const results = await db.update(schema.clients)
        .set({ status, updatedAt: new Date() })
        .where(eq(schema.clients.id, id))
        .returning();
      return results[0];
    } catch (e) {
      console.warn("DB Update failed, running mock update: ", e);
    }
  }
  const idx = mockClients.findIndex(c => c.id === id);
  if (idx !== -1) {
    mockClients[idx] = {
      ...mockClients[idx],
      status,
      updatedAt: new Date()
    };
    return mockClients[idx];
  }
  return null;
}

// --- INVOICE QUERIES ---
export async function getInvoices() {
  if (isDbConfigured()) {
    try {
      return await db.query.invoices.findMany({
        orderBy: [desc(schema.invoices.createdAt)],
        with: {
          client: true
        }
      });
    } catch (e) {
      console.warn("DB Query failed, falling back to mock data: ", e);
    }
  }
  return mockInvoices.map(inv => ({
    ...inv,
    client: mockClients.find(c => c.id === inv.clientId)
  })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function createInvoice(data: schema.NewInvoice) {
  if (isDbConfigured()) {
    try {
      const results = await db.insert(schema.invoices).values(data).returning();
      return results[0];
    } catch (e) {
      console.warn("DB Insert failed, running mock insert: ", e);
    }
  }
  const newInvoice: MockInvoice = {
    id: crypto.randomUUID(),
    clientId: data.clientId,
    invoiceNumber: data.invoiceNumber,
    subtotal: data.subtotal,
    tax: data.tax || 0,
    total: data.total,
    status: data.status || 'draft',
    itemsJson: data.itemsJson,
    issuedAt: data.issuedAt || null,
    dueDate: data.dueDate,
    paidAt: data.paidAt || null,
    discountType: (data.discountType || null) as 'percentage' | 'fixed' | null,
    discountValue: data.discountValue !== undefined && data.discountValue !== null ? Number(data.discountValue) : 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockInvoices.push(newInvoice);
  return newInvoice;
}

export async function updateInvoiceStatus(id: string, status: 'draft' | 'issued' | 'paid' | 'past_due' | 'written_off') {
  if (isDbConfigured()) {
    try {
      const results = await db.update(schema.invoices)
        .set({ 
          status, 
          paidAt: status === 'paid' ? new Date() : null,
          updatedAt: new Date() 
        })
        .where(eq(schema.invoices.id, id))
        .returning();
      return results[0];
    } catch (e) {
      console.warn("DB Update failed, running mock update: ", e);
    }
  }
  const idx = mockInvoices.findIndex(inv => inv.id === id);
  if (idx !== -1) {
    mockInvoices[idx] = {
      ...mockInvoices[idx],
      status,
      paidAt: status === 'paid' ? new Date() : null,
      updatedAt: new Date()
    };
    return mockInvoices[idx];
  }
  return null;
}

export async function updateInvoice(id: string, data: Partial<schema.NewInvoice>) {
  if (isDbConfigured()) {
    try {
      const results = await db.update(schema.invoices)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(schema.invoices.id, id))
        .returning();
      return results[0];
    } catch (e) {
      console.warn("DB Update failed, running mock update: ", e);
    }
  }
  const idx = mockInvoices.findIndex(inv => inv.id === id);
  if (idx !== -1) {
    mockInvoices[idx] = {
      ...mockInvoices[idx],
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : mockInvoices[idx].dueDate,
      issuedAt: data.status ? (data.status !== 'draft' ? new Date() : null) : mockInvoices[idx].issuedAt,
      paidAt: data.status ? (data.status === 'paid' ? new Date() : null) : mockInvoices[idx].paidAt,
      discountType: data.discountType !== undefined ? (data.discountType as 'percentage' | 'fixed' | null) : mockInvoices[idx].discountType,
      discountValue: data.discountValue !== undefined && data.discountValue !== null ? Number(data.discountValue) : mockInvoices[idx].discountValue,
      updatedAt: new Date()
    } as MockInvoice;
    return mockInvoices[idx];
  }
  return null;
}

export async function deleteInvoice(id: string) {
  if (isDbConfigured()) {
    try {
      const results = await db.delete(schema.invoices)
        .where(eq(schema.invoices.id, id))
        .returning();
      return results[0] || null;
    } catch (e) {
      console.warn("DB Delete failed, running mock delete: ", e);
    }
  }
  const idx = mockInvoices.findIndex(inv => inv.id === id);
  if (idx !== -1) {
    const deleted = mockInvoices[idx];
    mockInvoices = mockInvoices.filter(inv => inv.id !== id);
    return deleted;
  }
  return null;
}

// --- SUPPORT TICKETS QUERIES ---
export async function getTickets() {
  if (isDbConfigured()) {
    try {
      return await db.query.tickets.findMany({
        orderBy: [desc(schema.tickets.createdAt)],
        with: {
          client: true,
          messages: true
        }
      });
    } catch (e) {
      console.warn("DB Query failed, falling back to mock data: ", e);
    }
  }
  return mockTickets.map(t => ({
    ...t,
    client: mockClients.find(c => c.id === t.clientId),
    messages: mockTicketMessages.filter(m => m.ticketId === t.id)
  })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getTicketDetails(id: string) {
  if (isDbConfigured()) {
    try {
      return await db.query.tickets.findFirst({
        where: eq(schema.tickets.id, id),
        with: {
          client: true,
          messages: {
            orderBy: [desc(schema.ticketMessages.createdAt)]
          }
        }
      });
    } catch (e) {
      console.warn("DB Query failed, falling back to mock data: ", e);
    }
  }
  const ticket = mockTickets.find(t => t.id === id);
  if (!ticket) return null;
  return {
    ...ticket,
    client: mockClients.find(c => c.id === ticket.clientId),
    messages: mockTicketMessages
      .filter(m => m.ticketId === ticket.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  };
}

export async function createTicket(data: schema.NewTicket) {
  if (isDbConfigured()) {
    try {
      const results = await db.insert(schema.tickets).values(data).returning();
      return results[0];
    } catch (e) {
      console.warn("DB Insert failed, running mock insert: ", e);
    }
  }
  const newTicket: MockTicket = {
    id: crypto.randomUUID(),
    clientId: data.clientId,
    title: data.title,
    description: data.description,
    status: data.status || 'open',
    priority: data.priority || 'medium',
    category: data.category || 'technical',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  mockTickets.push(newTicket);
  return newTicket;
}

export async function createTicketMessage(data: schema.NewTicketMessage) {
  if (isDbConfigured()) {
    try {
      const results = await db.insert(schema.ticketMessages).values(data).returning();
      return results[0];
    } catch (e) {
      console.warn("DB Message Insert failed, running mock insert: ", e);
    }
  }
  const newMessage: MockTicketMessage = {
    id: crypto.randomUUID(),
    ticketId: data.ticketId,
    senderType: data.senderType as 'admin' | 'client',
    senderName: data.senderName,
    message: data.message,
    createdAt: new Date()
  };
  mockTicketMessages.push(newMessage);
  
  // Also update ticket updatedAt
  const idx = mockTickets.findIndex(t => t.id === data.ticketId);
  if (idx !== -1) {
    mockTickets[idx] = {
      ...mockTickets[idx],
      updatedAt: new Date()
    };
  }
  return newMessage;
}

export async function updateTicketStatus(id: string, status: 'open' | 'in_progress' | 'resolved' | 'closed') {
  if (isDbConfigured()) {
    try {
      const results = await db.update(schema.tickets)
        .set({ status, updatedAt: new Date() })
        .where(eq(schema.tickets.id, id))
        .returning();
      return results[0];
    } catch (e) {
      console.warn("DB Update failed, running mock update: ", e);
    }
  }
  const idx = mockTickets.findIndex(t => t.id === id);
  if (idx !== -1) {
    mockTickets[idx] = {
      ...mockTickets[idx],
      status,
      updatedAt: new Date()
    };
    return mockTickets[idx];
  }
  return null;
}

// ============================================================================
// Finance & Split Ledger Data & Queries
// ============================================================================

export interface MockExpense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: Date;
  payer: 'company' | 'fredrick' | 'nicholas';
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockCapitalInjection {
  id: string;
  founderName: 'fredrick' | 'nicholas';
  amount: number;
  date: Date;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockPayout {
  id: string;
  founderName: 'fredrick' | 'nicholas';
  amount: number;
  date: Date;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

let mockExpenses: MockExpense[] = [
  {
    id: 'exp1-1111-1111-1111-111111111111',
    title: 'Vercel Pro Subscription',
    category: 'Hosting & Cloud',
    amount: 320000,
    date: new Date('2026-05-02T10:00:00Z'),
    payer: 'company',
    notes: 'Monthly hosting plan for production app aliases',
    createdAt: new Date('2026-05-02T10:00:00Z'),
    updatedAt: new Date('2026-05-02T10:00:00Z'),
  },
  {
    id: 'exp2-2222-2222-2222-222222222222',
    title: 'OpenAI API Token Usage',
    category: 'API & Software',
    amount: 650000,
    date: new Date('2026-05-10T14:30:00Z'),
    payer: 'fredrick',
    notes: 'LLM credits for AI invoice autofill features',
    createdAt: new Date('2026-05-10T14:30:00Z'),
    updatedAt: new Date('2026-05-10T14:30:00Z'),
  },
  {
    id: 'exp3-3333-3333-3333-333333333333',
    title: 'Google Workspace Licenses',
    category: 'Office & Admin',
    amount: 180000,
    date: new Date('2026-05-14T09:00:00Z'),
    payer: 'company',
    notes: 'Two team email addresses for founders',
    createdAt: new Date('2026-05-14T09:00:00Z'),
    updatedAt: new Date('2026-05-14T09:00:00Z'),
  },
  {
    id: 'exp4-4444-4444-4444-444444444444',
    title: 'Domain renew scala-solutions.com',
    category: 'Hosting & Cloud',
    amount: 220000,
    date: new Date('2026-05-18T11:00:00Z'),
    payer: 'nicholas',
    notes: '2-year domain lock registration fee',
    createdAt: new Date('2026-05-18T11:00:00Z'),
    updatedAt: new Date('2026-05-18T11:00:00Z'),
  },
  {
    id: 'exp5-5555-5555-5555-555555555555',
    title: 'Contractor UI Asset Pack Designs',
    category: 'Contractor & Outsource',
    amount: 1500000,
    date: new Date('2026-05-22T16:00:00Z'),
    payer: 'company',
    notes: 'Outsourced graphics for landing page templates',
    createdAt: new Date('2026-05-22T16:00:00Z'),
    updatedAt: new Date('2026-05-22T16:00:00Z'),
  }
];

let mockCapitalInjections: MockCapitalInjection[] = [
  {
    id: 'inj1-1111-1111-1111-111111111111',
    founderName: 'fredrick',
    amount: 10000000,
    date: new Date('2026-04-01T09:00:00Z'),
    description: 'Initial Seed Capital Injection for Treasury',
    createdAt: new Date('2026-04-01T09:00:00Z'),
    updatedAt: new Date('2026-04-01T09:00:00Z'),
  },
  {
    id: 'inj2-2222-2222-2222-222222222222',
    founderName: 'nicholas',
    amount: 10000000,
    date: new Date('2026-04-01T09:00:00Z'),
    description: 'Initial Seed Capital Injection for Treasury',
    createdAt: new Date('2026-04-01T09:00:00Z'),
    updatedAt: new Date('2026-04-01T09:00:00Z'),
  },
  {
    id: 'inj3-3333-3333-3333-333333333333',
    founderName: 'fredrick',
    amount: 650000,
    date: new Date('2026-05-10T14:30:00Z'),
    description: 'Out-of-pocket payment: OpenAI API Token Usage',
    createdAt: new Date('2026-05-10T14:30:00Z'),
    updatedAt: new Date('2026-05-10T14:30:00Z'),
  },
  {
    id: 'inj4-4444-4444-4444-444444444444',
    founderName: 'nicholas',
    amount: 220000,
    date: new Date('2026-05-18T11:00:00Z'),
    description: 'Out-of-pocket payment: Domain renew scala-solutions.com',
    createdAt: new Date('2026-05-18T11:00:00Z'),
    updatedAt: new Date('2026-05-18T11:00:00Z'),
  }
];

let mockPayouts: MockPayout[] = [
  {
    id: 'pay1-1111-1111-1111-111111111111',
    founderName: 'fredrick',
    amount: 2500000,
    date: new Date('2026-05-15T15:00:00Z'),
    description: 'Mid-month profit share distribution draw',
    createdAt: new Date('2026-05-15T15:00:00Z'),
    updatedAt: new Date('2026-05-15T15:00:00Z'),
  },
  {
    id: 'pay2-2222-2222-2222-222222222222',
    founderName: 'nicholas',
    amount: 2000000,
    date: new Date('2026-05-15T16:00:00Z'),
    description: 'Mid-month profit share distribution draw',
    createdAt: new Date('2026-05-15T16:00:00Z'),
    updatedAt: new Date('2026-05-15T16:00:00Z'),
  }
];

// --- EXPENSES ---
export async function getExpenses() {
  if (isDbConfigured()) {
    try {
      return await db.query.expenses.findMany({
        orderBy: [desc(schema.expenses.date)]
      });
    } catch (e) {
      console.warn("DB Query failed, falling back to mock data: ", e);
    }
  }
  return [...mockExpenses].sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function createExpense(data: schema.NewExpense) {
  if (isDbConfigured()) {
    try {
      const results = await db.insert(schema.expenses).values(data).returning();
      return results[0];
    } catch (e) {
      console.warn("DB Insert failed, running mock insert: ", e);
    }
  }
  const newExpense: MockExpense = {
    id: crypto.randomUUID(),
    title: data.title,
    category: data.category,
    amount: data.amount,
    date: data.date ? new Date(data.date) : new Date(),
    payer: data.payer as any || 'company',
    notes: data.notes || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockExpenses.push(newExpense);
  return newExpense;
}

export async function deleteExpense(id: string) {
  if (isDbConfigured()) {
    try {
      const results = await db.delete(schema.expenses).where(eq(schema.expenses.id, id)).returning();
      return results[0] || null;
    } catch (e) {
      console.warn("DB Delete failed, running mock delete: ", e);
    }
  }
  const idx = mockExpenses.findIndex(exp => exp.id === id);
  if (idx !== -1) {
    const deleted = mockExpenses[idx];
    mockExpenses = mockExpenses.filter(exp => exp.id !== id);
    return deleted;
  }
  return null;
}

// --- CAPITAL INJECTIONS ---
export async function getCapitalInjections() {
  if (isDbConfigured()) {
    try {
      return await db.query.capitalInjections.findMany({
        orderBy: [desc(schema.capitalInjections.date)]
      });
    } catch (e) {
      console.warn("DB Query failed, falling back to mock data: ", e);
    }
  }
  return [...mockCapitalInjections].sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function createCapitalInjection(data: schema.NewCapitalInjection) {
  if (isDbConfigured()) {
    try {
      const results = await db.insert(schema.capitalInjections).values(data).returning();
      return results[0];
    } catch (e) {
      console.warn("DB Insert failed, running mock insert: ", e);
    }
  }
  const newInjection: MockCapitalInjection = {
    id: crypto.randomUUID(),
    founderName: data.founderName as any,
    amount: data.amount,
    date: data.date ? new Date(data.date) : new Date(),
    description: data.description || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockCapitalInjections.push(newInjection);
  return newInjection;
}

// --- PAYOUTS ---
export async function getPayouts() {
  if (isDbConfigured()) {
    try {
      return await db.query.payouts.findMany({
        orderBy: [desc(schema.payouts.date)]
      });
    } catch (e) {
      console.warn("DB Query failed, falling back to mock data: ", e);
    }
  }
  return [...mockPayouts].sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function createPayout(data: schema.NewPayout) {
  if (isDbConfigured()) {
    try {
      const results = await db.insert(schema.payouts).values(data).returning();
      return results[0];
    } catch (e) {
      console.warn("DB Insert failed, running mock insert: ", e);
    }
  }
  const newPayout: MockPayout = {
    id: crypto.randomUUID(),
    founderName: data.founderName as any,
    amount: data.amount,
    date: data.date ? new Date(data.date) : new Date(),
    description: data.description || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockPayouts.push(newPayout);
  return newPayout;
}
