'use client';

import { useState } from 'react';
import type { PaymentQueueItem } from '@/types/api';
import { CustomerStatusBadge } from '@/components/customers/CustomerStatusBadge';
import { SlipLightbox } from '@/components/payments/SlipLightbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

interface PaymentLedgerTableProps {
  payments: PaymentQueueItem[];
}

export function PaymentLedgerTable({ payments }: PaymentLedgerTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = statusFilter === 'all'
    ? payments
    : payments.filter((p) => p.status === statusFilter);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="pending_verification">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Slip</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <SlipLightbox slipUrl={p.slipUrl} />
                </TableCell>
                <TableCell>
                  <Link href={`/customers/${p.customerId}`} className="font-medium underline">
                    {p.customerName}
                  </Link>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{p.installmentCode}</TableCell>
                <TableCell className="font-semibold">฿{p.amount}</TableCell>
                <TableCell>
                  <CustomerStatusBadge status={p.status} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(p.createdAt).toLocaleString('th-TH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                  No payments found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
