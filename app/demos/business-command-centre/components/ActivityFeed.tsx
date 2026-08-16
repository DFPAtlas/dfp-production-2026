'use client';

import {
  BriefcaseBusiness,
  CirclePoundSterling,
  UsersRound,
  ListChecks,
  Zap,
} from 'lucide-react';

const typeIconMap: Record<string, React.ElementType> = {
  project: BriefcaseBusiness,
  finance: CirclePoundSterling,
  people: UsersRound,
  task: ListChecks,
  system: Zap,
};

const typeColorMap: Record<string, string> = {
  project: 'text-cyan-400 bg-cyan-400/10',
  finance: 'text-emerald-400 bg-emerald-400/10',
  people: 'text-orange-400 bg-orange-400/10',
  task: 'text-violet-400 bg-violet-400/10',
  system: 'text-slate-400 bg-slate-400/10',
};

interface ActivityEvent {
  time: string;
  message: string;
  type: 'project' | 'finance' | 'people' | 'task' | 'system';
}

interface ActivityFeedProps {
  events: ActivityEvent[];
}

export default function ActivityFeed({ events }: ActivityFeedProps) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0d111c] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white">Activity Feed</h3>
          <p className="mt-0.5 text-[10px] text-slate-600">Recent activity across the business</p>
        </div>
      </div>

      <div className="space-y-3">
        {events.map((event, index) => {
          const Icon = typeIconMap[event.type];
          const colorClass = typeColorMap[event.type];
          return (
            <div key={index} className="flex items-start gap-3">
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${colorClass}`}
              >
                <Icon className="h-3 w-3" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] leading-4 text-slate-300">{event.message}</p>
                <p className="mt-0.5 text-[10px] text-slate-600">{event.time}</p>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-white/[0.04] py-2 text-[10px] text-slate-500 transition hover:bg-white/[0.03] hover:text-slate-300"
      >
        View all activity
        <i className="ri-arrow-right-s-line text-xs"></i>
      </button>
    </div>
  );
}