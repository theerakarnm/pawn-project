import { getPendingPayments } from '@/lib/api';
import { SlipQueue } from '@/components/payments/SlipQueue';

export default async function QueuePage() {
  const payments = await getPendingPayments();

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Slip Verification Queue</h1>
      <SlipQueue initialPayments={payments} />
    </div>
  );
}
