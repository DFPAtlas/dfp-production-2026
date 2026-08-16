'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { supabase, getSessionSafe } from '@/lib/supabase';
import { motion } from '@/components/motion';
import { Shield, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSafeNavigation } from '@/hooks/useSafeNavigation';



function StaffLoginContent() {
  const { replace } = useSafeNavigation();
  const searchParams = useSearchParams();
  const fromGate = searchParams.get('from') === 'gate';
  const mountedRef = useRef(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

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
        if (!cancelled && mountedRef.current) setChecking(false);
        return;
      }

      try {
        const session = await getSessionSafe();
        if (cancelled || !mountedRef.current) return;
        if (session?.user) {
          try {
            const { data: sp } = await supabase.from('staff_profiles').select('id').eq('id', session.user.id).maybeSingle();
            if (cancelled || !mountedRef.current) return;
            if (sp) {
              safeReplace('/staff/dashboard');
              return;
            }
          } catch {}
        }
      } catch {}
      if (!cancelled && mountedRef.current) setChecking(false);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled || !mountedRef.current) return;
      if (event === 'SIGNED_IN' && session) {
        safeReplace('/staff/dashboard');
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (!mountedRef.current) return;
      if (authError) {
        setError(authError.message === 'Invalid login credentials' ? 'Incorrect email or password.' : authError.message);
        setLoading(false);
        return;
      }

      if (data.session?.user) {
        const { data: sp } = await supabase.from('staff_profiles').select('id').eq('id', data.session.user.id).maybeSingle();
        if (!mountedRef.current) return;
        if (!sp) {
          setError('Your account does not have staff access. Contact an administrator.');
          await supabase.auth.signOut().catch(() => {});
          setLoading(false);
          return;
        }
        safeReplace('/staff/dashboard');
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err?.message || 'Something went wrong. Please try again.');
        setLoading(false);
      }
    }
  };

  if (checking) {
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
          Back to Website
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex flex-col items-center">
              <img
                src="https://storage.readdy-site.link/project_files/9c829bf4-c727-45a7-99f8-358e1780c66a/eee9f9ba-b907-488b-a1a8-f6d02534a71b_compressed_Remove-Background-Keep-Foot-Logo.webp"
                alt="Digital Footprint Logo"
                width={64}
                height={64}
                className="object-contain rounded-xl mb-4"
              />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Staff Portal</h1>
            <p className="text-slate-400 text-sm">Digital Footprint — Staff Access Only</p>
          </div>

          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 shadow-sm">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@digital-footprint.uk"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/15 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full px-4 py-3 pr-11 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/15 transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600"
                >
                  {error}
                </motion.div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-3 bg-[#06B6D4] hover:bg-[#0891B2] rounded-xl font-bold text-white hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-[rgba(255,255,255,0.08)] text-center">
              <p className="text-xs text-slate-500">
                One Contact. One Relationship. One Vision.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function StaffLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
      </div>
    }>
      <StaffLoginContent />
    </Suspense>
  );
}