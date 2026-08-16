'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle, Clock, Ban, Filter, ChevronDown } from 'lucide-react';
import { useUATTester } from '@/components/uat/UATTesterProvider';
import UATPortalBreadcrumbs from '@/components/uat/portal/UATPortalBreadcrumbs';
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
  assignment_test_case_id: string | null;
  safe_metadata: Record<string, unknown> | null;
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'navigation', label: 'Navigation', types: ['page_view', 'route_change'] },
  { key: 'errors', label: 'Errors', types: ['javascript_error', 'unhandled_rejection'] },
  { key: 'requests', label: 'Failed/Slow Requests', types: ['api_failure', 'api_slow'] },
  { key: 'performance', label: 'Performance', types: ['performance'] },
  { key: 'checkpoints', label: 'Checkpoints', types: ['tester_checkpoint'] },
];

const PAGE_SIZE = 50;

export default function TesterEvents({ assignmentId }: { assignmentId: string }) {
  const router = useRouter();
  const { tester } = useUATTester();
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [blockMessage, setBlockMessage] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [monitoringEnabled, setMonitoringEnabled] = useState(false);
  const [jobTitle, setJobTitle] = useState('');

  useEffect(() => {
    loadAssignment();
  }, [assignmentId, tester.id]);

  const loadAssignment = async () => {
    const { data: assign } = await supabase.from('uat_assignments')
      .select('id, status, job_id')
      .eq('id', assignmentId).eq('tester_id', tester.id).maybeSingle();

    if (!assign) { setBlocked(true); setBlockMessage('This test assignment is not available.'); setLoading(false); return; }

    const aData = assign as any;

    if (aData.job_id) {
      const { data: job } = await supabase.from('uat_jobs').select('title, project_id').eq('id', aData.job_id).maybeSingle();
      if (job) {
        setJobTitle((job as any).title || '');
        if ((job as any).project_id) {
          const { data: settings } = await supabase.from('uat_monitoring_settings')
            .select('monitoring_enabled').eq('project_id', (job as any).project_id).maybeSingle();
          if ((settings as any)?.monitoring_enabled) setMonitoringEnabled(true);
        }
      }
    }

    const { data: sess } = await supabase.from('uat_sessions')
      .select('id')
      .eq('assignment_id', assignmentId)
      .in('status', ['active', 'paused', 'completed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sess) { setBlocked(true); setBlockMessage('No active or completed session found.'); setLoading(false); return; }

    setSessionId((sess as any).id);
    loadEvents((sess as any).id);
  };

  const loadEvents = async (sid: string, pageNum = 0) => {
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase.from('uat_session_events')
      .select('*')
      .eq('session_id', sid)
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
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setPage(0);
    setEvents([]);
    if (sessionId) setTimeout(() => loadEvents(sessionId, 0), 0);
  };

  const handleLoadMore = () => {
    if (!sessionId) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadEvents(sessionId, nextPage);
  };

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-[3px] border-[#2878d0]/20 border-t-[#2878d0] rounded-full animate-spin" />
      </div>
    );
  }

  if (blocked) {
    return (
      <>
        <UATPortalBreadcrumbs items={[{ label: 'My Tests', href: '/uat/my-tests' }, { label: 'Technical Events' }]} />
        <div className="flex items-center justify-center py-16">
          <div className="bg-white border border-slate-100 rounded-3xl p-12 shadow-sm text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-6">
              <Ban className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-[#17325c] mb-2">Not Available</h3>
            <p className="text-slate-500 mb-6">{blockMessage}</p>
            <button onClick={() => router.push(`/uat/my-tests/${assignmentId}`)}
              className="px-5 py-2.5 bg-[#2878d0] rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap">
              Back to Test
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!monitoringEnabled) {
    return (
      <>
        <UATPortalBreadcrumbs items={[{ label: 'My Tests', href: '/uat/my-tests' }, { label: 'Technical Events' }]} />
        <div className="flex items-center justify-center py-16">
          <div className="bg-white border border-slate-100 rounded-3xl p-12 shadow-sm text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-[#17325c] mb-2">Monitoring Disabled</h3>
            <p className="text-slate-500 mb-6">Technical monitoring is not enabled for this project.</p>
            <button onClick={() => router.push(`/uat/my-tests/${assignmentId}`)}
              className="px-5 py-2.5 bg-[#2878d0] rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap">
              Back to Test
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <UATPortalBreadcrumbs items={[{ label: 'My Tests', href: '/uat/my-tests' }, { label: jobTitle || 'Test', href: `/uat/my-tests/${assignmentId}` }, { label: 'Technical Events' }]} />

      <div className="mt-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => router.push(`/uat/my-tests/${assignmentId}`)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#2878d0] transition-colors cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> Back to Test
          </button>
          <span className="text-xs text-slate-400">{events.length} event{events.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-[#17325c] mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#2878d0]" /> Technical Events
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((f) => (
                <button key={f.key} onClick={() => handleFilterChange(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                    filter === f.key
                      ? 'bg-[#2878d0]/10 text-[#2878d0] border border-[#2878d0]/20'
                      : 'bg-slate-50 text-slate-500 border border-slate-200 hover:text-[#17325c]'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-50">
            {events.length === 0 ? (
              <div className="p-12 text-center">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">No events recorded</p>
                <p className="text-xs text-slate-300 mt-1">Events will appear here as you browse the test website</p>
              </div>
            ) : (
              events.map((evt) => {
                const config = UAT_MONITORING_EVENT_CONFIG[evt.event_type as UatMonitoringEventType];
                return (
                  <div key={evt.id} className="px-4 py-2.5 flex items-start gap-3 hover:bg-slate-50/50 transition-colors">
                    <span className="text-[10px] text-slate-400 font-mono w-16 shrink-0 text-right pt-0.5">
                      {formatTime(evt.event_timestamp)}
                    </span>

                    <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: config?.color || '#94A3B8' }} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#17325c]">{config?.label || evt.event_type}</span>
                        {evt.severity && (
                          <span className={`text-[10px] font-semibold px-1 py-0 rounded ${
                            evt.severity === 'error' || evt.severity === 'critical' ? 'text-red-600 bg-red-50' :
                            evt.severity === 'warning' ? 'text-amber-600 bg-amber-50' :
                            'text-slate-500 bg-slate-100'
                          }`}>{evt.severity}</span>
                        )}
                        {evt.response_status && (
                          <span className={`text-[10px] font-mono px-1 py-0 rounded ${
                            evt.response_status >= 500 ? 'text-red-600 bg-red-50' :
                            evt.response_status >= 400 ? 'text-orange-600 bg-orange-50' :
                            'text-slate-500 bg-slate-100'
                          }`}>{evt.response_status}</span>
                        )}
                        {evt.duration_ms != null && (
                          <span className="text-[10px] text-slate-400">{evt.duration_ms}ms</span>
                        )}
                      </div>

                      {evt.message && (
                        <p className="text-xs text-slate-500 leading-relaxed mt-0.5 line-clamp-2" title={evt.message}>{evt.message}</p>
                      )}

                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                        {evt.page_path && (
                          <span className="text-[10px] text-slate-400 font-mono truncate max-w-[300px]" title={evt.page_path}>{evt.page_path}</span>
                        )}
                        {evt.event_name && (
                          <span className="text-[10px] text-slate-400">{evt.event_name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {hasMore && events.length > 0 && (
            <div className="p-4 text-center border-t border-slate-100">
              <button onClick={handleLoadMore} disabled={loadingMore}
                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-500 cursor-pointer whitespace-nowrap transition-colors">
                {loadingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" /> : null}
                Load More
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}