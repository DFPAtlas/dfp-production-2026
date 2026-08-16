'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, AlertCircle, Image, FileText, Download, ShieldAlert, Eye, CheckCircle, X } from 'lucide-react';
import { UATEvidence } from '@/components/uat/evidence/evidence-types';
import UATEvidenceStatusBadge from '@/components/uat/evidence/UATEvidenceStatusBadge';

interface UATEvidenceReviewPanelProps {
  assignmentId?: string;
  feedbackId?: string;
  testerId?: string;
}

export default function UATEvidenceReviewPanel({ assignmentId, feedbackId, testerId }: UATEvidenceReviewPanelProps) {
  const [evidence, setEvidence] = useState<UATEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [quarantineReason, setQuarantineReason] = useState('');
  const [showQuarantine, setShowQuarantine] = useState<string | null>(null);

  useEffect(() => { loadEvidence(); }, [assignmentId, feedbackId, testerId]);

  const loadEvidence = async () => {
    setLoading(true);
    setError('');
    let query = supabase.from('uat_evidence').select('*').order('created_at', { ascending: false });

    if (feedbackId) query = query.eq('feedback_id', feedbackId);
    else if (assignmentId) query = query.eq('assignment_id', assignmentId);
    if (testerId) query = query.eq('tester_id', testerId);

    const { data, error: queryErr } = await query;
    if (queryErr) { setError(queryErr.message); setLoading(false); return; }

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
    setLoading(false);
  };

  const handleDownload = async (ev: UATEvidence) => {
    const { data } = await supabase.storage.from('uat-evidence').createSignedUrl(ev.storage_path, 120);
    if (data?.signedUrl) {
      const a = document.createElement('a'); a.href = data.signedUrl; a.download = ev.original_filename; a.click();
    }
  };

  const handleQuarantine = async (evidenceId: string) => {
    if (!quarantineReason.trim()) return;
    setActionLoading(evidenceId);
    const { error } = await supabase.from('uat_evidence').update({ status: 'quarantined', tester_notes: quarantineReason, updated_at: new Date().toISOString() }).eq('id', evidenceId);
    if (error) { setActionError(error.message); setActionLoading(null); return; }
    setActionLoading(null);
    setShowQuarantine(null);
    setQuarantineReason('');
    loadEvidence();
  };

  const handleStatusChange = async (evidenceId: string, newStatus: string) => {
    setActionLoading(evidenceId);
    const { error } = await supabase.from('uat_evidence').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', evidenceId);
    if (error) { setActionError(error.message); }
    setActionLoading(null);
    loadEvidence();
  };

  if (loading) {
    return (<div className="p-8 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>);
  }

  if (error) {
    return (<div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>);
  }

  return (
    <div className="space-y-3">
      {actionError && (<div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{actionError}<button onClick={() => setActionError('')} className="ml-auto text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button></div>)}

      {evidence.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3"><Image className="w-5 h-5 text-slate-300" /></div>
          <p className="text-xs text-slate-400">No evidence attached.</p>
        </div>
      ) : (
        evidence.map((ev) => (
          <div key={ev.id} className="bg-white border border-slate-100 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <button onClick={() => setPreviewId(previewId === ev.id ? null : ev.id)}
                className="w-16 h-16 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer">
                {ev.evidence_type === 'screenshot' || ev.evidence_type === 'image' ? (
                  ev.signedUrl ? <img src={ev.signedUrl} alt="" className="w-full h-full object-cover" /> : <Image className="w-6 h-6 text-slate-300" />
                ) : <FileText className="w-6 h-6 text-slate-300" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-slate-700 truncate">{ev.caption || ev.original_filename}</p>
                  <UATEvidenceStatusBadge status={ev.status} />
                </div>
                <p className="text-xs text-slate-400">{ev.original_filename} · {(ev.file_size_bytes / 1024).toFixed(1)} KB · {ev.mime_type}</p>
                {ev.browser_name && <p className="text-[11px] text-slate-400 mt-0.5">{ev.browser_name} · {ev.operating_system} · {ev.viewport_width}×{ev.viewport_height}</p>}
                <p className="text-[11px] text-slate-400">{new Date(ev.created_at).toLocaleString('en-GB')}</p>
              </div>
            </div>

            {previewId === ev.id && (ev.evidence_type === 'screenshot' || ev.evidence_type === 'image') && ev.signedUrl && (
              <div className="rounded-xl overflow-hidden bg-slate-100"><img src={ev.signedUrl} alt={ev.original_filename} className="w-full max-h-[400px] object-contain" /></div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => handleDownload(ev)} disabled={actionLoading === ev.id}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-600 cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1">
                <Download className="w-3 h-3" /> Download
              </button>

              {ev.status !== 'quarantined' && ev.status !== 'rejected' && (
                <button onClick={() => setShowQuarantine(ev.id)}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 rounded-lg text-xs font-semibold text-amber-700 cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Quarantine
                </button>
              )}

              {ev.status === 'quarantined' && (
                <button onClick={() => handleStatusChange(ev.id, 'uploaded')} disabled={actionLoading === ev.id}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-xs font-semibold text-emerald-700 cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1">
                  {actionLoading === ev.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Restore
                </button>
              )}

              {ev.status !== 'rejected' && (
                <button onClick={() => handleStatusChange(ev.id, 'rejected')} disabled={actionLoading === ev.id}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-semibold text-red-600 cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1">
                  <X className="w-3 h-3" /> Reject
                </button>
              )}
            </div>

            {showQuarantine === ev.id && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 space-y-2">
                <p className="text-xs font-medium text-amber-800">Quarantine this evidence?</p>
                <textarea value={quarantineReason} onChange={(e) => setQuarantineReason(e.target.value)}
                  placeholder="Reason for quarantine..."
                  rows={2} className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none" />
                <div className="flex gap-2">
                  <button onClick={() => handleQuarantine(ev.id)} disabled={!quarantineReason.trim() || actionLoading === ev.id}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 rounded-lg text-xs font-semibold text-white cursor-pointer whitespace-nowrap">
                    {actionLoading === ev.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm'}
                  </button>
                  <button onClick={() => { setShowQuarantine(null); setQuarantineReason(''); }}
                    className="px-3 py-1.5 bg-amber-100 rounded-lg text-xs font-semibold text-amber-700 cursor-pointer whitespace-nowrap">Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}