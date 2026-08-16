'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, getSessionSafe } from '@/lib/supabase';

interface UATTesterProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  status: string;
  experience_level: string;
  created_at: string;
  updated_at: string;
}

interface UATTesterContextValue {
  tester: UATTesterProfile;
  userId: string;
  refreshTester: () => Promise<void>;
}

type UATAuthState =
  | 'checking_session'
  | 'unauthenticated'
  | 'no_tester_profile'
  | 'awaiting_approval'
  | 'approved'
  | 'error';

const UATTesterContext = createContext<UATTesterContextValue | null>(null);

export function useUATTester(): UATTesterContextValue {
  const ctx = useContext(UATTesterContext);
  if (!ctx) throw new Error('useUATTester must be used within UATTesterProvider');
  return ctx;
}

const statusDisplay: Record<string, { label: string; bgClass: string; iconClass: string }> = {
  applied: { label: 'Application Submitted', bgClass: 'bg-sky-50', iconClass: 'ri-time-line text-sky-500' },
  under_review: { label: 'Under Review', bgClass: 'bg-amber-50', iconClass: 'ri-time-line text-amber-500' },
  approved: { label: 'Approved', bgClass: 'bg-emerald-50', iconClass: 'ri-check-line text-emerald-500' },
  rejected: { label: 'Not Approved', bgClass: 'bg-red-50', iconClass: 'ri-close-circle-line text-red-500' },
  paused: { label: 'Paused', bgClass: 'bg-amber-50', iconClass: 'ri-pause-circle-line text-amber-500' },
  suspended: { label: 'Suspended', bgClass: 'bg-red-50', iconClass: 'ri-error-warning-line text-red-500' },
};

