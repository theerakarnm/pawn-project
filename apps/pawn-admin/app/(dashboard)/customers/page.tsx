import { getCustomers } from '@/lib/api';
import { CustomerTable } from '@/components/customers/CustomerTable';
import { CustomerFilters } from '@/components/admin/CustomerFilters';
import Link from 'next/link';
import { Plus } from 'lucide-react';

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? '1');
  const { customers, total } = await getCustomers({
    search: params.search,
    status: params.status,
    page,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Customers</h1>
          <p className="text-xs text-muted-foreground">{total} total</p>
        </div>
        <Link
          href="/customers/new"
          className="flex items-center gap-1.5 rounded bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
        >
          <Plus className="size-3.5" />
          New Customer
        </Link>
      </div>

      <CustomerFilters
        currentSearch={params.search}
        currentStatus={params.status}
      />

      <CustomerTable customers={customers} />

      {total > 20 && (
        <div className="flex gap-2">
          {page > 1 && (
            <a
              href={`/customers?page=${page - 1}${params.search ? `&search=${params.search}` : ''}${params.status ? `&status=${params.status}` : ''}`}
              className="rounded border px-3 py-1 text-sm"
            >
              Previous
            </a>
          )}
          {page * 20 < total && (
            <a
              href={`/customers?page=${page + 1}${params.search ? `&search=${params.search}` : ''}${params.status ? `&status=${params.status}` : ''}`}
              className="rounded border px-3 py-1 text-sm"
            >
              Next
            </a>
          )}
        </div>
      )}
    </div>
  );
}
