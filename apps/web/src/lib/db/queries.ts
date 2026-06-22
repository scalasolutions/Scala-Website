"use server";

import { db } from './index';
import * as schema from './schema';
import { desc, eq, like } from 'drizzle-orm';
import { put } from '@vercel/blob';
import { auth } from '@/auth';

// Check if a real database connection is available and configured
const isDbConfigured = () => {
  return typeof process !== 'undefined' && 
         !!process.env.DATABASE_URL && 
         process.env.DATABASE_URL !== '';
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
  portalPasswordIsPrivate: boolean;
  sourcedBy: string | null;
  tcStatus: string;
  tcSignedAt: Date | null;
  tcCustomTerms: string | null;
  slaCustomTerms: string | null;
  envRotationInterval: number;
  envRotationLastAt: Date | null;
  stabilityCheckInterval: number;
  stabilityCheckLastAt: Date | null;
  expectationsCheckInterval: number;
  expectationsCheckLastAt: Date | null;
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
  amountPaid: number;
  proofOfPaymentUrl?: string | null;
  status: 'draft' | 'issued' | 'paid' | 'partially_paid' | 'past_due' | 'written_off';
  itemsJson: string;
  includedPagesJson?: string | null;
  issuedAt: Date | null;
  dueDate: Date;
  dpAt?: Date | null;
  paidAt: Date | null;
  discountType: 'percentage' | 'fixed' | null;
  discountValue: number;
  receivedBy: 'company' | 'fredrick' | 'nicholas';
  isDpCollection: boolean;
  paymentMilestonesJson?: string | null;
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

export interface MockPartner {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  referralRate: number;
  bankDetails: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Global In-Memory state for mock data
let mockPartners: MockPartner[] = [];
let mockClients: MockClient[] = [];
let mockInvoices: MockInvoice[] = [];
let mockTickets: MockTicket[] = [];
let mockTicketMessages: MockTicketMessage[] = [];

export interface MockClientTask {
  id: string;
  clientId: string;
  title: string;
  description: string | null;
  status: 'to_prepare' | 'in_progress' | 'achieved';
  targetDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

let mockClientTasks: MockClientTask[] = [];


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
    portalPasswordIsPrivate: data.portalPasswordIsPrivate || false,
    sourcedBy: data.sourcedBy || 'organic',
    tcStatus: (data.tcStatus as 'pending' | 'signed') || 'pending',
    tcSignedAt: data.tcSignedAt ? new Date(data.tcSignedAt) : null,
    tcCustomTerms: data.tcCustomTerms || null,
    slaCustomTerms: data.slaCustomTerms || null,
    envRotationInterval: data.envRotationInterval !== undefined ? Number(data.envRotationInterval) : 6,
    envRotationLastAt: data.envRotationLastAt ? new Date(data.envRotationLastAt) : new Date(),
    stabilityCheckInterval: data.stabilityCheckInterval !== undefined ? Number(data.stabilityCheckInterval) : 1,
    stabilityCheckLastAt: data.stabilityCheckLastAt ? new Date(data.stabilityCheckLastAt) : new Date(),
    expectationsCheckInterval: data.expectationsCheckInterval !== undefined ? Number(data.expectationsCheckInterval) : 3,
    expectationsCheckLastAt: data.expectationsCheckLastAt ? new Date(data.expectationsCheckLastAt) : new Date(),
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
      portalPasswordIsPrivate: data.portalPasswordIsPrivate !== undefined ? data.portalPasswordIsPrivate : mockClients[idx].portalPasswordIsPrivate,
      sourcedBy: data.sourcedBy !== undefined ? data.sourcedBy : mockClients[idx].sourcedBy,
      tcSignedAt: data.tcSignedAt !== undefined ? (data.tcSignedAt ? new Date(data.tcSignedAt) : null) : mockClients[idx].tcSignedAt,
      envRotationLastAt: data.envRotationLastAt !== undefined ? (data.envRotationLastAt ? new Date(data.envRotationLastAt) : null) : mockClients[idx].envRotationLastAt,
      stabilityCheckLastAt: data.stabilityCheckLastAt !== undefined ? (data.stabilityCheckLastAt ? new Date(data.stabilityCheckLastAt) : null) : mockClients[idx].stabilityCheckLastAt,
      expectationsCheckLastAt: data.expectationsCheckLastAt !== undefined ? (data.expectationsCheckLastAt ? new Date(data.expectationsCheckLastAt) : null) : mockClients[idx].expectationsCheckLastAt,
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

export async function deleteClient(id: string) {
  if (isDbConfigured()) {
    try {
      await db.delete(schema.clientTasks).where(eq(schema.clientTasks.clientId, id));
      await db.delete(schema.invoices).where(eq(schema.invoices.clientId, id));
      await db.delete(schema.tickets).where(eq(schema.tickets.clientId, id));
      await db.delete(schema.clients).where(eq(schema.clients.id, id));
      return true;
    } catch (e) {
      console.warn("DB Delete failed, running mock delete: ", e);
    }
  }
  mockClientTasks = mockClientTasks.filter(t => t.clientId !== id);
  mockInvoices = mockInvoices.filter(inv => inv.clientId !== id);
  mockTickets = mockTickets.filter(t => t.clientId !== id);
  mockClients = mockClients.filter(c => c.id !== id);
  return true;
}

// --- CLIENT TASK QUERIES ---
export async function getClientTasks() {
  if (isDbConfigured()) {
    try {
      return await db.query.clientTasks.findMany({
        orderBy: [desc(schema.clientTasks.createdAt)],
        with: {
          client: true
        }
      });
    } catch (e) {
      console.warn("DB Query failed, falling back to mock data: ", e);
      try {
        const liveClients = await db.select().from(schema.clients);
        return mockClientTasks.map(t => ({
          ...t,
          client: liveClients.find(c => c.id === t.clientId)
        })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      } catch (dbErr) {
        console.warn("Failed to fetch live clients for mock fallback:", dbErr);
      }
    }
  }
  return mockClientTasks.map(t => ({
    ...t,
    client: mockClients.find(c => c.id === t.clientId)
  })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getClientTasksByClientId(clientId: string) {
  if (isDbConfigured()) {
    try {
      return await db.query.clientTasks.findMany({
        where: eq(schema.clientTasks.clientId, clientId),
        orderBy: [desc(schema.clientTasks.createdAt)]
      });
    } catch (e) {
      console.warn("DB Query failed, falling back to mock data: ", e);
    }
  }
  return mockClientTasks
    .filter(t => t.clientId === clientId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function createClientTask(data: schema.NewClientTask) {
  if (isDbConfigured()) {
    try {
      const results = await db.insert(schema.clientTasks).values(data).returning();
      return results[0];
    } catch (e) {
      console.warn("DB Insert failed, running mock insert: ", e);
    }
  }
  const newRef: MockClientTask = {
    id: crypto.randomUUID(),
    clientId: data.clientId,
    title: data.title,
    description: data.description || null,
    status: (data.status || 'to_prepare') as 'to_prepare' | 'in_progress' | 'achieved',
    targetDate: data.targetDate ? new Date(data.targetDate) : null,
    completedAt: data.status === 'achieved' ? new Date() : (data.completedAt ? new Date(data.completedAt) : null),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  mockClientTasks.push(newRef);
  return newRef;
}

export async function updateClientTask(id: string, data: Partial<schema.NewClientTask>) {
  if (isDbConfigured()) {
    try {
      const results = await db.update(schema.clientTasks)
        .set({ 
          ...data, 
          completedAt: data.status === 'achieved' ? new Date() : (data.status ? null : undefined),
          updatedAt: new Date() 
        })
        .where(eq(schema.clientTasks.id, id))
        .returning();
      if (results.length > 0) {
        return results[0];
      }
    } catch (e) {
      console.warn("DB Update failed, running mock update: ", e);
    }
  }
  const idx = mockClientTasks.findIndex(t => t.id === id);
  if (idx !== -1) {
    const prevStatus = mockClientTasks[idx].status;
    const nextStatus = data.status || prevStatus;
    let completedAt = mockClientTasks[idx].completedAt;
    if (nextStatus === 'achieved' && prevStatus !== 'achieved') {
      completedAt = new Date();
    } else if (nextStatus !== 'achieved') {
      completedAt = null;
    }
    
    mockClientTasks[idx] = {
      ...mockClientTasks[idx],
      ...data,
      targetDate: data.targetDate !== undefined ? (data.targetDate ? new Date(data.targetDate) : null) : mockClientTasks[idx].targetDate,
      completedAt,
      updatedAt: new Date()
    } as MockClientTask;
    return mockClientTasks[idx];
  }
  return null;
}

export async function deleteClientTask(id: string) {
  if (isDbConfigured()) {
    try {
      const results = await db.delete(schema.clientTasks)
        .where(eq(schema.clientTasks.id, id))
        .returning();
      if (results.length > 0) {
        return results[0];
      }
    } catch (e) {
      console.warn("DB Delete failed, running mock delete: ", e);
    }
  }
  const idx = mockClientTasks.findIndex(t => t.id === id);
  if (idx !== -1) {
    const deleted = mockClientTasks[idx];
    mockClientTasks = mockClientTasks.filter(t => t.id !== id);
    return deleted;
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
    amountPaid: data.amountPaid !== undefined && data.amountPaid !== null ? Number(data.amountPaid) : 0,
    proofOfPaymentUrl: data.proofOfPaymentUrl || null,
    status: data.status || 'draft',
    itemsJson: data.itemsJson,
    includedPagesJson: data.includedPagesJson || null,
    issuedAt: data.issuedAt || null,
    dueDate: data.dueDate,
    paidAt: data.paidAt || null,
    discountType: (data.discountType || null) as 'percentage' | 'fixed' | null,
    discountValue: data.discountValue !== undefined && data.discountValue !== null ? Number(data.discountValue) : 0,
    receivedBy: data.receivedBy as any || 'company',
    isDpCollection: data.isDpCollection || false,
    paymentMilestonesJson: data.paymentMilestonesJson || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockInvoices.push(newInvoice);
  return newInvoice;
}

export async function updateInvoiceStatus(id: string, status: 'draft' | 'issued' | 'paid' | 'partially_paid' | 'past_due' | 'written_off', amountPaid?: number, proofOfPaymentUrl?: string, receivedBy?: 'company' | 'fredrick' | 'nicholas') {
  if (isDbConfigured()) {
    try {
      const existing = await db.select().from(schema.invoices).where(eq(schema.invoices.id, id));
      const existingUrl = existing[0]?.proofOfPaymentUrl;
      let finalUrl = proofOfPaymentUrl;
      if (proofOfPaymentUrl && existingUrl) {
        const urls = existingUrl.split('|').map(u => u.trim()).filter(Boolean);
        if (!urls.includes(proofOfPaymentUrl)) {
          finalUrl = [...urls, proofOfPaymentUrl].join('|');
        } else {
          finalUrl = existingUrl;
        }
      } else if (existingUrl && !proofOfPaymentUrl) {
        finalUrl = existingUrl;
      }

      const results = await db.update(schema.invoices)
        .set({ 
          status, 
          amountPaid: status === 'paid' ? undefined : amountPaid,
          proofOfPaymentUrl: finalUrl,
          receivedBy: receivedBy || undefined,
          dpAt: (status === 'partially_paid' || status === 'paid') ? (existing[0]?.dpAt || new Date()) : null,
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
    const total = mockInvoices[idx].total;
    const finalAmountPaid = status === 'paid' ? total : (amountPaid !== undefined ? amountPaid : mockInvoices[idx].amountPaid);
    
    let finalProofOfPaymentUrl = mockInvoices[idx].proofOfPaymentUrl || null;
    if (proofOfPaymentUrl) {
      if (finalProofOfPaymentUrl) {
        const urls = finalProofOfPaymentUrl.split('|').map(u => u.trim()).filter(Boolean);
        if (!urls.includes(proofOfPaymentUrl)) {
          finalProofOfPaymentUrl = [...urls, proofOfPaymentUrl].join('|');
        }
      } else {
        finalProofOfPaymentUrl = proofOfPaymentUrl;
      }
    }

    const currentInvoice = mockInvoices[idx];
    mockInvoices[idx] = {
      ...currentInvoice,
      status,
      amountPaid: finalAmountPaid,
      proofOfPaymentUrl: finalProofOfPaymentUrl,
      receivedBy: receivedBy || currentInvoice.receivedBy || 'company',
      dpAt: (status === 'partially_paid' || status === 'paid') ? (currentInvoice.dpAt || new Date()) : null,
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
    const updatedStatus = data.status || mockInvoices[idx].status;
    const total = data.total !== undefined ? data.total : mockInvoices[idx].total;
    const updatedAmountPaid = updatedStatus === 'paid' ? total : (data.amountPaid !== undefined && data.amountPaid !== null ? Number(data.amountPaid) : mockInvoices[idx].amountPaid);
    
    mockInvoices[idx] = {
      ...mockInvoices[idx],
      ...data,
      amountPaid: updatedAmountPaid,
      proofOfPaymentUrl: data.proofOfPaymentUrl !== undefined ? data.proofOfPaymentUrl : mockInvoices[idx].proofOfPaymentUrl,
      dueDate: data.dueDate ? new Date(data.dueDate) : mockInvoices[idx].dueDate,
      issuedAt: data.status ? (data.status !== 'draft' ? new Date() : null) : mockInvoices[idx].issuedAt,
      paidAt: data.status ? (data.status === 'paid' ? new Date() : null) : mockInvoices[idx].paidAt,
      discountType: data.discountType !== undefined ? (data.discountType as 'percentage' | 'fixed' | null) : mockInvoices[idx].discountType,
      discountValue: data.discountValue !== undefined && data.discountValue !== null ? Number(data.discountValue) : mockInvoices[idx].discountValue,
      includedPagesJson: data.includedPagesJson !== undefined ? data.includedPagesJson : mockInvoices[idx].includedPagesJson,
      isDpCollection: data.isDpCollection !== undefined ? data.isDpCollection : mockInvoices[idx].isDpCollection,
      paymentMilestonesJson: data.paymentMilestonesJson !== undefined ? data.paymentMilestonesJson : mockInvoices[idx].paymentMilestonesJson,
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

export async function uploadReceiptAction(name: string, base64Data: string) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.warn("BLOB_READ_WRITE_TOKEN is missing. Falling back to storing Base64 receipt data directly in the database.");
    return base64Data;
  }
  
  try {
    const base64Content = base64Data.split(';base64,').pop() || base64Data;
    const buffer = Buffer.from(base64Content, 'base64');
    
    let contentType = 'image/jpeg';
    if (base64Data.startsWith('data:image/png')) contentType = 'image/png';
    else if (base64Data.startsWith('data:image/webp')) contentType = 'image/webp';
    else if (base64Data.startsWith('data:application/pdf')) contentType = 'application/pdf';
    
    const blob = await put(`receipts/${crypto.randomUUID()}-${name}`, buffer, {
      access: 'public',
      contentType: contentType,
      token: token
    });
    
    return blob.url;
  } catch (err) {
    console.error("Vercel Blob upload failed, falling back to Base64: ", err);
    return base64Data;
  }
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
  receiptUrl?: string | null;
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

let mockExpenses: MockExpense[] = [];
let mockCapitalInjections: MockCapitalInjection[] = [];
let mockPayouts: MockPayout[] = [];

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
    receiptUrl: data.receiptUrl || null,
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

export async function deleteCapitalInjection(id: string) {
  if (isDbConfigured()) {
    try {
      const results = await db.delete(schema.capitalInjections).where(eq(schema.capitalInjections.id, id)).returning();
      return results[0] || null;
    } catch (e) {
      console.warn("DB Delete failed, running mock delete: ", e);
    }
  }
  const idx = mockCapitalInjections.findIndex(inj => inj.id === id);
  if (idx !== -1) {
    const deleted = mockCapitalInjections[idx];
    mockCapitalInjections = mockCapitalInjections.filter(inj => inj.id !== id);
    return deleted;
  }
  return null;
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

export async function deletePayout(id: string) {
  if (isDbConfigured()) {
    try {
      const results = await db.delete(schema.payouts).where(eq(schema.payouts.id, id)).returning();
      return results[0] || null;
    } catch (e) {
      console.warn("DB Delete failed, running mock delete: ", e);
    }
  }
  const idx = mockPayouts.findIndex(pay => pay.id === id);
  if (idx !== -1) {
    const deleted = mockPayouts[idx];
    mockPayouts = mockPayouts.filter(pay => pay.id !== id);
    return deleted;
  }
  return null;
}

export async function syncInvoicePayoutAction(
  invoiceNumber: string,
  receivedBy: 'company' | 'fredrick' | 'nicholas',
  amountPaid: number,
  date?: Date | null
) {
  const matchDesc = `%invoice ${invoiceNumber}%`;
  
  if (isDbConfigured()) {
    try {
      // 1. Delete any existing payouts for this invoice number
      await db.delete(schema.payouts).where(like(schema.payouts.description, matchDesc));
      
      // 2. If received by a founder personally and amount > 0, create new payout
      if ((receivedBy === 'fredrick' || receivedBy === 'nicholas') && amountPaid > 0) {
        await db.insert(schema.payouts).values({
          founderName: receivedBy,
          amount: amountPaid,
          date: date ? new Date(date) : new Date(),
          description: `Direct payment received from client for invoice ${invoiceNumber} (Auto Sync)`,
        });
      }
      return true;
    } catch (e) {
      console.warn("DB sync payout failed, falling back to mock: ", e);
    }
  }

  // Mock Fallback
  mockPayouts = mockPayouts.filter(p => !p.description || !p.description.includes(`invoice ${invoiceNumber}`));
  if ((receivedBy === 'fredrick' || receivedBy === 'nicholas') && amountPaid > 0) {
    mockPayouts.push({
      id: crypto.randomUUID(),
      founderName: receivedBy,
      amount: amountPaid,
      date: date ? new Date(date) : new Date(),
      description: `Direct payment received from client for invoice ${invoiceNumber} (Auto Sync)`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  return true;
}

// ============================================================================
// --- INVOICE PRESETS ---
// ============================================================================

import type { InvoiceLinePresetCategory } from '../invoice-preset-categories';

export interface MockInvoiceLinePreset {
  id: string;
  name: string;
  description: string;
  price: number;
  category: InvoiceLinePresetCategory;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockInvoicePagePreset {
  id: string;
  pageKey: string;
  sectionKey: string;
  content: string;
  updatedAt: Date;
}

// Seeded service catalog grouped by category. Prices use the lower bound of
// the quoted range; the description carries the published range for context.
const now = new Date();
let mockInvoiceLinePresets: MockInvoiceLinePreset[] = [
  // ── Website Solutions ──
  {
    id: 'lp_web_starter',
    name: 'Starter Presence Website',
    description:
      'Range: Rp 5jt – 8jt\nTemplate-based website for businesses needing a professional online presence.\n\nIncludes:\n• Up to 5 pages\n• Mobile responsive\n• WhatsApp integration\n• Basic SEO\n• Contact form\n• Fast loading optimization\n\nRevisions: 1 Major, 2 Minor',
    price: 5000000,
    category: 'website',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'lp_web_business',
    name: 'Business Website',
    description:
      'Range: Rp 10jt – 18jt\nCustom-designed website tailored to your business and customer experience.\n\nIncludes:\n• Up to 10 pages\n• Custom UI design\n• CMS integration\n• SEO structure\n• Analytics integration\n• Better animations & interactions\n\nRevisions: 2 Major, 4 Minor',
    price: 10000000,
    category: 'website',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'lp_web_premium',
    name: 'Premium Digital Experience',
    description:
      'Range: Rp 20jt – 45jt+\nFully custom digital brand experience focused on premium positioning and conversion.\n\nIncludes:\n• Fully custom UI/UX\n• Premium interactions\n• Landing page systems\n• Advanced CMS\n• Conversion-focused UX\n• Performance optimization\n\nRevisions: 3 Major, 6 Minor',
    price: 20000000,
    category: 'website',
    createdAt: now,
    updatedAt: now,
  },

  // ── E-Commerce Solutions ──
  {
    id: 'lp_ecom_catalog',
    name: 'Catalog Commerce Store',
    description:
      'Range: Rp 12jt – 20jt\nPlatform options: Shopify, WooCommerce, Custom Storefront.\n\nIncludes:\n• Product catalog system\n• Product categories & filters\n• Product management dashboard\n• WhatsApp checkout\n• Basic inventory tracking\n• SEO-friendly structure\n\nRevisions: 2 Major, 3 Minor',
    price: 12000000,
    category: 'ecommerce',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'lp_ecom_full',
    name: 'Full E-Commerce Platform',
    description:
      'Range: Rp 25jt – 50jt\nPlatform options: Shopify, WooCommerce, Fully Custom Platform.\n\nIncludes:\n• Full online checkout\n• Payment gateway integration\n• Shipping integration\n• Customer accounts\n• Inventory management\n• Order dashboard\n• Analytics dashboard\n\nRevisions: 3 Major, 5 Minor',
    price: 25000000,
    category: 'ecommerce',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'lp_ecom_ecosystem',
    name: 'Commerce Ecosystem Platform',
    description:
      'Range: Rp 60jt – 150jt+\nEnterprise commerce build with deep integrations.\n\nIncludes:\n• Membership systems\n• Loyalty systems\n• ERP/CRM integration\n• Warehouse integration\n• Automation workflows\n• Advanced analytics\n• Scalable architecture\n\nRevisions: Custom project agreement.',
    price: 60000000,
    category: 'ecommerce',
    createdAt: now,
    updatedAt: now,
  },

  // ── Business Systems ──
  {
    id: 'lp_biz_admin_basic',
    name: 'Basic Admin Dashboard',
    description:
      'Range: Rp 6jt – 12jt\n\nIncludes:\n• Admin login\n• CRUD system\n• Basic analytics\n• Role access',
    price: 6000000,
    category: 'business_systems',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'lp_biz_ops_dashboard',
    name: 'Operational Dashboard System',
    description:
      'Range: Rp 15jt – 35jt\n\nIncludes:\n• Inventory management\n• Customer management\n• Reporting system\n• Notifications\n• Export system',
    price: 15000000,
    category: 'business_systems',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'lp_biz_erp',
    name: 'Custom Business System / ERP',
    description:
      'Range: Rp 50jt – 250jt+\n\nIncludes:\n• ERP systems\n• CRM systems\n• Operational workflows\n• Warehouse systems\n• Automation systems',
    price: 50000000,
    category: 'business_systems',
    createdAt: now,
    updatedAt: now,
  },

  // ── CRM Solutions ──
  {
    id: 'lp_crm_lite',
    name: 'CRM Lite',
    description:
      'Range: Rp 12jt – 20jt\n\nIncludes:\n• Lead tracking\n• Kanban pipelines\n• Customer database\n• WhatsApp integration',
    price: 12000000,
    category: 'crm',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'lp_crm_pro',
    name: 'CRM Pro',
    description:
      'Range: Rp 25jt – 60jt\n\nIncludes:\n• Automation\n• Sales analytics\n• Team management\n• Reporting dashboard\n• Integrations',
    price: 25000000,
    category: 'crm',
    createdAt: now,
    updatedAt: now,
  },

  // ── Growth & Marketing ──
  {
    id: 'lp_growth_seo_setup',
    name: 'SEO Foundation Setup',
    description: 'Range: Rp 2jt – 5jt (one-time setup).',
    price: 2000000,
    category: 'growth',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'lp_growth_seo_monthly',
    name: 'Monthly SEO Growth',
    description: 'Range: Rp 2jt – 15jt / month.',
    price: 2000000,
    category: 'growth',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'lp_growth_newsletter_setup',
    name: 'Newsletter & Email Marketing Setup',
    description: 'Range: Rp 2jt – 5jt (one-time setup).',
    price: 2000000,
    category: 'growth',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'lp_growth_email_monthly',
    name: 'Monthly Email Marketing',
    description: 'Range: Rp 1jt – 10jt / month.',
    price: 1000000,
    category: 'growth',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'lp_growth_product_upload',
    name: 'Product Upload Service',
    description: 'Rp 5.000 per SKU.',
    price: 5000,
    category: 'growth',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'lp_growth_seo_article',
    name: 'SEO Article Writing',
    description: 'Rp 300.000 per article.',
    price: 300000,
    category: 'growth',
    createdAt: now,
    updatedAt: now,
  },

  // ── AI & Automation ──
  {
    id: 'lp_ai_chatbot',
    name: 'AI Chatbot Setup',
    description: 'Range: Rp 8jt – 25jt.',
    price: 8000000,
    category: 'ai_automation',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'lp_ai_whatsapp',
    name: 'WhatsApp Automation',
    description: 'Range: Rp 3jt – 20jt.',
    price: 3000000,
    category: 'ai_automation',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'lp_ai_support',
    name: 'AI Customer Support System',
    description: 'Range: Rp 25jt – 100jt+.',
    price: 25000000,
    category: 'ai_automation',
    createdAt: now,
    updatedAt: now,
  },

  // ── Infrastructure & Security ──
  {
    id: 'lp_infra_hosting',
    name: 'Managed Hosting',
    description: 'Range: Rp 300k – 3jt / month.',
    price: 300000,
    category: 'infrastructure',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'lp_infra_email',
    name: 'Business Email',
    description: 'Rp 20k – 100k per user / month.',
    price: 20000,
    category: 'infrastructure',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'lp_infra_storage',
    name: 'Cloud Storage',
    description: 'Usage-based billing.',
    price: 0,
    category: 'infrastructure',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'lp_infra_security',
    name: 'Security & 2FA Setup',
    description: 'Range: Rp 1.5jt – 5jt.',
    price: 1500000,
    category: 'infrastructure',
    createdAt: now,
    updatedAt: now,
  },

  // ── Ongoing Digital Support ──
  {
    id: 'lp_support_essential',
    name: 'Essential Care',
    description:
      'Range: Rp 500k – 1jt / month.\n\nIncludes:\n• Security updates\n• Backups\n• Bug fixes\n• Uptime monitoring\n• Minor edits',
    price: 500000,
    category: 'support',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'lp_support_growth',
    name: 'Growth Support',
    description:
      'Range: Rp 1.5jt – 4jt / month.\n\nIncludes:\n• Everything in Essential\n• Monthly updates\n• SEO improvements\n• Performance optimization\n• Technical consultation',
    price: 1500000,
    category: 'support',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'lp_support_partnership',
    name: 'Digital Partnership',
    description:
      'Range: Rp 5jt – 15jt / month.\n\nIncludes:\n• Priority support\n• Landing page additions\n• Continuous improvements\n• Optimization reviews\n• Strategy consultation\n• Long-term digital support',
    price: 5000000,
    category: 'support',
    createdAt: now,
    updatedAt: now,
  },
];

let mockInvoicePagePresets: MockInvoicePagePreset[] = [
  {
    id: 'pp1',
    pageKey: 'tc1',
    sectionKey: 'timeline',
    content: JSON.stringify([
      'Discovery & Planning: 2–5 Working Days',
      'UI/UX Design: 5–10 Working Days',
      'Development: 10–25 Working Days',
      'Testing & Launch: 3–7 Working Days'
    ]),
    updatedAt: new Date(),
  },
  {
    id: 'pp2',
    pageKey: 'tc2',
    sectionKey: 'maintenance',
    content: JSON.stringify([
      'Maintenance fees that have been paid are non-refundable.',
      'Maintenance covers minor updates, monitoring, and technical support only.',
      'Major redesigns or additional features are excluded unless agreed separately.'
    ]),
    updatedAt: new Date(),
  },
  {
    id: 'pp3',
    pageKey: 'tc2',
    sectionKey: 'payment_terms',
    content: JSON.stringify([
      '50% Down Payment (DP) is required before project scheduling and development begins.',
      'Remaining 50% payment must be completed before final handoff and website launch.',
      'Late payments may result in project delays or temporary pause in development.'
    ]),
    updatedAt: new Date(),
  },
  {
    id: 'pp4',
    pageKey: 'tc2',
    sectionKey: 'scope_changes',
    content: JSON.stringify([
      'Any additional requests outside the agreed scope may require additional charges or timeline adjustments.'
    ]),
    updatedAt: new Date(),
  },
  {
    id: 'pp5',
    pageKey: 'tc2',
    sectionKey: 'client_responsibilities',
    content: JSON.stringify([
      'Providing accurate content/assets',
      'Giving timely feedback',
      'Maintaining communication during development'
    ]),
    updatedAt: new Date(),
  },
  {
    id: 'pp6',
    pageKey: 'tc2',
    sectionKey: 'support',
    content: 'Minor bug fixes after launch are included within the agreed support period. (1 Month). Does not include third-party/server/platform related issues.',
    updatedAt: new Date(),
  },
  {
    id: 'pp7',
    pageKey: 'tc1',
    sectionKey: 'full_page_html',
    content: `<h2>1. Project Workflow</h2>\n<p>Our standard workflow:</p>\n<ol>\n  <li>Client Discovery</li>\n  <li>Asset Handoff</li>\n  <li>UI/UX Design</li>\n  <li>Website Development</li>\n  <li>Testing & Revisions</li>\n  <li>Launch & Handoff</li>\n</ol>\n\n<h2>2. Asset Handoff</h2>\n<p>Development can only begin after all required assets have been submitted by the client.</p>\n<p>Required assets may include:</p>\n<ul>\n  <li>Logo</li>\n  <li>Images/videos</li>\n  <li>Product data</li>\n  <li>Company profile/content</li>\n  <li>Social links</li>\n  <li>Domain/hosting access (if needed)</li>\n</ul>\n<p>Delays in asset submission may affect project timeline.</p>\n\n<h2>3. Revision Policy</h2>\n<p>This project includes:</p>\n<ul>\n  <li>2 Major Review Sessions</li>\n  <li>1 during UI/UX Design</li>\n  <li>1 before Final Launch</li>\n</ul>\n<p>Additional major revisions outside the agreed sessions may incur extra charges.</p>`,
    updatedAt: new Date(),
  },
  {
    id: 'pp8',
    pageKey: 'tc2',
    sectionKey: 'full_page_html',
    content: `<h2>4. Estimated Timeline</h2>\n<p>Phase Estimated Time</p>\n<ul>\n  <li>Discovery & Planning: 2–5 Working Days</li>\n  <li>UI/UX Design: 5–10 Working Days</li>\n  <li>Development: 10–25 Working Days</li>\n  <li>Testing & Launch: 3–7 Working Days</li>\n</ul>\n<p>Timeline may vary depending on project complexity and response time.</p>\n\n<h2>5. Maintenance Terms</h2>\n<p>Maintenance fees that have been paid are non-refundable.</p>\n<p>Maintenance covers minor updates, monitoring, and technical support only.</p>\n<p>Major redesigns or additional features are excluded unless agreed separately.</p>\n\n<h2>6. Payment Terms</h2>\n<p>50% Down Payment (DP) is required before project scheduling and development begins.</p>\n<p>Remaining 50% payment must be completed before final handoff and website launch.</p>\n<p>Development can only begin after:</p>\n<ol>\n  <li>DP payment confirmation</li>\n  <li>Complete asset handoff from client</li>\n</ol>\n<p>Late payments may result in project delays or temporary pause in development.</p>\n\n<h2>7. Scope Changes</h2>\n<p>Any additional requests outside the agreed scope may require:</p>\n<ul>\n  <li>Additional charges</li>\n  <li>Timeline adjustments</li>\n</ul>\n\n<h2>8. Client Responsibilities</h2>\n<p>Client is responsible for:</p>\n<ul>\n  <li>Providing accurate content/assets</li>\n  <li>Giving timely feedback</li>\n  <li>Maintaining communication during development</li>\n</ul>\n\n<h2>9. Post Launch Support</h2>\n<p>Minor bug fixes after launch are included within the agreed support period. <strong>(1 Month)</strong></p>\n<p>Does not include third-party/server/platform related issues.</p>`,
    updatedAt: new Date(),
  }
];

export async function getInvoiceLinePresets() {
  if (isDbConfigured()) {
    try {
      return await db.query.invoiceLinePresets.findMany({
        orderBy: [desc(schema.invoiceLinePresets.createdAt)]
      });
    } catch (e) {
      console.warn("DB Query failed, falling back to mock data: ", e);
    }
  }
  return [...mockInvoiceLinePresets].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function createInvoiceLinePreset(data: { name: string; description?: string | null; price: number }) {
  if (isDbConfigured()) {
    try {
      const results = await db.insert(schema.invoiceLinePresets).values(data).returning();
      return results[0];
    } catch (e) {
      console.warn("DB Insert failed, running mock insert: ", e);
    }
  }
  const newPreset: MockInvoiceLinePreset = {
    id: crypto.randomUUID(),
    name: data.name,
    description: data.description || '',
    price: data.price,
    category: 'uncategorized',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockInvoiceLinePresets.push(newPreset);
  return newPreset;
}

export async function updateInvoiceLinePreset(id: string, data: { name?: string; description?: string | null; price?: number }) {
  if (isDbConfigured()) {
    try {
      const results = await db.update(schema.invoiceLinePresets).set(data).where(eq(schema.invoiceLinePresets.id, id)).returning();
      return results[0];
    } catch (e) {
      console.warn("DB Update failed, running mock update: ", e);
    }
  }
  const idx = mockInvoiceLinePresets.findIndex(p => p.id === id);
  if (idx !== -1) {
    mockInvoiceLinePresets[idx] = {
      ...mockInvoiceLinePresets[idx],
      ...data,
      description: data.description !== undefined ? (data.description || '') : mockInvoiceLinePresets[idx].description,
      updatedAt: new Date(),
    };
    return mockInvoiceLinePresets[idx];
  }
  return null;
}

export async function deleteInvoiceLinePreset(id: string) {
  if (isDbConfigured()) {
    try {
      await db.delete(schema.invoiceLinePresets).where(eq(schema.invoiceLinePresets.id, id));
      return true;
    } catch (e) {
      console.warn("DB Delete failed, running mock delete: ", e);
    }
  }
  mockInvoiceLinePresets = mockInvoiceLinePresets.filter(p => p.id !== id);
  return true;
}

export async function getInvoicePagePresets() {
  if (isDbConfigured()) {
    try {
      return await db.query.invoicePagePresets.findMany();
    } catch (e) {
      console.warn("DB Query failed, falling back to mock data: ", e);
    }
  }
  return [...mockInvoicePagePresets];
}

export async function updateInvoicePagePreset(pageKey: string, sectionKey: string, content: string) {
  if (isDbConfigured()) {
    try {
      const existing = await db.query.invoicePagePresets.findFirst({
        where: (presets, { and, eq }) => and(eq(presets.pageKey, pageKey), eq(presets.sectionKey, sectionKey))
      });
      if (existing) {
        const results = await db.update(schema.invoicePagePresets).set({ content, updatedAt: new Date() }).where(eq(schema.invoicePagePresets.id, existing.id)).returning();
        return results[0];
      } else {
        const results = await db.insert(schema.invoicePagePresets).values({ pageKey, sectionKey, content }).returning();
        return results[0];
      }
    } catch (e) {
      console.warn("DB Update failed, running mock update: ", e);
    }
  }
  const idx = mockInvoicePagePresets.findIndex(p => p.pageKey === pageKey && p.sectionKey === sectionKey);
  if (idx !== -1) {
    mockInvoicePagePresets[idx] = {
      ...mockInvoicePagePresets[idx],
      content,
      updatedAt: new Date(),
    };
    return mockInvoicePagePresets[idx];
  } else {
    const newPreset: MockInvoicePagePreset = {
      id: crypto.randomUUID(),
      pageKey: pageKey as any,
      sectionKey,
      content,
      updatedAt: new Date(),
    };
    mockInvoicePagePresets.push(newPreset);
    return newPreset;
  }
}

export async function deleteInvoicePagePreset(pageKey: string) {
  if (isDbConfigured()) {
    try {
      await db.delete(schema.invoicePagePresets).where(eq(schema.invoicePagePresets.pageKey, pageKey));
      return true;
    } catch (e) {
      console.warn("DB Delete failed, running mock delete: ", e);
    }
  }
  mockInvoicePagePresets = mockInvoicePagePresets.filter(p => p.pageKey !== pageKey);
  return true;
}

// --- AFFILIATE PARTNER QUERIES ---
export async function getPartners() {
  if (isDbConfigured()) {
    try {
      return await db.query.partners.findMany({
        orderBy: [desc(schema.partners.createdAt)]
      });
    } catch (e) {
      console.warn("DB Query failed, falling back to mock data: ", e);
    }
  }
  return [...mockPartners].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function createPartner(data: schema.NewPartner) {
  if (isDbConfigured()) {
    try {
      const results = await db.insert(schema.partners).values(data).returning();
      return results[0];
    } catch (e) {
      console.warn("DB Insert failed, running mock insert: ", e);
    }
  }
  const newPartner: MockPartner = {
    id: crypto.randomUUID(),
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    companyName: data.companyName || null,
    referralRate: data.referralRate !== undefined && data.referralRate !== null ? Number(data.referralRate) : 10,
    bankDetails: data.bankDetails || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockPartners.push(newPartner);
  return newPartner;
}

export async function updatePartner(id: string, data: Partial<schema.NewPartner>) {
  if (isDbConfigured()) {
    try {
      const results = await db.update(schema.partners)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(schema.partners.id, id))
        .returning();
      return results[0];
    } catch (e) {
      console.warn("DB Update failed, running mock update: ", e);
    }
  }
  const idx = mockPartners.findIndex(p => p.id === id);
  if (idx !== -1) {
    mockPartners[idx] = {
      ...mockPartners[idx],
      ...data,
      referralRate: data.referralRate !== undefined && data.referralRate !== null ? Number(data.referralRate) : mockPartners[idx].referralRate,
      updatedAt: new Date()
    } as MockPartner;
    return mockPartners[idx];
  }
  return null;
}

export async function deletePartner(id: string) {
  if (isDbConfigured()) {
    try {
      await db.delete(schema.partners).where(eq(schema.partners.id, id));
      return true;
    } catch (e) {
      console.warn("DB Delete failed, running mock delete: ", e);
    }
  }
  // When deleting a partner, any clients referred by them are updated to 'organic'
  const clientsToUpdate = mockClients.filter(c => c.sourcedBy === id);
  clientsToUpdate.forEach(c => {
    c.sourcedBy = 'organic';
  });
  
  mockPartners = mockPartners.filter(p => p.id !== id);
  return true;
}

// ============================================================================
// Unified & Secure Parallelized Loaders
// ============================================================================

export async function getAdminOverviewData() {
  const session = await auth();
  if (!session || !session.user || (session.user as any).role !== 'admin') {
    throw new Error("Unauthorized access. Admin role required.");
  }

  const [
    clients,
    invoices,
    tickets,
    tasks,
    partners,
    expenses,
    injections,
    payouts
  ] = await Promise.all([
    getClients(),
    getInvoices(),
    getTickets(),
    getClientTasks(),
    getPartners(),
    getExpenses(),
    getCapitalInjections(),
    getPayouts()
  ]);

  return {
    clients,
    invoices,
    tickets,
    tasks,
    partners,
    expenses,
    injections,
    payouts
  };
}

export async function getClientPortalData() {
  const session = await auth();
  if (!session || !session.user || (session.user as any).role !== 'client') {
    throw new Error("Unauthorized access. Client role required.");
  }

  const clientId = (session.user as any).id;

  if (isDbConfigured()) {
    try {
      const [client, invoicesList, ticketsList] = await Promise.all([
        db.query.clients.findFirst({
          where: eq(schema.clients.id, clientId)
        }),
        db.query.invoices.findMany({
          where: eq(schema.invoices.clientId, clientId),
          orderBy: [desc(schema.invoices.createdAt)],
          with: {
            client: true
          }
        }),
        db.query.tickets.findMany({
          where: eq(schema.tickets.clientId, clientId),
          orderBy: [desc(schema.tickets.createdAt)],
          with: {
            client: true,
            messages: true
          }
        })
      ]);

      return {
        client: client || null,
        invoices: invoicesList,
        tickets: ticketsList
      };
    } catch (e) {
      console.warn("DB Query failed for getClientPortalData, falling back to mock data: ", e);
    }
  }

  // Fallback to mock data
  const mockClientRecord = mockClients.find(c => c.id === clientId) || null;
  const mockInvoicesList = mockInvoices
    .filter(inv => inv.clientId === clientId)
    .map(inv => ({
      ...inv,
      client: mockClientRecord
    }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  
  const mockTicketsList = mockTickets
    .filter(t => t.clientId === clientId)
    .map(t => ({
      ...t,
      client: mockClientRecord,
      messages: mockTicketMessages.filter(m => m.ticketId === t.id)
    }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return {
    client: mockClientRecord,
    invoices: mockInvoicesList,
    tickets: mockTicketsList
  };
}

export async function getClientInvoiceDetail(invoiceId: string) {
  const session = await auth();
  if (!session || !session.user || (session.user as any).role !== 'client') {
    throw new Error("Unauthorized access. Client role required.");
  }

  const clientId = (session.user as any).id;

  if (isDbConfigured()) {
    try {
      const activeInvoice = await db.query.invoices.findFirst({
        where: eq(schema.invoices.id, invoiceId),
        with: {
          client: true
        }
      });

      if (!activeInvoice) {
        throw new Error("Invoice not found.");
      }

      if (activeInvoice.clientId !== clientId) {
        throw new Error("Access Denied. You do not have permission to view this invoice.");
      }

      return {
        invoice: activeInvoice,
        client: activeInvoice.client || null
      };
    } catch (e) {
      const err = e as Error;
      if (err.message?.includes("Access Denied") || err.message?.includes("not found")) {
        throw e;
      }
      console.warn("DB Query failed for getClientInvoiceDetail, falling back to mock data: ", e);
    }
  }

  // Fallback to mock data
  const mockInvoiceRecord = mockInvoices.find(inv => inv.id === invoiceId);
  if (!mockInvoiceRecord) {
    throw new Error("Invoice not found.");
  }

  if (mockInvoiceRecord.clientId !== clientId) {
    throw new Error("Access Denied. You do not have permission to view this invoice.");
  }

  const mockClientRecord = mockClients.find(c => c.id === clientId) || null;

  return {
    invoice: {
      ...mockInvoiceRecord,
      client: mockClientRecord
    },
    client: mockClientRecord
  };
}

