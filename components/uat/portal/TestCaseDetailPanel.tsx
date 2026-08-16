'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertCircle, Loader2, CheckCircle, XCircle, SkipForward, AlertTriangle, Bug, Camera, Paperclip, Image as ImageIcon } from 'lucide-react';
import UATEvidenceList from '@/components/uat/evidence/UATEvidenceList';
import UATScreenshotCapture from '@/components/uat/evidence/UATScreenshotCapture';
import UATEvidenceUploader from '@/components/uat/evidence/UATEvidenceUploader';
import { UATEvidence } from '@/components/uat/evidence/evidence-types';

interface CaseDetail {
  id: string;
  test_case_id: string;
  reference: string;
  title: string;
  description: string | null;
  preconditions: string | null;
  expected_result: string;
  priority: string;
  status: string;
  steps: { step_number: number; instruction: string; expected_result: string | null }[];
  actual_result: string | null;
  tester_notes: string | null;
  blocker_reason: string | null;
}

interface TestCaseDetailPanelProps {
  assignmentTestCaseId: string | null;
  sessionId: string | null;
  sessionStatus: string | null;
  assignmentId: string;
  onStatusChange: () => void;
  onReportBug: (atcId: string) => void;
}

export default function TestCaseDetailPanel({
  assignmentTestCaseId, sessionId, sessionStatus, assignmentId, onStatusChange, onReportBug,
}: TestCaseDetailPanelProps) {
  const [detail, setDetail] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [testerNotes, setTesterNotes] = useState('');
  const [actualResult, setActualResult] = useState('');
  const [blockerReason, setBlockerReason] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const [evidence, setEvidence] = useState<UATEvidence[]>([]);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [screenshotOpen, setScreenshotOpen] = useState(false);
  const [uploaderOpen, setUploaderOpen] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!assignmentTestCaseId) { setDetail(null); setEvidence([]); return; }
    loadDetail();
    loadEvidence();
  }, [assignmentTestCaseId]);

  const loadDetail = async () => {
    setLoading(true);
    const { data: atc } = await supabase.from('uat_assignment_test_cases').select('*').eq('id', assignmentTestCaseId).maybeSingle();
    if (!atc) { setDetail(null); setLoading(false); return; }

    const { data: tc } = await supabase.from('uat_test_cases').select('*').eq('id', (atc as any).test_case_id).maybeSingle();
    const { data: steps } = await supabase.from('uat_test_case_steps').select('*').eq('test_case_id', (atc as any).test_case_id).order('step_number', { ascending: true });

    let resultData: any = null;
    if (sessionId) {
      const { data: res } = await supabase.from('uat_test_case_results')
        .select('*')
        .eq('assignment_test_case_id', assignmentTestCaseId)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      resultData = res;
    }

    setDetail({
      id: (atc as any).id,
      test_case_id: (atc as any).test_case_id,
      reference: (tc as any)?.reference || 'N/A',
      title: (tc as any)?.title || (tc as any)?.reference || 'Untitled',
      description: (tc as any)?.description || null,
      preconditions: (tc as any)?.preconditions || null,
      expected_result: (tc as any)?.expected_result || 'No expected result defined.',
      priority: (tc as any)?.priority || 'medium',
      status: (atc as any).status,
      steps: (steps || []).map((s: any) => ({
        step_number: s.step_number,
        instruction: s.instruction,
        expected_result: s.expected_result || null,
      })),
      actual_result: resultData?.actual_result || null,
      tester_notes: resultData?.tester_notes || null,
      blocker_reason: resultData?.blocker_reason || null,
    });

    setTesterNotes(resultData?.tester_notes || '');
    setActualResult(resultData?.actual_result || '');
    setBlockerReason(resultData?.blocker_reason || '');
    setLoading(false);
  };

  const loadEvidence = async () => {
    if (!assignmentTestCaseId) return;
    setEvidenceLoading(true);
    const { data } = await supabase.from('uat_evidence')
      .select('*')
      .eq('assignment_test_case_id', assignmentTestCaseId)
      .in('status', ['uploaded', 'attached'])
      .order('created_at', { ascending: false });
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
    setEvidenceLoading(false);
  };

  const handleEvidenceUploadComplete = () => {
    loadEvidence();
    setScreenshotOpen(false);
    setUploaderOpen(false);
  };

  const handleRemoveEvidence = async (evidenceId: string) => {
    const { data } = await supabase.rpc('soft_delete_uat_evidence', { p_evidence_id: evidenceId });
    const result = data as any;
    if (result?.success) loadEvidence();
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!assignmentTestCaseId || !sessionId) return;
    if (newStatus === 'failed' && !actualResult.trim()) {
      setUpdateError('Please enter the actual result before marking as failed.');
      return;
    }
    if (newStatus === 'blocked' && !blockerReason.trim()) {
      setUpdateError('Please enter a blocker reason before marking as blocked.');
      return;
    }

    setUpdating(true);
    setUpdateError('');

    const { data, error } = await supabase.rpc('update_uat_test_case_result', {
      p_assignment_test_case_id: assignmentTestCaseId,
      p_session_id: sessionId,
      p_status: newStatus,
      p_actual_result: actualResult || null,
      p_tester_notes: testerNotes || null,
      p_blocker_reason: blockerReason || null,
    });

    setUpdating(false);

    if (error) {
      setUpdateError(error.message || 'Failed to update.');
      return;
    }

    const result = data as any;
    if (!result?.success) {
      setUpdateError(result?.message || 'Failed to update.');
      return;
    }

    setDetail((prev) => prev ? { ...prev, status: newStatus, actual_result: actualResult, tester_notes: testerNotes, blocker_reason: blockerReason } : null);
    onStatusChange();
    setSaveState('saved');
    setTimeout(() => { if (mountedRef.current) setSaveState('idle'); }, 1500);
  };

  const saveNotes = useCallback(() => {
    if (!assignmentTestCaseId || !sessionId) return;
    setSaveState('saving');
    supabase.rpc('update_uat_test_case_result', {
      p_assignment_test_case_id: assignmentTestCaseId,
      p_session_id: sessionId,
      p_status: detail?.status || 'in_progress',
      p_actual_result: actualResult || null,
      p_tester_notes: testerNotes || null,
      p_blocker_reason: blockerReason || null,
    }).then(({ error, data }) => {
      if (!mountedRef.current) return;
      const result = data as any;
      if (error || !result?.success) {
        setSaveState('error');
      } else {
        setSaveState('saved');
        setTimeout(() => { if (mountedRef.current) setSaveState('idle'); }, 1500);
      }
    });
  }, [assignmentTestCaseId, sessionId, detail?.status, actualResult, testerNotes, blockerReason]);

  const debouncedSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(saveNotes, 1500);
  }, [saveNotes]);

  useEffect(() => {
    if (!detail || !sessionId) return;
    debouncedSave();
  }, [testerNotes, actualResult]);

  const canModify = sessionId && sessionStatus === 'active';
  const isFinal = detail?.status && ['passed', 'failed', 'blocked', 'skipped'].includes(detail.status);

  if (!assignmentTestCaseId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
            <i className="ri-file-list-3-line text-xl text-slate-300 w-7 h-7 flex items-center justify-center" />
          </div>
          <p className="text-slate-400 text-sm">Select a test case to view details</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-[#2878d0]/20 border-t-[#2878d0] rounded-full animate-spin" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-8">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Failed to load test case details.</p>
        </div>
      </div>
    );
  }

  const priorityLabel = detail.priority.charAt(0).toUpperCase() + detail.priority.slice(1);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-mono font-bold text-[#2878d0] bg-[#edf5ff] px-2 py-0.5 rounded-md">{detail.reference}</span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
            detail.priority === 'critical' ? 'text-red-600 bg-red-50' :
            detail.priority === 'high' ? 'text-orange-600 bg-orange-50' :
            detail.priority === 'medium' ? 'text-amber-600 bg-amber-50' :
            'text-slate-500 bg-slate-100'
          }`}>{priorityLabel}</span>
        </div>
        <h2 className="text-base font-bold text-[#17325c] leading-snug">{detail.title}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {detail.description && (
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Description</h4>
            <p className="text-sm text-slate-600 leading-relaxed">{detail.description}</p>
          </div>
        )}

        {detail.preconditions && (
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Preconditions</h4>
            <p className="text-sm text-slate-600 leading-relaxed">{detail.preconditions}</p>
          </div>
        )}

        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Steps</h4>
          <ol className="space-y-2">
            {detail.steps.map((step) => (
              <li key={step.step_number} className="flex gap-3 p-2.5 bg-slate-50 rounded-xl">
                <span className="w-6 h-6 rounded-full bg-[#2878d0] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{step.step_number}</span>
                <div className="min-w-0">
                  <p className="text-sm text-slate-700 leading-relaxed">{step.instruction}</p>
                  {step.expected_result && (
                    <p className="text-xs text-slate-400 mt-1">Expected: {step.expected_result}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Expected Result</h4>
          <p className="text-sm text-emerald-700 bg-emerald-50 rounded-xl p-3 leading-relaxed">{detail.expected_result}</p>
        </div>

        {canModify && (
          <>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Actual Result {!isFinal && <span className="text-red-400">* for Fail</span>}
              </label>
              <textarea
                value={actualResult}
                onChange={(e) => { setActualResult(e.target.value); debouncedSave(); }}
                placeholder="Describe what actually happened..."
                rows={3}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 resize-none transition-all"
                disabled={isFinal}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Tester Notes</label>
              <textarea
                value={testerNotes}
                onChange={(e) => { setTesterNotes(e.target.value); debouncedSave(); }}
                placeholder="Additional observations, notes..."
                rows={2}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 resize-none transition-all"
                disabled={isFinal}
              />
            </div>

            {detail.status === 'blocked' && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Blocker Reason <span className="text-red-400">* required</span>
                </label>
                <textarea
                  value={blockerReason}
                  onChange={(e) => setBlockerReason(e.target.value)}
                  placeholder="Why is this test case blocked?"
                  rows={2}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 resize-none transition-all"
                />
              </div>
            )}

            <div className="flex items-center gap-1.5 text-xs">
              {saveState === 'saving' && <span className="text-slate-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Saving...</span>}
              {saveState === 'saved' && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Saved</span>}
              {saveState === 'error' && <span className="text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Save failed</span>}
            </div>
          </>
        )}

        {updateError && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-600">{updateError}</p>
          </div>
        )}

        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Evidence</h4>
            {evidence.length > 0 && (
              <span className="text-[11px] font-semibold text-slate-400">{evidence.length} item(s)</span>
            )}
          </div>

          <UATEvidenceList
            evidence={evidence}
            loading={evidenceLoading}
            onRemove={handleRemoveEvidence}
            showRemove
            addLabel="Capture or Upload"
          />

          {canModify && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button onClick={() => setScreenshotOpen(true)}
                className="flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer whitespace-nowrap transition-colors">
                <Camera className="w-3.5 h-3.5" /> Screenshot
              </button>
              <button onClick={() => setUploaderOpen(!uploaderOpen)}
                className="flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer whitespace-nowrap transition-colors">
                <Paperclip className="w-3.5 h-3.5" /> Upload File
              </button>
            </div>
          )}

          {uploaderOpen && (
            <div className="mt-3">
              <UATEvidenceUploader
                assignmentId={assignmentId}
                assignmentTestCaseId={assignmentTestCaseId}
                sessionId={sessionId}
                existingEvidence={[]}
                onUploadComplete={handleEvidenceUploadComplete}
                onRemove={handleRemoveEvidence}
              />
            </div>
          )}

          {(detail.status === 'failed' || detail.status === 'blocked') && evidence.length === 0 && canModify && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">We strongly recommend attaching evidence (screenshots) for failed or blocked test cases.</p>
            </div>
          )}
        </div>
      </div>

      {canModify && (
        <div className="p-4 border-t border-slate-100 shrink-0 bg-slate-50/50">
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => handleUpdateStatus('passed')} disabled={updating}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap">
              {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Pass
            </button>
            <button onClick={() => handleUpdateStatus('failed')} disabled={updating}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap">
              {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />} Fail
            </button>
            <button onClick={() => handleUpdateStatus('blocked')} disabled={updating}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap">
              {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />} Block
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button onClick={() => handleUpdateStatus('skipped')} disabled={updating}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-400 hover:bg-slate-500 disabled:opacity-50 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap">
              {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SkipForward className="w-3.5 h-3.5" />} Skip
            </button>
            <button onClick={() => onReportBug(detail.id)} disabled={updating}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-[#2878d0] hover:bg-[#1e68b9] disabled:opacity-50 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap">
              <Bug className="w-3.5 h-3.5" /> Report Bug
            </button>
          </div>
        </div>
      )}

      {screenshotOpen && (
        <UATScreenshotCapture
          assignmentId={assignmentId}
          assignmentTestCaseId={assignmentTestCaseId}
          sessionId={sessionId}
          onUploadComplete={handleEvidenceUploadComplete}
          onClose={() => setScreenshotOpen(false)}
        />
      )}
    </div>
  );
}