import { pgTable, uuid, text, boolean, timestamp, numeric, date, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// 1. USUARIOS
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  displayName: text('display_name').notNull(),
  authUserId: text('auth_user_id').unique(),
  isGhost: boolean('is_ghost').generatedAlwaysAs(sql`("auth_user_id" IS NULL)`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Secreto de sesión separado
export const userSecrets = pgTable('user_secrets', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).primaryKey(),
  sessionSecret: uuid('session_secret').defaultRandom().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 2. CUENTAS
export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  iconKey: text('icon_key').notNull(),
  currency: text('currency').default('EUR').notNull(),
  inviteToken: uuid('invite_token').defaultRandom().notNull().unique(),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
}, (table) => [
  index('idx_accounts_invite_token').on(table.inviteToken)
]);

// 3. MIEMBROS
export const accountMembers = pgTable('account_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  role: text('role').default('member').notNull(),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('unique_account_user').on(table.accountId, table.userId),
  index('idx_account_members_user').on(table.userId)
]);

// 4. LIBRO MAYOR (LEDGER)
export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // 'expense' | 'transfer'
  description: text('description').notNull(),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').notNull(),
  occurredOn: date('occurred_on').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  index('idx_transactions_account_date').on(table.accountId, table.occurredOn)
]);

export const transactionEntries = pgTable('transaction_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  transactionId: uuid('transaction_id').references(() => transactions.id, { onDelete: 'cascade' }).notNull(),
  accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  paidAmount: numeric('paid_amount', { precision: 12, scale: 2 }).default('0').notNull(),
  owedAmount: numeric('owed_amount', { precision: 12, scale: 2 }).default('0').notNull(),
  netAmount: numeric('net_amount', { precision: 12, scale: 2 }).generatedAlwaysAs(sql`("paid_amount" - "owed_amount")`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('unique_transaction_user').on(table.transactionId, table.userId),
  index('idx_entries_account_user').on(table.accountId, table.userId)
]);

// 5. SALDOS PRECALCULADOS
export const accountBalances = pgTable('account_balances', {
  accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  balance: numeric('balance', { precision: 12, scale: 2 }).default('0').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('pk_account_balances').on(table.accountId, table.userId)
]);

