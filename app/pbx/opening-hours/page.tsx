'use client';

import PBXShell from '@/components/pbx/PBXShell';
import PBXStatusBadge from '@/components/pbx/PBXStatusBadge';
import PBXEmptyState from '@/components/pbx/PBXEmptyState';
import { usePBXBusinessHours } from '@/hooks/usePBXData';
import { Clock, RefreshCw } from 'lucide-react';

export default function PBXOpeningHoursPage() {
  const { schedules, loading, refetch } = usePBXBusinessHours();

  return (
    <PBXShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Opening Hours</h1>
            <p className="text-sm text-slate-400 mt-0.5">Business hours schedules for your tenant</p>
          </div>
          <button onClick={refetch} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-400 rounded-xl text-xs font-semibold hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap">
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" /></div>
        ) : schedules.length === 0 ? (
          <PBXEmptyState icon={<Clock className="w-7 h-7 text-slate-500" />} title="No opening hours configured" description="Opening hours are set by Digital-Footprint when your routing goes live." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schedules.map((s) => (
              <div key={s.id} className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">{s.name}</h3>
                  <PBXStatusBadge status={s.is_active ? 'active' : 'inactive'} />
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-slate-500">Timezone</span><span className="text-slate-300">{s.timezone || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">After-Hours Route</span><span className="text-slate-300">{s.after_hours_destination || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Emergency Override</span><span className="text-slate-300">{s.emergency_override ? 'Active' : 'None'}</span></div>
                </div>
                {s.weekly_schedule && (
                  <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.04)]">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Weekly Schedule</p>
                    <div className="space-y-1">
                      {Object.entries(s.weekly_schedule as Record<string, unknown>).map(([day, hours]) => (
                        <div key={day} className="flex justify-between text-xs">
                          <span className="text-slate-400 capitalize">{day}</span>
                          <span className="text-slate-300">
                            {typeof hours === 'string' ? hours : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="bg-[#1E293B]/50 rounded-xl border border-[rgba(255,255,255,0.04)] p-4">
          <p className="text-xs text-slate-500">Opening hours and holiday overrides are maintained by Digital-Footprint to keep routing accurate.</p>
        </div>
      </div>
    </PBXShell>
  );
}