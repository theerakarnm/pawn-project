import { getCustomer } from '@/lib/api';
import { ClientLiffMock } from '@/components/clients/ClientLiffMock';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientLiffPage({ params }: PageProps) {
  const { id } = await params;
  let customer;
  try {
    customer = await getCustomer(id);
  } catch {
    notFound();
  }

  return (
    <div className="flex min-h-svh items-start justify-center bg-gray-100 pt-6">
      <div className="w-full max-w-md">
        <div className="mb-3 flex items-center justify-center gap-2">
          <Link
            href="/clients"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" />
            Back to list
          </Link>
          <span className="text-xs text-muted-foreground">|</span>
          <Link
            href={`/customers/${id}`}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Admin view
          </Link>
        </div>
        <div className="overflow-hidden rounded-xl border bg-white shadow-lg">
          <ClientLiffMock customer={customer} />
        </div>
      </div>
    </div>
  );
}
