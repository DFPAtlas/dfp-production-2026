'use client';

import { UATEvidence } from './evidence-types';

const statusStyles: Record<string, string> = {
  uploaded: 'bg-sky-50 text-sky-600 ring-sky-200',
  attached: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
  quarantined: 'bg-amber-50 text-amber-600 ring-amber-200',
  rejected: 'bg-red-50 text-red-600 ring-red-200',
  deleted: 'bg-slate-100 text-slate-400 ring-slate-200',
};

const statusLabels: Record<string, string> = {
  uploaded: 'Uploaded',
  attached: 'Attached',
  quarantined: 'Quarantined',
  rejected: 'Rejected',
  deleted: 'Deleted',
};

export default function UATEvidenceStatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ring-1 ${statusStyles[status] || 'bg-slate-50 text-slate-400 ring-slate-200'}`}>
      {statusLabels[status] || status}
    </span>
  );
}