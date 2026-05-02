interface PaymentItem {
  id: string;
  amount: string;
  slipUrl: string;
  status: string;
  confirmedBy: string | null;
  confirmedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectReason: string | null;
  createdAt: string;
}

interface InstallmentDetailProps {
  detail: {
    installmentCode: string;
    name: string;
    totalPrice: string;
    downPayment: string;
    remainingBalance: string;
    totalInstallments: number;
    paidInstallments: number;
    monthlyPayment: string;
    dueDate: string | null;
    status: string;
    payments: PaymentItem[];
  };
  onBack: () => void;
  onPayment: () => void;
}

function paymentStatusLabel(status: string) {
  switch (status) {
    case 'confirmed':
      return { text: 'อนุมัติแล้ว', cls: 'text-green-700 bg-green-50' };
    case 'rejected':
      return { text: 'ปฏิเสธ', cls: 'text-red-700 bg-red-50' };
    case 'pending_verification':
      return { text: 'รอตรวจสอบ', cls: 'text-amber-700 bg-amber-50' };
    default:
      return { text: status, cls: 'text-gray-700 bg-gray-50' };
  }
}

export function InstallmentDetailScreen({
  detail,
  onBack,
  onPayment,
}: InstallmentDetailProps) {
  const remaining = detail.totalInstallments - detail.paidInstallments;

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-muted-foreground"
        >
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">{detail.installmentCode}</h1>
      </div>

      <div className="space-y-2 rounded-lg border p-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">ชื่อ</span>
          <span className="font-medium">{detail.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">ราคารวม</span>
          <span>฿{detail.totalPrice}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">เงินดาวน์</span>
          <span>฿{detail.downPayment}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">ยอดคงเหลือ</span>
          <span className="font-bold text-[#E74C3C]">฿{detail.remainingBalance}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">งวดที่ชำระ</span>
          <span>{detail.paidInstallments}/{detail.totalInstallments} (เหลือ {remaining})</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">ค่าผ่อน/งวด</span>
          <span>฿{detail.monthlyPayment}</span>
        </div>
        {detail.dueDate && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">ครบกำหนด</span>
            <span>{detail.dueDate}</span>
          </div>
        )}
      </div>

      {detail.status !== 'paid' && (
        <button
          type="button"
          onClick={onPayment}
          className="w-full rounded bg-[#00B900] px-4 py-2.5 text-sm font-semibold text-white"
        >
          แจ้งชำระเงิน
        </button>
      )}

      <div>
        <h2 className="mb-2 text-sm font-semibold">ประวัติชำระ</h2>
        {detail.payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">ยังไม่มีประวัติ</p>
        ) : (
          <div className="space-y-2">
            {detail.payments.map((p) => {
              const badge = paymentStatusLabel(p.status);
              return (
                <div key={p.id} className="flex items-center justify-between rounded border p-3">
                  <div>
                    <div className="text-sm font-medium">฿{p.amount}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString('th-TH')}
                    </div>
                    {p.status === 'rejected' && p.rejectReason && (
                      <div className="text-xs text-red-500 mt-0.5">
                        เหตุผล: {p.rejectReason}
                      </div>
                    )}
                  </div>
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${badge.cls}`}>
                    {badge.text}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onBack}
        className="w-full rounded bg-secondary px-4 py-2.5 text-sm font-semibold"
      >
        กลับ
      </button>
    </div>
  );
}
