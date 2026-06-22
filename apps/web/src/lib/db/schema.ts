import { pgTable, uuid, text, timestamp, boolean, integer, bigint, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const clientStatusEnum = pgEnum('client_status', ['pending', 'active', 'inactive']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'issued', 'paid', 'partially_paid', 'past_due', 'written_off']);
export const ticketStatusEnum = pgEnum('ticket_status', ['open', 'in_progress', 'resolved', 'closed']);
export const ticketPriorityEnum = pgEnum('ticket_priority', ['low', 'medium', 'high', 'urgent']);
export const ticketCategoryEnum = pgEnum('ticket_category', ['billing', 'technical', 'general', 'feature_request']);
export const subscriptionTypeEnum = pgEnum('subscription_type', ['static', 'dynamic']);
export const clientTaskStatusEnum = pgEnum('client_task_status', ['to_prepare', 'in_progress', 'achieved']);


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
  portalPasswordIsPrivate: boolean('portal_password_is_private').notNull().default(false),
  sourcedBy: text('sourced_by').notNull().default('organic'),
  // SLA & T&C fields
  tcStatus: text('tc_status').notNull().default('pending'), // 'pending' | 'signed'
  tcSignedAt: timestamp('tc_signed_at'),
  tcCustomTerms: text('tc_custom_terms'),
  slaCustomTerms: text('sla_custom_terms'),
  // Maintenance reminder intervals (in months) and last completion dates
  envRotationInterval: integer('env_rotation_interval').notNull().default(6),
  envRotationLastAt: timestamp('env_rotation_last_at'),
  stabilityCheckInterval: integer('stability_check_interval').notNull().default(1),
  stabilityCheckLastAt: timestamp('stability_check_last_at'),
  expectationsCheckInterval: integer('expectations_check_interval').notNull().default(3),
  expectationsCheckLastAt: timestamp('expectations_check_last_at'),
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
  amountPaid: bigint('amount_paid', { mode: 'number' }).notNull().default(0),
  proofOfPaymentUrl: text('proof_of_payment_url'),
  status: invoiceStatusEnum('status').notNull().default('draft'),
  itemsJson: text('items_json').notNull(), // JSON string for billing line items
  includedPagesJson: text('included_pages_json'), // JSON list of included custom/default page keys
  issuedAt: timestamp('issued_at'),
  dueDate: timestamp('due_date').notNull(),
  dpAt: timestamp('dp_at'),
  paidAt: timestamp('paid_at'),
  discountType: text('discount_type'), // 'percentage' | 'fixed' | null
  discountValue: integer('discount_value').default(0),
  receivedBy: text('received_by').notNull().default('company'), // 'company' | 'fredrick' | 'nicholas'
  isDpCollection: boolean('is_dp_collection').notNull().default(false),
  paymentMilestonesJson: text('payment_milestones_json'),
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
  tasks: many(clientTasks),
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

// 5. Expenses Table
export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  date: timestamp('date').notNull().defaultNow(),
  payer: text('payer').notNull().default('company'), // 'company' | 'fredrick' | 'nicholas'
  notes: text('notes'),
  receiptUrl: text('receipt_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 6. Capital Injections Table
export const capitalInjections = pgTable('capital_injections', {
  id: uuid('id').primaryKey().defaultRandom(),
  founderName: text('founder_name').notNull(), // 'fredrick' | 'nicholas'
  amount: bigint('amount', { mode: 'number' }).notNull(),
  date: timestamp('date').notNull().defaultNow(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 7. Payouts Table
export const payouts = pgTable('payouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  founderName: text('founder_name').notNull(), // 'fredrick' | 'nicholas'
  amount: bigint('amount', { mode: 'number' }).notNull(),
  date: timestamp('date').notNull().defaultNow(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 8. Invoice Line Presets Table
export const invoiceLinePresets = pgTable('invoice_line_presets', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  price: bigint('price', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 9. Invoice Page Presets Table
export const invoicePagePresets = pgTable('invoice_page_presets', {
  id: uuid('id').primaryKey().defaultRandom(),
  pageKey: text('page_key').notNull(), // 'cover' | 'tc1' | 'tc2'
  sectionKey: text('section_key').notNull(), // 'timeline' | 'maintenance' | 'payment_terms' | 'scope_changes' | 'client_responsibilities' | 'support'
  content: text('content').notNull(), // JSON string or block text
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 10. Affiliate Partners Table
export const partners = pgTable('partners', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  companyName: text('company_name'),
  referralRate: integer('referral_rate').default(10).notNull(), // rate in percentage, defaults to 10%
  bankDetails: text('bank_details'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 11. Client Tasks Table
export const clientTasks = pgTable('client_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  status: clientTaskStatusEnum('status').notNull().default('to_prepare'),
  targetDate: timestamp('target_date'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const clientTasksRelations = relations(clientTasks, ({ one }) => ({
  client: one(clients, { fields: [clientTasks.clientId], references: [clients.id] }),
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
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
export type CapitalInjection = typeof capitalInjections.$inferSelect;
export type NewCapitalInjection = typeof capitalInjections.$inferInsert;
export type Payout = typeof payouts.$inferSelect;
export type NewPayout = typeof payouts.$inferInsert;
export type InvoiceLinePreset = typeof invoiceLinePresets.$inferSelect;
export type NewInvoiceLinePreset = typeof invoiceLinePresets.$inferInsert;
export type InvoicePagePreset = typeof invoicePagePresets.$inferSelect;
export type NewInvoicePagePreset = typeof invoicePagePresets.$inferInsert;
export type Partner = typeof partners.$inferSelect;
export type NewPartner = typeof partners.$inferInsert;
export type ClientTask = typeof clientTasks.$inferSelect;
export type NewClientTask = typeof clientTasks.$inferInsert;

