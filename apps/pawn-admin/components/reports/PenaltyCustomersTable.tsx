'use client';

import type { PenaltyCustomerItem } from '@/types/api';
import { PaymentModeBadge } from './PaymentModeBadge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface Props {
  data: PenaltyCustomerItem[];
  onAction: (customerId: string, action: 'full' | 'waived' | 'reduced', reducedAmount?: number) => void;
}

export function PenaltyCustomersTable({ data, onAction }: Props) {
  const [reduceInputs, setReduceInputs] = useState<Record<string, string>>({});

  if (data.length === 0) {
    return <p className="py-4 text-sm text-muted-foreground">ไม่มีลูกค้าที่มีค่าปรับ</p>;
  }

  const actionLabel = (action: PenaltyCustomerItem['penaltyAction'], reduced: number | null) => {
    switch (action) {
      case 'full': return <span className="rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">เก็บเต็ม</span>;
      case 'waived': return <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">ยกเว้น</span>;
      case 'reduced': return <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">ลดเหลือ ฿{reduced?.toLocaleString()}</span>;
      default: return <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">รอดำเนินการ</span>;
    }
  };

  return (
    <div className="rounded border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>รหัส</TableHead>
            <TableHead>ชื่อ</TableHead>
            <TableHead>โหมด</TableHead>
            <TableHead>เกิน (วัน)</TableHead>
            <TableHead className="text-right">ค่าปรับ (฿)</TableHead>
            <TableHead>สถานะ</TableHead>
            <TableHead>จัดการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <Link href={`/customers/${c.id}`} className="font-medium underline">{c.installmentCode}</Link>
              </TableCell>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell><PaymentModeBadge mode={c.paymentMode} /></TableCell>
              <TableCell className="text-right">{c.overdueDays} วัน</TableCell>
              <TableCell className="text-right font-semibold text-red-700">
                ฿{c.penaltyAmount.toLocaleString()}
              </TableCell>
              <TableCell>{actionLabel(c.penaltyAction, c.penaltyReducedAmount)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px]"
                    onClick={() => onAction(c.id, 'full')}
                  >
                    เก็บเต็ม
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px]"
                    onClick={() => onAction(c.id, 'waived')}
                  >
                    ยกเว้น
                  </Button>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      placeholder="ลด"
                      className="h-7 w-16 text-[10px]"
                      value={reduceInputs[c.id] ?? ''}
                      onChange={(e) => setReduceInputs({ ...reduceInputs, [c.id]: e.target.value })}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px]"
                      onClick={() => {
                        const val = Number(reduceInputs[c.id]);
                        if (val > 0 && val < c.penaltyAmount) {
                          onAction(c.id, 'reduced', val);
                        }
                      }}
                    >
                      ลด
                    </Button>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
