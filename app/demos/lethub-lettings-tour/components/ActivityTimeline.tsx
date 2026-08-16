'use client';

import type { ActivityEvent } from '../lib/types';

interface Props {
  events: ActivityEvent[];
}

const iconMap: Record<string, string> = {
  maintenance: 'ri-tools-line text-amber-500',
  compliance: 'ri-shield-check-line text-blue-500',
  rent: 'ri-wallet-line text-emerald-500',
  message: 'ri-message-2-line text-[#0d9488]',
  general: 'ri-file-list-line text-[#8a8a8a]',
};

export default function ActivityTimeline({ events }: Props) {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-[#e8e5df] px-4 py-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1a2332]">Portfolio Activity</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {events.map((ev) => (
          <div key={ev.id} className="flex gap-2.5">
            <div className="flex shrink-0 flex-col items-center">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#faf9f7]">
                <i className={`${iconMap[ev.type]} text-sm`} />
              </div>
              <div className="mt-1 h-full w-px bg-[#e8e5df]" />
            </div>
            <div className="pb-3">
              <p className="text-[10px] font-medium text-[#8a8a8a]">{ev.time}</p>
              <p className="text-[11px] font-medium text-[#1a2332]">{ev.title}</p>
              <p className="text-[10px] text-[#8a8a8a]">{ev.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}