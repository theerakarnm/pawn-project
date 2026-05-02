export function PendingCustomerScreen() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 p-6 text-center min-h-screen">
      <div className="flex size-16 items-center justify-center rounded-full bg-amber-100">
        <svg
          className="size-8 text-amber-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h1 className="text-lg font-semibold text-amber-600">รอการยืนยัน</h1>
      <p className="text-sm text-muted-foreground">
        ข้อมูลของคุณถูกบันทึกเรียบร้อยแล้ว
        <br />
        กรุณารอเจ้าหน้าที่สร้างสัญญาในระบบ
        <br />
        เมื่อสัญญาพร้อม คุณจะสามารถใช้งานได้ทันที
      </p>
    </div>
  );
}
