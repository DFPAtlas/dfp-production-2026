'use client';

import type { ActivityEvent } from '../lib/types';

interface LiveOperationsRailProps {
  activities: ActivityEvent[];
}

const typeIcon: Record<string, string> = {
  checkin: 'ri-login-circle-line',
  patrol: 'ri-footprint-line',
  incident: 'ri-alert-line',
  system: 'ri-settings-3-line',
  handover: 'ri-swap-line',
  rota: 'ri-calendar-check-line',
};

const typeColor: Record<string, string> = {
  checkin: 'text-emerald-400',
  patrol: 'text-cyan-400',
  incident: 'text-amber-400',
  system: 'text-slate-400',
  handover: 'text-blue-400',
  rota: 'text-violet-400',
};

export default function LiveOperationsRail({ activities }: LiveOperationsRailProps) {
  return (
    <div className="w-64 shrink-0 border-l border-white/[0.05] bg-[#0a0f18] flex flex-col overflow-hidden">
      <div className="border-b border-white/[0.05] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">Live Operations</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-1">
          {activities.map((act) => (
            <div key={act.id} className="flex items-start gap-2.5 rounded-lg px-2 py-2 transition hover:bg-white/[0.03]">
              <span className={`mt-0.5 w-3 h-3 flex items-center justify-center ${typeColor[act.type] || 'text-slate-500'}`}>
                <i className={`${typeIcon[act.type] || 'ri-information-line'} text-xs`}></i>
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] leading-5 text-slate-300">{act.message}</p>
                <p className="mt-0.5 text-[10px] text-slate-600">{act.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/[0.05] px-4 py-2">
        <p className="text-[9px] text-slate-600">Fictional demo activity</p>
      </div>
    </div>
  );
}