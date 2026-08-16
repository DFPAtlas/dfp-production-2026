import { useState } from 'react';
import type { DemoJob, GuardProfile, JobActivity } from '../lib/types';
import { ACTIVITY_OPTIONS } from '../lib/data';

interface GuardDashboardProps {
  guard: GuardProfile;
  job: DemoJob | null;
  isReadyForAccept: boolean;
  onAccept: () => void;
  jobDaySimulated: boolean;
  guardsCheckedIn: string[];
  onCheckIn: (guardId: string) => void;
  onAddActivity: (message: string) => void;
  activities: JobActivity[];
  onCompleteJob: () => void;
  jobStatus: string | null;
  secondGuardConfirmed: boolean;
  allCheckedIn: boolean;
}

export default function GuardDashboard({
  guard,
  job,
  isReadyForAccept,
  onAccept,
  jobDaySimulated,
  guardsCheckedIn,
  onCheckIn,
  onAddActivity,
  activities,
  onCompleteJob,
  jobStatus,
  secondGuardConfirmed,
  allCheckedIn,
}: GuardDashboardProps) {
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [jobAccepted, setJobAccepted] = useState(false);
  const hasCheckedIn = guardsCheckedIn.includes(guard.id);

  const handleAccept = () => {
    setJobAccepted(true);
    onAccept();
  };

  const handleCheckInClick = () => {
    onCheckIn(guard.id);
  };

  const handleAddActivity = (message: string) => {
    onAddActivity(message);
    setShowActivityPicker(false);
  };

  if (!job || (!isReadyForAccept && !jobAccepted && !jobDaySimulated && jobStatus === null)) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-lg font-bold text-emerald-300">
            {guard.initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{guard.name}</p>
            <p className="text-xs text-slate-500">{guard.role} · Demo Guard</p>
            <span className="inline-flex items-center gap-1.5 mt-1 rounded-full border border-emerald-500/15 bg-emerald-500/8 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Available
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h2 className="mb-4 text-sm font-bold text-white">Good afternoon, {guard.name.split(' ')[0]}.</h2>
          <p className="text-sm text-slate-400">No suitable jobs near you right now. Check back soon or adjust your availability.</p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { icon: 'ri-briefcase-line', label: 'Available Jobs', count: '0' },
            { icon: 'ri-calendar-check-line', label: 'My Jobs', count: '0' },
            { icon: 'ri-money-pound-circle-line', label: 'Earnings', count: '£0' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center opacity-50">
              <i className={`${item.icon} text-slate-600 text-xl`}></i>
              <p className="mt-2 text-lg font-bold text-slate-600">{item.count}</p>
              <p className="text-[10px] text-slate-600">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-lg font-bold text-emerald-300">
          {guard.initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{guard.name}</p>
          <p className="text-xs text-slate-500">{guard.role} · Demo Guard</p>
          {jobAccepted ? (
            <span className="inline-flex items-center gap-1.5 mt-1 rounded-full border border-blue-500/15 bg-blue-500/8 px-2 py-0.5 text-[10px] font-medium text-blue-400">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              Assigned
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 mt-1 rounded-full border border-emerald-500/15 bg-emerald-500/8 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Available
            </span>
          )}
        </div>
      </div>

      {isReadyForAccept && !jobAccepted && (
        <div id="guard-job-card" className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="rounded bg-blue-500/10 px-2 py-1 text-[10px] font-semibold text-blue-400">
                New Match
              </span>
              <h2 className="mt-2 text-lg font-bold text-white">{job.location}</h2>
              <p className="text-sm text-slate-400">{job.securityType} · {job.city}</p>
            </div>
            <span className="text-xs text-slate-500">{job.distance || '2.8'} miles</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
              <p className="text-[10px] text-slate-500">Schedule</p>
              <p className="text-sm font-medium text-white">{job.date}</p>
              <p className="text-xs text-slate-400">{job.timeStart} – {job.timeEnd} · {job.hours}h</p>
            </div>
            <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
              <p className="text-[10px] text-slate-500">Pay</p>
              <p className="text-sm font-medium text-white">Demo rate</p>
              <p className="text-xs text-slate-400">{job.hours}h shift</p>
            </div>
          </div>

          {job.requirements.length > 0 && (
            <div className="mb-5">
              <p className="text-[10px] font-medium text-slate-500 mb-2">Requirements</p>
              <div className="flex flex-wrap gap-1.5">
                {job.requirements.map((req) => (
                  <span key={req} className="rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[10px] text-slate-400">
                    {req}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] text-slate-600 mb-4">
            No client contact details are revealed until appropriate within the simulated booking flow.
          </p>

          <button
            type="button"
            onClick={handleAccept}
            className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 cursor-pointer"
          >
            Accept Demo Job
          </button>
          <p className="mt-2 text-center text-[10px] text-slate-600">This will not create a real booking</p>
        </div>
      )}

      {jobAccepted && !jobDaySimulated && (
        <div className="rounded-2xl border border-blue-500/15 bg-blue-500/[0.03] p-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 mx-auto mb-3">
            <i className="ri-check-double-line text-emerald-400 text-2xl"></i>
          </div>
          <h2 className="text-lg font-bold text-white mb-1">Job Accepted</h2>
          <p className="text-sm text-slate-400 mb-1">
            {job.location} · {job.date}
          </p>
          <p className="text-xs text-slate-500">
            {secondGuardConfirmed ? '2 of 2 guards confirmed' : 'Awaiting full team confirmation'}
          </p>
          <p className="mt-4 text-[10px] text-slate-600">
            Switch to Client view to confirm the security team and simulate job day
          </p>
        </div>
      )}

      {jobDaySimulated && (
        <div id="job-day-actions" className="space-y-5">
          {['checked_in', 'in_progress', 'completed'].includes(jobStatus || '') && (
            <div className="rounded-2xl border border-blue-500/15 bg-blue-500/[0.03] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Active Shift</h3>
                  <p className="text-xs text-slate-400">{job.location} · {job.timeStart}–{job.timeEnd}</p>
                </div>
                {hasCheckedIn ? (
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold text-emerald-400">
                    Checked In · 18:02
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[10px] font-semibold text-amber-400">
                    Awaiting Check-in
                  </span>
                )}
              </div>

              {!hasCheckedIn && (
                <button
                  type="button"
                  onClick={handleCheckInClick}
                  className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 mb-3 cursor-pointer"
                >
                  <i className="ri-map-pin-line mr-2"></i>
                  Check In (Simulated)
                </button>
              )}

              {hasCheckedIn && jobStatus !== 'completed' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">What would you like to record?</p>

                  {!showActivityPicker ? (
                    <button
                      type="button"
                      onClick={() => setShowActivityPicker(true)}
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] cursor-pointer"
                    >
                      <i className="ri-add-line mr-2"></i>
                      Add Activity
                    </button>
                  ) : (
                    <div className="space-y-2">
                      {ACTIVITY_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleAddActivity(opt)}
                          className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-left text-xs text-slate-400 transition hover:bg-white/[0.04] hover:text-slate-200 cursor-pointer"
                        >
                          {opt}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setShowActivityPicker(false)}
                        className="w-full rounded-lg px-4 py-2 text-xs text-slate-600 transition hover:text-slate-400 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {allCheckedIn && jobStatus !== 'completed' && (
                    <button
                      type="button"
                      onClick={onCompleteJob}
                      className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 mt-3 cursor-pointer"
                    >
                      Complete Demo Shift
                    </button>
                  )}
                </div>
              )}

              {jobStatus === 'completed' && (
                <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] p-4 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 mx-auto mb-2">
                    <i className="ri-check-double-line text-emerald-400 text-xl"></i>
                  </div>
                  <h3 className="text-sm font-bold text-white">Shift Completed</h3>
                  <p className="text-xs text-slate-400 mt-1">Awaiting client confirmation</p>
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <i className="ri-check-line text-emerald-400"></i>
                      Shift complete
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <i className="ri-check-line text-emerald-400"></i>
                      Handover complete
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <i className="ri-check-line text-emerald-400"></i>
                      No outstanding incidents
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <i className="ri-check-line text-emerald-400"></i>
                      Client notified
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {['approved', 'paid'].includes(jobStatus || '') && (
            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.03] p-5 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 mx-auto mb-3">
                <i className="ri-bank-card-line text-emerald-400 text-2xl"></i>
              </div>
              <h2 className="text-lg font-bold text-white mb-1">
                {jobStatus === 'paid' ? 'Earnings Approved' : 'Payment Pending'}
              </h2>
              <p className="text-sm text-slate-400">
                {jobStatus === 'paid' ? 'Payment has been processed (demo)' : 'Awaiting client payment approval'}
              </p>
              <p className="mt-2 text-[10px] text-slate-600">Demo payment · Fictional amount</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}