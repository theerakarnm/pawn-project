'use client';

import type { DueCustomerItem } from '@/types/api';
import { PaymentModeBadge } from './PaymentModeBadge';
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
  data: DueCustomerItem[];
}

export function DueCustomersTable({ data }: Props) {
  if (data.length === 0) {
    return <p className="py-4 text-sm text-muted-foreground">ไม่มีลูกค้าที่ถึงกำหนดจ่ายวันนี้</p>;
  }

  return (
    <div className="rounded border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>รหัส</TableHead>
            <TableHead>ชื่อ</TableHead>
            <TableHead>เบอร์โทร</TableHead>
            <TableHead>โหมด</TableHead>
            <TableHead>งวดละ</TableHead>
            <TableHead>คงเหลือ</TableHead>
            <TableHead>กำหนดจ่าย</TableHead>
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
              <TableCell><PaymentModeBadge mode={c.paymentMode} /></TableCell>
              <TableCell>฿{c.monthlyPayment}</TableCell>
              <TableCell className="font-semibold">฿{c.remainingBalance}</TableCell>
              <TableCell>{c.dueDate}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
