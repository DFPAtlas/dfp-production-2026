'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, CheckCircle, XCircle, Copy, RefreshCw, X,
  Play, Ban, ExternalLink, Loader2, AlertCircle, Activity,
  Bug, ChevronDown, ChevronRight, Clock, Monitor, Image,
  Download, Zap, StopCircle, RotateCcw, Eye,
} from 'lucide-react';
import AdminShell from '../../../../../components/admin/AdminShell';

const REPRODUCTION_ACTION_LABELS: Record<string, string> = {
  navigate: 'Navigate', click: 'Click', fill: 'Fill', select: 'Select',
  check: 'Check', uncheck: 'Uncheck', upload_test_file: 'Upload Test File',
  wait_for: 'Wait For', assert_visible: 'Assert Visible', assert_text: 'Assert Text',
  assert_url: 'Assert URL', custom_checkpoint: 'Checkpoint',
};

const statusColors: Record<string, string> = {
  new: '#06B6D4', reviewing: '#8B5CF6', accepted: '#10B981',
  duplicate: '#F59E0B', rejected: '#EF4444', fixed: '#10B981',
  retest_needed: '#F97316', closed: '#6B7280',
};

const severityColors: Record<string, string> = {
  critical: '#EF4444', high: '#F97316', medium: '#F59E0B', low: '#6B7280',
};

const reproStatusConfig: Record<string, { label: string; color: string }> = {
  requested: { label: 'Requested', color: '#94A3B8' },
  queued: { label: 'Queued', color: '#3B82F6' },
  preparing: { label: 'Preparing', color: '#8B5CF6' },
  running: { label: 'Running', color: '#06B6D4' },
  completed: { label: 'Completed', color: '#10B981' },
  failed: { label: 'Failed', color: '#EF4444' },
  cancelled: { label: 'Cancelled', color: '#6B7280' },
  expired: { label: 'Expired', color: '#F59E0B' },
};

const STEP_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: '#94A3B8' },
  running: { label: 'Running', color: '#3B82F6' },
  passed: { label: 'Passed', color: '#10B981' },
  failed: { label: 'Failed', color: '#EF4444' },
  skipped: { label: 'Skipped', color: '#F59E0B' },
  blocked: { label: 'Blocked', color: '#6B7280' },
};

const ACTION_TYPES = [
  'navigate', 'click', 'fill', 'select', 'check', 'uncheck',
  'wait_for', 'assert_visible', 'assert_text', 'assert_url', 'custom_checkpoint',
];

interface EditableStep {
  action_type: string;
  target_description: string;
  safe_selector: string;
  input_reference: string;
  expected_outcome: string;
}

function buildStepsFromFeedback(feedback: any): EditableStep[] {
  const steps: EditableStep[] = [];

  if (feedback.page_url) {
    steps.push({
      action_type: 'navigate',
      target_description: 'Navigate to the page where the issue was reported',
      safe_selector: feedback.page_url,
      input_reference: '',
      expected_outcome: 'Page loads successfully',
    });
  }

  const stepsText = feedback.steps_to_reproduce || '';
  if (stepsText) {
    const lines = stepsText.split('\n').filter((l: string) => l.trim());
    for (const line of lines) {
      const clean = line.replace(/^\d+[.)]\s*/, '').trim();
      if (!clean) continue;

      if (clean.toLowerCase().includes('click') || clean.toLowerCase().includes('press') || clean.toLowerCase().includes('tap')) {
        steps.push({
          action_type: 'click', target_description: clean, safe_selector: '', input_reference: '', expected_outcome: '',
        });
      } else if (clean.toLowerCase().includes('enter') || clean.toLowerCase().includes('type') || clean.toLowerCase().includes('fill') || clean.toLowerCase().includes('input')) {
        steps.push({
          action_type: 'fill', target_description: clean, safe_selector: '', input_reference: 'TEST_USER_EMAIL', expected_outcome: '',
        });
      } else if (clean.toLowerCase().includes('navigate') || clean.toLowerCase().includes('go to') || clean.toLowerCase().includes('open')) {
        steps.push({
          action_type: 'navigate', target_description: clean, safe_selector: '', input_reference: '', expected_outcome: '',
        });
      } else if (clean.toLowerCase().includes('wait')) {
        steps.push({
          action_type: 'wait_for', target_description: clean, safe_selector: '', input_reference: '', expected_outcome: '',
        });
      } else if (clean.toLowerCase().includes('verify') || clean.toLowerCase().includes('check') || clean.toLowerCase().includes('assert') || clean.toLowerCase().includes('confirm') || clean.toLowerCase().includes('should')) {
        steps.push({
          action_type: 'assert_visible', target_description: clean, safe_selector: '', input_reference: '', expected_outcome: '',
        });
      } else {
        steps.push({
          action_type: 'custom_checkpoint', target_description: clean, safe_selector: '', input_reference: '', expected_outcome: '',
        });
      }
    }
  }

  if (feedback.expected_result) {
    steps.push({
      action_type: 'assert_text',
      target_description: 'Verify expected result',
      safe_selector: '',
      input_reference: feedback.expected_result.substring(0, 100),
      expected_outcome: feedback.expected_result,
    });
  }

  return steps;
}

