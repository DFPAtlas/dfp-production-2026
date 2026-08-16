'use client';

import { RefreshCw, PackageOpen, SearchX, ShieldAlert, WifiOff, AlertTriangle, RotateCcw, Settings, FileX, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface DataStateProps {
  className?: string;
  onRetry?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

export function LoadingState({ className = '' }: DataStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 ${className}`}>
      <div className="w-10 h-10 border-[3px] border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin mb-4" />
      <p className="text-sm text-slate-400">Loading data...</p>
    </div>
  );
}

export function NoRecordsState({ onAction, actionLabel, className = '' }: DataStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
        <PackageOpen className="w-7 h-7 text-slate-500" />
      </div>
      <p className="text-slate-300 font-medium text-lg mb-1">No records found</p>
      <p className="text-sm text-slate-500 mb-5">Nothing here yet. Get started by creating your first record.</p>
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function NoFilterMatchesState({ onRetry, className = '' }: DataStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
        <SearchX className="w-7 h-7 text-slate-500" />
      </div>
      <p className="text-slate-300 font-medium text-lg mb-1">No matches found</p>
      <p className="text-sm text-slate-500 mb-5">Try adjusting your search or filters to find what you&apos;re looking for.</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm font-medium hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap"
        >
          <RotateCcw className="w-4 h-4" />
          Clear Filters
        </button>
      )}
    </div>
  );
}

export function AccessDeniedState({ className = '' }: DataStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
        <ShieldAlert className="w-7 h-7 text-red-400" />
      </div>
      <p className="text-slate-300 font-medium text-lg mb-1">Access Denied</p>
      <p className="text-sm text-slate-500">You do not have permission to view this page.</p>
    </div>
  );
}

export function ConnectionFailedState({ onRetry, className = '' }: DataStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
        <WifiOff className="w-7 h-7 text-amber-400" />
      </div>
      <p className="text-slate-300 font-medium text-lg mb-1">Connection Failed</p>
      <p className="text-sm text-slate-500 mb-5">Unable to connect to the database. Please check your connection and try again.</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      )}
    </div>
  );
}

export function NotConfiguredState({ onAction, actionLabel, className = '' }: DataStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
        <Settings className="w-7 h-7 text-amber-400" />
      </div>
      <p className="text-slate-300 font-medium text-lg mb-1">Configuration Required</p>
      <p className="text-sm text-slate-500 mb-5">This section needs additional setup before it can be used.</p>
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ErrorState({ onRetry, className = '', children }: DataStateProps & { children?: React.ReactNode }) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
        <AlertTriangle className="w-7 h-7 text-red-400" />
      </div>
      <p className="text-slate-300 font-medium text-lg mb-1">Something went wrong</p>
      {children ? (
        <div className="text-sm text-slate-500 mb-5 text-center max-w-md">{children}</div>
      ) : (
        <p className="text-sm text-slate-500 mb-5">An unexpected error occurred while loading data.</p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      )}
    </div>
  );
}

export function RecordUnavailableState({ onBack, backHref, className = '' }: DataStateProps & { backHref?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-slate-500/10 flex items-center justify-center mb-4">
        <FileX className="w-7 h-7 text-slate-500" />
      </div>
      <p className="text-slate-300 font-medium text-lg mb-1">Record Unavailable</p>
      <p className="text-sm text-slate-500 mb-5 max-w-md text-center">
        This record is not available or you do not have permission to view it.
      </p>
      <div className="flex gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm font-medium hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        )}
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm font-medium hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Link>
        )}
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
        >
          Admin Dashboard
        </Link>
      </div>
    </div>
  );
}

export function AdminPageLoading({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 ${className}`}>
      <div className="w-10 h-10 border-[3px] border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin mb-4" />
      <p className="text-sm text-slate-400">Loading...</p>
    </div>
  );
}

export function AdminPageError({ onRetry, message, className = '' }: { onRetry?: () => void; message?: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
        <AlertTriangle className="w-7 h-7 text-red-400" />
      </div>
      <p className="text-slate-300 font-medium text-lg mb-1">Something went wrong</p>
      <p className="text-sm text-slate-500 mb-5 max-w-md text-center">
        {message || 'An unexpected error occurred while loading this page.'}
      </p>
      <div className="flex gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        )}
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm font-medium hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap"
        >
          Admin Dashboard
        </Link>
      </div>
    </div>
  );
}

export function AdminAccessDenied({ reason, className = '' }: { reason?: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
        <ShieldAlert className="w-7 h-7 text-red-400" />
      </div>
      <p className="text-slate-300 font-medium text-lg mb-1">Access Denied</p>
      <p className="text-sm text-slate-500 mb-5 max-w-md text-center">
        {reason || 'You do not have permission to access this section.'}
      </p>
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}

export function StaleDataNotice({ lastUpdated, onRefresh }: { lastUpdated: string | null; onRefresh?: () => void }) {
  if (!lastUpdated) return null;
  const diff = Date.now() - new Date(lastUpdated).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 2) return null;
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
      <span>Updated {minutes}m ago</span>
      {onRefresh && (
        <button onClick={onRefresh} className="hover:text-amber-300 transition-colors cursor-pointer">
          <RefreshCw className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}