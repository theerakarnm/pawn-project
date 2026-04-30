import { db } from '../db/index.ts';
import { customers, payments } from '../db/schema.ts';
import { ilike, or, eq, and, sql } from 'drizzle-orm';

export interface CustomerListItem {
  id: string;
  installmentCode: string;
  name: string;
  phone: string;
  remainingBalance: string;
  status: string;
  dueDate: string | null;
}

export interface CustomerDetail extends CustomerListItem {
  totalPrice: string;
  downPayment: string;
  monthlyPayment: string;
  totalInstallments: number;
  paidInstallments: number;
  lineUserId: string | null;
  createdAt: Date;
  payments: Array<{
    id: string;
    amount: string;
    slipUrl: string;
    status: string;
    confirmedBy: string | null;
    confirmedAt: Date | null;
    rejectedBy: string | null;
    rejectedAt: Date | null;
    rejectReason: string | null;
    createdAt: Date;
  }>;
}

export async function listCustomers(query?: {
  search?: string;
  status?: string;
  page?: number;
}) {
  const page = query?.page ?? 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (query?.status) {
    conditions.push(eq(customers.status, query.status as 'active' | 'paid' | 'overdue' | 'due_soon'));
  }
  if (query?.search) {
    conditions.push(
      or(
        ilike(customers.name, `%${query.search}%`),
        ilike(customers.phone, `%${query.search}%`),
      )!,
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(customers)
      .where(where)
      .orderBy(sql`${customers.createdAt} DESC`)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(customers)
      .where(where),
  ]);

  const total = countResult.at(0)?.count ?? 0;

  return {
    customers: rows.map(
      (r): CustomerListItem => ({
        id: r.id,
        installmentCode: r.installmentCode,
        name: r.name,
        phone: r.phone,
        remainingBalance: r.remainingBalance,
        status: r.status,
        dueDate: r.dueDate,
      }),
    ),
    total,
  };
}

export async function getCustomer(id: string): Promise<CustomerDetail> {
  const result = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id));

  const customer = result.at(0);
  if (!customer) throw new Error('NOT_FOUND');

  const paymentRows = await db
    .select()
    .from(payments)
    .where(eq(payments.customerId, id))
    .orderBy(sql`${payments.createdAt} DESC`)
    .limit(50);

  return {
    id: customer.id,
    installmentCode: customer.installmentCode,
    name: customer.name,
    phone: customer.phone,
    remainingBalance: customer.remainingBalance,
    status: customer.status,
    dueDate: customer.dueDate,
    totalPrice: customer.totalPrice,
    downPayment: customer.downPayment,
    monthlyPayment: customer.monthlyPayment,
    totalInstallments: customer.totalInstallments,
    paidInstallments: customer.paidInstallments,
    lineUserId: customer.lineUserId,
    createdAt: customer.createdAt,
    payments: paymentRows.map((p) => ({
      id: p.id,
      amount: p.amount,
      slipUrl: p.slipUrl,
      status: p.status,
      confirmedBy: p.confirmedBy,
      confirmedAt: p.confirmedAt,
      rejectedBy: p.rejectedBy,
      rejectedAt: p.rejectedAt,
      rejectReason: p.rejectReason,
      createdAt: p.createdAt,
    })),
  };
}

export async function createCustomer(data: {
  installmentCode: string;
  name: string;
  phone: string;
  totalPrice: string;
  downPayment: string;
  monthlyPayment: string;
  totalInstallments: number;
  dueDate?: string;
}) {
  const remainingBalance = String(
    Number(data.totalPrice) - Number(data.downPayment),
  );

  const result = await db
    .insert(customers)
    .values({
      installmentCode: data.installmentCode,
      name: data.name,
      phone: data.phone,
      totalPrice: data.totalPrice,
      downPayment: data.downPayment,
      monthlyPayment: data.monthlyPayment,
      totalInstallments: data.totalInstallments,
      dueDate: data.dueDate,
      remainingBalance,
    })
    .returning();

  const row = result.at(0);
  if (!row) throw new Error('INSERT_FAILED');
  return row;
}

export async function updateCustomer(
  id: string,
  data: {
    name?: string;
    phone?: string;
    monthlyPayment?: string;
    dueDate?: string | null;
    status?: 'active' | 'paid' | 'overdue' | 'due_soon';
  },
) {
  const result = await db
    .update(customers)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(customers.id, id))
    .returning();

  const row = result.at(0);
  if (!row) throw new Error('NOT_FOUND');
  return row;
}

export async function linkLineUser(customerId: string, lineUserId: string) {
  const result = await db
    .update(customers)
    .set({ lineUserId, updatedAt: new Date() })
    .where(eq(customers.id, customerId))
    .returning();

  const row = result.at(0);
  if (!row) throw new Error('NOT_FOUND');
  return row;
}

export async function findByLineUserId(lineUserId: string) {
  const result = await db
    .select()
    .from(customers)
    .where(eq(customers.lineUserId, lineUserId));

  return result.at(0) ?? null;
}
