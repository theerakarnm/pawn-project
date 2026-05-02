interface InstallmentItem {
  id: string;
  installmentCode: string;
  name: string;
  remainingBalance: string;
  totalInstallments: number;
  paidInstallments: number;
  monthlyPayment: string;
  dueDate: string | null;
  status: string;
}

interface InstallmentListScreenProps {
  installments: InstallmentItem[];
  onSelect: (id: string) => void;
  onPayment: (id: string) => void;
}

function statusLabel(status: string) {
  switch (status) {
    case 'active':
      return { text: 'ผ่อนอยู่', cls: 'bg-blue-50 text-blue-700' };
    case 'overdue':
      return { text: 'เกินกำหนด', cls: 'bg-red-50 text-red-700' };
    case 'due_soon':
      return { text: 'ใกล้ครบกำหนด', cls: 'bg-amber-50 text-amber-700' };
    case 'paid':
      return { text: 'ชำระแล้ว', cls: 'bg-green-50 text-green-700' };
    default:
      return { text: status, cls: 'bg-gray-50 text-gray-700' };
  }
}

export function InstallmentListScreen({
  installments,
  onSelect,
  onPayment,
}: InstallmentListScreenProps) {
  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <h1 className="text-center text-lg font-semibold">สัญญาผ่อนของคุณ</h1>

      {installments.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          ไม่พบสัญญาผ่อน
        </p>
      ) : (
        <div className="space-y-3">
          {installments.map((item) => {
            const badge = statusLabel(item.status);
            const remaining = item.totalInstallments - item.paidInstallments;
            return (
              <div
                key={item.id}
                className="rounded-lg border bg-card p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">
                    {item.installmentCode}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${badge.cls}`}
                  >
                    {badge.text}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ยอดคงเหลือ</span>
                  <span className="font-bold text-[#E74C3C]">
                    ฿{item.remainingBalance}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    เหลือ {remaining} งวด
                  </span>
                  <span className="text-muted-foreground">
                    ฿{item.monthlyPayment}/งวด
                  </span>
                </div>

                {item.dueDate && (
                  <div className="text-xs text-muted-foreground">
                    ครบกำหนด: {item.dueDate}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onSelect(item.id)}
                    className="flex-1 rounded bg-secondary px-3 py-2 text-xs font-semibold"
                  >
                    ดูรายละเอียด
                  </button>
                  {item.status !== 'paid' && (
                    <button
                      type="button"
                      onClick={() => onPayment(item.id)}
                      className="flex-1 rounded bg-[#00B900] px-3 py-2 text-xs font-semibold text-white"
                    >
                      แจ้งชำระ
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
