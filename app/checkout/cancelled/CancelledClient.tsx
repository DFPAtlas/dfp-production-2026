'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function CancelledContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref') || '';

  return (
    <div className="max-w-2xl mx-auto pt-32 pb-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[rgba(139,108,255,0.1)] flex items-center justify-center mx-auto mb-6">
        <i className="ri-pause-circle-line text-[#8B6CFF] w-8 h-8 flex items-center justify-center" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F7FA] mb-4">
        Your project has not been started yet.
      </h1>
      <p className="text-[#AAB4C3] mb-8 max-w-md mx-auto">
        No payment has been confirmed. Your selected package is still available when you are ready.
      </p>

      {ref && (
        <div className="rounded-xl border border-[rgba(148,163,184,0.15)] bg-[rgba(15,23,42,0.5)] p-4 mb-8 max-w-sm mx-auto">
          <p className="text-xs text-[#64748B]">
            Reference: <span className="text-[#AAB4C3] font-mono">{ref}</span>
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] rounded-xl bg-[#38E8C6] text-[#0B0F14] font-semibold cursor-pointer hover:shadow-[0_0_20px_rgba(56,232,198,0.25)] transition-all text-sm whitespace-nowrap"
        >
          Review pricing
          <i className="ri-price-tag-3-line w-4 h-4 flex items-center justify-center" />
        </Link>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] rounded-xl border border-[rgba(148,163,184,0.25)] text-[#F5F7FA] font-semibold cursor-pointer hover:border-[#38E8C6]/40 hover:text-[#38E8C6] transition-all text-sm whitespace-nowrap"
        >
          Talk to us
        </Link>
      </div>
    </div>
  );
}

export default function CancelledClient() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto pt-32 pb-20 px-6 text-center">
          <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center">
            <i className="ri-loader-4-line text-[#38E8C6] w-10 h-10 flex items-center justify-center animate-spin" />
          </div>
        </div>
      }
    >
      <CancelledContent />
    </Suspense>
  );
}