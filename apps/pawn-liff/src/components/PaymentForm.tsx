import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/heic'];

const schema = z.object({
  lookupType: z.enum(['installmentCode', 'phone']),
  lookupValue: z.string().min(1, 'กรุณากรอกข้อมูล'),
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

interface PaymentFormProps {
  lineUserId: string;
  onSuccess: (result: { id: string; amount: string; status: string }) => void;
}

const API_URL = import.meta.env.VITE_API_URL as string;

export function PaymentForm({ lineUserId, onSuccess }: PaymentFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { lookupType: 'installmentCode', lookupValue: '', amount: '' },
  });

  const lookupType = watch('lookupType');

  const onSubmit = async (data: FormValues) => {
    setSubmitError(null);
    const formData = new FormData();
    if (data.lookupType === 'installmentCode') {
      formData.append('installmentCode', data.lookupValue);
    } else {
      formData.append('phone', data.lookupValue);
    }
    formData.append('amount', data.amount);
    formData.append('slip', data.slip[0]);
    formData.append('lineUserId', lineUserId);

    try {
      const res = await fetch(`${API_URL}/api/payments`, {
        method: 'POST',
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
      <h1 className="text-center text-lg font-semibold">แจ้งชำระเงิน</h1>

      <div className="flex gap-2">
        <button
          type="button"
          className={`flex-1 rounded px-3 py-2 text-sm ${lookupType === 'installmentCode' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
          onClick={() => setValue('lookupType', 'installmentCode')}
        >
          รหัสผ่อน
        </button>
        <button
          type="button"
          className={`flex-1 rounded px-3 py-2 text-sm ${lookupType === 'phone' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
          onClick={() => setValue('lookupType', 'phone')}
        >
          เบอร์โทร
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <input
            {...register('lookupValue')}
            placeholder={lookupType === 'installmentCode' ? 'รหัสผ่อน' : 'เบอร์โทรศัพท์'}
            className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
          />
          {errors.lookupValue && (
            <p className="mt-1 text-xs text-destructive">{errors.lookupValue.message}</p>
          )}
        </div>

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
