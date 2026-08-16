'use client';

import Link from 'next/link';
import { Clock, Monitor } from 'lucide-react';

interface UATJobCardProps {
  id: string;
  title: string;
  projectName?: string | null;
  devices?: string[] | null;
  estimatedHours?: number | null;
  payAmount?: number | null;
  icon?: React.ReactNode;
}

export default function UATJobCard({ id, title, projectName, devices, estimatedHours, payAmount, icon }: UATJobCardProps) {
  return (
    <div className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(200px,1.5fr)_0.8fr_0.6fr_0.5fr_auto] md:items-center">
      <div className="flex items-center gap-3">
        {icon || (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-100">
            <Monitor className="h-5 w-5 text-[#2878d0]" />
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-[#17325c] truncate">{title}</p>
          <p className="mt-1 text-xs text-slate-500">{projectName || 'DFP Project'}</p>
        </div>
      </div>
      <p className="text-sm text-slate-500">{devices?.join(', ') || 'Any device'}</p>
      <p className="flex items-center gap-1 text-sm text-slate-500">
        <Clock className="h-4 w-4" />{estimatedHours ? `${estimatedHours}h` : '-'}
      </p>
      <span className="w-fit rounded-lg bg-[#edf4e8] px-3 py-1 text-sm font-bold text-[#617a50] whitespace-nowrap">
        {payAmount != null ? `£${payAmount}` : '-'}
      </span>
      <Link
        href={`/uat/jobs/${id}`}
        className="rounded-xl bg-slate-100 px-4 py-2.5 text-center text-sm font-semibold text-slate-600 hover:bg-[#2878d0] hover:text-white transition-colors whitespace-nowrap"
      >
        View
      </Link>
    </div>
  );
}