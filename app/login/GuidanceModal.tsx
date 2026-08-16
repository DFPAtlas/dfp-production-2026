'use client';

import { useState, useRef, useEffect } from 'react';

interface GuidanceModalProps {
  open: boolean;
  onClose: () => void;
}

export default function GuidanceModal({ open, onClose }: GuidanceModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const lastSubmitRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    const now = Date.now();
    if (now - lastSubmitRef.current < 5000) {
      setError('Please wait a moment before trying again.');
      return;
    }
    lastSubmitRef.current = now;

    setLoading(true);

    try {
      await fetch('https://zjqftnkrmqhmbrtkvafy.supabase.co/functions/v1/account-guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
    } catch {
    }

    if (mountedRef.current) {
      setSent(true);
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setSent(false);
    setError('');
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 z-10">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <i className="ri-close-line text-lg w-5 h-5 flex items-center justify-center" />
        </button>

        {sent ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <i className="ri-mail-check-line text-2xl text-green-500 w-7 h-7 flex items-center justify-center" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Check your email</h3>
            <p className="text-sm text-slate-500 mb-6">
              If an account or invitation is associated with that address, we will send the appropriate sign-in guidance.
            </p>
            <button
              onClick={handleClose}
              className="w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-[#06B6D4] hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
                <i className="ri-mail-send-line text-xl text-amber-500 w-6 h-6 flex items-center justify-center" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Find your sign-in area</h3>
              <p className="text-sm text-slate-500">
                Enter your email and we will send guidance to the right inbox. We will never reveal whether an account exists on this page.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="guidance-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Your email address
                </label>
                <input
                  id="guidance-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 focus:outline-none text-sm text-slate-800 placeholder-slate-400 transition-all"
                />
              </div>

              <input
                type="text"
                name="phone_alt"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                readOnly
                className="absolute opacity-0 w-0 h-0 pointer-events-none"
              />

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-[#06B6D4] hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="ri-mail-send-line w-4 h-4 flex items-center justify-center" />
                    Send guidance
                  </>
                )}
              </button>
            </form>

            <p className="text-xs text-slate-400 mt-4 text-center">
              We look up your email securely and only send guidance to verified inboxes.
            </p>
          </>
        )}
      </div>
    </div>
  );
}