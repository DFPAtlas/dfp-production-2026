'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentAdminAccess, type AdminProfileAccessRecord, type AdminAccessDeniedReason } from '@/lib/admin-access';
import type { AdminRoleKey } from '@/lib/admin-roles';

export type AdminAccessState =
  | { status: 'checking' }
  | { status: 'allowed'; userId: string; role: AdminRoleKey; profile: AdminProfileAccessRecord }
  | { status: 'denied'; reason: AdminAccessDeniedReason }
  | { status: 'error'; message: string };

export function useAdminAccess() {
  const [state, setState] = useState<AdminAccessState>({ status: 'checking' });
  const checkingRef = useRef(false);
  const mountedRef = useRef(true);

  const checkAccess = useCallback(async () => {
    if (checkingRef.current) return;
    checkingRef.current = true;
    if (mountedRef.current) setState({ status: 'checking' });

    try {
      const result = await getCurrentAdminAccess();
      if (!mountedRef.current) { checkingRef.current = false; return; }

      if (result.allowed) {
        setState({ status: 'allowed', userId: result.userId, role: result.role, profile: result.profile });
      } else {
        setState({ status: 'denied', reason: result.reason });
      }
    } catch (e: unknown) {
      if (mountedRef.current) {
        setState({ status: 'error', message: (e as Error)?.message || 'Access check failed' });
      }
    }
    checkingRef.current = false;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    if (mountedRef.current) setState({ status: 'denied', reason: 'unauthenticated' });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    checkAccess();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!mountedRef.current) return;
      if (event === 'SIGNED_OUT') {
        setState({ status: 'denied', reason: 'unauthenticated' });
        return;
      }
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        checkAccess();
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [checkAccess]);

  return { state, refreshAccess: checkAccess, signOut };
}