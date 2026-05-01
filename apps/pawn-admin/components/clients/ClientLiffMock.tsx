'use client';

import { useState } from 'react';
import type { CustomerDetail } from '@/types/api';
import { CustomerStatusBadge } from '@/components/customers/CustomerStatusBadge';
import { Progress } from '@/components/ui/progress';

type Screen = 'form' | 'success' | 'balance' | 'identity';

interface ClientLiffMockProps {
  customer: CustomerDetail;
}

export function ClientLiffMock({ customer }: ClientLiffMockProps) {
  const [screen, setScreen] = useState<Screen>('form');
  const [submittedAmount, setSubmittedAmount] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [identitySubmitted, setIdentitySubmitted] = useState(false);

  const progressPercent =
    customer.totalInstallments > 0
      ? Math.round((customer.paidInstallments / customer.totalInstallments) * 100)
      : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formAmount || Number(formAmount) <= 0) {
      setFormError('กรุณาระบุจำนวนเงินที่ถูกต้อง');
      return;
    }
    setSubmittedAmount(formAmount);
    setFormAmount('');
    setScreen('success');
  };

  const recentPayments = customer.payments.slice(0, 5);
  const pendingPayments = customer.payments.filter((p) => p.status === 'pending_verification');
  const rejectedPayments = customer.payments.filter((p) => p.status === 'rejected');

  return (
    <div className="mx-auto max-w-md space-y-4 bg-background p-4 text-foreground" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div className="flex items-center justify-center gap-2">
        <div className="size-6 rounded bg-[#00B900]" />
        <span className="text-sm font-semibold">PAWN Payment</span>
      </div>

      {screen === 'success' && (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-green-100">
            <svg className="size-8 text-[#00B900]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[#00B900]">ส่งแจ้งชำระสำเร็จ</h2>
          <div className="text-2xl font-bold">฿{Number(submittedAmount).toLocaleString()}</div>
          <p className="text-sm text-muted-foreground">
            ระบบได้รับแจ้งชำระของคุณแล้ว กรุณารอเจ้าหน้าที่ตรวจสอบ
          </p>
          <button
            onClick={() => setScreen('form')}
            className="mt-2 w-full rounded bg-[#00B900] px-4 py-2.5 text-sm font-semibold text-white"
          >
            กลับ
          </button>
        </div>
      )}

      {screen === 'balance' && (
        <div className="space-y-4">
          <h2 className="text-center text-lg font-semibold">ยอดคงเหลือ</h2>

          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">รหัสผ่อน</span>
              <span className="font-medium">{customer.installmentCode}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">อุปกรณ์</span>
              <span className="font-medium">{customer.deviceModel}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">ยอดคงเหลือ</span>
              <span className="text-lg font-bold text-[#E74C3C]">฿{customer.remainingBalance}</span>
            </div>
            {customer.dueDate && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">งวดถัดไป</span>
                <span className="font-medium">{customer.dueDate}</span>
              </div>
            )}
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span>{customer.paidInstallments} / {customer.totalInstallments} งวด</span>
                <span>{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} />
            </div>
          </div>

          {pendingPayments.length > 0 && (
            <div className="rounded border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-medium text-amber-800">
                มี {pendingPayments.length} รายการรอตรวจสอบ
              </p>
            </div>
          )}

          {rejectedPayments.length > 0 && (
            <div className="rounded border border-red-200 bg-red-50 p-3">
              <p className="text-xs font-medium text-red-800">
                มี {rejectedPayments.length} รายการถูกปฏิเสธ — กรุณาส่งสลิปใหม่
              </p>
              {rejectedPayments.map((p) => (
                <p key={p.id} className="mt-1 text-xs text-red-700">
                  ฿{p.amount}: {p.rejectReason ?? 'ไม่ระบุเหตุผล'}
                </p>
              ))}
            </div>
          )}

          {recentPayments.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground">ประวัติล่าสุด</h3>
              {recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded border p-2 text-xs">
                  <span>฿{p.amount}</span>
                  <span>{new Date(p.createdAt).toLocaleDateString('th-TH')}</span>
                  <CustomerStatusBadge status={p.status} />
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setScreen('form')}
              className="flex-1 rounded bg-[#00B900] px-4 py-2.5 text-sm font-semibold text-white"
            >
              แจ้งชำระเงิน
            </button>
            <button
              onClick={() => setScreen('form')}
              className="flex-1 rounded bg-secondary px-4 py-2.5 text-sm font-semibold"
            >
              กลับ
            </button>
          </div>
        </div>
      )}

      {screen === 'form' && (
        <div className="space-y-4">
          <h2 className="text-center text-lg font-semibold">แจ้งชำระเงิน</h2>

          <div className="flex justify-between rounded border p-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">{customer.installmentCode}</div>
              <div className="font-medium">{customer.name}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">คงเหลือ</div>
              <div className="font-bold text-[#E74C3C]">฿{customer.remainingBalance}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setScreen('balance')}
              className="flex-1 rounded bg-secondary px-3 py-2 text-sm"
            >
              ดูยอดคงเหลือ
            </button>
            <button
              onClick={() => setScreen('identity')}
              className="flex-1 rounded bg-secondary px-3 py-2 text-sm"
            >
              ยืนยันตัวตน
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">จำนวนเงิน (บาท)</label>
              <input
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">แนบสลิปโอนเงิน</label>
              <input
                type="file"
                accept="image/jpeg,image/png"
                className="w-full text-sm file:mr-2 file:rounded file:border-0 file:bg-[#00B900] file:px-3 file:py-1.5 file:text-xs file:text-white"
              />
            </div>

            {formError && (
              <p className="text-xs text-destructive">{formError}</p>
            )}

            <button
              type="submit"
              className="w-full rounded bg-[#00B900] px-4 py-2.5 text-sm font-semibold text-white"
            >
              แจ้งชำระเงิน
            </button>
          </form>
        </div>
      )}

      {screen === 'identity' && (
        <div className="space-y-4">
          <h2 className="text-center text-lg font-semibold">ยืนยันตัวตน</h2>
          <p className="text-center text-xs text-muted-foreground">
            อัปโหลดรูปถ่ายและบัตรประชาชนเพื่อยืนยันตัวตน
          </p>

          {identitySubmitted ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-green-100">
                <svg className="size-7 text-[#00B900]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-medium text-[#00B900]">ส่งเอกสารสำเร็จ</p>
              <p className="text-xs text-muted-foreground">เจ้าหน้าที่จะตรวจสอบเอกสารของคุณ</p>
              <button
                onClick={() => setScreen('form')}
                className="w-full rounded bg-[#00B900] px-4 py-2.5 text-sm font-semibold text-white"
              >
                กลับ
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIdentitySubmitted(true);
              }}
              className="space-y-3"
            >
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">รูปถ่ายหน้าตรง</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  className="w-full text-sm file:mr-2 file:rounded file:border-0 file:bg-[#00B900] file:px-3 file:py-1.5 file:text-xs file:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">บัตรประชาชน (หน้า)</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  className="w-full text-sm file:mr-2 file:rounded file:border-0 file:bg-[#00B900] file:px-3 file:py-1.5 file:text-xs file:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">บัตรประชาชน (หลัง)</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  className="w-full text-sm file:mr-2 file:rounded file:border-0 file:bg-[#00B900] file:px-3 file:py-1.5 file:text-xs file:text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded bg-[#00B900] px-4 py-2.5 text-sm font-semibold text-white"
              >
                ส่งเอกสาร
              </button>
            </form>
          )}

          <button
            onClick={() => setScreen('form')}
            className="w-full rounded bg-secondary px-4 py-2.5 text-sm font-semibold"
          >
            กลับ
          </button>
        </div>
      )}

      <div className="border-t pt-3 text-center text-[10px] text-muted-foreground">
        PAWN Demo — LIFF Mock Preview<br />
        Customer: {customer.name} ({customer.installmentCode})
      </div>
    </div>
  );
}
