'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from '@/components/motion';
import { X, CheckCircle2, RotateCcw, MessageSquare, ShieldCheck, Monitor, Smartphone, FileText, Calendar, User, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ValidationResult } from './email-validator';
import { EditorDocument, EmailTemplate } from './editor-types';
import { renderDocumentToHtml } from './editor-utils';

interface ReviewAction {
  id: string;
  action: string;
  note: string;
  created_by: string;
  created_at: string;
}

interface ReviewPanelProps {
  open: boolean;
  onClose: () => void;
  template: EmailTemplate;
  document: EditorDocument;
  subject: string;
  previewText: string;
  validation: ValidationResult | null;
  currentUserId: string | null;
}

export default function ReviewPanel({ open, onClose, template, document, subject, previewText, validation, currentUserId }: ReviewPanelProps) {
  const [reviews, setReviews] = useState<ReviewAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [note, setNote] = useState('');
  const [reviewTab, setReviewTab] = useState<'preview' | 'history'>('preview');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !template.id) return;
    const fetchReviews = async () => {
      setLoading(true);
      const { data } = await supabase.from('email_template_reviews').select('*').eq('template_id', template.id).order('created_at', { ascending: false });
      if (data) setReviews(data as ReviewAction[]);
      setLoading(false);
    };
    fetchReviews();
  }, [open, template.id]);

  const handleAction = useCallback(async (action: string) => {
    if (!currentUserId) return;
    setActionLoading(true);
    setError('');

    if (action === 'request_review' && validation && validation.errors.length > 0) {
      setError('Cannot request review with outstanding errors. Fix all errors first.');
      setActionLoading(false);
      return;
    }

    if ((action === 'request_changes' || action === 'approved') && !note.trim()) {
      setError('Please provide a note with this action.');
      setActionLoading(false);
      return;
    }

    const { data: profileData } = await supabase.from('admin_profiles').select('organisation_id').eq('id', currentUserId).maybeSingle();

    const newStatus = action === 'request_review' ? 'ready_for_review'
      : action === 'request_changes' ? 'changes_requested'
      : action === 'approved' ? 'approved'
      : action === 'activated' ? 'active'
      : action === 'archived' ? 'archived'
      : action === 'restored' ? 'draft'
      : template.status;

    await supabase.from('email_template_reviews').insert({
      template_id: template.id,
      action,
      note: note.trim() || null,
      created_by: currentUserId,
      organisation_id: profileData?.organisation_id || null,
    });

    if (action === 'request_review' || action === 'approved' || action === 'activated') {
      const { data: existing } = await supabase.from('email_template_versions').select('version_number').eq('template_id', template.id).order('version_number', { ascending: false }).limit(1);
      const nextVersion = (existing && existing.length > 0 ? (existing[0].version_number || 0) : (template.revision || 1)) + 1;
      await supabase.from('email_template_versions').insert({
        template_id: template.id,
        version_number: nextVersion,
        version_type: action === 'request_review' ? 'review_submission' : action === 'approved' ? 'approved' : 'activated',
        editor_document: document as unknown as Record<string, unknown>,
        rendered_html: renderDocumentToHtml(document),
        subject: subject || null,
        preview_text: previewText || null,
        brand_kit_id: template.brand_kit_id,
        internal_note: note.trim() || null,
        status_at_creation: newStatus,
        created_by: currentUserId,
        organisation_id: profileData?.organisation_id || null,
      });
      await supabase.from('email_templates').update({ revision: nextVersion }).eq('id', template.id);
    }

    const updates: Record<string, unknown> = { status: newStatus };
    if (action === 'request_review') {
      updates.submitted_for_review_at = new Date().toISOString();
      updates.submitted_by = currentUserId;
    }

    await supabase.from('email_templates').update(updates).eq('id', template.id);

    const { data: updated } = await supabase.from('email_template_reviews').select('*').eq('template_id', template.id).order('created_at', { ascending: false });
    if (updated) setReviews(updated as ReviewAction[]);

    setNote('');
    setActionLoading(false);
  }, [currentUserId, template.id, template.status, note, validation]);

  const htmlContent = renderDocumentToHtml(document);

  if (!open) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-end overflow-y-auto"
      onClick={onClose}
    >
      <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }}
        className="w-full max-w-xl h-full bg-[#0f0f13] border-l border-[rgba(255,255,255,0.06)] shadow-2xl flex flex-col"
        onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
          <div>
            <h3 className="text-base font-bold text-white">Review & Approval</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">{template.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex border-b border-[rgba(255,255,255,0.06)]">
          <button onClick={() => setReviewTab('preview')}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${reviewTab === 'preview' ? 'text-[#06B6D4] border-b-2 border-[#06B6D4]' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Eye className="w-3.5 h-3.5 inline mr-1.5" />
            Preview
          </button>
          <button onClick={() => setReviewTab('history')}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${reviewTab === 'history' ? 'text-[#06B6D4] border-b-2 border-[#06B6D4]' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <MessageSquare className="w-3.5 h-3.5 inline mr-1.5" />
            History
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {reviewTab === 'preview' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 p-3 border-b border-[rgba(255,255,255,0.06)]">
                <button onClick={() => setPreviewMode('desktop')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${previewMode === 'desktop' ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'text-slate-400 hover:text-white'}`}
                >
                  <Monitor className="w-3.5 h-3.5 inline mr-1" />
                  Desktop
                </button>
                <button onClick={() => setPreviewMode('mobile')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${previewMode === 'mobile' ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'text-slate-400 hover:text-white'}`}
                >
                  <Smartphone className="w-3.5 h-3.5 inline mr-1" />
                  Mobile
                </button>
              </div>

              <div className="p-4">
                <div className="mb-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-medium">Subject:</span>
                    <span className="text-xs text-white">{subject || '(not set)'}</span>
                  </div>
                  {previewText && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-medium">Preview:</span>
                      <span className="text-xs text-slate-400">{previewText}</span>
                    </div>
                  )}
                </div>
                <div className={`bg-slate-200 rounded-xl overflow-hidden shadow-lg mx-auto ${previewMode === 'mobile' ? 'max-w-[375px]' : 'max-w-[620px]'}`}>
                  <iframe srcDoc={htmlContent} className="w-full h-[500px]" title="Review Preview" sandbox="allow-same-origin" />
                </div>
              </div>
            </div>
          )}

          {reviewTab === 'history' && (
            <div className="p-4 space-y-3">
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs text-slate-500">Loading review history...</p>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-medium text-white mb-1">No review history</p>
                  <p className="text-xs text-slate-500">Actions will appear here as the template goes through review.</p>
                </div>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <ActionIcon action={r.action} />
                      <span className="text-xs font-semibold text-white">{actionLabel(r.action)}</span>
                      <span className="text-[10px] text-slate-600 ml-auto">{new Date(r.created_at).toLocaleString()}</span>
                    </div>
                    {r.note && <p className="text-[11px] text-slate-400">{r.note}</p>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="border-t border-[rgba(255,255,255,0.06)] p-4 space-y-3">
          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}

          {(template.status === 'draft' || template.status === 'changes_requested') && (
            <>
              {validation && (
                <div className="flex items-center gap-2 text-[10px]">
                  <ShieldCheck className={`w-3.5 h-3.5 ${validation.errors.length > 0 ? 'text-red-400' : 'text-emerald-400'}`} />
                  <span className="text-slate-500">
                    {validation.errors.length > 0 ? `${validation.errors.length} error(s) must be resolved` : 'Ready for review'}
                  </span>
                </div>
              )}
              <div>
                <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 500))}
                  placeholder="Add an internal note (optional for review request, required for changes)..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 transition-all resize-y"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleAction('request_review')} disabled={actionLoading || (!!validation && validation.errors.length > 0)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#06B6D4] text-white rounded-lg text-xs font-semibold hover:bg-[#0891B2] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer whitespace-nowrap"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Request Review
                </button>
              </div>
            </>
          )}

          {template.status === 'ready_for_review' && (
            <>
              <div>
                <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 500))}
                  placeholder="Required: Add a note for this action..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 transition-all resize-y"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleAction('request_changes')} disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs font-semibold hover:bg-amber-500/20 transition-all cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Request Changes
                </button>
                <button onClick={() => handleAction('approved')} disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold hover:bg-emerald-500/20 transition-all cursor-pointer whitespace-nowrap"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approve
                </button>
              </div>
            </>
          )}

          {template.status === 'approved' && (
            <div className="flex gap-2">
              <button onClick={() => handleAction('activated')} disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500 text-white rounded-lg text-xs font-semibold hover:bg-emerald-600 transition-all cursor-pointer whitespace-nowrap"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Activate
              </button>
              <button onClick={() => handleAction('archived')} disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] text-slate-400 rounded-lg text-xs font-semibold hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer whitespace-nowrap"
              >
                Archive
              </button>
            </div>
          )}

          {template.status === 'active' && (
            <button onClick={() => handleAction('archived')} disabled={actionLoading}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] text-slate-400 rounded-lg text-xs font-semibold hover:text-red-400 transition-all cursor-pointer whitespace-nowrap"
            >
              Archive Template
            </button>
          )}

          {template.status === 'archived' && (
            <button onClick={() => handleAction('restored')} disabled={actionLoading}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] text-slate-400 rounded-lg text-xs font-semibold hover:text-emerald-400 transition-all cursor-pointer whitespace-nowrap"
            >
              Restore Template
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ActionIcon({ action }: { action: string }) {
  const iconMap: Record<string, typeof CheckCircle2> = {
    request_review: ShieldCheck,
    request_changes: RotateCcw,
    approved: CheckCircle2,
    activated: CheckCircle2,
    deactivated: RotateCcw,
    archived: FileText,
    restored: RotateCcw,
  };
  const Icon = iconMap[action] || MessageSquare;
  const colorMap: Record<string, string> = {
    request_review: 'text-blue-400',
    request_changes: 'text-amber-400',
    approved: 'text-emerald-400',
    activated: 'text-emerald-400',
    deactivated: 'text-amber-400',
    archived: 'text-slate-400',
    restored: 'text-blue-400',
  };
  return <Icon className={`w-4 h-4 ${colorMap[action] || 'text-slate-400'}`} />;
}

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    request_review: 'Review requested',
    request_changes: 'Changes requested',
    approved: 'Approved',
    activated: 'Activated',
    deactivated: 'Deactivated',
    archived: 'Archived',
    restored: 'Restored',
    blocked: 'Blocked',
  };
  return map[action] || action;
}
