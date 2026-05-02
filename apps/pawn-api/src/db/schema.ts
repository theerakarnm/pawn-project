import {
  pgTable,
  uuid,
  varchar,
  decimal,
  integer,
  pgEnum,
  timestamp,
  date,
  index,
  check,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const customerStatusEnum = pgEnum('customer_status', [
  'active',
  'paid',
  'overdue',
  'due_soon',
]);
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending_verification',
  'confirmed',
  'rejected',
]);
export const lineProfileStatusEnum = pgEnum('line_profile_status', [
  'pending_customer',
  'linked',
]);

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    installmentCode: varchar('installment_code', { length: 50 })
      .unique()
      .notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    phoneNormalized: varchar('phone_normalized', { length: 20 }).notNull(),
    lineUserId: varchar('line_user_id', { length: 100 }),
    totalPrice: decimal('total_price', { precision: 12, scale: 2 }).notNull(),
    downPayment: decimal('down_payment', { precision: 12, scale: 2 }).notNull(),
    monthlyPayment: decimal('monthly_payment', { precision: 12, scale: 2 }).notNull(),
    totalInstallments: integer('total_installments').notNull(),
    paidInstallments: integer('paid_installments').notNull().default(0),
    remainingBalance: decimal('remaining_balance', { precision: 12, scale: 2 }).notNull(),
    status: customerStatusEnum('status').notNull().default('active'),
    dueDate: date('due_date'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_customers_phone').on(t.phone),
    index('idx_customers_phone_normalized').on(t.phoneNormalized),
    index('idx_customers_status').on(t.status),
    index('idx_customers_line_user_id').on(t.lineUserId),
    check('remaining_balance_non_negative', sql`${t.remainingBalance} >= 0`),
  ],
);

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id),
    lineUserId: varchar('line_user_id', { length: 100 }),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    slipUrl: varchar('slip_url', { length: 500 }).notNull(),
    status: paymentStatusEnum('status').notNull().default('pending_verification'),
    confirmedBy: varchar('confirmed_by', { length: 100 }),
    confirmedAt: timestamp('confirmed_at'),
    rejectedBy: varchar('rejected_by', { length: 100 }),
    rejectedAt: timestamp('rejected_at'),
    rejectReason: varchar('reject_reason', { length: 500 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_payments_customer_id').on(t.customerId),
    index('idx_payments_status').on(t.status),
    index('idx_payments_confirmed_at').on(t.confirmedAt),
  ],
);

export const lineUserProfiles = pgTable(
  'line_user_profiles',
  {
    lineUserId: varchar('line_user_id', { length: 100 }).primaryKey(),
    phoneNormalized: varchar('phone_normalized', { length: 20 }).notNull(),
    name: varchar('name', { length: 100 }),
    birthdate: date('birthdate'),
    email: varchar('email', { length: 200 }),
    lineDisplayName: varchar('line_display_name', { length: 200 }),
    linePictureUrl: varchar('line_picture_url', { length: 500 }),
    status: lineProfileStatusEnum('status').notNull().default('pending_customer'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_line_profiles_phone_normalized').on(t.phoneNormalized),
  ],
);

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type LineUserProfile = typeof lineUserProfiles.$inferSelect;
