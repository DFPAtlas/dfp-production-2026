'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle, CheckCircle, Loader2, Send,
  Bug, ChevronDown, FileText, Camera, Paperclip,
  Activity,
} from 'lucide-react';
import { useUATTester } from '@/components/uat/UATTesterProvider';
import UATPortalBreadcrumbs from '@/components/uat/portal/UATPortalBreadcrumbs';
import { UAT_MONITORING_EVENT_CONFIG } from '@/lib/uat-definitions';
import UATEvidenceList from '@/components/uat/evidence/UATEvidenceList';
import UATScreenshotCapture from '@/components/uat/evidence/UATScreenshotCapture';
import UATEvidenceUploader from '@/components/uat/evidence/UATEvidenceUploader';
import { UATEvidence } from '@/components/uat/evidence/evidence-types';

const feedbackTypes = [
  { value: 'bug', label: 'Bug', icon: Bug },
  { value: 'usability issue', label: 'Usability Issue' },
  { value: 'broken link', label: 'Broken Link' },
  { value: 'payment issue', label: 'Payment Issue' },
  { value: 'login issue', label: 'Login Issue' },
  { value: 'design feedback', label: 'Design Feedback' },
  { value: 'mobile issue', label: 'Mobile Issue' },
  { value: 'accessibility issue', label: 'Accessibility Issue' },
  { value: 'performance issue', label: 'Performance Issue' },
  { value: 'other', label: 'Other' },
];

const severityLevels = ['critical', 'high', 'medium', 'low'];
const browserOptions = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera', 'Brave', 'Other'];
const deviceOptions = ['Desktop', 'Laptop', 'Tablet', 'Mobile Phone'];

interface FormData {
  feedback_type: string; severity: string; category: string;
  page_url: string; device: string; browser: string; os_version: string;
  screen_size: string; title: string; description: string;
  steps_to_reproduce: string; expected_result: string; actual_result: string;
}

