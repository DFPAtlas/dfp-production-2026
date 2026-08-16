'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { verifyAdminAccess, getAccessDeniedMessage } from '@/lib/admin-access';
import { Shield, Eye, EyeOff, ArrowLeft, Loader2, Mail, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function getResetRedirectUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin + '/admin/reset-password';
  }
  return 'https://digital-footprint.uk/admin/reset-password';
}

function readSearchParam(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return new URL(window.location.href).searchParams.get(key);
  } catch {
    return null;
  }
}

export default function AdminLoginPage() {
  const router = useRouter();
  const mountedRef = useRef(true);
  const loginInProgressRef = useRef(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [deniedSession, setDeniedSession] = useState(false);
  const [configWarning, setConfigWarning] = useState('');
  const [justReset, setJustReset] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setConfigWarning('Authentication is temporarily unavailable because the application configuration could not be loaded.');
      return;
    }
    setConfigWarning('');
  }, []);

  useEffect(() => {
    if (readSearchParam('reset') === 'done') {
      setJustReset(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const checkExisting = async () => {
      if (readSearchParam('from') === 'gate') {
        return;
      }
      if (!isSupabaseConfigured()) {
        return;
      }

      try {
        const { data } = await supabase?.auth.getSession();
        const session = data?.session;

        if (!session || cancelled || !mountedRef.current) {
          return;
        }

        const result = await verifyAdminAccess(session);
        if (!mountedRef.current || cancelled) return;

        if (result.allowed) {
          router.push('/admin');
        } else {
          setDeniedSession(true);
        }
      } catch {
      }
    };

    checkExisting();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supabase) {
      setError('Authentication service unavailable. Please refresh.');
      return;
    }
    if (loginInProgressRef.current) {
      return;
    }
    loginInProgressRef.current = true;
    setError('');
    setDeniedSession(false);
    setLoading(true);

    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (!mountedRef.current) { loginInProgressRef.current = false; return; }

      if (signInError) {
        setLoading(false);
        loginInProgressRef.current = false;
        if (signInError.message?.includes('Invalid login credentials') || signInError.message?.includes('invalid')) {
          setError('The email address or password was not recognised.');
        } else if (signInError.message?.includes('rate') || signInError.message?.includes('too many')) {
          setError('Too many attempts. Please wait a moment and try again.');
        } else if (signInError.message?.includes('Email not confirmed')) {
          setError('Email address not confirmed. Please check your inbox or contact an administrator.');
        } else {
          setError('Sign-in failed. Please try again.');
        }
        return;
      }

      if (!signInData?.session) {
        if (!mountedRef.current) { loginInProgressRef.current = false; return; }
        setError('Session not established. Please try again.');
        setLoading(false);
        loginInProgressRef.current = false;
        return;
      }

      const result = await verifyAdminAccess(signInData.session);

      if (!mountedRef.current) { loginInProgressRef.current = false; return; }

      if (result.allowed) {
        setLoading(false);
        loginInProgressRef.current = false;
        router.push('/admin');
        return;
      }

      const message = getAccessDeniedMessage(result.reason);
      setError(message);
      setDeniedSession(true);
      setLoading(false);
      loginInProgressRef.current = false;
    } catch (_err) {
      if (mountedRef.current) {
        setError('Something went wrong. Please try again.');
        setLoading(false);
        loginInProgressRef.current = false;
      }
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    setLoading(true);
    await supabase.auth.signOut();
    if (mountedRef.current) {
      setDeniedSession(false);
      setError('');
      setLoading(false);
    }
  };

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setResetError('Authentication service unavailable.');
      return;
    }
    setResetError('');

    if (!resetEmail) {
      setResetError('Please enter your email address.');
      return;
    }

    setResetLoading(true);

    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: getResetRedirectUrl(),
    });

    if (!mountedRef.current) return;

    if (resetErr) {
      setResetError(resetErr.message);
    } else {
      setResetSent(true);
    }

    if (mountedRef.current) setResetLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col">
      <div className="absolute top-6 left-6 z-10">
        <Link href="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          Back to Website
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
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
            <h1 className="text-2xl font-bold text-white mb-1">Admin Portal</h1>
            <p className="text-slate-400 text-sm">Digital Footprint — Admin Access Only</p>
          </div>

          {showReset ? (
            <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 shadow-sm">
              <div className="flex items-center justify-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[#06B6D4] to-[#0891B2] rounded-2xl flex items-center justify-center shadow-lg shadow-[#06B6D4]/20">
                  <Mail className="w-7 h-7 text-white" />
                </div>
              </div>

              {resetSent ? (
                <div className="text-center space-y-4">
                  <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-7 h-7 text-green-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">Check Your Email</h2>
                  <p className="text-sm text-slate-400">
                    If an eligible account exists, password recovery instructions have been sent. Check your inbox and spam folder.
                  </p>
                  <button
                    onClick={() => { setShowReset(false); setResetSent(false); setResetEmail(''); setResetError(''); }}
                    className="text-sm text-[#06B6D4] hover:text-[#0891B2] transition-colors cursor-pointer mt-2 whitespace-nowrap"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-center text-lg font-semibold text-white mb-1">Forgot Password</h2>
                  <p className="text-center text-sm text-slate-400 mb-6">
                    Enter your admin email and we&apos;ll send you a secure reset link.
                  </p>

                  <form onSubmit={handleSendResetEmail} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="admin@digital-footprint.uk"
                        required
                        autoFocus
                        className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/15 transition-all"
                      />
                    </div>

                    {resetError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                        {resetError}
                      </div>
                    )}

                    <button type="submit" disabled={resetLoading}
                      className="w-full py-3 bg-gradient-to-r from-[#06B6D4] to-[#0891B2] rounded-xl font-bold text-white hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap"
                    >
                      {resetLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Reset Link'
                      )}
                    </button>

                    <button type="button"
                      onClick={() => { setShowReset(false); setResetEmail(''); setResetError(''); }}
                      className="w-full text-center text-sm text-slate-400 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Back to Sign In
                    </button>
                  </form>
                </>
              )}
            </div>
          ) : (
            <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 shadow-sm">
              <div className="flex items-center justify-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[#06B6D4] to-[#0891B2] rounded-2xl flex items-center justify-center shadow-lg shadow-[#06B6D4]/20">
                  <Shield className="w-7 h-7 text-white" />
                </div>
              </div>

              {configWarning && (
                <div className="mb-5 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-400">
                  {configWarning}
                </div>
              )}

              {justReset && (
                <div className="mb-5 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-sm text-green-400 text-center">
                  Password updated successfully. Please sign in with your new password.
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@digital-footprint.uk"
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

                <div className="flex justify-end">
                  <button type="button"
                    onClick={() => setShowReset(true)}
                    className="text-sm text-[#06B6D4] hover:text-[#0891B2] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Forgot Password?
                  </button>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-[#06B6D4] to-[#0891B2] rounded-xl font-bold text-white hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap"
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

              {deniedSession && (
                <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.08)] space-y-3">
                  <p className="text-xs text-slate-500 text-center">Your account is signed in but does not have admin access.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSignOut}
                      disabled={loading}
                      className="flex-1 py-2.5 rounded-xl font-medium text-sm text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                    >
                      Sign Out
                    </button>
                    <Link
                      href="/account/help"
                      className="flex-1 py-2.5 rounded-xl font-medium text-sm text-slate-300 bg-white/5 border border-[rgba(255,255,255,0.1)] hover:bg-white/10 transition-colors cursor-pointer text-center whitespace-nowrap"
                    >
                      Account Help
                    </Link>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-5 border-t border-[rgba(255,255,255,0.08)] text-center">
                <p className="text-xs text-slate-500">
                  One Contact. One Relationship. One Vision.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}