'use client';

import type { ClientReport } from '../lib/types';

interface ClientViewProps {
  reports: ClientReport[];
}

export default function ClientView({ reports }: ClientViewProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Client Visibility</h2>
        <p className="mt-1 text-xs text-slate-400">See what your clients see — site status, guard coverage and patrol completion.</p>
      </div>

      {reports.map((report) => {
        const isAttention = report.status !== 'healthy';
        return (
          <div key={report.siteId} className={`rounded-2xl border ${isAttention ? 'border-amber-500/15 bg-amber-500/[0.03]' : 'border-white/[0.05] bg-[#0a0f18]'} overflow-hidden`}>
            <div className="border-b border-white/[0.05] px-5 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">{report.siteName}</h3>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${isAttention ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  {report.status === 'healthy' ? 'Healthy' : 'Attention'}
                </span>
              </div>
              <p className="mt-2 text-[10px] text-slate-500">Today&apos;s Summary</p>
            </div>

            <div className="px-5 py-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-4">
                <ClientStat label="Guard Coverage" value={`${report.guardCoverage}%`} healthy={report.guardCoverage >= 100} />
                <ClientStat label="Patrols" value={`${report.patrolsCompleted} / ${report.patrolsTotal}`} healthy={report.patrolsCompleted >= report.patrolsTotal} />
                <ClientStat label="Incidents" value={`${report.incidentsResolved} resolved`} healthy={report.incidentsResolved > 0 || true} />
                <ClientStat label="Escalations" value={`${report.escalations}`} healthy={report.escalations === 0} />
              </div>

              <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-[11px] font-medium text-slate-300 transition hover:bg-white/[0.05] cursor-pointer whitespace-nowrap">
                <i className="ri-file-text-line text-xs w-3 h-3 flex items-center justify-center"></i>
                Preview Client Report
              </button>
            </div>
          </div>
        );
      })}

      <div className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-4">
        <div className="flex items-center gap-2 mb-2">
          <i className="ri-lock-line text-xs w-3 h-3 flex items-center justify-center text-slate-500"></i>
          <span className="text-[10px] font-medium text-slate-400">Access Control</span>
        </div>
        <p className="text-[11px] text-slate-500">Clients see only their own sites. Internal staff notes, other client information and private compliance documents are never visible.</p>
      </div>
    </div>
  );
}

function ClientStat({ label, value, healthy }: { label: string; value: string; healthy: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold ${healthy ? 'text-emerald-400' : 'text-amber-400'}`}>{value}</p>
    </div>
  );
}