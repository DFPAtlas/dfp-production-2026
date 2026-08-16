'use client';

import { useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { normaliseAdminRole } from '@/lib/admin-roles';
import { useGateState, type GateVerifyResult } from '@/hooks/useGateState';
import type { Session } from '@supabase/supabase-js';

interface AreaGateProps {
  children: React.ReactNode;
  loginPath: string;
  requiredRoles?: string[];
  publicPaths?: string[];
  profileTable?: string;
}

export default function AreaGate({ children, loginPath, requiredRoles, publicPaths, profileTable }: AreaGateProps) {
  const pathname = usePathname();

  const verifyAccess = useCallback(async (session: Session): Promise<GateVerifyResult> => {
    if (!requiredRoles || !profileTable) {
      return { allowed: true };
    }

    try {
      const { data: profile, error } = await supabase
        .from(profileTable)
        .select('role, active')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        return { allowed: false, reason: 'Could not verify your access. Please try again.' };
      }

      if (!profile) {
        return { allowed: false, reason: 'Access denied — your account is not authorised for this area.' };
      }

      if (profile.active === false) {
        return { allowed: false, reason: 'Your account is currently inactive. Contact an administrator.' };
      }

      const normalisedRole = normaliseAdminRole(profile.role) || profile.role;
      if (!profile.role || !requiredRoles.includes(normalisedRole)) {
        return { allowed: false, reason: 'Access denied — your account is not authorised for this area.' };
      }

      return { allowed: true };
    } catch {
      return { allowed: false, reason: 'Access verification failed. Please try again.' };
    }
  }, [requiredRoles, profileTable]);

  const { gateState, deniedReason } = useGateState({
    publicPaths,
    loginPath,
    verifyAccess,
  });

  const isPublic = publicPaths && publicPaths.some((p) => pathname === p || pathname.startsWith(p));
  if (isPublic) {
    return <>{children}</>;
  }

  if (gateState === 'idle' || gateState === 'checking') {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-[3px] border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Checking access...</p>
      </div>
    );
  }

  if (gateState === 'denied') {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
          <i className="ri-shield-cross-line text-2xl text-red-400 w-7 h-7 flex items-center justify-center" />
        </div>
        <h1 className="text-xl font-semibold text-white">Access Denied</h1>
        {deniedReason && (
          <p className="text-sm text-slate-400 max-w-sm text-center">{deniedReason}</p>
        )}
        <button
          onClick={async () => {
            if (supabase) await supabase.auth.signOut();
            window.location.href = loginPath;
          }}
          className="mt-4 px-6 py-2.5 rounded-xl font-medium text-sm text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors cursor-pointer whitespace-nowrap"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return <>{children}</>;
}