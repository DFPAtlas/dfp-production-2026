'use client';

import { useState } from 'react';
import { X, Download, Eye, Trash2, Image as ImageIcon, FileText, Camera } from 'lucide-react';
import { UATEvidence, formatFileSize, isImageEvidence } from './evidence-types';
import UATEvidenceStatusBadge from './UATEvidenceStatusBadge';
import UATEvidencePreview from './UATEvidencePreview';

interface UATEvidenceCardProps {
  evidence: UATEvidence;
  onRemove?: (id: string) => void;
  onDownload?: (evidence: UATEvidence) => void;
  showRemove?: boolean;
  showDownload?: boolean;
}

export default function UATEvidenceCard({ evidence, onRemove, onDownload, showRemove, showDownload }: UATEvidenceCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl group hover:border-[#2878d0]/30 transition-colors">
        <button onClick={() => setPreviewOpen(true)} className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer relative">
          {isImageEvidence(evidence) && evidence.signedUrl ? (
            <img src={evidence.signedUrl} alt={evidence.caption || evidence.original_filename} className="w-full h-full object-cover" />
          ) : (
            <FileText className="w-5 h-5 text-slate-400" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-xs font-semibold text-slate-700 truncate">{evidence.caption || evidence.original_filename}</p>
            <UATEvidenceStatusBadge status={evidence.status} />
          </div>
          <p className="text-[11px] text-slate-400">
            {formatFileSize(evidence.file_size_bytes)} · {evidence.mime_type?.split('/')[1] || evidence.mime_type}
          </p>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {showDownload && onDownload && (
            <button onClick={() => onDownload(evidence)} title="Download"
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 cursor-pointer text-slate-400 hover:text-[#2878d0]">
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
          {(evidence.evidence_type === 'screenshot' || evidence.evidence_type === 'image') && (
            <button onClick={() => setPreviewOpen(true)} title="Preview"
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 cursor-pointer text-slate-400 hover:text-[#2878d0]">
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}
          {showRemove && onRemove && (
            <button onClick={() => onRemove(evidence.id)} title="Remove"
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 cursor-pointer text-slate-400 hover:text-red-500">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {previewOpen && (
        <UATEvidencePreview evidence={evidence} onClose={() => setPreviewOpen(false)} />
      )}
    </>
  );
}