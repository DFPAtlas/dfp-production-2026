'use client';

import { X, Download, AlertTriangle } from 'lucide-react';
import { UATEvidence, formatFileSize, isImageEvidence } from './evidence-types';

interface UATEvidencePreviewProps {
  evidence: UATEvidence;
  onClose: () => void;
}

export default function UATEvidencePreview({ evidence, onClose }: UATEvidencePreviewProps) {
  const handleDownload = () => {
    if (evidence.signedUrl) {
      const a = document.createElement('a');
      a.href = evidence.signedUrl;
      a.download = evidence.original_filename;
      a.click();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#17325c] truncate">{evidence.caption || evidence.original_filename}</h3>
            <p className="text-[11px] text-slate-400">{formatFileSize(evidence.file_size_bytes)}</p>
          </div>
          <div className="flex items-center gap-1">
            {evidence.signedUrl && (
              <button onClick={handleDownload}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 cursor-pointer text-slate-500 hover:text-[#2878d0]">
                <Download className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 cursor-pointer text-slate-500">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-50/50">
          {isImageEvidence(evidence) && evidence.signedUrl ? (
            <img src={evidence.signedUrl} alt={evidence.original_filename} className="max-w-full max-h-[60vh] rounded-xl object-contain" />
          ) : (
            <div className="text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500">Preview not available for this file type.</p>
              {evidence.signedUrl && (
                <button onClick={handleDownload}
                  className="mt-3 px-4 py-2 bg-[#2878d0] rounded-xl text-xs font-semibold text-white cursor-pointer whitespace-nowrap">
                  Download File
                </button>
              )}
            </div>
          )}
        </div>

        {evidence.tester_notes && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Notes</p>
            <p className="text-sm text-slate-600">{evidence.tester_notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}