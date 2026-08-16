'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Monitor, CheckCircle2, AlertTriangle, XCircle, Clock, Zap,
  ArrowLeft, ZoomIn, Maximize2, Columns2, Layers,
  Image, Eye, Smartphone, Monitor as MonitorIcon,
  ThumbsUp, ThumbsDown, Loader2, RefreshCw,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  waiting: { label: 'Waiting', color: 'text-slate-400', bg: 'bg-slate-400/10', icon: Clock },
  running: { label: 'Running', color: 'text-sky-400', bg: 'bg-sky-400/10', icon: Zap },
  needs_review: { label: 'Needs Review', color: 'text-amber-400', bg: 'bg-amber-400/10', icon: AlertTriangle },
  passed: { label: 'Passed', color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: CheckCircle2 },
  warning: { label: 'Warning', color: 'text-amber-400', bg: 'bg-amber-400/10', icon: AlertTriangle },
  failed: { label: 'Failed', color: 'text-red-400', bg: 'bg-red-400/10', icon: XCircle },
  unavailable: { label: 'Unavailable', color: 'text-slate-500', bg: 'bg-slate-500/10', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'text-slate-500', bg: 'bg-slate-500/10', icon: XCircle },
};

interface TestData {
  name: string;
  status: string;
  source_type: string;
  source_name: string;
  source_version: string;
  language: string;
  locale: string;
  sample_profile: string;
  preset: string;
  created_at: string;
  completed_at: string;
  review_note: string;
  results_summary: { total: number; passed: number; warning: number; failed: number; baseline_count: number };
}

interface RenderResult {
  id: string;
  client_key: string;
  client_name: string;
  platform: string;
  mode: string;
  image_state: string;
  status: string;
  diff_percentage: number | null;
  issue_count: number | null;
  test_time: number | null;
  screenshot_url: string | null;
  issues: { title?: string; description?: string }[];
}

function summaryCount(v: unknown, key: string): number {
  if (v && typeof v === 'object') {
    const obj = v as Record<string, unknown>;
    if (typeof obj[key] === 'number') return obj[key] as number;
  }
  return 0;
}

