import { db } from '../db/index.ts';
import { customers, payments } from '../db/schema.ts';
import { eq, and, sql } from 'drizzle-orm';
import { uploadSlip } from '../lib/r2.ts';
import { lineClient } from '../lib/line.ts';
import { buildPaymentConfirmFlex } from '../lib/line.ts';

export interface PaymentQueueItem {
  id: string;
  customerId: string;
  customerName: string;
  phone: string;
  amount: string;
  slipUrl: string;
  status: string;
  createdAt: Date;
  lineUserId: string | null;
}

export async function submitPayment(data: {
  customerId?: string;
  phone?: string;
  amount: string;
  slipBuffer: Uint8Array;
  lineUserId?: string;
}) {
  let customer;
  if (data.customerId) {
    const result = await db
      .select()
      .from(customers)
      .where(eq(customers.id, data.customerId));
    customer = result.at(0);
  } else if (data.phone) {
    const result = await db
      .select()
      .from(customers)
      .where(eq(customers.phone, data.phone));
    customer = result.at(0);
  }
  if (!customer) throw new Error('NOT_FOUND');

  const slipUrl = await uploadSlip(data.slipBuffer);

  const result = await db
    .insert(payments)
    .values({
      customerId: customer.id,
      lineUserId: data.lineUserId ?? customer.lineUserId ?? null,
      amount: data.amount,
      slipUrl,
      status: 'pending_verification',
    })
    .returning();

  const row = result.at(0);
  if (!row) throw new Error('INSERT_FAILED');
  return row;
}

export async function confirmPayment(paymentId: string, confirmedBy: string) {
  const paymentResult = await db
    .select()
    .from(payments)
    .where(eq(payments.id, paymentId));

  const payment = paymentResult.at(0);
  if (!payment) throw new Error('NOT_FOUND');
  if (payment.status !== 'pending_verification') throw new Error('INVALID_STATUS');

  const customerResult = await db
    .select()
    .from(customers)
    .where(eq(customers.id, payment.customerId));

  const customer = customerResult.at(0);
  if (!customer) throw new Error('NOT_FOUND');

  if (Number(payment.amount) > Number(customer.remainingBalance)) {
    throw new Error('INSUFFICIENT_BALANCE');
  }

  await db.transaction(async (tx) => {
    await tx
      .update(customers)
      .set({
        remainingBalance: sql`remaining_balance - ${payment.amount}`,
        paidInstallments: sql`paid_installments + 1`,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, payment.customerId));

    await tx
      .update(payments)
      .set({
        status: 'confirmed',
        confirmedBy,
        confirmedAt: new Date(),
      })
      .where(eq(payments.id, paymentId));
  });

  const updatedCustomerResult = await db
    .select()
    .from(customers)
    .where(eq(customers.id, payment.customerId));
  const updatedCustomer = updatedCustomerResult.at(0);

  if (payment.lineUserId && updatedCustomer) {
    try {
      const flexRequest = buildPaymentConfirmFlex({
        amount: payment.amount,
        remainingBalance: updatedCustomer.remainingBalance,
        nextDueDate: updatedCustomer.dueDate,
        installmentCode: updatedCustomer.installmentCode,
      });
      await lineClient.pushMessage({
        ...flexRequest,
        to: payment.lineUserId,
      });
    } catch (e) {
      console.error('LINE push failed:', e);
    }
  }

  return { paymentId, status: 'confirmed' };
}

export async function rejectPayment(
  paymentId: string,
  rejectedBy: string,
  reason: string,
) {
  const paymentResult = await db
    .select()
    .from(payments)
    .where(eq(payments.id, paymentId));

  const payment = paymentResult.at(0);
  if (!payment) throw new Error('NOT_FOUND');
  if (payment.status !== 'pending_verification') throw new Error('INVALID_STATUS');

  await db
    .update(payments)
    .set({
      status: 'rejected',
      rejectedBy,
      rejectedAt: new Date(),
      rejectReason: reason,
    })
    .where(eq(payments.id, paymentId));

  return { paymentId, status: 'rejected' };
}

export async function listPendingPayments(): Promise<PaymentQueueItem[]> {
  const rows = await db
    .select({
      id: payments.id,
      customerId: payments.customerId,
      customerName: customers.name,
      phone: customers.phone,
      amount: payments.amount,
      slipUrl: payments.slipUrl,
      status: payments.status,
      createdAt: payments.createdAt,
      lineUserId: payments.lineUserId,
    })
    .from(payments)
    .innerJoin(customers, eq(payments.customerId, customers.id))
    .where(eq(payments.status, 'pending_verification'))
    .orderBy(sql`${payments.createdAt} ASC`);

  return rows;
}

export async function getPaymentsByCustomer(customerId: string) {
  return db
    .select()
    .from(payments)
    .where(eq(payments.customerId, customerId))
    .orderBy(sql`${payments.createdAt} DESC`)
    .limit(50);
}
