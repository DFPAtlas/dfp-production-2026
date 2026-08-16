'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import { ArrowLeft, Loader2, AlertCircle, Clock, ChevronDown } from 'lucide-react';
import { UAT_MONITORING_EVENT_CONFIG } from '@/lib/uat-definitions';
import type { UatMonitoringEventType } from '@/lib/uat-monitoring-definitions';

interface SessionEvent {
  id: string;
  event_type: string;
  event_timestamp: string;
  page_path: string | null;
  page_title: string | null;
  message: string | null;
  severity: string | null;
  response_status: number | null;
  duration_ms: number | null;
  request_method: string | null;
  request_path: string | null;
  source_file: string | null;
  source_line: number | null;
  event_name: string | null;
  safe_metadata: Record<string, unknown> | null;
  assignment_test_case_id: string | null;
}

const FILTERS = [
  { key: 'all', label: 'All Events' },
  { key: 'navigation', label: 'Navigation', types: ['page_view', 'route_change'] },
  { key: 'errors', label: 'Errors', types: ['javascript_error', 'unhandled_rejection'] },
  { key: 'requests', label: 'Requests', types: ['api_failure', 'api_slow'] },
  { key: 'performance', label: 'Performance', types: ['performance'] },
  { key: 'checkpoints', label: 'Checkpoints', types: ['tester_checkpoint'] },
  { key: 'session', label: 'Session', types: ['session_started', 'session_resumed', 'session_paused', 'session_finished', 'monitoring_started', 'monitoring_stopped'] },
];

const PAGE_SIZE = 50;

