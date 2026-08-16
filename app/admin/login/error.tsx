'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function AdminLoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('AdminLoginError boundary caught:', error.message);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col">
      <div className="absolute top-6 left-6 z-10">
        <Link href="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer">
          <i className="ri-arrow-left-line w-4 h-4 flex items-center justify-center" />
          Back to Website
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">Admin Portal</h1>
            <p className="text-slate-400 text-sm">Digital Footprint — Admin Access Only</p>
          </div>

          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 text-center shadow-sm">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <i className="ri-error-warning-line text-2xl text-red-400 w-7 h-7 flex items-center justify-center" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-400 mb-6">
              We couldn&apos;t load the administrator sign-in page.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={reset}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#0891B2] text-white font-semibold text-sm hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
              >
                Try Again
              </button>
              <Link
                href="/"
                className="px-6 py-3 rounded-xl font-medium text-sm text-slate-300 bg-white/5 border border-[rgba(255,255,255,0.1)] hover:bg-white/10 transition-colors cursor-pointer text-center whitespace-nowrap"
              >
                Back to Website
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}