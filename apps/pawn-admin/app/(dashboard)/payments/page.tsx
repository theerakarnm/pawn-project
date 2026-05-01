import { getAllPayments } from '@/lib/api';
import { PaymentLedgerTable } from '@/components/admin/PaymentLedgerTable';

export default async function PaymentsPage() {
  const payments = await getAllPayments();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">All Payments</h1>
        <span className="text-xs text-muted-foreground">{payments.length} total</span>
      </div>
      <PaymentLedgerTable payments={payments} />
    </div>
  );
}
