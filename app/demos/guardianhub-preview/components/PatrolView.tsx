'use client';

import type { DemoSite } from '../lib/types';

interface PatrolViewProps {
  sites: DemoSite[];
  onCompleteCheckpoint: (siteId: string, checkpointId: string) => void;
}

export default function PatrolView({ sites, onCompleteCheckpoint }: PatrolViewProps) {
  const attentionSite = sites.find((s) => s.patrolOverdue);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Patrol Status</h2>
        <p className="mt-1 text-xs text-slate-400">All site patrol checkpoints across the operation.</p>
      </div>

      {attentionSite && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15">
              <i className="ri-alert-line text-amber-400 text-lg w-5 h-5 flex items-center justify-center"></i>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{attentionSite.name}</p>
              <p className="text-xs text-amber-400">Patrol overdue — needs attention</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {attentionSite.patrolCheckpoints.map((cp) => (
              <div
                key={cp.id}
                className={`flex items-center justify-between rounded-lg border px-4 py-3 transition ${
                  cp.completed
                    ? 'border-emerald-500/10 bg-emerald-500/[0.03]'
                    : 'border-amber-500/15 bg-amber-500/[0.03]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-4 h-4 flex items-center justify-center ${cp.completed ? 'text-emerald-400' : 'text-amber-400'}`}>
                    <i className={`${cp.completed ? 'ri-checkbox-circle-fill' : 'ri-alert-line'} text-sm`}></i>
                  </span>
                  <span className={`text-sm ${cp.completed ? 'text-slate-400' : 'font-medium text-white'}`}>{cp.name}</span>
                </div>
                {cp.completed ? (
                  <span className="text-[10px] text-emerald-400">Complete</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onCompleteCheckpoint(attentionSite.id, cp.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-3 py-1.5 text-[11px] font-semibold text-amber-300 transition hover:bg-amber-500/30 cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-check-line text-xs w-3 h-3 flex items-center justify-center"></i>
                    Complete Checkpoint
                  </button>
                )}
              </div>
            ))}
          </div>

          <p className="text-[10px] text-slate-600">
            {attentionSite.patrolCheckpoints.filter((c) => c.completed).length} / {attentionSite.patrolCheckpoints.length} checkpoints complete
          </p>
        </div>
      )}

      {!attentionSite && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15">
              <i className="ri-check-double-line text-emerald-400 text-lg w-5 h-5 flex items-center justify-center"></i>
            </div>
            <p className="text-sm font-semibold text-white">All patrols up to date</p>
          </div>
          <p className="text-xs text-slate-400">No overdue patrols across any site.</p>
        </div>
      )}

      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">All Sites</p>
        <div className="space-y-3">
          {sites.map((site) => {
            const completed = site.patrolCheckpoints.filter((c) => c.completed).length;
            const total = site.patrolCheckpoints.length;
            const pct = Math.round((completed / total) * 100);

            return (
              <div key={site.id} className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-white">{site.name}</span>
                  <span className={`text-[10px] font-medium ${site.patrolOverdue ? 'text-amber-400' : 'text-slate-500'}`}>
                    {site.patrolOverdue ? 'Overdue' : `Next: ${site.nextPatrolDue}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-white/[0.04] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${pct === 100 ? 'bg-emerald-400' : pct >= 75 ? 'bg-cyan-400' : 'bg-amber-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">{completed}/{total}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}