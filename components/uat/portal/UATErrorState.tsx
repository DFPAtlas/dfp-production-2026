'use client';

import { AlertCircle } from 'lucide-react';

interface UATErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export default function UATErrorState({ message, onRetry }: UATErrorStateProps) {
  return (
    <div className="px-5 py-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 mb-4">
        <AlertCircle className="h-8 w-8 text-red-400" />
      </div>
      <h3 className="text-lg font-bold text-[#17325c] mb-2">Something went wrong</h3>
      <p className="text-sm text-slate-500 mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-xl bg-[#2878d0] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 hover:bg-[#1e68b9] transition cursor-pointer whitespace-nowrap"
        >
          Retry
        </button>
      )}
    </div>
  );
}