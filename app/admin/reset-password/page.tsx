'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from '@/components/motion';
import { Eye, EyeOff, ArrowLeft, Loader2, KeyRound, Check, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function getResetRedirectUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin + '/admin/reset-password';
  }
  return `${process.env.NEXT_PUBLIC_SITE_URL || 'https://digital-footprint.uk'}/admin/reset-password`;
}

export default function AdminResetPasswordPage() {
  const router = useRouter();
  const mountedRef = useRef(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [checking, setChecking] = useState(true);
  const [validSession, setValidSession] = useState(false);
  const [fromEmail, setFromEmail] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [linkError, setLinkError] = useState<{code: string; description: string} | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    const hashParams = new URLSearchParams(hash);
    const searchParams = new URLSearchParams(window.location.search);
    
    const errorParam = hashParams.get('error') || searchParams.get('error');
    const errorCode = hashParams.get('error_code') || searchParams.get('error_code');
    const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');
    
    if (errorParam || errorCode) {
      if (errorCode === 'otp_expired') {
        setLinkError({ code: 'otp_expired', description: 'This reset link has expired or was already opened (email security scanners can consume links). Request a new one below.' });
      } else {
        setLinkError({ code: errorCode || 'unknown', description: decodeURIComponent(errorDescription || errorParam || 'Unknown error occurred.') });
      }
      setChecking(false);
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 15;

    function checkForSession() {
      if (cancelled || !mountedRef.current) return;

      supabase.auth.getSession().then(({ data: { session } }) => {
        if (cancelled || !mountedRef.current) return;

        if (session) {
          setValidSession(true);
          setFromEmail(true);
          setChecking(false);
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          pollRef.current = setTimeout(checkForSession, 500);
        } else {
          setValidSession(false);
          setChecking(false);
        }
      });
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled || !mountedRef.current) return;

      if (session) {
        setValidSession(true);
        setFromEmail(true);
        setChecking(false);
        return;
      }

      attempts = 1;
      pollRef.current = setTimeout(checkForSession, 500);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled || !mountedRef.current) return;
      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session) {
        setValidSession(true);
        setFromEmail(true);
        setChecking(false);
        if (pollRef.current) clearTimeout(pollRef.current);
      }
    });

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, []);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    const { error: updateErr } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (!mountedRef.current) return;

    if (updateErr) {
      setError(updateErr.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    setTimeout(async () => {
      if (!mountedRef.current) return;
      await supabase.auth.signOut();
      if (mountedRef.current) router.push('/admin/login?reset=done');
    }, 2500);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-3 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Processing recovery link...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col">
      <div className="absolute top-6 left-6">
        <button onClick={() => router.push('/admin/login')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </button>
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
            <h1 className="text-2xl font-bold text-white mb-1">Set New Password</h1>
            <p className="text-slate-400 text-sm">Choose a new password for your admin account</p>
          </div>

          {!validSession ? (
            <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 shadow-sm">
              <div className="text-center space-y-5">
                <div className="w-14 h-14 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-7 h-7 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white mb-2">
                    {linkError ? (linkError.code === 'otp_expired' ? 'Link Expired' : 'Invalid Reset Link') : 'Invalid or Expired Link'}
                  </h2>
                  <p className="text-sm text-slate-400">
                    {linkError ? linkError.description : 'This password reset link is invalid or has already been used.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-[rgba(255,255,255,0.08)] space-y-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Recovery Options</p>

                  <button
                    onClick={() => router.push('/admin/recovery')}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-[#F97316] to-[#FB923C] rounded-xl font-bold text-white text-sm hover:shadow-lg hover:shadow-[#F97316]/20 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <KeyRound className="w-4 h-4" />
                    Request a New Link
                  </button>

                  <button
                    onClick={() => router.push('/admin/login')}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 border border-[rgba(255,255,255,0.1)] rounded-xl font-medium text-slate-300 text-sm hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Sign In
                  </button>

                  <p className="text-xs text-slate-500 pt-2">
                    Use the Supabase dashboard for additional recovery options.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 shadow-sm">
              <div className="flex items-center justify-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[#06B6D4] to-[#0891B2] rounded-2xl flex items-center justify-center shadow-lg shadow-[#06B6D4]/20">
                  <KeyRound className="w-7 h-7 text-white" />
                </div>
              </div>

              {success ? (
                <div className="text-center space-y-4">
                  <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-7 h-7 text-green-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">Password Updated</h2>
                  <p className="text-sm text-slate-400">
                    Your password has been changed. Redirecting you to sign in...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSetPassword} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        required
                        autoFocus
                        className="w-full px-4 py-3 pr-11 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/15 transition-all"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPasswordConfirm}
                      onChange={(e) => setNewPasswordConfirm(e.target.value)}
                      placeholder="Re-enter your new password"
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/15 transition-all"
                    />
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400"
                    >
                      {error}
                    </motion.div>
                  )}

                  <button type="submit" disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-[#06B6D4] to-[#0891B2] rounded-xl font-bold text-white hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating Password...
                      </>
                    ) : (
                      'Set New Password'
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}