import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const vendors = pgTable('vendors', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  contactName: text('contact_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  address: text('address').notNull(),
  taxId: text('tax_id'),
  notes: text('notes'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}); 