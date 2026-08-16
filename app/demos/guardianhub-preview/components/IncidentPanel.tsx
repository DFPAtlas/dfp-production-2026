'use client';

import { useState } from 'react';
import type { DemoIncident } from '../lib/types';

interface IncidentPanelProps {
  incident: DemoIncident;
  onResolve: () => void;
}

export default function IncidentPanel({ incident, onResolve }: IncidentPanelProps) {
  const [showResolve, setShowResolve] = useState(false);

  const priorityConfig: Record<string, string> = {
    low: 'bg-slate-500/10 text-slate-400',
    medium: 'bg-amber-500/10 text-amber-400',
    high: 'bg-orange-500/10 text-orange-400',
    critical: 'bg-red-500/10 text-red-400',
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Incident Management</h2>
        <p className="mt-1 text-xs text-slate-400">Active operational incidents.</p>
      </div>

      {incident.status !== 'resolved' ? (
        <div className="rounded-2xl border border-red-500/15 bg-[#0a0f18] overflow-hidden">
          <div className="border-b border-white/[0.05] px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{incident.id}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityConfig[incident.priority]}`}>
                {incident.priority.toUpperCase()}
              </span>
            </div>
            <h3 className="text-base font-semibold text-white">{incident.title}</h3>
            <p className="mt-1 text-xs text-slate-400">{incident.description}</p>
          </div>

          <div className="px-5 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-slate-500">Site</span>
                <p className="text-xs text-white mt-0.5">Westfield Construction</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500">Reported By</span>
                <p className="text-xs text-white mt-0.5">{incident.reportedBy}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500">Reported</span>
                <p className="text-xs text-white mt-0.5">{incident.reportedAt}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500">Status</span>
                <p className="text-xs text-amber-400 mt-0.5 font-medium">Open</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">Timeline</p>
              <div className="space-y-2">
                {incident.timeline.map((entry, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex flex-col items-center mt-1">
                      <span className={`h-2 w-2 rounded-full ${entry.type === 'created' ? 'bg-red-400' : entry.type === 'resolved' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                      {i < incident.timeline.length - 1 && <span className="w-px flex-1 bg-white/[0.06] my-0.5" />}
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-300">{entry.message}</p>
                      <p className="text-[10px] text-slate-600">{entry.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.05] px-5 py-3 flex items-center gap-2">
            <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-[11px] font-medium text-slate-300 transition hover:bg-white/[0.05] cursor-pointer whitespace-nowrap">
              <i className="ri-check-line text-xs w-3 h-3 flex items-center justify-center"></i>
              Acknowledge
            </button>
            <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-[11px] font-medium text-slate-300 transition hover:bg-white/[0.05] cursor-pointer whitespace-nowrap">
              <i className="ri-chat-1-line text-xs w-3 h-3 flex items-center justify-center"></i>
              Add Update
            </button>
            <button
              type="button"
              onClick={() => setShowResolve(true)}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-2 text-[11px] font-semibold text-red-300 transition hover:bg-red-500/30 cursor-pointer whitespace-nowrap"
            >
              <i className="ri-check-double-line text-xs w-3 h-3 flex items-center justify-center"></i>
              Resolve Demo Incident
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 mx-auto mb-3">
            <i className="ri-check-double-line text-emerald-400 text-xl w-5 h-5 flex items-center justify-center"></i>
          </div>
          <h3 className="text-base font-semibold text-white">Incident Resolved</h3>
          <p className="mt-1 text-sm text-slate-400">Vehicle left site after verification. No further action required.</p>
        </div>
      )}

      {showResolve && (
        <div className="rounded-2xl border border-white/[0.08] bg-[#0a0f18] p-5">
          <h4 className="text-sm font-semibold text-white mb-3">Resolve Incident</h4>
          <div className="space-y-3 mb-4">
            <div>
              <label className="text-[10px] font-medium text-slate-400 mb-1 block">Outcome</label>
              <p className="text-xs text-slate-300 bg-white/[0.02] rounded-lg border border-white/[0.06] p-3">
                Vehicle left site after verification. Driver confirmed as contractor for adjacent unit.
              </p>
            </div>
            <div>
              <label className="text-[10px] font-medium text-slate-400 mb-1 block">Follow-up</label>
              <p className="text-xs text-slate-300 bg-white/[0.02] rounded-lg border border-white/[0.06] p-3">
                No further action required. Driver briefed on access procedures.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setShowResolve(false); onResolve(); }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-[11px] font-semibold text-white transition hover:bg-emerald-500 cursor-pointer whitespace-nowrap"
            >
              <i className="ri-check-double-line text-xs w-3 h-3 flex items-center justify-center"></i>
              Close Incident
            </button>
            <button type="button" onClick={() => setShowResolve(false)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-2 text-[11px] font-medium text-slate-400 transition hover:bg-white/[0.03] cursor-pointer whitespace-nowrap">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}