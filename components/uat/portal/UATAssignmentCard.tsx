'use client';

import Link from 'next/link';
import UATStatusBadge from './UATStatusBadge';

interface UATAssignmentCardProps {
  id: string;
  jobTitle: string;
  projectName?: string | null;
  status: string;
  agreedPay?: number | null;
  statusColors: Record<string, string>;
}

export default function UATAssignmentCard({ id, jobTitle, projectName, status, agreedPay, statusColors }: UATAssignmentCardProps) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-[#17325c] truncate">{jobTitle}</p>
          <UATStatusBadge status={status} colorMap={statusColors} />
        </div>
        <p className="mt-0.5 text-xs text-slate-500">{projectName || 'DFP Project'}</p>
      </div>
      <div className="flex items-center gap-4">
        {agreedPay != null && <span className="text-sm font-bold text-[#617a50]">£{agreedPay}</span>}
        <Link
          href={`/uat/my-tests/${id}`}
          className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-[#2878d0] hover:text-white transition-colors whitespace-nowrap"
        >
          Open
        </Link>
      </div>
    </div>
  );
}