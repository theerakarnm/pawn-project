import { useState, useEffect, useCallback } from 'react';
import { useLiff } from './hooks/useLiff.ts';
import { KycScreen } from './components/KycScreen.tsx';
import { PendingCustomerScreen } from './components/PendingCustomerScreen.tsx';
import { InstallmentListScreen } from './components/InstallmentListScreen.tsx';
import { InstallmentDetailScreen } from './components/InstallmentDetailScreen.tsx';
import { LinkedPaymentForm } from './components/LinkedPaymentForm.tsx';
import { SuccessScreen } from './components/SuccessScreen.tsx';
import { ErrorScreen } from './components/ErrorScreen.tsx';

type AppScreen =
  | 'loading'
  | 'kyc'
  | 'pending'
  | 'dashboard'
  | 'detail'
  | 'payment'
  | 'success';

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

interface InstallmentDetailData {
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
  payments: Array<{
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
  }>;
}

const API_URL = import.meta.env.VITE_API_URL as string;

export function App() {
  const { liffReady, idToken, error } = useLiff();
  const [screen, setScreen] = useState<AppScreen>('loading');
  const [installments, setInstallments] = useState<InstallmentItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<InstallmentDetailData | null>(null);
  const [successAmount, setSuccessAmount] = useState<string | null>(null);

  const fetchMe = useCallback(async () => {
    if (!idToken) return;
    try {
      const res = await fetch(`${API_URL}/api/liff/me`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();

      if (data.status === 'needs_kyc') {
        setScreen('kyc');
      } else if (data.status === 'pending_customer') {
        setScreen('pending');
      } else {
        setInstallments(data.installments);
        setScreen('dashboard');
      }
    } catch {
      setScreen('kyc');
    }
  }, [idToken]);

  useEffect(() => {
    if (liffReady && idToken) {
      void fetchMe();
    }
  }, [liffReady, idToken, fetchMe]);

  const fetchDetail = useCallback(
    async (customerId: string) => {
      if (!idToken) return;
      const res = await fetch(
        `${API_URL}/api/liff/installments/${customerId}`,
        { headers: { Authorization: `Bearer ${idToken}` } },
      );
      if (res.ok) {
        const data = await res.json();
        setDetail(data);
        setSelectedId(customerId);
        setScreen('detail');
      }
    },
    [idToken],
  );

  if (error) return <ErrorScreen message={error} />;

  if (!liffReady || !idToken) {
    return (
      <div className="mx-auto flex max-w-md items-center justify-center p-6">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (screen === 'kyc') {
    return <KycScreen idToken={idToken} onKycComplete={() => void fetchMe()} />;
  }

  if (screen === 'pending') {
    return <PendingCustomerScreen />;
  }

  if (screen === 'success' && successAmount) {
    return (
      <SuccessScreen
        amount={successAmount}
        onClose={() => {
          setSuccessAmount(null);
          void fetchMe();
        }}
      />
    );
  }

  if (screen === 'payment' && selectedId) {
    const item = installments.find((i) => i.id === selectedId);
    return (
      <LinkedPaymentForm
        customerId={selectedId}
        installmentCode={item?.installmentCode ?? ''}
        idToken={idToken}
        onSuccess={(result) => {
          setSuccessAmount(result.amount);
          setScreen('success');
        }}
        onCancel={() => setScreen('dashboard')}
      />
    );
  }

  if (screen === 'detail' && detail && selectedId) {
    return (
      <InstallmentDetailScreen
        detail={detail}
        onBack={() => {
          setDetail(null);
          setSelectedId(null);
          setScreen('dashboard');
        }}
        onPayment={() => setScreen('payment')}
      />
    );
  }

  return (
    <InstallmentListScreen
      installments={installments}
      onSelect={(id) => void fetchDetail(id)}
      onPayment={(id) => {
        setSelectedId(id);
        setScreen('payment');
      }}
    />
  );
}

export default App;