export default function RenderTestDetailClient({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'detail'>('grid');
  const [selectedResult, setSelectedResult] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState<'side_by_side' | 'overlay' | 'diff'>('side_by_side');
  const [reviewNote, setReviewNote] = useState('');
  const [test, setTest] = useState<TestData | null>(null);
  const [results, setResults] = useState<RenderResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<'approve' | 'reject' | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const [testRes, resultsRes] = await Promise.all([
          supabase.from('email_render_tests').select('*').eq('id', params.id).maybeSingle(),
          supabase.from('email_render_results').select('*').eq('test_id', params.id).order('created_at', { ascending: true }).limit(200),
        ]);

        if (cancelled) return;
        if (testRes.error) throw testRes.error;

        const data = testRes.data;
        if (data) {
          setTest({
            name: data.name,
            status: data.status,
            source_type: data.source_type,
            source_name: data.source_id || '',
            source_version: data.source_version || '',
            language: data.language || 'en',
            locale: data.locale || 'en-GB',
            sample_profile: data.sample_profile || 'Default Profile',
            preset: data.preset || 'core',
            created_at: data.created_at || '',
            completed_at: data.completed_at || '',
            review_note: data.review_note || '',
            results_summary: {
              total: summaryCount(data.results_summary, 'total'),
              passed: summaryCount(data.results_summary, 'passed'),
              warning: summaryCount(data.results_summary, 'warning'),
              failed: summaryCount(data.results_summary, 'failed'),
              baseline_count: summaryCount(data.results_summary, 'baseline_count'),
            },
          });
          setReviewNote(data.review_note || '');
        } else {
          setTest(null);
        }

        const resultRows = ((resultsRes.data || []) as Record<string, unknown>[]).map((r) => ({
          id: r.id as string,
          client_key: (r.client_key as string) || 'unknown',
          client_name: (r.client_name as string) || (r.client_key as string) || 'Client',
          platform: (r.platform as string) || 'web',
          mode: (r.mode as string) || 'light',
          image_state: (r.image_state as string) || 'enabled',
          status: (r.status as string) || 'waiting',
          diff_percentage: typeof r.diff_percentage === 'number' ? (r.diff_percentage as number) : null,
          issue_count: typeof r.issue_count === 'number' ? (r.issue_count as number) : null,
          test_time: typeof r.test_time === 'number' ? (r.test_time as number) : null,
          screenshot_url: (r.screenshot_url as string) || null,
          issues: Array.isArray(r.issues) ? (r.issues as { title?: string; description?: string }[]) : [],
        }));
        setResults(resultRows);
      } catch {
        setTest(null);
        setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [params.id]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleApprove = async () => {
    if (!test) return;
    setSaving('approve');
    try {
      const { error } = await supabase
        .from('email_render_tests')
        .update({ status: 'passed', review_note: reviewNote, updated_at: new Date().toISOString() })
        .eq('id', params.id);
      if (error) throw error;
      setTest({ ...test, status: 'passed', review_note: reviewNote });
      showToast('success', 'Test approved successfully');
    } catch {
      showToast('error', 'Failed to approve. Please try again.');
    } finally {
      setSaving(null);
    }
  };

  const handleReject = async () => {
    if (!test) return;
    setSaving('reject');
    try {
      const { error } = await supabase
        .from('email_render_tests')
        .update({ status: 'failed', review_note: reviewNote, updated_at: new Date().toISOString() })
        .eq('id', params.id);
      if (error) throw error;
      setTest({ ...test, status: 'failed', review_note: reviewNote });
      showToast('success', 'Test rejected. Changes requested.');
    } catch {
      showToast('error', 'Failed to reject. Please try again.');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Monitor className="w-10 h-10 text-slate-600" />
        <p className="text-sm text-slate-400">Render test not found</p>
        <Link href="/admin/email/render-tests" className="text-xs text-violet-400 hover:text-violet-300 cursor-pointer">Back to tests</Link>
      </div>
    );
  }

  const testStatus = STATUS_CONFIG[test.status] || STATUS_CONFIG.needs_review;
  const TestStatusIcon = testStatus.icon;

  const summary = results.length > 0
    ? {
        total: results.length,
        passed: results.filter((r) => r.status === 'passed').length,
        warning: results.filter((r) => r.status === 'warning').length,
        failed: results.filter((r) => r.status === 'failed').length,
        baseline_count: test.results_summary.baseline_count,
      }
    : test.results_summary;

  const filteredByPlatform = (platform: string) => results.filter((r) => r.platform === platform);
  const selected = results.find((r) => r.id === selectedResult) || null;

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl ${
          toast.type === 'success'
            ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400'
            : 'bg-red-400/10 border-red-400/20 text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Link href="/admin/email/render-tests" className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">{test.name}</h1>
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold ${testStatus.color} ${testStatus.bg}`}>
              <TestStatusIcon className="w-3 h-3" />
              {testStatus.label}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {test.source_name} · {test.language?.toUpperCase()} · {test.preset} · {test.source_version}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const q = new URLSearchParams();
              if (test.source_type) q.set('source_type', test.source_type);
              if (test.source_name) q.set('source_name', test.source_name);
              if (test.preset) q.set('preset', test.preset);
              if (test.language) q.set('language', test.language);
              if (test.sample_profile) q.set('sample_profile_name', test.sample_profile);
              q.set('name', `${test.name} (Rerun)`);
              router.push(`/admin/email/render-tests/new?${q.toString()}`);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm font-medium hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className="w-4 h-4" />
            Rerun Test
          </button>
          {test.status === 'needs_review' ? (
            <>
              <button
                onClick={handleReject}
                disabled={!!saving}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-400/10 border border-red-400/20 text-red-400 rounded-xl text-sm font-medium hover:bg-red-400/20 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                {saving === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsDown className="w-4 h-4" />}
                Request Changes
              </button>
              <button
                onClick={handleApprove}
                disabled={!!saving}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-400/20 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                {saving === 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                Approve
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setTest({ ...test, status: 'needs_review', review_note: '' });
                setReviewNote('');
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-400/10 border border-amber-400/20 text-amber-400 rounded-xl text-sm font-medium hover:bg-amber-400/20 transition-all cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className="w-4 h-4" />
              Re-open Review
            </button>
          )}
        </div>
      </div>

      {test.review_note && test.status !== 'needs_review' && (
        <div className={`px-4 py-3 rounded-xl border text-sm ${
          test.status === 'passed'
            ? 'bg-emerald-400/[0.03] border-emerald-400/10 text-emerald-400/80'
            : 'bg-red-400/[0.03] border-red-400/10 text-red-400/80'
        }`}>
          <span className="font-semibold">Review note:</span> {test.review_note}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Total Clients</p>
          <p className="text-2xl font-bold text-white">{summary.total}</p>
        </div>
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Passed</p>
          <p className="text-2xl font-bold text-emerald-400">{summary.passed}</p>
        </div>
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Warnings</p>
          <p className="text-2xl font-bold text-amber-400">{summary.warning}</p>
        </div>
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Failed</p>
          <p className="text-2xl font-bold text-red-400">{summary.failed}</p>
        </div>
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Baselines</p>
          <p className="text-2xl font-bold text-violet-400">{summary.baseline_count}</p>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-16 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl">
          <Monitor className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No render results recorded yet</p>
          <p className="text-xs text-slate-500 mt-1">Results appear here once the rendering worker processes this test.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${viewMode === 'grid' ? 'bg-violet-400/10 text-violet-400' : 'text-slate-400 hover:text-white'}`}
              >
                Grid View
              </button>
              <button
                onClick={() => setViewMode('detail')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${viewMode === 'detail' ? 'bg-violet-400/10 text-violet-400' : 'text-slate-400 hover:text-white'}`}
              >
                Detail View
              </button>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Passed
              <span className="w-2 h-2 rounded-full bg-amber-400 ml-2" /> Warning
              <span className="w-2 h-2 rounded-full bg-red-400 ml-2" /> Failed
              <span className="w-2 h-2 rounded-full bg-slate-600 ml-2" /> Unavailable
            </div>
          </div>

          <div className="space-y-6">
            {['web', 'desktop', 'mobile'].map((platform) => {
              const platformResults = filteredByPlatform(platform);
              if (platformResults.length === 0) return null;
              const platformLabel = platform === 'web' ? 'Web Clients' : platform === 'desktop' ? 'Desktop Clients' : 'Mobile Clients';
              const PlatformIcon = platform === 'web' ? MonitorIcon : platform === 'desktop' ? MonitorIcon : Smartphone;
              return (
                <div key={platform}>
                  <div className="flex items-center gap-2 mb-3">
                    <PlatformIcon className="w-4 h-4 text-slate-400" />
                    <h3 className="text-sm font-semibold text-white">{platformLabel}</h3>
                    <span className="text-xs text-slate-500">({platformResults.length})</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {platformResults.map((r) => {
                      const rs = STATUS_CONFIG[r.status] || STATUS_CONFIG.waiting;
                      const RIcon = rs.icon;
                      return (
                        <button
                          key={r.id}
                          onClick={() => setSelectedResult(selectedResult === r.id ? null : r.id)}
                          className={`bg-[#121215] border rounded-xl p-3 text-left transition-all cursor-pointer ${
                            selectedResult === r.id ? 'border-violet-400/50 ring-1 ring-violet-400/20' : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="text-sm font-medium text-white">{r.client_name}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                {r.mode === 'dark' ? 'Dark Mode' : 'Light'} · {r.image_state === 'blocked' ? 'Images Off' : 'Images On'}
                              </p>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${rs.color} ${rs.bg}`}>
                              <RIcon className="w-2.5 h-2.5" />
                              {rs.label}
                            </span>
                          </div>
                          <div className="aspect-[4/3] bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-lg overflow-hidden mb-2 flex items-center justify-center">
                            {r.screenshot_url ? (
                              <img src={r.screenshot_url} alt={r.client_name} className="w-full h-full object-top object-cover" />
                            ) : (
                              <div className="text-center p-4">
                                <Image className="w-8 h-8 text-slate-600 mx-auto mb-1" />
                                <p className="text-[10px] text-slate-500">Screenshot</p>
                                <p className="text-[9px] text-slate-600">{r.client_key}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-500">
                              {r.diff_percentage !== null && r.diff_percentage > 0 ? `${r.diff_percentage}% diff` : 'Baseline'}
                            </span>
                            {(r.issue_count || 0) > 0 && (
                              <span className="text-amber-400">{r.issue_count} issue{r.issue_count === 1 ? '' : 's'}</span>
                            )}
                            <span className="text-slate-600">{r.test_time !== null ? `${r.test_time}s` : '—'}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {selected && (
            <div className="bg-[#121215] border border-violet-400/20 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(255,255,255,0.06)]">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-white">Screenshot Viewer</h3>
                  <span className="text-xs text-slate-500">{selected.client_name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCompareMode('side_by_side')}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs transition-all cursor-pointer ${compareMode === 'side_by_side' ? 'bg-violet-400/10 text-violet-400' : 'text-slate-400 hover:text-white'}`}
                    title="Side by Side"
                  >
                    <Columns2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCompareMode('overlay')}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs transition-all cursor-pointer ${compareMode === 'overlay' ? 'bg-violet-400/10 text-violet-400' : 'text-slate-400 hover:text-white'}`}
                    title="Overlay"
                  >
                    <Layers className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCompareMode('diff')}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs transition-all cursor-pointer ${compareMode === 'diff' ? 'bg-violet-400/10 text-violet-400' : 'text-slate-400 hover:text-white'}`}
                    title="Difference"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <span className="w-px h-5 bg-[rgba(255,255,255,0.08)] mx-1" />
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer" title="Zoom In">
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer" title="Fit Width">
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-5">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2">
                      {compareMode === 'diff' ? 'Current Render' : 'Baseline'}
                    </p>
                    <div className="aspect-[4/3] bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl flex items-center justify-center overflow-hidden">
                      {selected.screenshot_url ? (
                        <img src={selected.screenshot_url} alt="Baseline" className="w-full h-full object-top object-cover" />
                      ) : (
                        <div className="text-center">
                          <Image className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                          <p className="text-xs text-slate-500">Render screenshot</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {compareMode === 'side_by_side' && (
                    <div className="flex-1">
                      <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2">Current Render</p>
                      <div className="aspect-[4/3] bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl flex items-center justify-center overflow-hidden">
                        {selected.screenshot_url ? (
                          <img src={selected.screenshot_url} alt="Current" className="w-full h-full object-top object-cover" />
                        ) : (
                          <div className="text-center">
                            <Image className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                            <p className="text-xs text-slate-500">Current screenshot</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {compareMode === 'diff' && (
                    <div className="flex-1">
                      <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2">Difference Map</p>
                      <div className="aspect-[4/3] bg-red-400/[0.03] border border-red-400/10 rounded-xl flex items-center justify-center">
                        <div className="text-center">
                          <Eye className="w-12 h-12 text-red-400/30 mx-auto mb-2" />
                          <p className="text-xs text-red-400/50">{selected.diff_percentage !== null ? `${selected.diff_percentage}% difference` : 'No diff data'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 p-4 bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl">
                  <h4 className="text-xs font-semibold text-white mb-2">Issues Detected</h4>
                  {selected.issues.length === 0 ? (
                    <p className="text-xs text-slate-500">No issues recorded for this client</p>
                  ) : (
                    <div className="space-y-2">
                      {selected.issues.map((issue, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-white">{issue.title || 'Issue'}</p>
                            {issue.description && <p className="text-[10px] text-slate-500">{issue.description}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {test.status === 'needs_review' && (
                  <div className="mt-4 p-4 bg-amber-400/[0.03] border border-amber-400/10 rounded-xl">
                    <h4 className="text-xs font-semibold text-white mb-3">Review Decision</h4>
                    <div className="flex items-center gap-3">
                      <textarea
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        placeholder="Add a review note..."
                        rows={2}
                        maxLength={500}
                        className="flex-1 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white placeholder:text-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                      />
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={handleApprove}
                          disabled={!!saving}
                          className="px-4 py-2 bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 rounded-xl text-xs font-semibold hover:bg-emerald-400/20 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
                        >
                          {saving === 'approve' ? <Loader2 className="w-3.5 h-3.5 inline mr-1 animate-spin" /> : <ThumbsUp className="w-3.5 h-3.5 inline mr-1" />}
                          Approve
                        </button>
                        <button
                          onClick={handleReject}
                          disabled={!!saving}
                          className="px-4 py-2 bg-red-400/10 border border-red-400/20 text-red-400 rounded-xl text-xs font-semibold hover:bg-red-400/20 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
                        >
                          {saving === 'reject' ? <Loader2 className="w-3.5 h-3.5 inline mr-1 animate-spin" /> : <ThumbsDown className="w-3.5 h-3.5 inline mr-1" />}
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Link href="/admin/email/compatibility" className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl font-medium text-sm hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap">
          <Zap className="w-4 h-4" /> Compatibility Report
        </Link>
        <Link href="/admin/email/render-tests" className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl font-medium text-sm hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap">
          <ArrowLeft className="w-4 h-4" /> Back to Tests
        </Link>
      </div>
    </div>
  );
}