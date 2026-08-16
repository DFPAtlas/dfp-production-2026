'use client';

import { useSessionExpiry } from '@/hooks/useSessionExpiry';
import { useSafeNavigation } from '@/hooks/useSafeNavigation';
import { supabase } from '@/lib/supabase';
import { X, ShieldAlert, Clock, LogIn } from 'lucide-react';
import { useState, useRef } from 'react';

interface SessionExpiryBannerProps {
  loginPath: string;
  portalName: string;
}

export default function SessionExpiryBanner({ loginPath, portalName }: SessionExpiryBannerProps) {
  const { state, dismiss } = useSessionExpiry();
  const { replace } = useSafeNavigation();
  const [loggingOut, setLoggingOut] = useState(false);
  const signOutRef = useRef(false);

  const handleReAuthenticate = async () => {
    if (signOutRef.current) return;
    signOutRef.current = true;
    setLoggingOut(true);
    await supabase.auth.signOut();
    replace(loginPath);
  };

  if (state.status === 'loading' || state.status === 'valid') {
    return null;
  }

  if (state.status === 'expired') {
    return (
      <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4 text-red-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-400">Your session has expired</p>
              <p className="text-xs text-red-400/70">You need to sign in again to continue using the {portalName}.</p>
            </div>
          </div>
          <button
            onClick={handleReAuthenticate}
            disabled={loggingOut}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-60"
          >
            <LogIn className="w-4 h-4" />
            {loggingOut ? 'Signing out...' : 'Re-authenticate'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-400">Session expiring soon</p>
            <p className="text-xs text-amber-400/70">
              Your session will expire in about {Math.round(state.minutesLeft)} {state.minutesLeft === 1 ? 'minute' : 'minutes'}. Save your work and re-authenticate.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleReAuthenticate}
            disabled={loggingOut}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-900 font-semibold text-sm hover:bg-amber-400 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
          >
            <LogIn className="w-4 h-4" />
            {loggingOut ? 'Signing out...' : 'Re-authenticate'}
          </button>
          <button
            onClick={dismiss}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}