'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { supabase, getSessionSafe } from '@/lib/supabase';
import { motion } from '@/components/motion';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSafeNavigation } from '@/hooks/useSafeNavigation';



function PortalLoginContent() {
  const { replace } = useSafeNavigation();
  const searchParams = useSearchParams();
  const fromGate = searchParams.get('from') === 'gate';
  const mountedRef = useRef(true);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const safeReplace = (href: string) => {
    if (mountedRef.current) replace(href);
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (fromGate) {
        if (!cancelled && mountedRef.current) setCheckingAuth(false);
        return;
      }

      try {
        const session = await getSessionSafe();
        if (cancelled || !mountedRef.current) return;
        if (session) {
          safeReplace('/portal/dashboard');
          return;
        }
      } catch {}
      if (!cancelled && mountedRef.current) setCheckingAuth(false);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled || !mountedRef.current) return;
      if (event === 'SIGNED_IN' && session) {
        safeReplace('/portal/dashboard');
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/portal/dashboard`,
        },
      });

      if (!mountedRef.current) return;
      if (authError) {
        setError(authError.message);
      } else {
        setSent(true);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col">
      <div className="absolute top-6 left-6">
        <Link href="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          Back to Digital Footprint
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-6">
              <div className="flex flex-col items-center">
                <img
                  src="https://storage.readdy-site.link/project_files/9c829bf4-c727-45a7-99f8-358e1780c66a/eee9f9ba-b907-488b-a1a8-f6d02534a71b_compressed_Remove-Background-Keep-Foot-Logo.webp"
                  alt="Digital Footprint Logo"
                  width={64}
                  height={64}
                  className="object-contain rounded-xl mb-4"
                />
                <span className="text-2xl font-bold tracking-tight text-white">
                  Digital<span className="text-[#06B6D4]"> Footprint</span>
                </span>
              </div>
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2">Client Portal</h1>
            <p className="text-slate-400">Reshaping Your Digital World</p>
          </div>

          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 shadow-sm">
            {!sent ? (
              <form onSubmit={handleSendLink} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Sign in to your portal</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                      className="w-full pl-11 pr-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4]/20 transition-all"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">We&apos;ll send you a magic link for password-free sign in
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full px-6 py-3 bg-[#06B6D4] hover:bg-[#0891B2] text-white font-semibold text-sm rounded-xl transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending link...
                    </>
                  ) : (
                    'Send Magic Link'
                  )}
                </button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="w-16 h-16 bg-[#06B6D4]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-[#06B6D4]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Check your email</h3>
                <p className="text-slate-400 text-sm mb-1">We sent a magic link to</p>
                <p className="text-white font-medium mb-4">{email}</p>
                <p className="text-xs text-slate-500">Click the link in the email to sign in. If you don&apos;t see it, check your spam folder.
                </p>
                <button
                  onClick={() => { setSent(false); setError(null); }}
                  className="mt-6 text-sm text-[#06B6D4] hover:underline cursor-pointer"
                >
                  Use a different email
                </button>
              </motion.div>
            )}
          </div>

          <p className="text-center text-xs text-slate-500 mt-6">Need access? Contact your Digital Footprint account manager.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function PortalLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
      </div>
    }>
      <PortalLoginContent />
    </Suspense>
  );
}