function FeedbackFormInner({ assignmentId }: { assignmentId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const atcId = searchParams.get('atcId');
  const { tester } = useUATTester();
  const testerId = tester.id;
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [blockMessage, setBlockMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [projectName, setProjectName] = useState('');
  const [existingFeedback, setExistingFeedback] = useState<any[]>([]);
  const [typeOpen, setTypeOpen] = useState(false);
  const [severityOpen, setSeverityOpen] = useState(false);
  const [deviceOpen, setDeviceOpen] = useState(false);
  const [browserOpen, setBrowserOpen] = useState(false);
  const [tcReference, setTcReference] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [evidence, setEvidence] = useState<UATEvidence[]>([]);
  const [caseEvidence, setCaseEvidence] = useState<UATEvidence[]>([]);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<Set<string>>(new Set());
  const [screenshotOpen, setScreenshotOpen] = useState(false);
  const [uploaderOpen, setUploaderOpen] = useState(false);
  const [evidenceError, setEvidenceError] = useState('');

  const [sessionEvents, setSessionEvents] = useState<any[]>([]);
  const [eventLoading, setEventLoading] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());

  const [form, setForm] = useState<FormData>({
    feedback_type: 'bug', severity: 'medium', category: '',
    page_url: '', device: 'Desktop', browser: 'Chrome', os_version: '',
    screen_size: '', title: '', description: '',
    steps_to_reproduce: '', expected_result: '', actual_result: '',
  });

  const updateForm = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => { loadData(); }, [assignmentId, testerId, atcId]);

  const loadData = async () => {
    const { data: assign } = await supabase.from('uat_assignments').select('*, uat_jobs!inner(title, project_id)').eq('id', assignmentId).eq('tester_id', testerId).maybeSingle();
    if (!assign) { setBlocked(true); setBlockMessage('Assignment does not exist or does not belong to you.'); setLoading(false); return; }

    const aData = assign as any;
    if (aData.status === 'cancelled' || aData.status === 'expired') { setBlocked(true); setBlockMessage('Assignment has been cancelled or expired.'); setLoading(false); return; }
    if (aData.access_expires_at && new Date(aData.access_expires_at) < new Date() && aData.status !== 'submitted') { setBlocked(true); setBlockMessage('Access has expired.'); setLoading(false); return; }

    if (aData.uat_jobs) {
      setJobTitle(aData.uat_jobs.title || '');
      if (aData.uat_jobs.project_id) {
        const { data: proj } = await supabase.from('uat_projects').select('name').eq('id', aData.uat_jobs.project_id).maybeSingle();
        if (proj) setProjectName((proj as any).name || '');
      }
    }

    const { data: feedback } = await supabase.from('uat_feedback').select('*').eq('assignment_id', assignmentId).eq('tester_id', testerId).order('created_at', { ascending: false });
    setExistingFeedback(feedback || []);

    if (atcId) {
      const { data: atc } = await supabase.from('uat_assignment_test_cases').select('test_case_id').eq('id', atcId).eq('tester_id', testerId).maybeSingle();
      if (atc) {
        const { data: tc } = await supabase.from('uat_test_cases').select('reference, title, expected_result').eq('id', (atc as any).test_case_id).maybeSingle();
        if (tc) {
          setTcReference((tc as any).reference || '');
          setForm((prev) => ({
            ...prev, feedback_type: 'bug',
            title: `[${(tc as any).reference}] ${(tc as any).title || ''}`,
            expected_result: (tc as any).expected_result || '',
            description: `Test Case: ${(tc as any).reference} — ${(tc as any).title || ''}`,
          }));
          const { data: steps } = await supabase.from('uat_test_case_steps').select('step_number, instruction').eq('test_case_id', (atc as any).test_case_id).order('step_number', { ascending: true });
          if (steps && steps.length > 0) {
            const stepsText = steps.map((s: any) => `${s.step_number}. ${s.instruction}`).join('\n');
            setForm((prev) => ({ ...prev, steps_to_reproduce: stepsText }));
          }
          const { data: session } = await supabase.from('uat_sessions').select('id').eq('assignment_id', assignmentId).in('status', ['active', 'paused']).order('created_at', { ascending: false }).limit(1).maybeSingle();
          if (session) setSessionId((session as any).id);
        }

        loadCaseEvidence(atcId);
      }
    }

    loadSessionEvents();
    loadAssignmentEvidence();
    setLoading(false);
  };

  const loadCaseEvidence = async (atcIdParam: string) => {
    setEvidenceLoading(true);
    const { data } = await supabase.from('uat_evidence').select('*').eq('assignment_test_case_id', atcIdParam).in('status', ['uploaded']).order('created_at', { ascending: false });
    const evData = (data || []) as UATEvidence[];
    for (const ev of evData) {
      if (ev.evidence_type === 'screenshot' || ev.evidence_type === 'image') {
        try {
          const { data: signed } = await supabase.storage.from('uat-evidence').createSignedUrl(ev.storage_path, 300);
          if (signed) ev.signedUrl = signed.signedUrl;
        } catch {}
      }
    }
    setCaseEvidence(evData);
    setEvidenceLoading(false);
  };

  const loadAssignmentEvidence = async () => {
    const { data } = await supabase.from('uat_evidence').select('*').eq('assignment_id', assignmentId).eq('tester_id', testerId).eq('feedback_id', null).in('status', ['uploaded']).order('created_at', { ascending: false });
    const evData = (data || []) as UATEvidence[];
    for (const ev of evData) {
      if (ev.evidence_type === 'screenshot' || ev.evidence_type === 'image') {
        try {
          const { data: signed } = await supabase.storage.from('uat-evidence').createSignedUrl(ev.storage_path, 300);
          if (signed) ev.signedUrl = signed.signedUrl;
        } catch {}
      }
    }
    setEvidence(evData);
  };

  const loadSessionEvents = async () => {
    setEventLoading(true);
    const { data: sess } = await supabase.from('uat_sessions')
      .select('id').eq('assignment_id', assignmentId).eq('tester_id', testerId)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (!sess) { setEventLoading(false); return; }

    const { data: events } = await supabase.from('uat_session_events')
      .select('id, event_type, event_timestamp, message, page_path, severity, response_status, duration_ms')
      .eq('session_id', (sess as any).id)
      .in('event_type', ['javascript_error', 'unhandled_rejection', 'api_failure', 'api_slow', 'performance', 'tester_checkpoint'])
      .order('event_timestamp', { ascending: false })
      .limit(50);

    setSessionEvents((events || []) as any[]);
    setEventLoading(false);
  };

  const toggleEventSelection = (id: string) => {
    setSelectedEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleEvidenceSelection = (id: string) => {
    setSelectedEvidenceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 10) next.add(id);
      return next;
    });
  };

  const handleEvidenceUploadComplete = () => {
    if (atcId) loadCaseEvidence(atcId);
    loadAssignmentEvidence();
    setScreenshotOpen(false);
    setUploaderOpen(false);
  };

  const handleRemoveEvidence = async (evidenceId: string) => {
    await supabase.rpc('soft_delete_uat_evidence', { p_evidence_id: evidenceId });
    setSelectedEvidenceIds((prev) => { const next = new Set(prev); next.delete(evidenceId); return next; });
    if (atcId) loadCaseEvidence(atcId);
    loadAssignmentEvidence();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    setSubmitting(true);
    setSubmitError('');
    setEvidenceError('');

    const { data: assign } = await supabase.from('uat_assignments').select('job_id').eq('id', assignmentId).eq('tester_id', testerId).maybeSingle();
    const aData = assign as any;
    const jobId = aData?.job_id;
    const { data: job } = jobId ? await supabase.from('uat_jobs').select('project_id, environment_id').eq('id', jobId).maybeSingle() : { data: null };
    const jData = job as any;

    const payload: any = {
      assignment_id: assignmentId, job_id: jobId,
      project_id: jData?.project_id || null, environment_id: jData?.environment_id || null,
      tester_id: testerId, feedback_type: form.feedback_type, severity: form.severity,
      category: form.category || null, title: form.title, description: form.description,
      steps_to_reproduce: form.steps_to_reproduce || null, expected_result: form.expected_result || null,
      actual_result: form.actual_result || null, page_url: form.page_url || null,
      device: form.device || null, browser: form.browser || null,
      os_version: form.os_version || null, screen_size: form.screen_size || null, status: 'new',
    };

    if (atcId) payload.assignment_test_case_id = atcId;
    if (sessionId) payload.session_id = sessionId;

    const { data: inserted, error } = await supabase.from('uat_feedback').insert(payload).select('id').single();

    if (error) { setSubmitError(error.message || 'Failed to submit.'); setSubmitting(false); return; }

    const feedbackId = (inserted as any)?.id;

    if (selectedEvidenceIds.size > 0 && feedbackId) {
      const ids = Array.from(selectedEvidenceIds);
      const { data: attachResult, error: attachErr } = await supabase.rpc('attach_evidence_to_feedback', {
        p_evidence_ids: ids, p_feedback_id: feedbackId, p_assignment_id: assignmentId,
      });
      if (attachErr) setEvidenceError('Bug submitted but evidence attachment failed: ' + attachErr.message);
    }

    if (selectedEventIds.size > 0 && feedbackId) {
      const fseRows = Array.from(selectedEventIds).map((eventId) => ({
        feedback_id: feedbackId,
        session_event_id: eventId,
      }));
      await supabase.from('uat_feedback_session_events').insert(fseRows);
    }

    await supabase.from('uat_audit_log').insert({
      action: 'Feedback submitted', entity_type: 'uat_feedback', entity_id: assignmentId,
      new_value: { title: form.title, feedback_type: form.feedback_type, severity: form.severity },
    });

    setSubmitting(false);
    setSubmitted(true);
    setExistingFeedback((prev) => [{ ...payload, created_at: new Date().toISOString() }, ...prev]);
    setSelectedEvidenceIds(new Set());
    setEvidence([]);
    setCaseEvidence([]);
  };

  if (loading) {
    return (<div className="flex flex-col items-center justify-center py-24 gap-3"><div className="w-8 h-8 border-[3px] border-[#2878d0]/20 border-t-[#2878d0] rounded-full animate-spin" /></div>);
  }

  if (blocked) {
    return (
      <>
        <UATPortalBreadcrumbs items={[{ label: 'My Tests', href: '/uat/my-tests' }, { label: 'Access Denied' }]} />
        <div className="flex items-center justify-center py-16"><div className="bg-white border border-slate-100 rounded-3xl p-12 shadow-sm text-center max-w-md"><div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-6"><AlertCircle className="w-8 h-8 text-amber-500" /></div><h3 className="text-xl font-bold text-[#17325c] mb-2">Access Denied</h3><p className="text-slate-500 mb-6">{blockMessage}</p><button onClick={() => router.push('/uat/my-tests')} className="px-5 py-2.5 bg-[#2878d0] rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap">Back to My Tests</button></div></div>
      </>
    );
  }

  if (submitted) {
    return (
      <>
        <UATPortalBreadcrumbs items={[{ label: 'My Tests', href: '/uat/my-tests' }, { label: 'Feedback Submitted' }]} />
        <div className="flex items-center justify-center py-16"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-100 rounded-3xl p-12 shadow-sm text-center max-w-md"><div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-6"><CheckCircle className="w-8 h-8 text-emerald-500" /></div><h3 className="text-xl font-bold text-[#17325c] mb-2">Feedback Submitted</h3><p className="text-slate-500 mb-6">Your feedback has been recorded. Staff will review it shortly.</p>{evidenceError && <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">{evidenceError}</div>}<div className="flex flex-col gap-3"><button onClick={() => setSubmitted(false)} className="px-5 py-2.5 bg-[#2878d0] rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap">Submit Another</button><button onClick={() => { if (atcId) router.push(`/uat/my-tests/${assignmentId}`); else router.push('/uat/my-tests'); }} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:text-[#2878d0] cursor-pointer whitespace-nowrap">Back to My Tests</button></div></motion.div></div>
      </>
    );
  }

  const inputClass = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 transition-all";
  const labelClass = "block text-sm font-medium text-[#17325c] mb-1.5";

  const dropdownTrigger = (value: string, isOpen: boolean, toggle: () => void) => (
    <button type="button" onClick={toggle} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 flex items-center justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 transition-all"><span>{value}</span><ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} /></button>
  );

  const dropdownMenu = (isOpen: boolean, options: string[], onSelect: (v: string) => void, close: () => void) => (
    isOpen && (<div className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">{options.map((opt) => (<button key={opt} type="button" onClick={() => { onSelect(opt); close(); }} className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-[#2878d0] transition-colors cursor-pointer first:rounded-t-xl last:rounded-b-xl capitalize">{opt}</button>))}</div>)
  );

  const allAvailableEvidence = atcId ? caseEvidence : evidence;
  const selectedEvidence = allAvailableEvidence.filter((e) => selectedEvidenceIds.has(e.id));

  return (
    <>
      <UATPortalBreadcrumbs items={[{ label: 'My Tests', href: '/uat/my-tests' }, { label: 'Submit Feedback' }]} />
      <div className="mt-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#789265]">Feedback</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-[#17325c]">Submit Feedback</h1>
          {projectName && <p className="text-sm text-[#2878d0] mt-0.5">{projectName} — {jobTitle}</p>}
          {!projectName && jobTitle && <p className="text-sm text-slate-500 mt-0.5">{jobTitle}</p>}
          {tcReference && (<div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-[#edf5ff] rounded-lg"><FileText className="w-3.5 h-3.5 text-[#2878d0]" /><span className="text-xs font-medium text-[#2878d0]">Linked to {tcReference}</span></div>)}
        </div>

        {existingFeedback.length > 0 && (
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm mb-6">
            <h3 className="text-sm font-semibold text-[#17325c] mb-3">Previous Feedback ({existingFeedback.length})</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">{existingFeedback.map((fb: any) => (<div key={fb.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5"><div className="min-w-0"><p className="text-sm text-[#17325c] truncate">{fb.title}</p><p className="text-xs text-slate-400">{fb.feedback_type} — {fb.severity}</p></div><span className="text-xs px-2 py-0.5 rounded-lg capitalize shrink-0 ml-3 bg-sky-50 text-[#2878d0] font-semibold">{fb.status}</span></div>))}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-[#17325c] mb-4">Issue Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="relative"><label className={labelClass}>Feedback Type</label>{dropdownTrigger(form.feedback_type.replace(/\b\w/g, (l: string) => l.toUpperCase()), typeOpen, () => { setTypeOpen(!typeOpen); setSeverityOpen(false); setDeviceOpen(false); setBrowserOpen(false); })}{dropdownMenu(typeOpen, feedbackTypes.map((ft) => ft.label), (v) => { const found = feedbackTypes.find((ft) => ft.label === v); updateForm('feedback_type', found ? found.value : v.toLowerCase()); }, () => setTypeOpen(false))}</div>
                <div className="relative"><label className={labelClass}>Severity</label>{dropdownTrigger(form.severity.charAt(0).toUpperCase() + form.severity.slice(1), severityOpen, () => { setSeverityOpen(!severityOpen); setTypeOpen(false); setDeviceOpen(false); setBrowserOpen(false); })}{dropdownMenu(severityOpen, severityLevels.map((s) => s.charAt(0).toUpperCase() + s.slice(1)), (v) => updateForm('severity', v.toLowerCase()), () => setSeverityOpen(false))}</div>
              </div>
              <div className="mb-4"><label className={labelClass}>Title <span className="text-red-500">*</span></label><input type="text" value={form.title} onChange={(e) => updateForm('title', e.target.value)} required placeholder="Brief summary of the issue..." className={inputClass} /></div>
              <div className="mb-4"><label className={labelClass}>Description <span className="text-red-500">*</span></label><textarea value={form.description} onChange={(e) => updateForm('description', e.target.value)} required placeholder="Describe the issue in detail..." rows={4} className={inputClass + ' resize-none'} /></div>
              <div><label className={labelClass}>Category</label><input type="text" value={form.category} onChange={(e) => updateForm('category', e.target.value)} placeholder="e.g. Navigation, Checkout, Dashboard..." className={inputClass} /></div>
            </div>

            <div className="p-6 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-[#17325c] mb-4">Reproduction Details</h3>
              <div className="mb-4"><label className={labelClass}>Steps to Reproduce</label><textarea value={form.steps_to_reproduce} onChange={(e) => updateForm('steps_to_reproduce', e.target.value)} placeholder="Step-by-step instructions..." rows={3} className={inputClass + ' resize-none'} /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelClass}>Expected Result</label><textarea value={form.expected_result} onChange={(e) => updateForm('expected_result', e.target.value)} placeholder="What should happen..." rows={2} className={inputClass + ' resize-none'} /></div>
                <div><label className={labelClass}>Actual Result</label><textarea value={form.actual_result} onChange={(e) => updateForm('actual_result', e.target.value)} placeholder="What actually happened..." rows={2} className={inputClass + ' resize-none'} /></div>
              </div>
            </div>

            <div className="p-6 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-[#17325c] mb-4">Environment Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div><label className={labelClass}>Page URL</label><input type="url" value={form.page_url} onChange={(e) => updateForm('page_url', e.target.value)} placeholder="https://..." className={inputClass} /></div>
                <div className="relative"><label className={labelClass}>Device</label>{dropdownTrigger(form.device, deviceOpen, () => { setDeviceOpen(!deviceOpen); setTypeOpen(false); setSeverityOpen(false); setBrowserOpen(false); })}{dropdownMenu(deviceOpen, deviceOptions, (v) => updateForm('device', v), () => setDeviceOpen(false))}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative"><label className={labelClass}>Browser</label>{dropdownTrigger(form.browser, browserOpen, () => { setBrowserOpen(!browserOpen); setTypeOpen(false); setSeverityOpen(false); setDeviceOpen(false); })}{dropdownMenu(browserOpen, browserOptions, (v) => updateForm('browser', v), () => setBrowserOpen(false))}</div>
                <div><label className={labelClass}>OS Version</label><input type="text" value={form.os_version} onChange={(e) => updateForm('os_version', e.target.value)} placeholder="e.g. Windows 11..." className={inputClass} /></div>
                <div><label className={labelClass}>Screen Size</label><input type="text" value={form.screen_size} onChange={(e) => updateForm('screen_size', e.target.value)} placeholder="e.g. 1920x1080..." className={inputClass} /></div>
              </div>
            </div>

            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[#17325c]">Evidence</h3>
                <span className="text-xs text-slate-400">{selectedEvidenceIds.size} selected</span>
              </div>

              {allAvailableEvidence.length > 0 && (
                <div className="space-y-2 mb-4">
                  {allAvailableEvidence.map((ev) => (
                    <label key={ev.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedEvidenceIds.has(ev.id) ? 'border-[#2878d0]/30 bg-[#edf5ff]' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <input type="checkbox" checked={selectedEvidenceIds.has(ev.id)} onChange={() => toggleEvidenceSelection(ev.id)}
                        className="w-4 h-4 rounded border-slate-300 text-[#2878d0] focus:ring-[#2878d0]" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">{ev.caption || ev.original_filename}</p>
                        <p className="text-[11px] text-slate-400">{ev.mime_type}</p>
                      </div>
                      {ev.evidence_type === 'screenshot' || ev.evidence_type === 'image' ? (
                        <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                          {ev.signedUrl && <img src={ev.signedUrl} alt="" className="w-full h-full object-cover" />}
                        </div>
                      ) : (
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </label>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setScreenshotOpen(true)}
                  className="flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer whitespace-nowrap transition-colors">
                  <Camera className="w-3.5 h-3.5" /> Screenshot
                </button>
                <button type="button" onClick={() => setUploaderOpen(!uploaderOpen)}
                  className="flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer whitespace-nowrap transition-colors">
                  <Paperclip className="w-3.5 h-3.5" /> Upload
                </button>
              </div>

              {uploaderOpen && (
                <div className="mt-3">
                  <UATEvidenceUploader assignmentId={assignmentId} assignmentTestCaseId={atcId} sessionId={sessionId} existingEvidence={[]} onUploadComplete={handleEvidenceUploadComplete} onRemove={handleRemoveEvidence} />
                </div>
              )}

              {selectedEvidence.length > 0 && (
                <div className="mt-3 p-3 bg-sky-50 border border-sky-100 rounded-xl">
                  <p className="text-xs text-sky-700 font-medium mb-0.5">Selected evidence ({selectedEvidence.length})</p>
                  <p className="text-[11px] text-sky-600">These files will be attached when you submit this bug report.</p>
                </div>
              )}

              <p className="text-xs text-slate-400 mt-3">Max 10 files. Screenshots/images max 10 MB, documents max 15 MB.</p>
            </div>

            {sessionEvents.length > 0 && (
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-[#17325c] flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-[#2878d0]" /> Session Events
                  </h3>
                  <span className="text-xs text-slate-400">{selectedEventIds.size} selected</span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {sessionEvents.map((evt: any) => {
                    const config = (UAT_MONITORING_EVENT_CONFIG as any)[evt.event_type];
                    return (
                      <label key={evt.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedEventIds.has(evt.id) ? 'border-[#2878d0]/30 bg-[#edf5ff]' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                        <input type="checkbox" checked={selectedEventIds.has(evt.id)} onChange={() => toggleEventSelection(evt.id)}
                          className="w-4 h-4 rounded border-slate-300 text-[#2878d0] focus:ring-[#2878d0]" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700">{config?.label || evt.event_type}</p>
                          {evt.message && <p className="text-[11px] text-slate-500 truncate">{evt.message}</p>}
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(evt.event_timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </label>
                    );
                  })}
                </div>

                <p className="text-xs text-slate-400 mt-3">Select technical events to attach to this bug report.</p>
              </div>
            )}

            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
              {submitError && (<div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2"><AlertCircle className="w-4 h-4 text-red-500 shrink-0" /><p className="text-sm text-red-600">{submitError}</p></div>)}
              {evidenceError && (<div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">{evidenceError}</div>)}
              <button type="submit" disabled={submitting || !form.title.trim() || !form.description.trim()}
                className="px-6 py-3 bg-[#2878d0] hover:bg-[#1e68b9] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-white transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Submit Feedback{selectedEvidenceIds.size > 0 ? ` (with ${selectedEvidenceIds.size} attachment(s))` : ''}
              </button>
            </div>
          </div>
        </form>
      </div>

      {screenshotOpen && (
        <UATScreenshotCapture assignmentId={assignmentId} assignmentTestCaseId={atcId} sessionId={sessionId} onUploadComplete={handleEvidenceUploadComplete} onClose={() => setScreenshotOpen(false)} />
      )}
    </>
  );
}

export default function FeedbackForm({ assignmentId }: { assignmentId: string }) {
  return (
    <Suspense fallback={<div className="flex flex-col items-center justify-center py-24"><div className="w-8 h-8 border-[3px] border-[#2878d0]/20 border-t-[#2878d0] rounded-full animate-spin" /></div>}>
      <FeedbackFormInner assignmentId={assignmentId} />
    </Suspense>
  );
}