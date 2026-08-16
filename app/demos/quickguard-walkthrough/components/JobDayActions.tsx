import { useState } from 'react';
import type { DemoJob, GuardProfile, JobActivity } from '../lib/types';
import { ACTIVITY_OPTIONS } from '../lib/data';

interface JobDayActionsProps {
  job: DemoJob;
  guards: GuardProfile[];
  guardsCheckedIn: string[];
  onCheckIn: (guardId: string) => void;
  onAddActivity: (message: string) => void;
  activities: JobActivity[];
  onCompleteJob: () => void;
  allCheckedIn: boolean;
}

export default function JobDayActions({
  job,
  guards,
  guardsCheckedIn,
  onCheckIn,
  onAddActivity,
  activities,
  onCompleteJob,
  allCheckedIn,
}: JobDayActionsProps) {
  const [showActivityPicker, setShowActivityPicker] = useState(false);

  return (
    <div id="completion-area" className="space-y-5">
      <div className="rounded-2xl border border-blue-500/15 bg-blue-500/[0.03] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">{job.securityType}</h2>
            <p className="text-sm text-slate-400">{job.location} · {job.date}</p>
          </div>
          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-semibold text-blue-400">
            {job.status === 'in_progress' ? 'In Progress' : 'Shift Started'}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 mb-5">
          {guards.slice(0, 2).map((guard) => {
            const checkedIn = guardsCheckedIn.includes(guard.id);
            return (
              <div key={guard.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-sm font-bold text-blue-300">
                      {guard.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{guard.name}</p>
                      <p className="text-[10px] text-slate-500">{guard.role}</p>
                    </div>
                  </div>
                  {checkedIn ? (
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-400">
                      Checked in · 18:02
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onCheckIn(guard.id)}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-[10px] font-semibold text-white transition hover:bg-blue-500 cursor-pointer"
                    >
                      Check In
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-slate-600 mb-4">Simulated check-in · Not using actual GPS</p>

        {allCheckedIn && (
          <div className="space-y-3">
            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] p-4">
              <p className="text-xs text-emerald-400 font-medium mb-1">
                All guards on site · Security team active
              </p>
            </div>

            {!showActivityPicker ? (
              <button
                type="button"
                onClick={() => setShowActivityPicker(true)}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] cursor-pointer"
              >
                <i className="ri-add-line mr-2"></i>
                Add Activity (Demo)
              </button>
            ) : (
              <div className="space-y-2">
                {ACTIVITY_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => { onAddActivity(opt); setShowActivityPicker(false); }}
                    className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-left text-xs text-slate-400 transition hover:bg-white/[0.04] hover:text-slate-200 cursor-pointer"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={onCompleteJob}
              className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 cursor-pointer mt-2"
            >
              <i className="ri-check-double-line mr-2"></i>
              Complete Demo Shift
            </button>
          </div>
        )}
      </div>
    </div>
  );
}