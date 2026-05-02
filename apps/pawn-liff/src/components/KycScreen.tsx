import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const API_URL = import.meta.env.VITE_API_URL as string;

const phoneSchema = z.object({
  phone: z.string().min(8, 'กรุณากรอกเบอร์โทรศัพท์'),
});

type PhoneForm = z.infer<typeof phoneSchema>;

const profileSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อ-นามสกุล'),
  birthdate: z.string().min(1, 'กรุณากรอกวันเกิด'),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').optional().or(z.literal('')),
});

type ProfileForm = z.infer<typeof profileSchema>;

interface KycScreenProps {
  idToken: string;
  onKycComplete: () => void;
}

type Step = 'phone' | 'profile';

export function KycScreen({ idToken, onKycComplete }: KycScreenProps) {
  const [step, setStep] = useState<Step>('phone');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const phoneForm = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', birthdate: '', email: '' },
  });

  const headers = { Authorization: `Bearer ${idToken}` };

  const onPhoneSubmit = async (data: PhoneForm) => {
    setSubmitError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/liff/kyc/phone`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: data.phone }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(
          typeof body.error === 'string' ? body.error : 'เกิดข้อผิดพลาด',
        );
      }
      const result = await res.json();
      if (result.matched) {
        onKycComplete();
      } else {
        setStep('profile');
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const onProfileSubmit = async (data: ProfileForm) => {
    setSubmitError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/liff/kyc/profile`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          birthdate: data.birthdate,
          email: data.email || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(
          typeof body.error === 'string' ? body.error : 'เกิดข้อผิดพลาด',
        );
      }
      onKycComplete();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'profile') {
    return (
      <div className="mx-auto max-w-md space-y-4 p-4">
        <h1 className="text-center text-lg font-semibold">ลงทะเบียน</h1>
        <p className="text-center text-sm text-muted-foreground">
          ยังไม่พบข้อมูลสัญญาในระบบ กรุณากรอกข้อมูลเพื่อรอเจ้าหน้าที่สร้างสัญญา
        </p>

        <form
          onSubmit={profileForm.handleSubmit(onProfileSubmit)}
          className="space-y-3"
        >
          <div>
            <input
              {...profileForm.register('name')}
              placeholder="ชื่อ-นามสกุล"
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
            />
            {profileForm.formState.errors.name && (
              <p className="mt-1 text-xs text-destructive">
                {profileForm.formState.errors.name.message}
              </p>
            )}
          </div>
          <div>
            <input
              {...profileForm.register('birthdate')}
              type="date"
              placeholder="วันเกิด"
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
            />
            {profileForm.formState.errors.birthdate && (
              <p className="mt-1 text-xs text-destructive">
                {profileForm.formState.errors.birthdate.message}
              </p>
            )}
          </div>
          <div>
            <input
              {...profileForm.register('email')}
              type="email"
              placeholder="อีเมล (ไม่จำเป็น)"
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
            />
            {profileForm.formState.errors.email && (
              <p className="mt-1 text-xs text-destructive">
                {profileForm.formState.errors.email.message}
              </p>
            )}
          </div>
          {submitError && (
            <p className="text-xs text-destructive">{submitError}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-[#00B900] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? 'กำลังส่ง...' : 'ลงทะเบียน'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <h1 className="text-center text-lg font-semibold">ยืนยันตัวตน</h1>
      <p className="text-center text-sm text-muted-foreground">
        กรอกเบอร์โทรศัพท์ที่ใช้สมัครสัญญาผ่อนเพื่อเชื่อมต่อบัญชี LINE
      </p>

      <form
        onSubmit={phoneForm.handleSubmit(onPhoneSubmit)}
        className="space-y-3"
      >
        <div>
          <input
            {...phoneForm.register('phone')}
            type="tel"
            placeholder="เบอร์โทรศัพท์"
            className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
          />
          {phoneForm.formState.errors.phone && (
            <p className="mt-1 text-xs text-destructive">
              {phoneForm.formState.errors.phone.message}
            </p>
          )}
        </div>
        {submitError && (
          <p className="text-xs text-destructive">{submitError}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-[#00B900] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'กำลังตรวจสอบ...' : 'ยืนยันเบอร์โทร'}
        </button>
      </form>
    </div>
  );
}
