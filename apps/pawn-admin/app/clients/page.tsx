import { getCustomers } from '@/lib/api';
import Link from 'next/link';
import { CustomerStatusBadge } from '@/components/customers/CustomerStatusBadge';
import { Smartphone, ExternalLink } from 'lucide-react';

export default async function ClientsPage() {
  const { customers } = await getCustomers({});

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Smartphone className="size-5" />
        <div>
          <h1 className="text-lg font-semibold">LIFF Demo</h1>
          <p className="text-xs text-muted-foreground">
            Customer-facing LIFF preview — select a customer to view their mobile experience
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {customers.map((c) => (
          <Link
            key={c.id}
            href={`/clients/${c.id}`}
            className="group flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {c.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{c.name}</div>
              <div className="text-xs text-muted-foreground">
                {c.installmentCode} · ฿{c.remainingBalance}
              </div>
            </div>
            <CustomerStatusBadge status={c.status} />
            <ExternalLink className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        ))}
      </div>

      <div className="rounded border bg-muted p-4 text-xs text-muted-foreground">
        This page simulates the LIFF customer experience. In production, each customer would access
        their own screen via LINE Login. Here you can preview all customer views for demo purposes.
      </div>
    </div>
  );
}
