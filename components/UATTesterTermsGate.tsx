'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase, getSessionSafe } from '@/lib/supabase';
import { UAT_TERMS_VERSION } from '@/lib/uat-terms-content';
import { Loader2 } from 'lucide-react';

interface UATTesterTermsGateProps {
  children: React.ReactNode;
}

export default function UATTesterTermsGate({ children }: UATTesterTermsGateProps) {
  const [checking, setChecking] = useState(true);
  const mountedRef = useRef(true);
  const router = useRouter();
  const pathname = usePathname();

  const safeReplace = (href: string) => {
    setTimeout(() => {
      if (mountedRef.current) router.replace(href);
    }, 0);
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const isTermsPage = pathname?.startsWith('/uat-testing/terms');
      if (isTermsPage) {
        if (mountedRef.current) setChecking(false);
        return;
      }

      const session = await getSessionSafe();
      if (cancelled || !mountedRef.current) return;

      if (!session) {
        if (mountedRef.current) setChecking(false);
        return;
      }

      try {
        const { data: activeVersion } = await supabase
          .from('uat_terms_versions')
          .select('id')
          .eq('is_active', true)
          .eq('version', UAT_TERMS_VERSION)
          .maybeSingle();

        if (!activeVersion) {
          if (mountedRef.current) setChecking(false);
          return;
        }

        const { data: acceptance } = await supabase
          .from('uat_terms_acceptances')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('terms_version_id', activeVersion.id)
          .maybeSingle();

        if (cancelled || !mountedRef.current) return;

        if (!acceptance) {
          safeReplace('/uat-testing/terms');
          return;
        }
      } catch {}

      if (mountedRef.current) setChecking(false);
    };

    check();

    return () => { cancelled = true; };
  }, [pathname, router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#fbfcff] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 text-[#2878d0] animate-spin" />
        <p className="text-sm text-slate-500">Verifying agreement status...</p>
      </div>
    );
  }

  return <>{children}</>;
}