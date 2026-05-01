import { useState, useEffect, useCallback } from 'react';
import { useLiff } from './hooks/useLiff.ts';
import { PaymentForm } from './components/PaymentForm.tsx';
import { SuccessScreen } from './components/SuccessScreen.tsx';
import { BalanceScreen } from './components/BalanceScreen.tsx';

type Screen = 'form' | 'success' | 'balance';

interface BalanceData {
  installmentCode: string;
  remainingBalance: string;
  dueDate: string | null;
}

const API_URL = import.meta.env.VITE_API_URL as string;

export function App() {
  const { liffReady, lineUserId, error } = useLiff();
  const [screen, setScreen] = useState<Screen>('form');
  const [successData, setSuccessData] = useState<{
    amount: string;
  } | null>(null);
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!lineUserId) return;
    try {
      const res = await fetch(
        `${API_URL}/api/customers/by-line/${encodeURIComponent(lineUserId)}`,
      );
      if (res.ok) {
        const data = await res.json();
        setBalanceData(data);
      }
    } catch {}
  }, [lineUserId]);

  useEffect(() => {
    if (liffReady && lineUserId) {
      void fetchBalance();
    }
  }, [liffReady, lineUserId, fetchBalance]);

  if (error) {
    return (
      <div className="mx-auto flex max-w-md items-center justify-center p-6">
        <p className="text-center text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!liffReady) {
    return (
      <div className="mx-auto flex max-w-md items-center justify-center p-6">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!lineUserId) return null;

  if (screen === 'success' && successData) {
    return (
      <SuccessScreen
        amount={successData.amount}
        onClose={() => setScreen('form')}
      />
    );
  }

  if (screen === 'balance' && balanceData) {
    return (
      <BalanceScreen
        remainingBalance={balanceData.remainingBalance}
        nextDueDate={balanceData.dueDate}
        installmentCode={balanceData.installmentCode}
        onBack={() => setScreen('form')}
      />
    );
  }

  return (
    <PaymentForm
      lineUserId={lineUserId}
      onSuccess={(result) => {
        setSuccessData({ amount: result.amount });
        void fetchBalance();
        setScreen('success');
      }}
    />
  );
}

export default App;
