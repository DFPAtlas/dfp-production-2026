'use client';

import { useState } from 'react';
import type { RotaShift, DemoGuard } from '../lib/types';

interface RotaViewProps {
  shifts: RotaShift[];
  availableGuards: DemoGuard[];
  onAssignGuard: (shiftId: string, guardId: string) => void;
}

export default function RotaView({ shifts, availableGuards, onAssignGuard }: RotaViewProps) {
  const [fillingShift, setFillingShift] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Guard Rota</h2>
        <p className="mt-1 text-xs text-slate-400">Today&apos;s shift coverage across all sites.</p>
        <div className="mt-3 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] text-slate-400">Covered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-[10px] text-slate-400">Short-staffed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            <span className="text-[10px] text-slate-400">Unassigned</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {shifts.map((shift) => {
          const statusColor = shift.status === 'covered' ? 'border-emerald-500/15' : shift.status === 'attention' ? 'border-amber-500/15' : 'border-red-500/15';
          const statusBg = shift.status === 'covered' ? 'bg-emerald-500/[0.03]' : shift.status === 'attention' ? 'bg-amber-500/[0.03]' : 'bg-red-500/[0.03]';

          return (
            <div key={shift.id} className={`rounded-xl border ${statusColor} ${statusBg} p-4`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-white">{shift.siteName}</p>
                  <p className="text-[11px] text-slate-500">{shift.start} – {shift.end}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                  shift.status === 'covered' ? 'bg-emerald-500/10 text-emerald-400'
                  : shift.status === 'attention' ? 'bg-amber-500/10 text-amber-400'
                  : 'bg-red-500/10 text-red-400'
                }`}>
                  {shift.status === 'covered' ? 'Covered' : shift.status === 'attention' ? `${shift.assignedGuards.length}/${shift.requiredGuards} assigned` : 'Unassigned'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                {shift.assignedGuards.map((gId) => {
                  const guard = availableGuards.find((g) => g.id === gId);
                  return guard ? (
                    <span key={gId} className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] px-2.5 py-1 text-[10px] text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {guard.name}
                    </span>
                  ) : null;
                })}
                {shift.assignedGuards.length < shift.requiredGuards && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.02] border border-white/[0.06] px-2.5 py-1 text-[10px] text-slate-500">
                    {shift.requiredGuards - shift.assignedGuards} slot{shift.requiredGuards - shift.assignedGuards > 1 ? 's' : ''} open
                  </span>
                )}
              </div>

              {shift.status !== 'covered' && (
                <div className="flex items-center gap-2">
                  {fillingShift === shift.id ? (
                    <div className="flex flex-wrap gap-2">
                      {availableGuards
                        .filter((g) => g.status === 'off_duty' && !shift.assignedGuards.includes(g.id))
                        .slice(0, 3)
                        .map((guard) => (
                          <button
                            key={guard.id}
                            type="button"
                            onClick={() => { onAssignGuard(shift.id, guard.id); setFillingShift(null); }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/15 px-3 py-1.5 text-[11px] font-medium text-cyan-300 transition hover:bg-cyan-500/25 cursor-pointer whitespace-nowrap"
                          >
                            <span>{guard.name}</span>
                            <i className="ri-arrow-right-line text-xs w-3 h-3 flex items-center justify-center"></i>
                          </button>
                        ))}
                      <button type="button" onClick={() => setFillingShift(null)} className="text-[10px] text-slate-500 hover:text-slate-300 cursor-pointer">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setFillingShift(shift.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/[0.06] px-3 py-1.5 text-[11px] font-medium text-cyan-400 transition hover:bg-cyan-500/[0.12] cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-user-add-line text-xs w-3 h-3 flex items-center justify-center"></i>
                      Fill Open Shift
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}