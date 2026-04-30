import { db } from '../db/index.ts';
import { customers, payments } from '../db/schema.ts';
import { eq, sql, and, gte } from 'drizzle-orm';

export interface DashboardStats {
  totalCustomers: number;
  overdueCount: number;
  todayReceipts: { count: number; total: string };
  monthlyReceipts: { count: number; total: string };
  weeklyChart: { date: string; total: number }[];
}

export async function getStats(): Promise<DashboardStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);

  const [
    totalResult,
    overdueResult,
    todayResult,
    monthlyResult,
    weeklyResult,
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(customers),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(customers)
      .where(eq(customers.status, 'overdue')),
    db
      .select({
        count: sql<number>`count(*)::int`,
        total: sql<string>`coalesce(sum(${payments.amount}), 0)`,
      })
      .from(payments)
      .where(
        and(
          eq(payments.status, 'confirmed'),
          gte(payments.confirmedAt, today),
        ),
      ),
    db
      .select({
        count: sql<number>`count(*)::int`,
        total: sql<string>`coalesce(sum(${payments.amount}), 0)`,
      })
      .from(payments)
      .where(
        and(
          eq(payments.status, 'confirmed'),
          gte(payments.confirmedAt, monthStart),
        ),
      ),
    db
      .select({
        date: sql<string>`date(${payments.confirmedAt})`,
        total: sql<number>`coalesce(sum(cast(${payments.amount} as numeric)), 0)`,
      })
      .from(payments)
      .where(
        and(
          eq(payments.status, 'confirmed'),
          gte(payments.confirmedAt, weekAgo),
        ),
      )
      .groupBy(sql`date(${payments.confirmedAt})`)
      .orderBy(sql`date(${payments.confirmedAt})`),
  ]);

  return {
    totalCustomers: totalResult.at(0)?.count ?? 0,
    overdueCount: overdueResult.at(0)?.count ?? 0,
    todayReceipts: {
      count: todayResult.at(0)?.count ?? 0,
      total: todayResult.at(0)?.total ?? '0',
    },
    monthlyReceipts: {
      count: monthlyResult.at(0)?.count ?? 0,
      total: monthlyResult.at(0)?.total ?? '0',
    },
    weeklyChart: weeklyResult.map((r) => ({
      date: r.date,
      total: Number(r.total),
    })),
  };
}
