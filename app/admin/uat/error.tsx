'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function UATErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.error('[admin:uat] error boundary caught', error.message);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-5">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>
      <h1 className="text-xl font-bold text-white mb-2">UAT Page Error</h1>
      <p className="text-sm text-slate-400 mb-8 max-w-md text-center">
        An unexpected error occurred while loading this UAT page. Your admin session is still active.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-3 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
        <Link
          href="/admin/uat"
          className="inline-flex items-center gap-2 px-5 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm font-medium hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap"
        >
          UAT Control Room
        </Link>
      </div>
    </div>
  );
}