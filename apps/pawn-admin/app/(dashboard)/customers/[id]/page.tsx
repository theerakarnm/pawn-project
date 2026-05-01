import { getCustomer } from '@/lib/api';
import { CustomerStatusBadge } from '@/components/customers/CustomerStatusBadge';
import { Progress } from '@/components/ui/progress';
import { SlipLightbox } from '@/components/payments/SlipLightbox';
import type { PaymentItem, CustomerIdentityDocument } from '@/types/api';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Phone,
  Smartphone,
  MessageCircle,
  Calendar,
  FileText,
  ExternalLink,
  User,
  CreditCard,
  ImageIcon,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerProfilePage({ params }: PageProps) {
  const { id } = await params;
  let customer;
  try {
    customer = await getCustomer(id);
  } catch {
    notFound();
  }

  const progressPercent =
    customer.totalInstallments > 0
      ? Math.round(
          (customer.paidInstallments / customer.totalInstallments) * 100,
        )
      : 0;

  const confirmedPayments = customer.payments.filter((p) => p.status === 'confirmed');
  const pendingPayments = customer.payments.filter((p) => p.status === 'pending_verification');
  const rejectedPayments = customer.payments.filter((p) => p.status === 'rejected');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">{customer.name}</h1>
            <CustomerStatusBadge status={customer.status} />
          </div>
          <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Phone className="size-3.5" />
              {customer.phone}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="size-3.5" />
              {customer.installmentCode}
            </span>
            <span className="flex items-center gap-1">
              <Smartphone className="size-3.5" />
              {customer.deviceModel}
            </span>
            {customer.lineDisplayName && (
              <span className="flex items-center gap-1 text-green-700">
                <MessageCircle className="size-3.5" />
                {customer.lineDisplayName}
              </span>
            )}
          </div>
        </div>
        <Link
          href={`/clients/${customer.id}`}
          className="flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
        >
          <ExternalLink className="size-3.5" />
          LIFF Preview
        </Link>
      </div>

      {customer.notes && (
        <div className="rounded border bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Note: {customer.notes}
        </div>
      )}

      {customer.identityDocuments.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Identity Documents</h2>
          <div className="grid grid-cols-3 gap-4">
            {customer.identityDocuments.map((doc: CustomerIdentityDocument) => (
              <IdentityDocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        </div>
      )}

      {customer.identityDocuments.length === 0 && (
        <div className="rounded border bg-muted px-3 py-2 text-xs text-muted-foreground">
          No identity documents uploaded yet
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold">Contract Summary</h2>

          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span>
                {customer.paidInstallments} / {customer.totalInstallments} งวด
              </span>
              <span className="font-medium">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} />
          </div>

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">อุปกรณ์</span>
              <span className="font-medium">{customer.deviceModel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ราคาเต็ม</span>
              <span>฿{customer.totalPrice}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">เงินดาวน์</span>
              <span>฿{customer.downPayment}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">งวดละ</span>
              <span>฿{customer.monthlyPayment}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>คงเหลือ</span>
              <span className="text-[#E74C3C]">฿{customer.remainingBalance}</span>
            </div>
            {customer.dueDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">งวดถัดไป</span>
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  {customer.dueDate}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-1 text-xs text-muted-foreground">
            <div>Created: {new Date(customer.createdAt).toLocaleDateString('th-TH')}</div>
            <div>LINE: {customer.lineDisplayName ? 'Connected' : 'Not linked'}</div>
          </div>
        </div>

        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Payment History</h2>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span>{confirmedPayments.length} confirmed</span>
              {pendingPayments.length > 0 && (
                <span className="text-amber-600">{pendingPayments.length} pending</span>
              )}
              {rejectedPayments.length > 0 && (
                <span className="text-red-600">{rejectedPayments.length} rejected</span>
              )}
            </div>
          </div>

          {customer.payments.length === 0 && (
            <p className="text-sm text-muted-foreground">No payments yet</p>
          )}

          <div className="space-y-2">
            {customer.payments.map((p: PaymentItem) => (
              <PaymentRow key={p.id} payment={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentRow({ payment }: { payment: PaymentItem }) {
  return (
    <div className="flex items-center gap-3 rounded border p-3 text-sm">
      <SlipLightbox slipUrl={payment.slipUrl} />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">฿{payment.amount}</span>
          <CustomerStatusBadge status={payment.status} />
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {new Date(payment.createdAt).toLocaleString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
        {payment.status === 'confirmed' && payment.confirmedBy && (
          <div className="mt-0.5 text-xs text-green-700">
            Confirmed by {payment.confirmedBy}
            {payment.confirmedAt && (
              <> · {new Date(payment.confirmedAt).toLocaleString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</>
            )}
          </div>
        )}
        {payment.status === 'rejected' && payment.rejectReason && (
          <div className="mt-0.5 text-xs text-red-700">
            Rejected: {payment.rejectReason}
          </div>
        )}
      </div>
    </div>
  );
}

function IdentityDocumentCard({ doc }: { doc: CustomerIdentityDocument }) {
  const typeLabel: Record<string, string> = {
    face: 'Face Photo',
    id_card_front: 'ID Card (Front)',
    id_card_back: 'ID Card (Back)',
    other: 'Document',
  };
  const typeIcon: Record<string, React.ReactNode> = {
    face: <User className="size-3.5" />,
    id_card_front: <CreditCard className="size-3.5" />,
    id_card_back: <CreditCard className="size-3.5" />,
    other: <ImageIcon className="size-3.5" />,
  };

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="aspect-[4/3] bg-muted">
        <img
          src={doc.url}
          alt={typeLabel[doc.type]}
          className="size-full object-cover"
        />
      </div>
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-1.5 text-xs font-medium">
          {typeIcon[doc.type]}
          {typeLabel[doc.type]}
        </div>
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${doc.uploadedBy === 'admin' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
          {doc.uploadedBy === 'admin' ? 'Staff' : 'Customer'}
        </span>
      </div>
      <div className="border-t px-3 py-1.5 text-[10px] text-muted-foreground">
        {new Date(doc.createdAt).toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </div>
    </div>
  );
}
