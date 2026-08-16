import { LIFECYCLE_STAGES, getLifecycleIndex } from '../lib/data';

interface LifecycleTimelineProps {
  currentStatus: string | null;
}

export default function LifecycleTimeline({ currentStatus }: LifecycleTimelineProps) {
  if (!currentStatus || currentStatus === 'creating') return null;

  const currentIdx = getLifecycleIndex(currentStatus);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
        Marketplace Timeline
      </h3>
      <div className="space-y-0">
        {LIFECYCLE_STAGES.map((stage, i) => {
          const isComplete = i <= currentIdx;
          const isCurrent = i === currentIdx;

          return (
            <div key={stage.status} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full transition ${
                    isComplete
                      ? isCurrent
                        ? 'bg-blue-600 ring-2 ring-blue-600/30'
                        : 'bg-emerald-500/20'
                      : 'bg-white/[0.04]'
                  }`}
                >
                  {isComplete ? (
                    <i className={`text-[10px] ${isCurrent ? 'ri-more-line text-white' : 'ri-check-line text-emerald-400'}`}></i>
                  ) : (
                    <div className="h-1 w-1 rounded-full bg-slate-700" />
                  )}
                </div>
                {i < LIFECYCLE_STAGES.length - 1 && (
                  <div className={`my-0.5 h-5 w-px ${i < currentIdx ? 'bg-emerald-500/30' : 'bg-white/[0.04]'}`} />
                )}
              </div>
              <div className="pb-3">
                <p className={`text-[11px] font-medium ${
                  isComplete ? 'text-white' : 'text-slate-600'
                }`}>
                  {stage.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}