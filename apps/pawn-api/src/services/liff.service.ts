import { db } from '../db/index.ts';
import { customers, payments, lineUserProfiles } from '../db/schema.ts';
import { eq, and, sql } from 'drizzle-orm';
import { uploadSlip } from '../lib/r2.ts';

export function normalizePhone(phone: string): string {
  return phone.replace(/[-\s]/g, '');
}

export interface LiffSession {
  status: 'needs_kyc' | 'pending_customer' | 'linked';
  installments: InstallmentSummary[];
}

export interface InstallmentSummary {
  id: string;
  installmentCode: string;
  name: string;
  totalPrice: string;
  remainingBalance: string;
  totalInstallments: number;
  paidInstallments: number;
  monthlyPayment: string;
  dueDate: string | null;
  status: string;
}

export async function getLiffSession(lineUserId: string): Promise<LiffSession> {
  const profile = await db
    .select()
    .from(lineUserProfiles)
    .where(eq(lineUserProfiles.lineUserId, lineUserId))
    .then((r) => r.at(0) ?? null);

  if (!profile) {
    return { status: 'needs_kyc', installments: [] };
  }

  if (profile.status === 'pending_customer') {
    return { status: 'pending_customer', installments: [] };
  }

  const linkedCustomers = await db
    .select()
    .from(customers)
    .where(eq(customers.lineUserId, lineUserId));

  return {
    status: 'linked',
    installments: linkedCustomers.map((c): InstallmentSummary => ({
      id: c.id,
      installmentCode: c.installmentCode,
      name: c.name,
      totalPrice: c.totalPrice,
      remainingBalance: c.remainingBalance,
      totalInstallments: c.totalInstallments,
      paidInstallments: c.paidInstallments,
      monthlyPayment: c.monthlyPayment,
      dueDate: c.dueDate,
      status: c.status,
    })),
  };
}

export async function submitPhoneKyc(
  lineUserId: string,
  phone: string,
  displayName: string,
  pictureUrl: string | null,
): Promise<{ matched: boolean; customerCount: number }> {
  const phoneNorm = normalizePhone(phone);

  const matched = await db
    .select()
    .from(customers)
    .where(eq(customers.phoneNormalized, phoneNorm));

  const existingProfile = await db
    .select()
    .from(lineUserProfiles)
    .where(eq(lineUserProfiles.lineUserId, lineUserId))
    .then((r) => r.at(0) ?? null);

  if (matched.length > 0) {
    const conflict = matched.some(
      (c) => c.lineUserId && c.lineUserId !== lineUserId,
    );
    if (conflict) {
      throw new Error('PHONE_LINKED_TO_ANOTHER_LINE');
    }

    if (existingProfile) {
      await db
        .update(lineUserProfiles)
        .set({
          phoneNormalized: phoneNorm,
          name: matched[0]!.name,
          lineDisplayName: displayName,
          linePictureUrl: pictureUrl,
          status: 'linked',
          updatedAt: new Date(),
        })
        .where(eq(lineUserProfiles.lineUserId, lineUserId));
    } else {
      await db.insert(lineUserProfiles).values({
        lineUserId,
        phoneNormalized: phoneNorm,
        name: matched[0]!.name,
        lineDisplayName: displayName,
        linePictureUrl: pictureUrl,
        status: 'linked',
      });
    }

    await db
      .update(customers)
      .set({ lineUserId, updatedAt: new Date() })
      .where(
        and(
          eq(customers.phoneNormalized, phoneNorm),
          sql`${customers.lineUserId} IS NULL`,
        ),
      );

    return { matched: true, customerCount: matched.length };
  }

  if (existingProfile) {
    await db
      .update(lineUserProfiles)
      .set({
        phoneNormalized: phoneNorm,
        lineDisplayName: displayName,
        linePictureUrl: pictureUrl,
        updatedAt: new Date(),
      })
      .where(eq(lineUserProfiles.lineUserId, lineUserId));
  } else {
    await db.insert(lineUserProfiles).values({
      lineUserId,
      phoneNormalized: phoneNorm,
      lineDisplayName: displayName,
      linePictureUrl: pictureUrl,
      status: 'pending_customer',
    });
  }

  return { matched: false, customerCount: 0 };
}

export async function submitPendingProfile(
  lineUserId: string,
  name: string,
  birthdate: string,
  email?: string,
): Promise<void> {
  const existing = await db
    .select()
    .from(lineUserProfiles)
    .where(eq(lineUserProfiles.lineUserId, lineUserId))
    .then((r) => r.at(0) ?? null);

  if (!existing) throw new Error('PROFILE_NOT_FOUND');
  if (existing.status === 'linked') throw new Error('ALREADY_LINKED');

  await db
    .update(lineUserProfiles)
    .set({
      name,
      birthdate,
      email: email ?? null,
      updatedAt: new Date(),
    })
    .where(eq(lineUserProfiles.lineUserId, lineUserId));
}

export async function getInstallmentDetail(
  lineUserId: string,
  customerId: string,
) {
  const customer = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.lineUserId, lineUserId)))
    .then((r) => r.at(0) ?? null);

  if (!customer) throw new Error('NOT_FOUND');

  const paymentRows = await db
    .select()
    .from(payments)
    .where(eq(payments.customerId, customerId))
    .orderBy(sql`${payments.createdAt} DESC`)
    .limit(50);

  return {
    id: customer.id,
    installmentCode: customer.installmentCode,
    name: customer.name,
    phone: customer.phone,
    totalPrice: customer.totalPrice,
    downPayment: customer.downPayment,
    monthlyPayment: customer.monthlyPayment,
    totalInstallments: customer.totalInstallments,
    paidInstallments: customer.paidInstallments,
    remainingBalance: customer.remainingBalance,
    status: customer.status,
    dueDate: customer.dueDate,
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

export async function submitLinkedPayment(
  lineUserId: string,
  customerId: string,
  amount: string,
  slipBuffer: Uint8Array,
) {
  const customer = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.lineUserId, lineUserId)))
    .then((r) => r.at(0) ?? null);

  if (!customer) throw new Error('NOT_FOUND');

  const slipUrl = await uploadSlip(slipBuffer);

  const result = await db
    .insert(payments)
    .values({
      customerId: customer.id,
      lineUserId,
      amount,
      slipUrl,
      status: 'pending_verification',
    })
    .returning();

  const row = result.at(0);
  if (!row) throw new Error('INSERT_FAILED');
  return row;
}
