'use client';

import { Image, Paperclip } from 'lucide-react';
import { UATEvidence, formatFileSize } from './evidence-types';
import UATEvidenceCard from './UATEvidenceCard';

interface UATEvidenceListProps {
  evidence: UATEvidence[];
  loading: boolean;
  onRemove?: (id: string) => void;
  onDownload?: (evidence: UATEvidence) => void;
  onAddClick?: () => void;
  showRemove?: boolean;
  showDownload?: boolean;
  addLabel?: string;
}

export default function UATEvidenceList({
  evidence, loading, onRemove, onDownload, onAddClick,
  showRemove, showDownload, addLabel = 'Add Evidence',
}: UATEvidenceListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl animate-pulse">
            <div className="w-12 h-12 rounded-xl bg-slate-200" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-slate-200 rounded w-32" />
              <div className="h-2 bg-slate-200 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {evidence.length === 0 ? (
        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
            <Image className="w-5 h-5 text-slate-300" />
          </div>
          <p className="text-xs text-slate-400 mb-3">No evidence attached yet.</p>
          {onAddClick && (
            <button onClick={onAddClick}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2878d0] hover:bg-[#1e68b9] rounded-xl text-xs font-semibold text-white cursor-pointer whitespace-nowrap transition-colors">
              <Paperclip className="w-3.5 h-3.5" /> {addLabel}
            </button>
          )}
        </div>
      ) : (
        <>
          {evidence.map((ev) => (
            <UATEvidenceCard
              key={ev.id}
              evidence={ev}
              onRemove={onRemove}
              onDownload={onDownload}
              showRemove={showRemove}
              showDownload={showDownload}
            />
          ))}
          {onAddClick && (
            <button onClick={onAddClick}
              className="w-full py-2.5 border-2 border-dashed border-slate-200 hover:border-[#2878d0]/40 rounded-xl text-xs font-medium text-slate-400 hover:text-[#2878d0] cursor-pointer transition-colors">
              + {addLabel}
            </button>
          )}
        </>
      )}
    </div>
  );
}