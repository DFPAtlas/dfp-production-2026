'use client';

import { ChevronRight } from 'lucide-react';
import type { TeamCapacity } from '../lib/types';

interface TeamCapacityBarsProps {
  capacities: TeamCapacity[];
  onNavigate: () => void;
}

export default function TeamCapacityBars({ capacities, onNavigate }: TeamCapacityBarsProps) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0d111c] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white">Team Capacity</h3>
          <p className="mt-0.5 text-[10px] text-slate-600">Current allocation vs capacity</p>
        </div>
        <button
          type="button"
          onClick={onNavigate}
          className="flex items-center gap-1 text-[10px] text-cyan-400 transition hover:text-cyan-300"
        >
          View full capacity
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      <div className="space-y-3">
        {capacities.map((cap) => {
          const barColor = cap.percentage > 90
            ? '#ef4444'
            : cap.percentage > 75
              ? '#f59e0b'
              : '#22d3ee';

          return (
            <div key={cap.department}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-white/[0.04]">
                    <i className="ri-team-line text-xs text-slate-500"></i>
                  </div>
                  <span className="text-[11px] font-medium text-slate-300">{cap.department}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">
                    {cap.filled}/{cap.total}
                  </span>
                  <span className="text-[11px] font-semibold text-white">{cap.percentage}%</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06]">
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{ width: `${cap.percentage}%`, backgroundColor: barColor }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-3 border-t border-white/[0.04] pt-3">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-[9px] text-slate-500">&lt; 70%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          <span className="text-[9px] text-slate-500">70 – 90%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
          <span className="text-[9px] text-slate-500">&gt; 90%</span>
        </div>
      </div>
    </div>
  );
}