import type { PaymentMode } from '@/types/api';

const modeConfig: Record<PaymentMode, { label: string; className: string }> = {
  savings: {
    label: 'ออมมือถือ',
    className: 'text-purple-700 bg-purple-50 border-purple-200',
  },
  installment: {
    label: 'ผ่อนเป็นงวด',
    className: 'text-blue-700 bg-blue-50 border-blue-200',
  },
};

export function PaymentModeBadge({ mode }: { mode: PaymentMode }) {
  const config = modeConfig[mode];
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
