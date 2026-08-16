'use client';

import type { DemoSite } from '../lib/types';
import { GUARDS } from '../lib/data';

interface SiteDetailPanelProps {
  site: DemoSite;
  onClose: () => void;
}

export default function SiteDetailPanel({ site, onClose }: SiteDetailPanelProps) {
  const siteGuards = GUARDS.filter((g) => g.currentSiteId === site.id);
  const completedPatrols = site.patrolCheckpoints.filter((c) => c.completed).length;
  const totalPatrols = site.patrolCheckpoints.length;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0a0f18] overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white">{site.name}</h3>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${site.status === 'healthy' ? 'bg-emerald-500/10 text-emerald-400' : site.status === 'attention' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${site.status === 'healthy' ? 'bg-emerald-400' : site.status === 'attention' ? 'bg-amber-400' : 'bg-red-400'}`} />
              {site.status === 'healthy' ? 'Healthy' : site.status === 'attention' ? 'Attention' : 'Critical'}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500">Client: {site.client}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-600 transition hover:bg-white/[0.05] hover:text-slate-400 cursor-pointer">
          <i className="ri-close-line text-base w-5 h-5 flex items-center justify-center"></i>
        </button>
      </div>

      <div className="p-5 space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatItem label="Guards On Duty" value={`${site.guardsOnDuty} / ${site.guardsRequired}`} />
          <StatItem label="Shift" value={`${site.shiftStart} – ${site.shiftEnd}`} />
          <StatItem label="Patrol Progress" value={`${completedPatrols} / ${totalPatrols}`} />
          <StatItem label="Incidents" value={site.hasOpenIncident ? '1 open' : '0'} attention={site.hasOpenIncident} />
        </div>

        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Guards On Site</p>
          <div className="space-y-2">
            {siteGuards.map((guard) => (
              <div key={guard.id} className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.01] px-3 py-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/15 text-[11px] font-semibold text-cyan-300">
                  {guard.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white">{guard.name}</p>
                  <p className="text-[10px] text-slate-500">{guard.role}</p>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${guard.status === 'on_duty' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${guard.status === 'on_duty' ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                  {guard.status === 'on_duty' ? 'On Duty' : guard.status === 'on_break' ? 'On Break' : 'Off Duty'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Patrol Checkpoints</p>
          <div className="space-y-1.5">
            {site.patrolCheckpoints.map((cp) => (
              <div key={cp.id} className="flex items-center gap-2.5 rounded-lg px-3 py-2">
                <span className={`w-3 h-3 flex items-center justify-center ${cp.completed ? 'text-emerald-400' : 'text-slate-600'}`}>
                  <i className={`${cp.completed ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'} text-xs`}></i>
                </span>
                <span className={`text-xs ${cp.completed ? 'text-slate-300' : 'text-slate-500'}`}>{cp.name}</span>
                {!cp.completed && <span className="ml-auto text-[10px] text-amber-400">Pending</span>}
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Site Instructions</p>
          <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] p-3">
            <ul className="space-y-1.5">
              {site.instructions.map((inst, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 w-3 h-3 flex items-center justify-center text-slate-600">
                    <i className="ri-arrow-right-s-line text-xs"></i>
                  </span>
                  <span className="text-[11px] text-slate-400">{inst}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value, attention }: { label: string; value: string; attention?: boolean }) {
  return (
    <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] px-3 py-2.5">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold ${attention ? 'text-amber-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}