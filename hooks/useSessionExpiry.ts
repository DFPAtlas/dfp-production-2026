'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase, getSessionSafe } from '@/lib/supabase';

export type SessionExpiryState =
  | { status: 'loading' }
  | { status: 'valid'; expiresAt: Date; minutesLeft: number }
  | { status: 'expiring-soon'; expiresAt: Date; minutesLeft: number }
  | { status: 'expired' };

const EXPIRY_WARNING_MINUTES = 5;
const CHECK_INTERVAL_MS = 30_000;

export function useSessionExpiry() {
  const [state, setState] = useState<SessionExpiryState>({ status: 'loading' });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dismissedRef = useRef(false);

  const evaluate = useCallback(async () => {
    const session = await getSessionSafe();
    if (!session) {
      setState({ status: 'expired' });
      return;
    }

    const expiresAtSec = session.expires_at;
    if (!expiresAtSec) {
      setState({ status: 'valid', expiresAt: new Date(), minutesLeft: 99 });
      return;
    }

    const expiresAt = new Date(expiresAtSec * 1000);
    const minutesLeft = Math.max(0, (expiresAt.getTime() - Date.now()) / 60_000);

    if (minutesLeft <= 0) {
      setState({ status: 'expired' });
    } else if (minutesLeft <= EXPIRY_WARNING_MINUTES) {
      if (!dismissedRef.current) {
        setState({ status: 'expiring-soon', expiresAt, minutesLeft });
      } else {
        setState({ status: 'valid', expiresAt, minutesLeft });
      }
    } else {
      dismissedRef.current = false;
      setState({ status: 'valid', expiresAt, minutesLeft });
    }
  }, []);

  useEffect(() => {
    evaluate();

    intervalRef.current = setInterval(evaluate, CHECK_INTERVAL_MS);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        dismissedRef.current = false;
      }
      evaluate();
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      subscription.unsubscribe();
    };
  }, [evaluate]);

  const dismiss = useCallback(() => {
    dismissedRef.current = true;
    setState((prev) => {
      if (prev.status === 'expiring-soon') {
        return { status: 'valid', expiresAt: prev.expiresAt, minutesLeft: prev.minutesLeft } as const;
      }
      return prev;
    });
  }, []);

  return { state, dismiss };
}