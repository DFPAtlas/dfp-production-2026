'use client';

import type { DemoGuard } from '../lib/types';

interface GuardProfilePanelProps {
  guard: DemoGuard;
  onClose: () => void;
}

export default function GuardProfilePanel({ guard, onClose }: GuardProfilePanelProps) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0a0f18] overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/15 text-sm font-bold text-cyan-300">
            {guard.initials}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{guard.name}</h3>
            <p className="text-[11px] text-slate-500">{guard.role}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-600 transition hover:bg-white/[0.05] hover:text-slate-400 cursor-pointer">
          <i className="ri-close-line text-base w-5 h-5 flex items-center justify-center"></i>
        </button>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatItem label="Status" value={guard.status === 'on_duty' ? 'On Duty' : guard.status === 'on_break' ? 'On Break' : 'Off Duty'} color={guard.status === 'on_duty' ? 'emerald' : 'slate'} />
          <StatItem label="Shift" value={`${guard.shiftStart} – ${guard.shiftEnd}`} />
          <StatItem label="Last Patrol" value={guard.lastPatrol || 'N/A'} />
        </div>

        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Compliance</p>
          <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] px-3 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 flex items-center justify-center ${guard.compliance === 'current' ? 'text-emerald-400' : guard.compliance === 'expiring_soon' ? 'text-amber-400' : 'text-red-400'}`}>
                <i className="ri-shield-check-line text-xs"></i>
              </span>
              <span className="text-xs text-slate-300">{guard.compliance === 'current' ? 'Fully Compliant' : guard.compliance === 'expiring_soon' ? 'Expiring Soon' : 'Action Required'}</span>
            </div>
            <span className="text-[10px] text-slate-600">Demo Verified Profile</span>
          </div>
        </div>

        <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] p-3">
          <p className="text-[10px] text-slate-600 mb-1">SIA Licence</p>
          <p className="text-xs text-slate-400">{guard.siaLicence}</p>
        </div>

        <p className="text-[9px] text-slate-700">All profiles use fictional demo data. No real SIA verification.</p>
      </div>
    </div>
  );
}

function StatItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] px-3 py-2.5">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold ${color === 'emerald' ? 'text-emerald-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}