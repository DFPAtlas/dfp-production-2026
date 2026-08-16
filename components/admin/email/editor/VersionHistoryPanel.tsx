'use client';

import { useState, useEffect } from 'react';
import { motion } from '@/components/motion';
import { X, History, RotateCcw, GitCompare, Eye, ShieldCheck, FileText, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { EditorDocument } from './editor-types';

interface TemplateVersion {
  id: string;
  template_id: string;
  version_number: number;
  version_type: string;
  subject: string | null;
  preview_text: string | null;
  internal_note: string | null;
  status_at_creation: string | null;
  validation_summary: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
}

interface VersionHistoryPanelProps {
  open: boolean;
  onClose: () => void;
  templateId: string;
  currentDocument: EditorDocument;
  onRestore: (version: TemplateVersion) => void;
  onCompare: (versionA: TemplateVersion, versionB: TemplateVersion) => void;
}

export default function VersionHistoryPanel({ open, onClose, templateId, currentDocument, onRestore, onCompare }: VersionHistoryPanelProps) {
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<TemplateVersion[]>([]);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [restoreNote, setRestoreNote] = useState('');
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !templateId) return;
    const fetchVersions = async () => {
      setLoading(true);
      const { data } = await supabase.from('email_template_versions').select('*').eq('template_id', templateId).order('version_number', { ascending: false });
      if (data) setVersions(data as TemplateVersion[]);
      setLoading(false);
    };
    fetchVersions();
  }, [open, templateId]);

  const handleRestore = async (version: TemplateVersion) => {
    setRestoring(version.id);
    onRestore(version);
    setTimeout(() => { setRestoring(null); setShowRestoreConfirm(null); setRestoreNote(''); }, 500);
  };

  const toggleCompare = (v: TemplateVersion) => {
    setSelectedForCompare((prev) => {
      if (prev.find((p) => p.id === v.id)) return prev.filter((p) => p.id !== v.id);
      if (prev.length >= 2) return [prev[1], v];
      return [...prev, v];
    });
  };

  if (!open) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-end overflow-y-auto"
      onClick={onClose}
    >
      <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }}
        className="w-full max-w-lg h-full bg-[#0f0f13] border-l border-[rgba(255,255,255,0.06)] shadow-2xl flex flex-col"
        onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
          <div>
            <h3 className="text-base font-bold text-white">Version History</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">{versions.length} snapshot{versions.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-1">
            {selectedForCompare.length === 2 && (
              <button onClick={() => onCompare(selectedForCompare[0], selectedForCompare[1])}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-[#06B6D4]/10 text-[#06B6D4] rounded-lg text-[11px] font-semibold hover:bg-[#06B6D4]/20 transition-colors cursor-pointer whitespace-nowrap"
              >
                <GitCompare className="w-3 h-3" />
                Compare
              </button>
            )}
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-white transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <div className="w-10 h-10 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-slate-400">Loading versions...</p>
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-slate-500/10 border border-[rgba(255,255,255,0.06)] flex items-center justify-center mb-5">
                <History className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-white mb-1">No versions yet</p>
              <p className="text-xs text-slate-500 max-w-xs">Version snapshots are created during review, approval, activation and restoration.</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {versions.map((v) => {
                const isSelected = selectedForCompare.some((s) => s.id === v.id);
                return (
                  <div key={v.id}
                    className={`bg-white/[0.02] border rounded-lg p-3 transition-colors ${isSelected ? 'border-[#06B6D4]/30 bg-[#06B6D4]/[0.04]' : 'border-[rgba(255,255,255,0.06)]'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <FileText className="w-4 h-4 text-[#06B6D4]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-white">v{v.version_number}</span>
                          <VersionBadge type={v.version_type} />
                          {v.status_at_creation && (
                            <StatusBadge status={v.status_at_creation} />
                          )}
                        </div>
                        {v.subject && <p className="text-[11px] text-slate-400 truncate">Subject: {v.subject}</p>}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-slate-600">{new Date(v.created_at).toLocaleString()}</span>
                          {v.validation_summary && (
                            <span className="text-[10px] text-emerald-500 flex items-center gap-0.5">
                              <ShieldCheck className="w-2.5 h-2.5" />
                              Validated
                            </span>
                          )}
                        </div>
                        {v.internal_note && (
                          <p className="text-[10px] text-slate-500 mt-1 italic">“{v.internal_note}”</p>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => toggleCompare(v)}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${isSelected ? 'bg-[#06B6D4]/20 text-[#06B6D4]' : 'hover:bg-white/[0.04] text-slate-500 hover:text-white'}`}
                          title="Select for comparison"
                        >
                          <GitCompare className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setShowRestoreConfirm(v.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-slate-500 hover:text-blue-400 transition-colors cursor-pointer"
                          title="Restore this version"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {showRestoreConfirm === v.id && (
                      <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                        <p className="text-[11px] text-slate-400 mb-2">Restore v{v.version_number} as a new draft? Current draft will not be lost.</p>
                        <textarea value={restoreNote} onChange={(e) => setRestoreNote(e.target.value.slice(0, 200))}
                          placeholder="Reason for restoring (optional)"
                          rows={1}
                          className="w-full px-3 py-1.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-[11px] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 resize-none mb-2"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleRestore(v)}
                            disabled={restoring === v.id}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-[11px] font-semibold hover:bg-blue-500/20 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            {restoring === v.id ? 'Restoring...' : 'Confirm Restore'}
                          </button>
                          <button onClick={() => { setShowRestoreConfirm(null); setRestoreNote(''); }}
                            className="px-3 py-1.5 text-[11px] text-slate-500 hover:text-white transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function VersionBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; color: string }> = {
    manual_save: { label: 'Save', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
    review_submission: { label: 'Review', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    approved: { label: 'Approved', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    activated: { label: 'Active', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    restored: { label: 'Restored', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    migration: { label: 'Migration', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  };
  const cfg = map[type] || { label: type, color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
  return <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded border ${cfg.color}`}>{cfg.label}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    draft: { label: 'Draft', color: 'text-slate-400' },
    ready_for_review: { label: 'Review', color: 'text-blue-400' },
    changes_requested: { label: 'Changes', color: 'text-amber-400' },
    approved: { label: 'Approved', color: 'text-emerald-400' },
    active: { label: 'Active', color: 'text-emerald-400' },
    archived: { label: 'Archived', color: 'text-slate-600' },
  };
  const cfg = map[status] || { label: status, color: 'text-slate-400' };
  return <span className={`text-[9px] ${cfg.color}`}>{cfg.label}</span>;
}
