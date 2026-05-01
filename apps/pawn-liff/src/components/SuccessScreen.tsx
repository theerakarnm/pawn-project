import liff from '@line/liff';

interface SuccessScreenProps {
  amount: string;
  customerName?: string;
  onClose?: () => void;
}

export function SuccessScreen({ amount, customerName, onClose }: SuccessScreenProps) {
  const handleClose = () => {
    if (liff.isInClient()) {
      liff.closeWindow();
    } else {
      onClose?.();
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-green-100">
        <svg
          className="size-8 text-[#00B900]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-lg font-semibold text-[#00B900]">ส่งแจ้งชำระสำเร็จ</h1>

      <div className="space-y-1">
        <p className="text-2xl font-bold">฿{amount}</p>
        {customerName && (
          <p className="text-sm text-muted-foreground">{customerName}</p>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        ระบบได้รับแจ้งชำระของคุณแล้ว กรุณารอเจ้าหน้าที่ตรวจสอบ
      </p>

      <button
        onClick={handleClose}
        className="mt-2 w-full rounded bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
      >
        ปิด
      </button>
    </div>
  );
}
