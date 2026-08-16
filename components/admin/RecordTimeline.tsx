'use client';

import { motion } from '@/components/motion';
import { ACTIVITY_COLORS } from '@/lib/event-catalogue';

export interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  actorName?: string | null;
  time: string;
  module?: string;
  linkHref?: string;
  metadata?: Record<string, unknown>;
}

interface RecordTimelineProps {
  events: TimelineEvent[];
  loading: boolean;
  error: string | null;
  emptyMessage?: string;
  maxItems?: number;
}

function timeFormat(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' at ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function RecordTimeline({ events, loading, error, emptyMessage, maxItems }: RecordTimelineProps) {
  const displayEvents = maxItems ? events.slice(0, maxItems) : events;

  if (loading) {
    return (
      <div className="space-y-4 py-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-white/5 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-white/5 rounded w-2/3" />
              <div className="h-2 bg-white/5 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-red-400">Failed to load timeline</p>
        <p className="text-xs text-slate-500 mt-1">{error}</p>
      </div>
    );
  }

  if (displayEvents.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-slate-400">{emptyMessage || 'No activity recorded yet'}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-[rgba(255,255,255,0.06)]" />

      <div className="space-y-5 py-2">
        {displayEvents.map((evt, i) => (
          <motion.div
            key={evt.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="relative pl-10"
          >
            <div
              className="absolute left-[12px] top-1 w-[9px] h-[9px] rounded-full border-2 border-[#0F172A] z-10"
              style={{ backgroundColor: ACTIVITY_COLORS[evt.type] || '#64748B' }}
            />

            <div className="bg-white/[0.02] rounded-lg px-3 py-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-white">{evt.title}</span>
                {evt.module && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-500">{evt.module}</span>
                )}
              </div>

              {evt.description && (
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{evt.description}</p>
              )}

              <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500">
                {evt.actorName && <span>{evt.actorName}</span>}
                <span>{timeFormat(evt.time)}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {maxItems && events.length > maxItems && (
        <p className="text-xs text-slate-500 text-center mt-2">
          Showing {maxItems} of {events.length} events
        </p>
      )}
    </div>
  );
}