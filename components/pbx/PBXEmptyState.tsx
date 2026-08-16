'use client';

import { Inbox, FlaskConical } from 'lucide-react';
import Link from 'next/link';

interface PBXEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  comingSoon?: boolean;
  onRequestAccess?: () => void;
}

export default function PBXEmptyState({ icon, title, description, actionLabel, actionHref, onAction, comingSoon, onRequestAccess }: PBXEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-[rgba(255,255,255,0.06)] flex items-center justify-center mb-4">
        {icon || <Inbox className="w-7 h-7 text-slate-500" />}
      </div>
      <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-1">{description}</p>
      {comingSoon && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/15 text-[#3B82F6] text-[10px] font-medium whitespace-nowrap mb-4">
          <FlaskConical className="w-3 h-3" />
          This feature is in testing — demo data may be shown
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-2 mt-4">
      {actionLabel && (actionHref ? (
        <Link href={actionHref} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#06B6D4] hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap">
          {actionLabel}
        </Link>
      ) : onAction ? (
        <button onClick={onAction} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#06B6D4] hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap">
          {actionLabel}
        </button>
      ) : null)}
      {onRequestAccess && (
        <button onClick={onRequestAccess} className="px-4 py-2 rounded-lg text-sm font-medium text-[#F59E0B] border border-[#F59E0B]/25 hover:bg-[#F59E0B]/10 transition-colors cursor-pointer whitespace-nowrap">
          Request Early Access
        </button>
      )}
      </div>
    </div>
  );
}