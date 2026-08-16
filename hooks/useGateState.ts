import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { supabase, getSessionSafe } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

export interface GateVerifyResult {
  allowed: boolean;
  reason?: string;
}

export interface GateStateOptions {
  publicPaths?: string[];
  loginPath: string;
  verifyAccess: (session: Session) => Promise<GateVerifyResult>;
}

export type GateState = 'idle' | 'checking' | 'allowed' | 'denied';

export function useGateState({ publicPaths, loginPath, verifyAccess }: GateStateOptions) {
  const [gateState, setGateState] = useState<GateState>('idle');
  const [deniedReason, setDeniedReason] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const pathname = usePathname();

  const configRef = useRef({ publicPaths, loginPath, verifyAccess });
  configRef.current = { publicPaths, loginPath, verifyAccess };

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const { publicPaths: pub, verifyAccess: verify } = configRef.current;
    const currentPath = pathname || '';

    let isPublic = false;

    if (currentPath) {
      isPublic = pub && pub.some(
        (p) => currentPath === p || currentPath.endsWith(p)
      );
    }

    if (!isPublic && typeof window !== 'undefined') {
      const browserPath = window.location.pathname;
      isPublic = pub && pub.some(
        (p) => browserPath === p || browserPath.endsWith(p)
      );
    }

    if (isPublic) {
      setGateState('allowed');
      setDeniedReason(null);
      return;
    }

    let cancelled = false;
    let checking = false;

    const runCheck = async () => {
      if (!mountedRef.current || cancelled) return;

      if (!checking) {
        checking = true;
        setGateState('checking');
      }

      try {
        const session = await getSessionSafe();
        if (!mountedRef.current || cancelled) return;

        if (!session) {
          setGateState('denied');
          setDeniedReason('unauthenticated');
          return;
        }

        const result = await verify(session);
        if (!mountedRef.current || cancelled) return;

        if (result.allowed) {
          setGateState('allowed');
          setDeniedReason(null);
        } else {
          setGateState('denied');
          setDeniedReason(result.reason || 'Access denied.');
        }
      } catch (_err) {
        if (!mountedRef.current || cancelled) return;
        setGateState('denied');
        setDeniedReason('Access verification failed. Please try again.');
      }
    };

    if (!supabase) {
      setGateState('denied');
      setDeniedReason('Authentication service is unavailable.');
      return;
    }

    runCheck();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!mountedRef.current || cancelled) return;

      if (event === 'SIGNED_OUT') {
        setGateState('denied');
        setDeniedReason('unauthenticated');
        return;
      }

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
        runCheck();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return { gateState, deniedReason };
}