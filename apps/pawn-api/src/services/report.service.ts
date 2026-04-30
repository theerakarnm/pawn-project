import { db } from '../db/index.ts';
import { payments } from '../db/schema.ts';
import { eq, and, gte, sql } from 'drizzle-orm';
import ExcelJS from 'exceljs';

export interface MonthlyReport {
  date: string;
  paymentCount: number;
  totalAmount: string;
  customerCount: number;
}

export async function getMonthlySummary(year: number, month: number): Promise<MonthlyReport[]> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const rows = await db
    .select({
      date: sql<string>`date(${payments.confirmedAt})`,
      paymentCount: sql<number>`count(*)::int`,
      totalAmount: sql<string>`coalesce(sum(cast(${payments.amount} as numeric)), 0)`,
      customerCount: sql<number>`count(distinct ${payments.customerId})::int`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.status, 'confirmed'),
        gte(payments.confirmedAt, startDate),
        sql`${payments.confirmedAt} < ${endDate}`,
      ),
    )
    .groupBy(sql`date(${payments.confirmedAt})`)
    .orderBy(sql`date(${payments.confirmedAt})`);

  return rows;
}

export async function exportToExcel(year: number, month: number): Promise<Buffer> {
  const data = await getMonthlySummary(year, month);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('รายงานประจำเดือน');

  sheet.columns = [
    { header: 'วันที่', key: 'date', width: 15 },
    { header: 'จำนวนรายการ', key: 'paymentCount', width: 15 },
    { header: 'ยอดรวม (บาท)', key: 'totalAmount', width: 18 },
    { header: 'จำนวนลูกค้า', key: 'customerCount', width: 15 },
  ];

  for (const row of data) {
    sheet.addRow({
      date: row.date,
      paymentCount: row.paymentCount,
      totalAmount: Number(row.totalAmount),
      customerCount: row.customerCount,
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
