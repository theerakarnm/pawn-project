import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/heic'];

const schema = z.object({
  amount: z.string().min(1, 'กรุณาระบุจำนวนเงิน').refine(
    (v) => Number(v) > 0,
    'ยอดชำระต้องมากกว่า 0',
  ),
  slip: z.instanceof(FileList)
    .refine((f) => f.length > 0, 'กรุณาแนบสลิปการโอนเงิน')
    .refine((f) => f[0]?.size <= 5 * 1024 * 1024, 'ไฟล์ต้องไม่เกิน 5MB')
    .refine((f) => ACCEPTED_TYPES.includes(f[0]?.type), 'รองรับเฉพาะ jpg, png, heic'),
});

type FormValues = z.infer<typeof schema>;

interface LinkedPaymentFormProps {
  customerId: string;
  installmentCode: string;
  idToken: string;
  onSuccess: (result: { id: string; amount: string; status: string }) => void;
  onCancel: () => void;
}

const API_URL = import.meta.env.VITE_API_URL as string;

export function LinkedPaymentForm({
  customerId,
  installmentCode,
  idToken,
  onSuccess,
  onCancel,
}: LinkedPaymentFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { amount: '' },
  });

  const onSubmit = async (data: FormValues) => {
    setSubmitError(null);
    const formData = new FormData();
    formData.append('customerId', customerId);
    formData.append('amount', data.amount);
    formData.append('slip', data.slip[0]);

    try {
      const res = await fetch(`${API_URL}/api/liff/payments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(
          typeof body.error === 'string' ? body.error : 'เกิดข้อผิดพลาด',
        );
      }
      const result = await res.json();
      onSuccess(result);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="text-muted-foreground"
        >
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">แจ้งชำระเงิน</h1>
      </div>

      <div className="rounded-lg border bg-card p-3">
        <span className="text-sm text-muted-foreground">สัญญา: </span>
        <span className="text-sm font-semibold">{installmentCode}</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <input
            {...register('amount')}
            type="number"
            placeholder="จำนวนเงิน (บาท)"
            className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
          />
          {errors.amount && (
            <p className="mt-1 text-xs text-destructive">{errors.amount.message}</p>
          )}
        </div>

        <div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/heic"
            {...register('slip')}
            className="w-full text-sm file:mr-2 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:text-primary-foreground"
          />
          {errors.slip && (
            <p className="mt-1 text-xs text-destructive">{errors.slip.message}</p>
          )}
        </div>

        {submitError && (
          <p className="text-xs text-destructive">{submitError}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !isValid}
          className="w-full rounded bg-[#00B900] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isSubmitting ? 'กำลังส่ง...' : 'แจ้งชำระเงิน'}
        </button>
      </form>
    </div>
  );
}
