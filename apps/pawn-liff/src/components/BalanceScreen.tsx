interface BalanceScreenProps {
  remainingBalance: string;
  nextDueDate: string | null;
  installmentCode: string;
  onBack: () => void;
}

export function BalanceScreen({
  remainingBalance,
  nextDueDate,
  installmentCode,
  onBack,
}: BalanceScreenProps) {
  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <h1 className="text-center text-lg font-semibold">ยอดคงเหลือ</h1>

      <div className="space-y-2 rounded-lg border p-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">รหัสผ่อน</span>
          <span className="font-medium">{installmentCode}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">ยอดคงเหลือ</span>
          <span className="font-bold text-[#E74C3C]">฿{remainingBalance}</span>
        </div>
        {nextDueDate && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">งวดถัดไป</span>
            <span className="font-medium">{nextDueDate}</span>
          </div>
        )}
      </div>

      <button
        onClick={onBack}
        className="w-full rounded bg-secondary px-4 py-2.5 text-sm font-semibold"
      >
        กลับ
      </button>
    </div>
  );
}
