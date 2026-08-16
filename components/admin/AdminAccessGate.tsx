'use client';

import { useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useGateState, type GateVerifyResult } from '@/hooks/useGateState';
import { verifyAdminAccess, getAccessDeniedMessage, type AdminAccessDeniedReason } from '@/lib/admin-access';
import type { Session } from '@supabase/supabase-js';

const PUBLIC_PATHS = ['/admin/login', '/admin/reset-password', '/admin/recovery'];

function normalisePath(value: string) {
  if (!value) return '/';
  const clean = value.length > 1 ? value.replace(/\/+$/, '') : value;
  return clean || '/';
}

function isPublicAdminPath(path: string): boolean {
  const currentPath = normalisePath(path || '');
  for (const pub of PUBLIC_PATHS) {
    if (currentPath === pub || currentPath.endsWith(pub)) {
      return true;
    }
  }
  return false;
}

function ProtectedAdminAccessGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const navigationInProgressRef = useRef(false);

  const verifyAccess = useCallback(async (session: Session): Promise<GateVerifyResult> => {
    const result = await verifyAdminAccess(session);
    return {
      allowed: result.allowed,
      reason: result.reason,
    };
  }, []);

  const { gateState, deniedReason } = useGateState({
    publicPaths: PUBLIC_PATHS,
    loginPath: '/admin/login',
    verifyAccess,
  });

  const handleSignOut = async () => {
    if (navigationInProgressRef.current) return;
    navigationInProgressRef.current = true;
    if (supabase) await supabase.auth.signOut();
    router.push('/admin/login');
  };

  if (gateState === 'checking') {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-[3px] border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Checking administrator access...</p>
      </div>
    );
  }

  if (gateState === 'denied') {
    const reason = (deniedReason as AdminAccessDeniedReason) || 'query_failed';
    const message = getAccessDeniedMessage(reason);

    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <i className="ri-shield-cross-line text-2xl text-red-400 w-7 h-7 flex items-center justify-center" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Access Denied</h1>
          <p className="text-sm text-slate-400 mb-6">{message}</p>
          <div className="space-y-3">
            <button
              onClick={handleSignOut}
              className="w-full py-3 rounded-xl font-semibold text-sm text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors cursor-pointer whitespace-nowrap"
            >
              Sign Out
            </button>
            <Link
              href="/admin/login"
              className="block w-full py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#06B6D4] to-[#0891B2] hover:shadow-lg transition-all cursor-pointer text-center whitespace-nowrap"
            >
              Go to Sign In
            </Link>
            <Link
              href="/account/help"
              className="block w-full py-3 rounded-xl font-medium text-sm text-slate-300 bg-white/5 border border-[rgba(255,255,255,0.1)] hover:bg-white/10 transition-colors cursor-pointer text-center whitespace-nowrap"
            >
              Account Help
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function AdminAccessGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isPublic = [pathname, typeof window !== 'undefined' ? window.location.pathname : ''].some(
    (p) => p && isPublicAdminPath(p)
  );

  if (isPublic) {
    return <>{children}</>;
  }

  return (
    <ProtectedAdminAccessGate>
      {children}
    </ProtectedAdminAccessGate>
  );
}