'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSafeNavigation } from '@/hooks/useSafeNavigation';
import { supabase, getSessionSafe } from '@/lib/supabase';
import { getCurrentAdminAccess } from '@/lib/admin-access';

interface Destination {
  key: string;
  label: string;
  description: string;
  href: string;
  icon: string;
}

function AuthCallbackContent() {
  const { replace } = useSafeNavigation();
  const searchParams = useSearchParams();
  const mountedRef = useRef(true);
  const navigationInProgressRef = useRef(false);

  const [phase, setPhase] = useState<'loading' | 'error' | 'chooser' | 'redirecting'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [redirectHref, setRedirectHref] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (redirectHref && mountedRef.current && !navigationInProgressRef.current) {
      navigationInProgressRef.current = true;
      replace(redirectHref);
    }
  }, [redirectHref, replace]);

  useEffect(() => {
    let cancelled = false;

    const processCallback = async () => {
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (errorParam) {
        if (!cancelled && mountedRef.current) {
          setPhase('error');
          setErrorMsg(decodeURIComponent(errorDescription || errorParam));
        }
        return;
      }

      const session = await getSessionSafe();
      if (cancelled || !mountedRef.current) return;

      if (!session) {
        setPhase('error');
        setErrorMsg('Session not found. Your sign-in link may have expired. Please try again.');
        return;
      }

      const userId = session.user.id;
      const userEmail = session.user.email || '';
      if (!cancelled && mountedRef.current) setEmail(userEmail);

      const foundDestinations: Destination[] = [];

      try {
        const [adminAccess, staffRes, portalRes, uatRes] = await Promise.all([
          getCurrentAdminAccess(),
          supabase.from('staff_profiles').select('id').eq('id', userId).maybeSingle(),
          supabase.from('portal_access').select('id, access_role').eq('user_id', userId).eq('is_revoked', false).maybeSingle(),
          supabase.from('uat_testers').select('id').eq('user_id', userId).maybeSingle(),
        ]);

        if (cancelled || !mountedRef.current) return;

        if (adminAccess.allowed) {
          foundDestinations.push({
            key: 'admin',
            label: 'Admin Portal',
            description: 'Full platform administration',
            href: '/admin',
            icon: 'ri-shield-line',
          });
        }

        if (staffRes.data) {
          foundDestinations.push({
            key: 'staff',
            label: 'Staff Gateway',
            description: 'Team workspace and tools',
            href: '/staff/dashboard',
            icon: 'ri-team-line',
          });
        }
        if (portalRes.data) {
          foundDestinations.push({
            key: 'client',
            label: 'Client Portal',
            description: `Access as ${portalRes.data.access_role || 'client'}`,
            href: '/portal/dashboard',
            icon: 'ri-user-line',
          });
        }
        if (uatRes.data) {
          foundDestinations.push({
            key: 'uat',
            label: 'UAT TestLab',
            description: 'Testing and feedback dashboard',
            href: '/uat/dashboard',
            icon: 'ri-test-tube-line',
          });
        }
      } catch {
        if (cancelled || !mountedRef.current) return;
      }

      if (cancelled || !mountedRef.current) return;

      if (foundDestinations.length === 0) {
        setPhase('error');
        setErrorMsg('No active Digital Footprint access was found for your account. If you believe this is an error, please contact support.');
        return;
      }

      if (foundDestinations.length === 1) {
        setRedirectHref(foundDestinations[0].href);
        setPhase('redirecting');
        return;
      }

      setDestinations(foundDestinations);
      setPhase('chooser');
    };

    processCallback();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  if (phase === 'loading' || phase === 'redirecting') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-[3px] border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
        <p className="text-sm text-slate-500">
          {phase === 'redirecting' ? 'Taking you to your dashboard...' : 'Verifying your session...'}
        </p>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <i className="ri-error-warning-line text-2xl text-red-500 w-7 h-7 flex items-center justify-center" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Sign-in issue</h1>
          <p className="text-sm text-slate-500 mb-6">{errorMsg}</p>
          <div className="space-y-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-1.5 w-full py-3 rounded-xl font-semibold text-sm text-white bg-[#06B6D4] hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
            >
              <i className="ri-arrow-left-line w-4 h-4 flex items-center justify-center" />
              Back to sign-in
            </Link>
            <Link
              href="/account/help"
              className="inline-flex items-center justify-center w-full py-3 rounded-xl font-medium text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer whitespace-nowrap"
            >
              Account help
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-[#06B6D4]/8 flex items-center justify-center mx-auto mb-3">
            <i className="ri-user-settings-line text-2xl text-[#06B6D4] w-7 h-7 flex items-center justify-center" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Choose your workspace</h1>
          <p className="text-sm text-slate-500">
            Signed in as <span className="font-medium text-slate-700">{email}</span>. You have access to multiple areas.
          </p>
        </div>

        <div className="space-y-3">
          {destinations.map((dest) => (
            <Link
              key={dest.key}
              href={dest.href}
              className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-[#06B6D4]/30 hover:shadow-md hover:shadow-[#06B6D4]/5 transition-all cursor-pointer bg-white"
            >
              <div className="w-11 h-11 rounded-xl bg-[#06B6D4]/8 flex items-center justify-center shrink-0">
                <i className={`${dest.icon} text-lg text-[#06B6D4] w-6 h-6 flex items-center justify-center`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 text-sm">{dest.label}</div>
                <div className="text-xs text-slate-500">{dest.description}</div>
              </div>
              <i className="ri-arrow-right-s-line text-slate-400 w-5 h-5 flex items-center justify-center" />
            </Link>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/login';
            }}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors cursor-pointer whitespace-nowrap"
          >
            Sign out and choose a different account
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-[3px] border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}