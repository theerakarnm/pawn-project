'use client';

import type { RevenueSummary } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, Receipt } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Props {
  data: RevenueSummary;
}

export function RevenueSummaryCard({ data }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wallet className="size-3.5" />
              รับวันนี้
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">฿{data.today.total}</div>
            <p className="text-xs text-muted-foreground">{data.today.count} รายการ</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="size-3.5" />
              เดือนนี้
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">฿{data.thisMonth.total}</div>
            <p className="text-xs text-muted-foreground">{data.thisMonth.count} รายการ</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Receipt className="size-3.5" />
              เดือนก่อน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">฿{data.lastMonth.total}</div>
            <p className="text-xs text-muted-foreground">{data.lastMonth.count} รายการ</p>
          </CardContent>
        </Card>
      </div>

      {data.dailyBreakdown.length > 0 && (
        <div className="rounded border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>วันที่</TableHead>
                <TableHead className="text-right">จำนวนรายการ</TableHead>
                <TableHead className="text-right">ยอดรวม (฿)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.dailyBreakdown.map((row) => (
                <TableRow key={row.date}>
                  <TableCell>{new Date(row.date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}</TableCell>
                  <TableCell className="text-right">{row.count}</TableCell>
                  <TableCell className="text-right font-semibold">฿{row.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
