import type { DemoJob, GuardProfile } from '../lib/types';

interface MatchingViewProps {
  phase: number;
  guards?: GuardProfile[];
  job?: DemoJob;
}

export default function MatchingView({ phase, guards, job }: MatchingViewProps) {
  if (phase < 5) {
    const steps = [
      { label: 'Checking location', done: phase > 1 },
      { label: 'Checking availability', done: phase > 2 },
      { label: 'Checking licence requirements', done: phase > 3 },
      { label: 'Ranking suitable guards', done: phase > 4 },
    ];

    return (
      <div className="rounded-2xl border border-blue-500/15 bg-blue-500/[0.03] p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 mx-auto mb-4">
          <i className="ri-search-line text-blue-400 text-2xl"></i>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Finding suitable guards...</h2>
        <p className="text-sm text-slate-400 mb-6">Demo matching — searching the marketplace</p>

        <div className="space-y-2 max-w-xs mx-auto">
          {steps.map((s, i) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className={`flex h-5 w-5 items-center justify-center rounded-full transition ${
                s.done ? 'bg-emerald-500/20' : 'bg-white/[0.04]'
              }`}>
                {s.done ? (
                  <i className="ri-check-line text-emerald-400 text-xs"></i>
                ) : (
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-600 animate-pulse" />
                )}
              </div>
              <span className={`text-xs ${s.done ? 'text-slate-300' : 'text-slate-600'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-4 text-[10px] text-slate-600">Demo matching · No real searches</p>
      </div>
    );
  }

  if (!guards || !job) return null;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.03] p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
            <i className="ri-user-search-line text-emerald-400 text-lg"></i>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">6 suitable guards available</h2>
            <p className="text-[10px] text-slate-500">{guards.length} shown · Demo profiles</p>
          </div>
        </div>

        <div className="space-y-3">
          {guards.map((guard, i) => (
            <div
              key={guard.id}
              className={`flex items-center gap-4 rounded-xl border p-4 transition ${
                i === 0 ? 'border-blue-500/20 bg-blue-500/[0.04]' : 'border-white/[0.06] bg-white/[0.02]'
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-sm font-bold text-blue-300">
                {guard.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{guard.name}</p>
                <p className="text-[11px] text-slate-500">{guard.role}</p>
                <div className="mt-1 flex items-center gap-3">
                  <div className="flex items-center gap-0.5 text-amber-400">
                    <i className="ri-star-fill text-[10px]"></i>
                    <span className="text-[10px] font-medium">{guard.rating}</span>
                  </div>
                  <span className="text-[10px] text-slate-600">{guard.completedJobs} jobs</span>
                  <span className="text-[10px] text-slate-600">{guard.distance} miles</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                  Verified
                </span>
                <span className="text-[9px] text-slate-600">Demo profile</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          <p className="text-[10px] text-slate-600">
            Switch to Guard view to accept this job
          </p>
          <i className="ri-arrow-up-line text-slate-600 text-xs"></i>
        </div>
      </div>
    </div>
  );
}