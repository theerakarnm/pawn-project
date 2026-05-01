import type { DueTodayItem } from '@/types/api';
import { CustomerStatusBadge } from '@/components/customers/CustomerStatusBadge';
import Link from 'next/link';

interface DueTodayListProps {
  items: DueTodayItem[];
}

export function DueTodayList({ items }: DueTodayListProps) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-medium">Due Soon / Overdue</h2>
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">No upcoming or overdue payments</p>
      )}
      <div className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/customers/${item.id}`}
            className="flex items-center gap-3 rounded border p-3 transition-colors hover:bg-muted"
          >
            <div className="flex-1">
              <div className="text-sm font-medium">{item.customerName}</div>
              <div className="text-xs text-muted-foreground">{item.installmentCode}</div>
            </div>
            <div className="text-sm font-semibold">฿{item.amount}</div>
            <CustomerStatusBadge status={item.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}
