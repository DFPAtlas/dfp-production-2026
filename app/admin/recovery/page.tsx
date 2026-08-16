'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from '@/components/motion';
import { Loader2, Shield, KeyRound, Mail, Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function getResetRedirectUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin + '/admin/reset-password';
  }
  return `${process.env.NEXT_PUBLIC_SITE_URL || 'https://digital-footprint.uk'}/admin/reset-password`;
}

export default function AdminRecoveryPage() {
  const mountedRef = useRef(true);
  const [email, setEmail] = useState('admin@digital-footprint.uk');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email) {
      setErrorMsg('Please enter your admin email address.');
      return;
    }

    setLoading(true);

    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getResetRedirectUrl(),
    });

    if (!mountedRef.current) return;

    if (resetErr) {
      setErrorMsg(resetErr.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="absolute top-6 left-6">
          <Link href="/admin/login" className="flex items-center gap-2 text-sm text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#06B6D4] to-[#0891B2] rounded-2xl flex items-center justify-center shadow-lg shadow-[#06B6D4]/20">
              <KeyRound className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Admin Account Recovery</h1>
          <p className="text-slate-400 text-sm">We&apos;ll email you a secure link to reset your password</p>
        </div>

        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 shadow-sm">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-7 h-7 text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Check Your Email</h2>
              <p className="text-sm text-slate-400">
                If an admin account exists for this email, a reset link has been sent. Check your inbox and spam folder.
              </p>
              <Link
                href="/admin/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#06B6D4] to-[#0891B2] rounded-xl font-bold text-white text-sm hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
              >
                Back to Sign In
              </Link>
            </div>
          ) : loading ? (
            <div className="text-center space-y-4 py-4">
              <Loader2 className="w-10 h-10 text-[#06B6D4] animate-spin mx-auto" />
              <p className="text-sm text-slate-400">Sending secure reset link...</p>
            </div>
          ) : (
            <form onSubmit={handleRecover} className="space-y-5">
              <div className="flex items-center justify-center mb-2">
                <div className="w-14 h-14 bg-gradient-to-br from-[#06B6D4] to-[#0891B2] rounded-2xl flex items-center justify-center shadow-lg shadow-[#06B6D4]/20">
                  <Mail className="w-7 h-7 text-white" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Admin Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@digital-footprint.uk"
                  required
                  autoFocus
                  className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/15 transition-all"
                />
              </div>

              {errorMsg && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400"
                >
                  {errorMsg}
                </motion.div>
              )}

              <button type="submit"
                className="w-full py-3 bg-gradient-to-r from-[#06B6D4] to-[#0891B2] rounded-xl font-bold text-white hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Mail className="w-4 h-4" />
                Send Secure Reset Link
              </button>

              <p className="text-center text-xs text-slate-500 pt-2 border-t border-[rgba(255,255,255,0.08)]">
                For your security, password resets require access to the admin email inbox.
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}