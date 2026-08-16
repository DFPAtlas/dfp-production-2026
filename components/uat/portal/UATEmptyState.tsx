'use client';

import type { LucideIcon } from 'lucide-react';

interface UATEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export default function UATEmptyState({ icon: Icon, title, description, actionLabel, actionHref }: UATEmptyStateProps) {
  return (
    <div className="px-5 py-12 text-center">
      <Icon className="mx-auto h-10 w-10 text-slate-300" />
      <p className="mt-3 font-medium text-[#17325c]">{title}</p>
      <p className="mt-1 text-sm text-slate-400">{description}</p>
      {actionLabel && actionHref && (
        <a
          href={actionHref}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#2878d0] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 hover:bg-[#1e68b9] transition whitespace-nowrap"
        >
          {actionLabel}
        </a>
      )}
    </div>
  );
}