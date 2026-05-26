import { pgTable, uuid, text, timestamp, boolean, integer, bigint, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const clientStatusEnum = pgEnum('client_status', ['pending', 'active', 'inactive']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'issued', 'paid', 'past_due', 'written_off']);
export const ticketStatusEnum = pgEnum('ticket_status', ['open', 'in_progress', 'resolved', 'closed']);
export const ticketPriorityEnum = pgEnum('ticket_priority', ['low', 'medium', 'high', 'urgent']);
export const ticketCategoryEnum = pgEnum('ticket_category', ['billing', 'technical', 'general', 'feature_request']);
export const subscriptionTypeEnum = pgEnum('subscription_type', ['static', 'dynamic']);

// 1. Clients Table
export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  companyName: text('company_name'),
  websiteAddress: text('website_address'),
  logoUrl: text('logo_url'),
  status: clientStatusEnum('status').notNull().default('pending'),
  // Subscription fields
  subscriptionType: subscriptionTypeEnum('subscription_type'),
  subscriptionMonths: integer('subscription_months').default(12),
  subscriptionStartDate: timestamp('subscription_start_date'),
  portalPassword: text('portal_password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 2. Invoices Table
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  invoiceNumber: text('invoice_number').notNull().unique(),
  subtotal: bigint('subtotal', { mode: 'number' }).notNull(),
  tax: bigint('tax', { mode: 'number' }).notNull().default(0),
  total: bigint('total', { mode: 'number' }).notNull(),
  status: invoiceStatusEnum('status').notNull().default('draft'),
  itemsJson: text('items_json').notNull(), // JSON string for billing line items
  issuedAt: timestamp('issued_at'),
  dueDate: timestamp('due_date').notNull(),
  paidAt: timestamp('paid_at'),
  discountType: text('discount_type'), // 'percentage' | 'fixed' | null
  discountValue: integer('discount_value').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const tickets = pgTable('tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: ticketStatusEnum('status').notNull().default('open'),
  priority: ticketPriorityEnum('priority').notNull().default('medium'),
  category: ticketCategoryEnum('category').notNull().default('technical'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 4. Ticket Messages (Threads) Table
export const ticketMessages = pgTable('ticket_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  senderType: text('sender_type').notNull(), // 'admin' or 'client'
  senderName: text('sender_name').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const clientsRelations = relations(clients, ({ many }) => ({
  invoices: many(invoices),
  tickets: many(tickets),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  client: one(clients, { fields: [invoices.clientId], references: [clients.id] }),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  client: one(clients, { fields: [tickets.clientId], references: [clients.id] }),
  messages: many(ticketMessages),
}));

export const ticketMessagesRelations = relations(ticketMessages, ({ one }) => ({
  ticket: one(tickets, { fields: [ticketMessages.ticketId], references: [tickets.id] }),
}));

// Types
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
export type TicketMessage = typeof ticketMessages.$inferSelect;
export type NewTicketMessage = typeof ticketMessages.$inferInsert;
