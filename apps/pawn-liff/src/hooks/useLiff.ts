import { useEffect, useState } from 'react';
import liff from '@line/liff';

interface UseLiffReturn {
  liffReady: boolean;
  lineUserId: string | null;
  idToken: string | null;
  error: string | null;
}

export function useLiff(): UseLiffReturn {
  const [liffReady, setLiffReady] = useState(false);
  const [lineUserId, setLineUserId] = useState<string | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const liffId = import.meta.env.VITE_LIFF_ID as string;
    if (!liffId) {
      setError('VITE_LIFF_ID is not set');
      return;
    }

    liff
      .init({ liffId })
      .then(() => {
        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }
        return liff.getProfile().then((profile) => {
          setLineUserId(profile.userId);
          const token = liff.getIDToken();
          if (token) setIdToken(token);
          setLiffReady(true);
        });
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'LIFF init failed');
      });
  }, []);

  return { liffReady, lineUserId, idToken, error };
}
