'use client';

import type { InactiveSavingsItem } from '@/types/api';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Props {
  data: InactiveSavingsItem[];
}

export function InactiveSavingsTable({ data }: Props) {
  if (data.length === 0) {
    return <p className="py-4 text-sm text-muted-foreground">ไม่มีลูกค้าออมที่หายไปนานเกิน 30 วัน</p>;
  }

  return (
    <div className="rounded border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>รหัส</TableHead>
            <TableHead>ชื่อ</TableHead>
            <TableHead>เบอร์โทร</TableHead>
            <TableHead>คงเหลือ</TableHead>
            <TableHead>ชำระล่าสุด</TableHead>
            <TableHead className="text-right">หาย (วัน)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <Link href={`/customers/${c.id}`} className="font-medium underline">{c.installmentCode}</Link>
              </TableCell>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell>{c.phone}</TableCell>
              <TableCell className="font-semibold">฿{c.remainingBalance}</TableCell>
              <TableCell>{c.lastPaymentDate ? new Date(c.lastPaymentDate).toLocaleDateString('th-TH') : 'ไม่เคยชำระ'}</TableCell>
              <TableCell className="text-right">
                <span className="rounded bg-amber-50 px-2 py-0.5 text-sm font-semibold text-amber-700">
                  {c.inactiveDays} วัน
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
