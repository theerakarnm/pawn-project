'use client';

import type { ReadyForPickupItem } from '@/types/api';
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

interface Props {
  data: ReadyForPickupItem[];
  onPickup: (customerId: string, pickedUp: boolean) => void;
}

export function ReadyForPickupTable({ data, onPickup }: Props) {
  if (data.length === 0) {
    return <p className="py-4 text-sm text-muted-foreground">ไม่มีลูกค้าพร้อมรับเครื่อง</p>;
  }

  return (
    <div className="rounded border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>รหัส</TableHead>
            <TableHead>ชื่อ</TableHead>
            <TableHead>เบอร์โทร</TableHead>
            <TableHead>อุปกรณ์</TableHead>
            <TableHead>ชำระครบเมื่อ</TableHead>
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
              <TableCell>{c.phone}</TableCell>
              <TableCell>{c.deviceModel}</TableCell>
              <TableCell>{c.paidDate ? new Date(c.paidDate).toLocaleDateString('th-TH') : '-'}</TableCell>
              <TableCell>
                {c.devicePickedUp ? (
                  <span className="rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">รับเครื่องแล้ว</span>
                ) : (
                  <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">รอรับเครื่อง</span>
                )}
              </TableCell>
              <TableCell>
                {!c.devicePickedUp && (
                  <Button
                    size="sm"
                    className="h-7 text-[10px]"
                    onClick={() => onPickup(c.id, true)}
                  >
                    ยืนยันรับเครื่อง
                  </Button>
                )}
                {c.devicePickedUp && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px]"
                    onClick={() => onPickup(c.id, false)}
                  >
                    เรียกคืนสถานะ
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
