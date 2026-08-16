'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, getSessionSafe } from '@/lib/supabase';
import type { AdminProfile } from '@/lib/supabase.types';

interface AdminProfileState {
  profile: AdminProfile | null;
  sessionUser: { id: string; email?: string } | null;
  loading: boolean;
  error: string | null;
  isSignedOut: boolean;
}

export function useAdminProfile(): AdminProfileState & { refresh: () => void } {
  const [state, setState] = useState<AdminProfileState>({
    profile: null,
    sessionUser: null,
    loading: true,
    error: null,
    isSignedOut: false,
  });

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const session = await getSessionSafe();
    if (!session) {
      setState({ profile: null, sessionUser: null, loading: false, error: null, isSignedOut: true });
      return;
    }

    const user = session.user;
    const { data: profile, error } = await supabase
      .from('admin_profiles')
      .select('id, email, role, full_name, active, suspended_at, archived_at, created_at, updated_at')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      setState({
        profile: null,
        sessionUser: { id: user.id, email: user.email },
        loading: false,
        error: error.message,
        isSignedOut: false,
      });
      return;
    }

    if (!profile) {
      setState({
        profile: null,
        sessionUser: { id: user.id, email: user.email },
        loading: false,
        error: 'Your account does not have admin access.',
        isSignedOut: false,
      });
      return;
    }

    setState({
      profile: profile as AdminProfile,
      sessionUser: { id: user.id, email: user.email },
      loading: false,
      error: null,
      isSignedOut: false,
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refresh: load };
}