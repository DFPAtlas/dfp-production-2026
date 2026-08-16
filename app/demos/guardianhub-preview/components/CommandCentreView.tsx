'use client';

import type { DemoSite, ActivityEvent } from '../lib/types';
import { SITES } from '../lib/data';

interface CommandCentreViewProps {
  sites: DemoSite[];
  guardsOnDuty: number;
  totalGuards: number;
  openIncidents: number;
  compliancePct: number;
  onSelectSite: (siteId: string) => void;
}

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  healthy: { bg: 'bg-emerald-500/[0.06]', text: 'text-emerald-400', dot: 'bg-emerald-400', label: 'Healthy' },
  attention: { bg: 'bg-amber-500/[0.06]', text: 'text-amber-400', dot: 'bg-amber-400', label: 'Attention' },
  critical: { bg: 'bg-red-500/[0.06]', text: 'text-red-400', dot: 'bg-red-400', label: 'Critical' },
};

export default function CommandCentreView({ sites, guardsOnDuty, totalGuards, openIncidents, compliancePct, onSelectSite }: CommandCentreViewProps) {
  const attentionCount = sites.filter((s) => s.status === 'attention' || s.status === 'critical').length;
  const healthyCount = sites.filter((s) => s.status === 'healthy').length;

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Operations are healthy.</h2>
        </div>
        {attentionCount > 0 && (
          <p className="mt-1 text-xs text-slate-400">{attentionCount} site{attentionCount > 1 ? 's' : ''} need{attentionCount === 1 ? 's' : ''} attention.</p>
        )}
        {attentionCount === 0 && (
          <p className="mt-1 text-xs text-slate-400">All sites reporting normal.</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard label="Guards on Duty" value={`${guardsOnDuty} / ${totalGuards}`} color="emerald" icon="ri-shield-user-line" />
        <MetricCard label="Active Sites" value={`${sites.length}`} color="cyan" icon="ri-building-line">
          <span className="text-[10px] text-emerald-400">{healthyCount} healthy</span>
        </MetricCard>
        <MetricCard label="Patrols Due" value={`${sites.filter((s) => s.patrolCheckpoints.some((c) => !c.completed)).length}`} color="amber" icon="ri-footprint-line" />
        <MetricCard label="Open Incidents" value={`${openIncidents}`} color={openIncidents > 0 ? 'red' : 'emerald'} icon="ri-alert-line" />
        <MetricCard label="Compliance" value={`${compliancePct}%`} color={compliancePct >= 95 ? 'emerald' : 'amber'} icon="ri-file-shield-2-line" />
      </div>

      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">Site Overview</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => {
            const cfg = statusConfig[site.status];
            return (
              <button
                key={site.id}
                type="button"
                onClick={() => onSelectSite(site.id)}
                className={`flex flex-col rounded-xl border p-4 text-left transition cursor-pointer hover:border-white/[0.12] ${cfg.bg} ${site.status === 'healthy' ? 'border-white/[0.05]' : site.status === 'attention' ? 'border-amber-500/20' : 'border-red-500/20'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-white">{site.name}</span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.bg} ${cfg.text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <i className="ri-shield-user-line text-xs w-3 h-3 flex items-center justify-center"></i>
                    {site.guardsOnDuty} guard{site.guardsOnDuty !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="ri-footprint-line text-xs w-3 h-3 flex items-center justify-center"></i>
                    {site.patrolOverdue ? (
                      <span className="text-amber-400">Overdue {site.nextPatrolDue}</span>
                    ) : (
                      <span>Next {site.nextPatrolDue}</span>
                    )}
                  </span>
                </div>
                {site.hasOpenIncident && (
                  <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-red-500/[0.08] px-2 py-1">
                    <i className="ri-alert-line text-[9px] w-3 h-3 flex items-center justify-center text-red-400"></i>
                    <span className="text-[10px] font-medium text-red-400">Open incident</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color, icon, children }: { label: string; value: string; color: string; icon: string; children?: React.ReactNode }) {
  const colors: Record<string, string> = {
    emerald: 'border-emerald-500/15 bg-emerald-500/[0.04]',
    cyan: 'border-cyan-500/15 bg-cyan-500/[0.04]',
    amber: 'border-amber-500/15 bg-amber-500/[0.04]',
    red: 'border-red-500/15 bg-red-500/[0.04]',
  };
  return (
    <div className={`rounded-xl border ${colors[color] || colors.cyan} p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500">{label}</span>
        <i className={`${icon} text-xs w-3 h-3 flex items-center justify-center text-slate-600`}></i>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
      {children && <div className="mt-1">{children}</div>}
    </div>
  );
}