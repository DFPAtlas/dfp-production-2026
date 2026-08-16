'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { motion } from '@/components/motion';
import { Activity, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import RecordTimeline from '@/components/admin/RecordTimeline';
import type { TimelineEvent } from '@/components/admin/RecordTimeline';
import { ACTIVITY_TYPE_LABELS } from '@/lib/event-catalogue';

const PAGE_SIZE = 25;

export default function ActivityFeed() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [filterModule, setFilterModule] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('project_activity')
      .select('*', { count: 'exact' });

    if (filterType) query = query.eq('activity_type', filterType);
    if (searchTerm) query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);

    const { data, error: queryErr, count } = await query
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (queryErr) { setError(queryErr.message); setLoading(false); return; }

    const mapped: TimelineEvent[] = (data || []).map((a: Record<string, unknown>) => ({
      id: a.id as string,
      type: a.activity_type as string,
      title: (ACTIVITY_TYPE_LABELS[a.activity_type as string] || (a.activity_type as string)) + ': ' + ((a.title as string) || ''),
      description: a.description as string | null,
      actorName: null,
      time: a.created_at as string,
      module: filterModule || 'projects',
      linkHref: a.project_id ? `/admin/projects` : undefined,
    }));

    setEvents(mapped);
    setTotalCount(count || 0);
    setLoading(false);
  }, [page, filterModule, filterType, searchTerm]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const allActivityTypes = Object.keys(ACTIVITY_TYPE_LABELS);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Activity Feed</h1>
        <p className="text-sm text-slate-400 mt-1">{totalCount} activity records across all projects</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
            placeholder="Search activity..."
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#06B6D4]/40"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(0); }}
          className="px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-xs text-slate-300 cursor-pointer focus:outline-none focus:border-[#06B6D4]/40 appearance-none pr-8"
        >
          <option value="">All types</option>
          {allActivityTypes.map((t) => <option key={t} value={t}>{ACTIVITY_TYPE_LABELS[t]}</option>)}
        </select>

        {(filterType || searchTerm) && (
          <button onClick={() => { setFilterType(''); setFilterModule(''); setSearchTerm(''); setPage(0); }} className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer whitespace-nowrap flex items-center gap-1">
            <X className="w-3 h-3" /> Clear filters
          </button>
        )}
      </div>

      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <RecordTimeline events={events} loading={loading} error={error} emptyMessage="No activity recorded yet. Activity appears here when records are created or updated." />
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const pageToShow = i;
            return (
              <button
                key={pageToShow}
                onClick={() => setPage(pageToShow)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs cursor-pointer transition-all ${pageToShow === page ? 'bg-[#06B6D4]/10 border border-[#06B6D4]/30 text-[#06B6D4]' : 'bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white'}`}
              >
                {pageToShow + 1}
              </button>
            );
          })}
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}