export default function UATTesterProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authState, setAuthState] = useState<UATAuthState>('checking_session');
  const [tester, setTester] = useState<UATTesterProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [sessionEmail, setSessionEmail] = useState('');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const refreshTester = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('uat_testers')
      .select('id, user_id, full_name, email, status, experience_level, created_at, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (!mountedRef.current) return;

    if (error) {
      setAuthState('error');
      setErrorMsg('Failed to load your tester profile. Please try again.');
      return;
    }

    if (!data) {
      setAuthState('no_tester_profile');
      return;
    }

    const t = data as UATTesterProfile;
    setTester(t);

    if (t.status === 'approved') {
      setAuthState('approved');
    } else {
      setAuthState('awaiting_approval');
    }
  }, [userId]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const session = await getSessionSafe();

      if (cancelled || !mountedRef.current) return;

      if (!session) {
        setAuthState('unauthenticated');
        return;
      }

      const uid = session.user.id;
      setUserId(uid);
      setSessionEmail(session.user.email || '');

      const { data, error } = await supabase
        .from('uat_testers')
        .select('id, user_id, full_name, email, status, experience_level, created_at, updated_at')
        .eq('user_id', uid)
        .maybeSingle();

      if (cancelled || !mountedRef.current) return;

      if (error) {
        setAuthState('error');
        setErrorMsg('Failed to load your tester profile. Please try again.');
        return;
      }

      if (!data) {
        setAuthState('no_tester_profile');
        return;
      }

      const t = data as UATTesterProfile;
      setTester(t);

      if (t.status === 'approved') {
        setAuthState('approved');
      } else {
        setAuthState('awaiting_approval');
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && mountedRef.current) {
        setAuthState('unauthenticated');
        setTester(null);
        setUserId(null);
        setSessionEmail('');
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authState === 'unauthenticated') {
      router.replace('/login');
    }
  }, [authState, router]);

  if (authState === 'checking_session') {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-[3px] border-[#2878d0]/20 border-t-[#2878d0] rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Verifying your account...</p>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-[3px] border-[#2878d0]/20 border-t-[#2878d0] rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Redirecting to sign in...</p>
      </div>
    );
  }

  if (authState === 'no_tester_profile') {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-8">
        <div className="bg-white border border-slate-100 rounded-3xl p-12 shadow-sm text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 flex items-center justify-center mx-auto mb-6">
            <i className="ri-user-search-line text-2xl text-[#2878d0] w-8 h-8 flex items-center justify-center" />
          </div>
          <h3 className="text-xl font-bold text-[#17325c] mb-2">No Tester Profile Found</h3>
          <p className="text-slate-500 mb-1">No UAT tester profile is connected to this account.</p>
          {sessionEmail && (
            <p className="text-sm text-slate-400 mb-6">Signed in as {sessionEmail}</p>
          )}
          <div className="space-y-3">
            <a href="/uat-testing/apply" className="block w-full py-3 rounded-xl font-semibold text-sm text-white bg-[#2878d0] hover:bg-[#1e6bc0] transition-all cursor-pointer whitespace-nowrap">
              Apply to Become a Tester
            </a>
            <a href="/account/help" className="block w-full py-3 rounded-xl font-medium text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer whitespace-nowrap">
              Account Help
            </a>
            <button
              onClick={async () => { await supabase.auth.signOut(); }}
              className="block w-full py-3 rounded-xl font-medium text-sm text-slate-500 hover:text-slate-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (authState === 'awaiting_approval') {
    const si = statusDisplay[tester?.status || ''] || { label: tester?.status || 'Unknown', bgClass: 'bg-slate-50', iconClass: 'ri-time-line text-slate-500' };
    const isNegative = tester?.status === 'rejected' || tester?.status === 'suspended';

    const statusMessage = (() => {
      switch (tester?.status) {
        case 'applied':
        case 'under_review':
          return 'Your tester application is being reviewed. You will get access to the tester portal once approved.';
        case 'rejected':
          return 'Your application was not approved at this time. If you believe this is an error, please contact support.';
        case 'paused':
        case 'suspended':
          return 'Your tester access is currently restricted. Please contact support for more information.';
        default:
          return 'Your tester account needs approval before you can access the portal.';
      }
    })();

    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-8">
        <div className="bg-white border border-slate-100 rounded-3xl p-12 shadow-sm text-center max-w-md">
          <div className={`w-16 h-16 rounded-2xl ${si.bgClass} flex items-center justify-center mx-auto mb-6`}>
            <i className={`${si.iconClass} text-2xl w-8 h-8 flex items-center justify-center`} />
          </div>
          <h3 className="text-xl font-bold text-[#17325c] mb-2">
            {isNegative ? si.label : `Account Status: ${si.label}`}
          </h3>
          <p className="text-slate-500 mb-6">{statusMessage}</p>
          <div className="space-y-3">
            <a href="/uat-testing" className="block w-full py-3 rounded-xl font-semibold text-sm text-white bg-[#2878d0] hover:bg-[#1e6bc0] transition-all cursor-pointer whitespace-nowrap">
              Back to UAT Information
            </a>
            <a href="/account/help" className="block w-full py-3 rounded-xl font-medium text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer whitespace-nowrap">
              Account Help
            </a>
            <button
              onClick={async () => { await supabase.auth.signOut(); }}
              className="block w-full py-3 rounded-xl font-medium text-sm text-slate-500 hover:text-slate-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (authState === 'error') {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-8">
        <div className="bg-white border border-slate-100 rounded-3xl p-12 shadow-sm text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
            <i className="ri-error-warning-line text-2xl text-red-500 w-8 h-8 flex items-center justify-center" />
          </div>
          <h3 className="text-xl font-bold text-[#17325c] mb-2">Something went wrong</h3>
          <p className="text-slate-500 mb-6">{errorMsg || 'An unexpected error occurred. Please try again.'}</p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setAuthState('checking_session');
                refreshTester();
              }}
              className="block w-full py-3 rounded-xl font-semibold text-sm text-white bg-[#2878d0] hover:bg-[#1e6bc0] transition-all cursor-pointer whitespace-nowrap"
            >
              Retry
            </button>
            <a href="/account/help" className="block w-full py-3 rounded-xl font-medium text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer whitespace-nowrap">
              Account Help
            </a>
            <button
              onClick={async () => { await supabase.auth.signOut(); }}
              className="block w-full py-3 rounded-xl font-medium text-sm text-slate-500 hover:text-slate-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!tester || !userId) return null;

  const contextValue: UATTesterContextValue = {
    tester,
    userId,
    refreshTester,
  };

  return (
    <UATTesterContext.Provider value={contextValue}>
      {children}
    </UATTesterContext.Provider>
  );
}