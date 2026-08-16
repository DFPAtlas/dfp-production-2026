'use client';

import { useState, useEffect } from 'react';
import { motion } from '@/components/motion';
import { X, ArrowRight, Plus, Minus, Edit3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { EditorDocument } from './editor-types';

interface TemplateVersion {
  id: string;
  version_number: number;
  version_type: string;
  subject: string | null;
  preview_text: string | null;
  editor_document: EditorDocument | null;
  validation_summary: Record<string, unknown> | null;
  created_at: string;
}

interface VersionCompareModalProps {
  open: boolean;
  onClose: () => void;
  versionA: { id: string } | null;
  versionB: { id: string } | null;
  templateId: string;
}

export default function VersionCompareModal({ open, onClose, versionA, versionB, templateId }: VersionCompareModalProps) {
  const [docA, setDocA] = useState<EditorDocument | null>(null);
  const [docB, setDocB] = useState<EditorDocument | null>(null);
  const [versionAData, setVersionAData] = useState<TemplateVersion | null>(null);
  const [versionBData, setVersionBData] = useState<TemplateVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [diffSummary, setDiffSummary] = useState<string[]>([]);

  useEffect(() => {
    if (!open || !versionA || !versionB) return;
    const fetchVersions = async () => {
      setLoading(true);
      const { data: dA } = await supabase.from('email_template_versions').select('*').eq('id', versionA.id).maybeSingle();
      const { data: dB } = await supabase.from('email_template_versions').select('*').eq('id', versionB.id).maybeSingle();

      const vA = dA as unknown as TemplateVersion | null;
      const vB = dB as unknown as TemplateVersion | null;

      setVersionAData(vA);
      setVersionBData(vB);
      setDocA(vA?.editor_document || null);
      setDocB(vB?.editor_document || null);

      const changes: string[] = [];

      if (vA && vB) {
        if (vA.subject !== vB.subject) changes.push(`Subject changed from "${vA.subject || ''}" to "${vB.subject || ''}"`);
        if (vA.preview_text !== vB.preview_text) changes.push('Preview text changed');

        if (vA.editor_document && vB.editor_document) {
          const blocksA = countBlocks(vA.editor_document);
          const blocksB = countBlocks(vB.editor_document);
          if (blocksA !== blocksB) {
            changes.push(`${blocksB > blocksA ? 'Added' : 'Removed'} ${Math.abs(blocksB - blocksA)} block(s)`);
          }

          const sectionsA = vA.editor_document.sections?.length || 0;
          const sectionsB = vB.editor_document.sections?.length || 0;
          if (sectionsA !== sectionsB) {
            changes.push(`${sectionsB > sectionsA ? 'Added' : 'Removed'} ${Math.abs(sectionsB - sectionsA)} section(s)`);
          }
        }

        if (changes.length === 0) changes.push('No significant differences detected');
      }

      setDiffSummary(changes);
      setLoading(false);
    };
    fetchVersions();
  }, [open, versionA, versionB]);

  if (!open) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#0f0f13] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-white">Version Comparison</h3>
            {versionAData && versionBData && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">v{versionAData.version_number}</span>
                <ArrowRight className="w-3 h-3 text-slate-600" />
                <span className="text-white">v{versionBData.version_number}</span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-5">
              <div className="bg-amber-500/[0.04] border border-amber-500/10 rounded-xl p-4">
                <p className="text-xs font-semibold text-amber-400 mb-2">Changes Summary</p>
                <div className="space-y-1">
                  {diffSummary.map((change, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-[10px] text-amber-500 mt-0.5">&bull;</span>
                      <span className="text-[11px] text-slate-300">{change}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    v{versionAData?.version_number}
                    <span className="ml-1 text-slate-600">({versionAData?.version_type})</span>
                  </p>
                  <div className="space-y-2">
                    <div>
                      <span className="text-[9px] text-slate-600">Subject</span>
                      <p className="text-xs text-white">{versionAData?.subject || '(not set)'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-600">Preview</span>
                      <p className="text-xs text-slate-400">{versionAData?.preview_text || '(not set)'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-600">Sections</span>
                      <p className="text-xs text-white">{docA?.sections?.length || 0}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-600">Blocks</span>
                      <p className="text-xs text-white">{docA ? countBlocks(docA) : 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-[#06B6D4]/20 rounded-xl p-4">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    v{versionBData?.version_number}
                    <span className="ml-1 text-slate-600">({versionBData?.version_type})</span>
                  </p>
                  <div className="space-y-2">
                    {diffSummary.map((change, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        {change.startsWith('Added') ? <Plus className="w-3 h-3 text-emerald-400" />
                          : change.startsWith('Removed') ? <Minus className="w-3 h-3 text-red-400" />
                          : <Edit3 className="w-3 h-3 text-amber-400" />}
                        <span className="text-[10px] text-slate-400">{change}</span>
                      </div>
                    ))}
                    {diffSummary.length === 1 && diffSummary[0] === 'No significant differences detected' && (
                      <p className="text-[10px] text-slate-500">No changes detected</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function countBlocks(doc: EditorDocument): number {
  let count = 0;
  for (const section of doc.sections) {
    for (const row of section.rows) {
      for (const col of row.columns) {
        count += col.blocks.length;
      }
    }
  }
  return count;
}