export default function UATSessionTimeline({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [testCases, setTestCases] = useState<Record<string, string>>({});

  useEffect(() => { loadSession(); }, [sessionId]);

  const loadSession = async () => {
    const { data: sess } = await supabase.from('uat_sessions').select('id, status, started_at, finished_at').eq('id', sessionId).maybeSingle();
    if (!sess) { setNotFound(true); setLoading(false); return; }
    setSessionInfo(sess);
    loadEvents();
  };

  const loadEvents = async (pageNum = 0) => {
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase.from('uat_session_events')
      .select('*')
      .eq('session_id', sessionId)
      .order('event_timestamp', { ascending: false })
      .range(from, to);

    const activeFilter = FILTERS.find((f) => f.key === filter);
    if (activeFilter?.types) {
      query = query.in('event_type', activeFilter.types);
    }

    const { data } = await query;

    const evts = (data || []) as SessionEvent[];

    if (pageNum === 0) {
      setEvents(evts);
    } else {
      setEvents((prev) => [...prev, ...evts]);
    }

    setHasMore(evts.length === PAGE_SIZE);
    setLoading(false);
    setLoadingMore(false);

    const tcIds = [...new Set(evts.filter((e) => e.assignment_test_case_id).map((e) => e.assignment_test_case_id!))];
    if (tcIds.length > 0) {
      const { data: atcs } = await supabase.from('uat_assignment_test_cases').select('id, test_case_id').in('id', tcIds);
      if (atcs) {
        const realTcIds = [...new Set((atcs as any[]).map((a) => a.test_case_id))];
        const { data: tcs } = await supabase.from('uat_test_cases').select('id, reference').in('id', realTcIds);
        const refMap: Record<string, string> = {};
        tcs?.forEach((tc: any) => { refMap[tc.id] = tc.reference; });
        const idMap: Record<string, string> = {};
        (atcs as any[]).forEach((a: any) => { idMap[a.id] = refMap[a.test_case_id] || 'N/A'; });
        setTestCases((prev) => ({ ...prev, ...idMap }));
      }
    }
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setPage(0);
    setEvents([]);
    setTimeout(() => loadEvents(0), 0);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadEvents(nextPage);
  };

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDateTime = (ts: string | null | undefined) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
        </div>
      </AdminShell>
    );
  }

  if (notFound) {
    return (
      <AdminShell>
        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-12 text-center max-w-md mx-auto mt-16">
          <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Session Not Found</h3>
        </div>
      </AdminShell>
    );
  }

  const eventCount = events.length;

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto">
        <button onClick={() => router.push('/admin/uat/assignments')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-[#06B6D4] transition-colors mb-6 cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-[rgba(255,255,255,0.08)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-white">Technical Session Activity</h1>
                <p className="text-sm text-slate-400 mt-1">
                  Session: {formatDateTime(sessionInfo?.started_at)}
                  {sessionInfo?.status && (
                    <span className={`ml-2 px-2 py-0.5 rounded-lg text-xs font-medium ${
                      sessionInfo.status === 'active' ? 'text-emerald-400 bg-emerald-400/10' :
                      sessionInfo.status === 'paused' ? 'text-amber-400 bg-amber-400/10' :
                      'text-slate-400 bg-slate-400/10'
                    }`}>{sessionInfo.status}</span>
                  )}
                </p>
              </div>
              <span className="text-xs text-slate-500">{eventCount} event{eventCount !== 1 ? 's' : ''}</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((f) => (
                <button key={f.key} onClick={() => handleFilterChange(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                    filter === f.key
                      ? 'bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30'
                      : 'bg-white/[0.02] text-slate-400 border border-[rgba(255,255,255,0.06)] hover:text-white hover:border-[rgba(255,255,255,0.12)]'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-[rgba(255,255,255,0.04)]">
            {events.length === 0 ? (
              <div className="p-12 text-center">
                <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">No events found</p>
              </div>
            ) : (
              events.map((evt) => {
                const config = UAT_MONITORING_EVENT_CONFIG[evt.event_type as UatMonitoringEventType];
                const tcRef = evt.assignment_test_case_id ? testCases[evt.assignment_test_case_id] : null;
                return (
                  <div key={evt.id} className="px-6 py-3 flex items-start gap-4 hover:bg-white/[0.01] transition-colors">
                    <div className="w-28 shrink-0 text-right">
                      <span className="text-xs text-slate-500 font-mono">{formatTime(evt.event_timestamp)}</span>
                    </div>

                    <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: config?.color || '#94A3B8' }} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-white">{config?.label || evt.event_type}</span>
                        {evt.severity && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0 rounded ${
                            evt.severity === 'error' || evt.severity === 'critical' ? 'text-red-400 bg-red-400/10' :
                            evt.severity === 'warning' ? 'text-amber-400 bg-amber-400/10' :
                            'text-slate-400 bg-slate-400/10'
                          }`}>{evt.severity}</span>
                        )}
                        {tcRef && (
                          <span className="text-[10px] font-medium text-cyan-400 bg-cyan-400/10 px-1.5 py-0 rounded">{tcRef}</span>
                        )}
                      </div>

                      {evt.message && (
                        <p className="text-xs text-slate-400 leading-relaxed truncate max-w-xl" title={evt.message}>{evt.message}</p>
                      )}

                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                        {evt.page_path && (
                          <span className="text-[11px] text-slate-500 font-mono truncate max-w-xs" title={evt.page_path}>
                            {evt.page_path}
                          </span>
                        )}
                        {evt.request_method && evt.response_status && (
                          <span className="text-[11px] text-slate-500 font-mono">
                            {evt.request_method} {evt.response_status}
                          </span>
                        )}
                        {evt.duration_ms != null && (
                          <span className="text-[11px] text-slate-500">{evt.duration_ms}ms</span>
                        )}
                      </div>

                      {evt.source_file && (
                        <p className="text-[10px] text-slate-600 font-mono mt-0.5 truncate max-w-md" title={evt.source_file}>
                          {evt.source_file}{evt.source_line ? `:${evt.source_line}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {hasMore && events.length > 0 && (
            <div className="p-4 text-center border-t border-[rgba(255,255,255,0.04)]">
              <button onClick={handleLoadMore} disabled={loadingMore}
                className="px-4 py-2 bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer whitespace-nowrap transition-colors">
                {loadingMore ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Load More'}
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}