export default function AdminFeedbackDetail({ feedbackId }: { feedbackId: string }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [error, setError] = useState('');
  const [linkedEvents, setLinkedEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const [reproRuns, setReproRuns] = useState<any[]>([]);
  const [reproLoading, setReproLoading] = useState(false);
  const [showReproDialog, setShowReproDialog] = useState(false);
  const [reproSteps, setReproSteps] = useState<EditableStep[]>([]);
  const [reproMode, setReproMode] = useState('fresh_sandbox');
  const [reproBrowser, setReproBrowser] = useState('chromium');
  const [reproViewportW, setReproViewportW] = useState(1280);
  const [reproViewportH, setReproViewportH] = useState(720);
  const [reproRequesting, setReproRequesting] = useState(false);
  const [reproError, setReproError] = useState('');
  const [reproSuccess, setReproSuccess] = useState('');
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [runSteps, setRunSteps] = useState<Record<string, any[]>>({});
  const [runEvents, setRunEvents] = useState<Record<string, any[]>>({});
  const [sandboxInstances, setSandboxInstances] = useState<any[]>([]);
  const [selectedSandboxId, setSelectedSandboxId] = useState('');

  useEffect(() => {
    fetchData();
  }, [feedbackId]);

  const fetchData = async () => {
    const { data: fb } = await supabase.from('uat_feedback').select('*').eq('id', feedbackId).maybeSingle();
    if (!fb) { setNotFound(true); setLoading(false); return; }

    const fData = fb as any;

    const [{ data: tester }, { data: job }, { data: proj }] = await Promise.all([
      supabase.from('uat_testers').select('full_name, email').eq('id', fData.tester_id).maybeSingle(),
      fData.job_id ? supabase.from('uat_jobs').select('title').eq('id', fData.job_id).maybeSingle() : Promise.resolve({ data: null }),
      fData.project_id ? supabase.from('uat_projects').select('name').eq('id', fData.project_id).maybeSingle() : Promise.resolve({ data: null }),
    ]);

    const initialSteps = buildStepsFromFeedback(fData);

    setFeedback({
      ...fData,
      tester_name: (tester as any)?.full_name || 'Unknown',
      tester_email: (tester as any)?.email || '',
      job_title: (job as any)?.title || null,
      project_name: (proj as any)?.name || null,
    });
    setAdminNote(fData.admin_notes || '');
    setReproSteps(initialSteps);
    setLoading(false);

    loadLinkedEvents(feedbackId);
    loadReproductionRuns();

    if (fData.project_id) {
      const { data: sbx } = await supabase
        .from('uat_sandbox_instances')
        .select('id, status, sandbox_mode')
        .eq('project_id', fData.project_id)
        .eq('assignment_id', fData.assignment_id)
        .in('status', ['ready', 'active'])
        .order('created_at', { ascending: false })
        .limit(5);
      setSandboxInstances(sbx || []);
    }
  };

  const loadReproductionRuns = async () => {
    setReproLoading(true);
    const { data: runs } = await supabase
      .from('uat_reproduction_runs')
      .select('*')
      .eq('feedback_id', feedbackId)
      .order('created_at', { ascending: false });

    setReproRuns(runs || []);
    setReproLoading(false);
  };

  const loadRunDetails = async (runId: string) => {
    if (runSteps[runId]) return;
    const [{ data: steps }, { data: events }] = await Promise.all([
      supabase.from('uat_reproduction_steps').select('*').eq('reproduction_run_id', runId).order('step_number'),
      supabase.from('uat_reproduction_events').select('*').eq('reproduction_run_id', runId).order('created_at'),
    ]);
    setRunSteps((prev) => ({ ...prev, [runId]: steps || [] }));
    setRunEvents((prev) => ({ ...prev, [runId]: events || [] }));
  };

  const toggleExpandRun = (runId: string) => {
    if (expandedRunId === runId) {
      setExpandedRunId(null);
    } else {
      setExpandedRunId(runId);
      loadRunDetails(runId);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatusUpdating(true);
    setError('');
    const { error: err } = await supabase.from('uat_feedback').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', feedbackId);
    if (err) { setError(err.message); setStatusUpdating(false); return; }

    await supabase.from('uat_audit_log').insert({
      action: `Feedback ${newStatus}`,
      entity_type: 'uat_feedback',
      entity_id: feedbackId,
      new_value: { status: newStatus },
    });
    setStatusUpdating(false);
    setFeedback((prev: any) => ({ ...prev, status: newStatus }));
  };

  const handleSaveNote = async () => {
    setNoteSaving(true);
    await supabase.from('uat_feedback').update({ admin_notes: adminNote, updated_at: new Date().toISOString() }).eq('id', feedbackId);
    await supabase.from('uat_audit_log').insert({
      action: 'Admin note updated',
      entity_type: 'uat_feedback',
      entity_id: feedbackId,
      new_value: { admin_notes: adminNote },
    });
    setNoteSaving(false);
    setFeedback((prev: any) => ({ ...prev, admin_notes: adminNote }));
  };

  const loadLinkedEvents = async (fid: string) => {
    setEventsLoading(true);
    const { data: fse } = await supabase.from('uat_feedback_session_events')
      .select('session_event_id').eq('feedback_id', fid);
    if (!fse || fse.length === 0) { setEventsLoading(false); return; }

    const eventIds = fse.map((f: any) => f.session_event_id);
    const { data: events } = await supabase.from('uat_session_events')
      .select('*').in('id', eventIds).order('event_timestamp', { ascending: false });

    setLinkedEvents((events || []) as any[]);
    setEventsLoading(false);
  };

  const updateStep = (idx: number, field: keyof EditableStep, value: string) => {
    setReproSteps((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const addStep = () => {
    setReproSteps((prev) => [...prev, {
      action_type: 'click', target_description: '', safe_selector: '', input_reference: '', expected_outcome: '',
    }]);
  };

  const removeStep = (idx: number) => {
    setReproSteps((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRequestReproduction = async () => {
    setReproRequesting(true);
    setReproError('');
    setReproSuccess('');

    const validSteps = reproSteps.filter((s) => s.action_type);
    if (validSteps.length === 0) {
      setReproError('At least one step is required');
      setReproRequesting(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      setReproError('Not authenticated');
      setReproRequesting(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/request-uat-reproduction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          feedback_id: feedbackId,
          execution_mode: reproMode,
          sandbox_instance_id: reproMode === 'existing_sandbox' ? (selectedSandboxId || null) : null,
          browser_name: reproBrowser,
          viewport_width: reproViewportW,
          viewport_height: reproViewportH,
          steps: validSteps,
          credential_references: {},
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setReproError(data.message || 'Request failed');
        setReproRequesting(false);
        return;
      }

      setReproSuccess(`Reproduction requested (Attempt #${data.attempt_number})`);
      setShowReproDialog(false);
      loadReproductionRuns();
    } catch (err: any) {
      setReproError(err.message || 'Network error');
    }
    setReproRequesting(false);
  };

  const handleCancelRun = async (runId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/request-uat-reproduction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'cancel', reproduction_run_id: runId }),
      });
    } catch {}

    await supabase.from('uat_reproduction_runs').update({ status: 'cancelled' }).eq('id', runId);
    loadReproductionRuns();
  };

  const handleRetryRun = async () => {
    setShowReproDialog(true);
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
          <h3 className="text-lg font-bold text-white mb-2">Feedback Not Found</h3>
          <p className="text-sm text-slate-400 mb-6">This feedback entry does not exist.</p>
          <button onClick={() => router.push('/admin/uat/feedback')} className="px-5 py-2.5 bg-[#06B6D4] rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap">Back to Feedback</button>
        </div>
      </AdminShell>
    );
  }

  if (!feedback) return null;

  const statusActions = (() => {
    switch (feedback.status) {
      case 'new': return ['reviewing', 'accepted', 'rejected', 'duplicate'];
      case 'reviewing': return ['accepted', 'rejected', 'duplicate'];
      case 'accepted': return ['fixed', 'closed'];
      case 'fixed': return ['retest_needed', 'closed'];
      case 'retest_needed': return ['closed'];
      case 'duplicate': case 'rejected': return ['closed'];
      default: return [];
    }
  })();

  const actionLabelMap: Record<string, string> = {
    reviewing: 'Start Review', accepted: 'Accept', rejected: 'Reject',
    duplicate: 'Mark Duplicate', fixed: 'Mark Fixed',
    retest_needed: 'Retest Needed', closed: 'Close',
  };

  const actionIcons: Record<string, any> = {
    reviewing: Play, accepted: CheckCircle, rejected: Ban,
    duplicate: Copy, fixed: CheckCircle, retest_needed: RefreshCw, closed: X,
  };

  const actionColors: Record<string, string> = {
    reviewing: '#8B5CF6', accepted: '#10B981', rejected: '#EF4444',
    duplicate: '#F59E0B', fixed: '#10B981', retest_needed: '#F97316', closed: '#6B7280',
  };

  const canRequestReproduction = ['reviewing', 'accepted', 'new'].includes(feedback.status) &&
    reproRuns.every((r: any) => !['queued', 'preparing', 'running'].includes(r.status));

  return (
    <AdminShell>
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.push('/admin/uat/feedback')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-[#06B6D4] transition-colors mb-6 cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to Feedback
        </button>

        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-[rgba(255,255,255,0.08)]">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex px-2.5 py-0.5 rounded-lg text-xs font-medium capitalize"
                style={{ color: statusColors[feedback.status] || '#94A3B8', backgroundColor: (statusColors[feedback.status] || '#94A3B8') + '15' }}>
                {feedback.status.replace('_', ' ')}
              </span>
              <span className="inline-flex px-2.5 py-0.5 rounded-lg text-xs font-medium capitalize"
                style={{ color: severityColors[feedback.severity] || '#6B7280', backgroundColor: (severityColors[feedback.severity] || '#6B7280') + '15' }}>
                {feedback.severity}
              </span>
              <span className="text-xs text-slate-500 capitalize">{feedback.feedback_type}</span>
            </div>
            <h1 className="text-xl font-bold text-white">{feedback.title}</h1>
            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-sm text-slate-400">
              <span>Tester: {feedback.tester_name} ({feedback.tester_email})</span>
              {feedback.project_name && <span>Project: {feedback.project_name}</span>}
              {feedback.job_title && <span>Job: {feedback.job_title}</span>}
              {feedback.category && <span>Category: {feedback.category}</span>}
            </div>
          </div>

          <div className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {reproSuccess && (
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <p className="text-sm text-emerald-400">{reproSuccess}</p>
                <button onClick={() => setReproSuccess('')} className="ml-auto text-emerald-400 hover:text-emerald-300"><X className="w-4 h-4" /></button>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {feedback.device && (
                <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-0.5">Device</p>
                  <p className="text-slate-300">{feedback.device}</p>
                </div>
              )}
              {feedback.browser && (
                <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-0.5">Browser</p>
                  <p className="text-slate-300">{feedback.browser}</p>
                </div>
              )}
              {feedback.os_version && (
                <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-0.5">OS</p>
                  <p className="text-slate-300">{feedback.os_version}</p>
                </div>
              )}
              {feedback.screen_size && (
                <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-0.5">Screen</p>
                  <p className="text-slate-300">{feedback.screen_size}</p>
                </div>
              )}
            </div>

            {feedback.page_url && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Page URL</p>
                <a href={feedback.page_url} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-[#06B6D4] hover:underline break-all flex items-center gap-1.5">
                  {feedback.page_url} <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            <div>
              <p className="text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wide">Description</p>
              <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{feedback.description}</p>
              </div>
            </div>

            {feedback.steps_to_reproduce && (
              <div>
                <p className="text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wide">Steps to Reproduce</p>
                <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                  <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{feedback.steps_to_reproduce}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feedback.expected_result && (
                <div>
                  <p className="text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wide">Expected Result</p>
                  <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{feedback.expected_result}</p>
                  </div>
                </div>
              )}
              {feedback.actual_result && (
                <div>
                  <p className="text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wide">Actual Result</p>
                  <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{feedback.actual_result}</p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wide">Admin Notes</p>
              <div className="flex gap-2">
                <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Add internal notes..."
                  className="flex-1 px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all resize-none"
                  rows={3} />
                <button onClick={handleSaveNote} disabled={noteSaving || adminNote === (feedback.admin_notes || '')}
                  className="px-4 py-2 bg-[#06B6D4] hover:bg-[#0891B2] disabled:opacity-40 rounded-xl text-sm font-semibold text-white transition-colors cursor-pointer whitespace-nowrap self-end">
                  {noteSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                </button>
              </div>
            </div>

            {statusActions.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                {statusActions.map((status) => {
                  const Icon = actionIcons[status] || Play;
                  return (
                    <button key={status} onClick={() => handleStatusChange(status)} disabled={statusUpdating}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap flex items-center gap-2 transition-colors disabled:opacity-50"
                      style={{ color: actionColors[status], backgroundColor: actionColors[status] + '15', border: '1px solid ' + actionColors[status] + '30' }}>
                      <Icon className="w-4 h-4" />
                      {actionLabelMap[status]}
                    </button>
                  );
                })}
              </div>
            )}

            {feedback.session_id && (
              <div className="pt-3 border-t border-[rgba(255,255,255,0.06)]">
                <button onClick={() => router.push(`/admin/uat/sessions/${feedback.session_id}`)}
                  className="px-4 py-2.5 bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-slate-400 hover:text-[#06B6D4] cursor-pointer whitespace-nowrap flex items-center gap-2 transition-colors">
                  <Activity className="w-4 h-4" /> View Session Timeline
                </button>
              </div>
            )}

            {linkedEvents.length > 0 && (
              <div className="pt-3 border-t border-[rgba(255,255,255,0.06)]">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-[#06B6D4]" /> Linked Session Events ({linkedEvents.length})
                </h3>
                <div className="space-y-2">
                  {linkedEvents.map((evt: any) => {
                    const evLabel = evt.event_type?.replace(/_/g, ' ') || evt.event_type;
                    return (
                      <div key={evt.id} className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-3 text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-slate-300 capitalize">{evLabel}</span>
                          {evt.severity && (
                            <span className={`text-[10px] px-1.5 py-0 rounded ${
                              evt.severity === 'error' ? 'text-red-400 bg-red-400/10' : 'text-amber-400 bg-amber-400/10'
                            }`}>{evt.severity}</span>
                          )}
                          <span className="text-[10px] text-slate-500 ml-auto">
                            {new Date(evt.event_timestamp).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {evt.message && <p className="text-xs text-slate-500 leading-relaxed">{evt.message}</p>}
                        {evt.page_path && <p className="text-[11px] text-slate-600 font-mono mt-1 truncate">{evt.page_path}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Automated Reproduction Section */}
        <div className="mt-6 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bug className="w-5 h-5 text-[#06B6D4]" />
              <h2 className="text-lg font-bold text-white">Automated Reproduction</h2>
            </div>
            {canRequestReproduction && (
              <button onClick={() => setShowReproDialog(true)}
                className="px-4 py-2.5 bg-[#06B6D4] hover:bg-[#0891B2] rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap flex items-center gap-2 transition-colors">
                <Zap className="w-4 h-4" /> Request Automated Reproduction
              </button>
            )}
          </div>

          <div className="p-6">
            {reproLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : reproRuns.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-[rgba(255,255,255,0.06)] flex items-center justify-center mx-auto mb-3">
                  <Bug className="w-5 h-5 text-slate-600" />
                </div>
                <p className="text-sm text-slate-400">No reproduction runs yet.</p>
                <p className="text-xs text-slate-600 mt-1">Request an automated reproduction attempt when ready.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reproRuns.map((run: any) => {
                  const isExpanded = expandedRunId === run.id;
                  const runCfg = reproStatusConfig[run.status] || { label: run.status, color: '#94A3B8' };
                  const steps = runSteps[run.id] || [];
                  const events = runEvents[run.id] || [];

                  return (
                    <div key={run.id} className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden">
                      <button onClick={() => toggleExpandRun(run.id)}
                        className="w-full p-4 flex items-center gap-3 text-left cursor-pointer hover:bg-white/[0.01] transition-colors">
                        <span className="inline-flex px-2.5 py-0.5 rounded-lg text-xs font-medium"
                          style={{ color: runCfg.color, backgroundColor: runCfg.color + '15' }}>
                          {runCfg.label}
                        </span>
                        <span className="text-sm text-slate-300">Attempt #{run.attempt_number}</span>
                        <span className="text-xs text-slate-500 capitalize">{run.execution_mode?.replace('_', ' ')}</span>
                        {run.browser_name && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Monitor className="w-3 h-3" /> {run.browser_name}
                          </span>
                        )}
                        <span className="text-xs text-slate-600 flex items-center gap-1 ml-auto">
                          <Clock className="w-3 h-3" />
                          {new Date(run.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-4 border-t border-[rgba(255,255,255,0.04)] pt-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            {run.reproduced !== null && (
                              <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-3">
                                <p className="text-xs text-slate-500 mb-0.5">Result</p>
                                <p className="text-slate-300 font-medium" style={{ color: run.reproduced ? '#10B981' : '#F59E0B' }}>
                                  {run.reproduced ? 'Reproduced' : 'Not Reproduced'}
                                </p>
                              </div>
                            )}
                            {run.duration_ms && (
                              <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-3">
                                <p className="text-xs text-slate-500 mb-0.5">Duration</p>
                                <p className="text-slate-300">{(run.duration_ms / 1000).toFixed(1)}s</p>
                              </div>
                            )}
                            {run.viewport_width && (
                              <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-3">
                                <p className="text-xs text-slate-500 mb-0.5">Viewport</p>
                                <p className="text-slate-300">{run.viewport_width}×{run.viewport_height}</p>
                              </div>
                            )}
                            {run.safe_summary && (
                              <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-3 col-span-2">
                                <p className="text-xs text-slate-500 mb-0.5">Summary</p>
                                <p className="text-slate-300 text-xs leading-relaxed">{run.safe_summary}</p>
                              </div>
                            )}
                          </div>

                          {steps.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Steps</h4>
                              <div className="space-y-1.5">
                                {steps.map((step: any) => {
                                  const sc = STEP_STATUS_CONFIG[step.status] || { label: step.status, color: '#94A3B8' };
                                  return (
                                    <div key={step.id} className="flex items-center gap-3 bg-white/[0.01] border border-[rgba(255,255,255,0.04)] rounded-lg px-3 py-2">
                                      <span className="text-[10px] font-mono text-slate-600 w-5">#{step.step_number}</span>
                                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium capitalize"
                                        style={{ color: '#8B5CF6', backgroundColor: '#8B5CF6' + '15' }}>
                                        {REPRODUCTION_ACTION_LABELS[step.action_type] || step.action_type}
                                      </span>
                                      <span className="text-xs text-slate-400 truncate flex-1">
                                        {step.target_description || step.safe_selector || '-'}
                                      </span>
                                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                                        style={{ color: sc.color, backgroundColor: sc.color + '12' }}>
                                        {sc.label}
                                      </span>
                                      {step.safe_result && (
                                        <span className="text-[10px] text-slate-600 max-w-[200px] truncate">{step.safe_result}</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {events.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Technical Events ({events.length})</h4>
                              <div className="space-y-1 max-h-48 overflow-y-auto">
                                {events.map((evt: any) => (
                                  <div key={evt.id} className="text-[11px] text-slate-500 flex items-center gap-2 px-2 py-1">
                                    <span className="w-16 text-slate-600 text-[10px]">
                                      {new Date(evt.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                    <span className="capitalize">{evt.event_type?.replace(/_/g, ' ')}</span>
                                    {evt.safe_message && <span className="text-slate-600 truncate">— {evt.safe_message}</span>}
                                    {evt.response_status && (
                                      <span className="text-[10px] px-1.5 py-0 rounded" style={{
                                        color: evt.response_status >= 500 ? '#EF4444' : evt.response_status >= 400 ? '#F97316' : '#94A3B8',
                                        backgroundColor: evt.response_status >= 500 ? '#EF4444' + '10' : evt.response_status >= 400 ? '#F97316' + '10' : '#94A3B8' + '10',
                                      }}>{evt.response_status}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2 pt-2 border-t border-[rgba(255,255,255,0.04)]">
                            {['queued', 'preparing', 'running'].includes(run.status) && (
                              <button onClick={() => handleCancelRun(run.id)}
                                className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/20 cursor-pointer whitespace-nowrap flex items-center gap-1 transition-colors">
                                <StopCircle className="w-3 h-3" /> Cancel
                              </button>
                            )}
                            {['completed', 'failed', 'cancelled'].includes(run.status) && (
                              <button onClick={handleRetryRun}
                                className="px-3 py-1.5 bg-[#06B6D4]/10 border border-[#06B6D4]/20 rounded-lg text-xs font-semibold text-[#06B6D4] hover:bg-[#06B6D4]/20 cursor-pointer whitespace-nowrap flex items-center gap-1 transition-colors">
                                <RotateCcw className="w-3 h-3" /> Retry
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reproduction Request Dialog */}
      {showReproDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowReproDialog(false)}>
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.1)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Bug className="w-5 h-5 text-[#06B6D4]" /> Request Automated Reproduction
              </h3>
              <button onClick={() => setShowReproDialog(false)} className="p-1.5 text-slate-400 hover:text-white cursor-pointer rounded-lg hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {reproError && (
                <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-sm text-red-400">{reproError}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Bug</p>
                <p className="text-sm text-white font-semibold">{feedback.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1.5">Execution Mode</p>
                  <div className="flex gap-2">
                    <button onClick={() => setReproMode('fresh_sandbox')}
                      className={`px-3 py-2 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap transition-colors ${reproMode === 'fresh_sandbox' ? 'bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/30' : 'bg-white/[0.02] border border-[rgba(255,255,255,0.06)] text-slate-400 hover:text-slate-300'}`}>
                      Fresh Sandbox
                    </button>
                    <button onClick={() => setReproMode('existing_sandbox')}
                      className={`px-3 py-2 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap transition-colors ${reproMode === 'existing_sandbox' ? 'bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/30' : 'bg-white/[0.02] border border-[rgba(255,255,255,0.06)] text-slate-400 hover:text-slate-300'}`}>
                      Existing Sandbox
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-400 mb-1.5">Browser</p>
                  <select value={reproBrowser} onChange={(e) => setReproBrowser(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 pr-8 cursor-pointer">
                    <option value="chromium">Chromium</option>
                    <option value="firefox">Firefox</option>
                    <option value="webkit">WebKit</option>
                  </select>
                </div>

                <div>
                  <p className="text-xs text-slate-400 mb-1.5">Viewport Width</p>
                  <input type="number" value={reproViewportW} onChange={(e) => setReproViewportW(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                </div>

                <div>
                  <p className="text-xs text-slate-400 mb-1.5">Viewport Height</p>
                  <input type="number" value={reproViewportH} onChange={(e) => setReproViewportH(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                </div>
              </div>

              {reproMode === 'existing_sandbox' && (
                <div>
                  <p className="text-xs text-slate-400 mb-1.5">Sandbox</p>
                  {sandboxInstances.length === 0 ? (
                    <p className="text-xs text-slate-600">No active sandboxes available for this assignment</p>
                  ) : (
                    <div className="space-y-1">
                      {sandboxInstances.map((sbx: any) => (
                        <button key={sbx.id} onClick={() => setSelectedSandboxId(sbx.id)}
                          className={`w-full px-3 py-2 rounded-lg text-xs text-left cursor-pointer transition-colors ${selectedSandboxId === sbx.id ? 'bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4]' : 'bg-white/[0.02] border border-[rgba(255,255,255,0.06)] text-slate-400 hover:text-slate-300'}`}>
                          {sbx.id.substring(0, 8)}... — {sbx.status} ({sbx.sandbox_mode})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Reproduction Steps ({reproSteps.length})</p>
                  <button onClick={addStep}
                    className="px-3 py-1 bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-lg text-xs text-[#06B6D4] hover:text-white cursor-pointer whitespace-nowrap transition-colors">
                    + Add Step
                  </button>
                </div>

                <div className="space-y-2 max-h-[360px] overflow-y-auto">
                  {reproSteps.map((step, idx) => (
                    <div key={idx} className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-600 w-5">#{idx + 1}</span>
                        <select value={step.action_type} onChange={(e) => updateStep(idx, 'action_type', e.target.value)}
                          className="px-2 py-1 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white cursor-pointer pr-8">
                          {ACTION_TYPES.map((a) => (
                            <option key={a} value={a}>{REPRODUCTION_ACTION_LABELS[a] || a}</option>
                          ))}
                        </select>
                        <button onClick={() => removeStep(idx)}
                          className="ml-auto p-1 text-slate-600 hover:text-red-400 cursor-pointer rounded">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {['navigate', 'click', 'fill', 'select', 'check', 'uncheck', 'wait_for', 'assert_visible', 'assert_text', 'assert_url'].includes(step.action_type) && (
                        <input type="text" value={step.safe_selector} onChange={(e) => updateStep(idx, 'safe_selector', e.target.value)}
                          placeholder={step.action_type === 'navigate' ? 'Target URL' : 'CSS selector (e.g. data-testid="submit")'}
                          className="w-full px-3 py-1.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/20" />
                      )}

                      {step.action_type === 'fill' && (
                        <input type="text" value={step.input_reference} onChange={(e) => updateStep(idx, 'input_reference', e.target.value)}
                          placeholder="Test data reference (e.g. TEST_USER_EMAIL)"
                          className="w-full px-3 py-1.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/20" />
                      )}

                      {['assert_text', 'assert_url'].includes(step.action_type) && (
                        <input type="text" value={step.input_reference} onChange={(e) => updateStep(idx, 'input_reference', e.target.value)}
                          placeholder={step.action_type === 'assert_text' ? 'Expected text' : 'URL pattern'}
                          className="w-full px-3 py-1.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/20" />
                      )}

                      <input type="text" value={step.target_description} onChange={(e) => updateStep(idx, 'target_description', e.target.value)}
                        placeholder="Description of what this step does"
                        className="w-full px-3 py-1.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/20" />

                      <input type="text" value={step.expected_outcome} onChange={(e) => updateStep(idx, 'expected_outcome', e.target.value)}
                        placeholder="Expected outcome (optional)"
                        className="w-full px-3 py-1.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/20" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-end gap-3">
              <button onClick={() => setShowReproDialog(false)}
                className="px-4 py-2.5 bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-slate-400 hover:text-white cursor-pointer whitespace-nowrap transition-colors">
                Cancel
              </button>
              <button onClick={handleRequestReproduction} disabled={reproRequesting || reproSteps.filter((s) => s.action_type).length === 0}
                className="px-5 py-2.5 bg-[#06B6D4] hover:bg-[#0891B2] disabled:opacity-40 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap flex items-center gap-2 transition-colors">
                {reproRequesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Start Reproduction
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}