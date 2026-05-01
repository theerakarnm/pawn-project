import Link from 'next/link';
import type { CustomerListItem } from '@/types/api';
import { CustomerStatusBadge } from './CustomerStatusBadge';
import { PaymentModeBadge } from '@/components/reports/PaymentModeBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExternalLink } from 'lucide-react';

interface CustomerTableProps {
  customers: CustomerListItem[];
}

export function CustomerTable({ customers }: CustomerTableProps) {
  return (
    <div className="rounded border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <Link href={`/customers/${c.id}`} className="font-medium underline">
                  {c.installmentCode}
                </Link>
              </TableCell>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell>{c.phone}</TableCell>
              <TableCell className="font-semibold">฿{c.remainingBalance}</TableCell>
              <TableCell>
                <CustomerStatusBadge status={c.status} />
              </TableCell>
              <TableCell><PaymentModeBadge mode={c.paymentMode} /></TableCell>
              <TableCell>{c.dueDate ?? '-'}</TableCell>
              <TableCell>
                <Link href={`/clients/${c.id}`} title="LIFF Preview" className="text-muted-foreground hover:text-foreground">
                  <ExternalLink className="size-3.5" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
          {customers.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="py-6 text-center text-muted-foreground">
                No customers found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
