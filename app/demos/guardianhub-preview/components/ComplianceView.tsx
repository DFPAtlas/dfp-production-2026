'use client';

import type { ComplianceRecord } from '../lib/types';

interface ComplianceViewProps {
  records: ComplianceRecord[];
}

export default function ComplianceView({ records }: ComplianceViewProps) {
  const current = records.filter((r) => r.status === 'current').length;
  const expiring = records.filter((r) => r.status === 'expiring_soon').length;
  const action = records.filter((r) => r.status === 'action_required').length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Workforce Compliance</h2>
        <p className="mt-1 text-xs text-slate-400">SIA licences, right to work, training and site certifications.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4">
          <p className="text-2xl font-bold text-emerald-400">{current}</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500 mt-1">Current</p>
        </div>
        <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.04] p-4">
          <p className="text-2xl font-bold text-amber-400">{expiring}</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500 mt-1">Expiring Soon</p>
        </div>
        <div className="rounded-xl border border-red-500/15 bg-red-500/[0.04] p-4">
          <p className="text-2xl font-bold text-red-400">{action}</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500 mt-1">Action Required</p>
        </div>
      </div>

      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">All Records</p>
        <div className="rounded-xl border border-white/[0.05] overflow-hidden">
          <div className="grid grid-cols-12 gap-2 border-b border-white/[0.05] bg-white/[0.02] px-4 py-2 text-[10px] font-medium text-slate-500 uppercase tracking-[0.08em]">
            <span className="col-span-4">Guard</span>
            <span className="col-span-4">Requirement</span>
            <span className="col-span-4 text-right">Status</span>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {records.map((rec) => (
              <div key={rec.id} className="grid grid-cols-12 gap-2 items-center px-4 py-2.5 hover:bg-white/[0.02] transition">
                <span className="col-span-4 text-xs text-white">{rec.guardName}</span>
                <div className="col-span-4">
                  <span className="text-xs text-slate-300">{rec.type}</span>
                  {rec.expiresIn && (
                    <p className="text-[10px] text-slate-600">{rec.expiresIn}</p>
                  )}
                </div>
                <div className="col-span-4 flex justify-end">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    rec.status === 'current' ? 'bg-emerald-500/10 text-emerald-400'
                    : rec.status === 'expiring_soon' ? 'bg-amber-500/10 text-amber-400'
                    : 'bg-red-500/10 text-red-400'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      rec.status === 'current' ? 'bg-emerald-400' : rec.status === 'expiring_soon' ? 'bg-amber-400' : 'bg-red-400'
                    }`} />
                    {rec.status === 'current' ? 'Current' : rec.status === 'expiring_soon' ? 'Expiring Soon' : 'Action Required'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-[9px] text-slate-700">All compliance records use fictional demo data. No real SIA licence verification.</p>
    </div>
  );
}