'use client';

import { useState } from 'react';
import { X, Monitor, Smartphone } from 'lucide-react';
import { EditorDocument } from './editor-types';
import { renderDocumentToHtml } from './editor-utils';

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  document: EditorDocument;
  subject: string;
  templateName: string;
}

export default function PreviewModal({ open, onClose, document, subject, templateName }: PreviewModalProps) {
  const [mode, setMode] = useState<'desktop' | 'mobile'>('desktop');

  if (!open) return null;

  const html = renderDocumentToHtml(document);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-[5vh] overflow-y-auto" onClick={onClose}>
      <div className="bg-[#1a1a1e] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl w-full max-w-4xl my-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
          <div>
            <h3 className="text-base font-bold text-white">{templateName}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Subject: {subject}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg overflow-hidden">
              <button
                onClick={() => setMode('desktop')}
                className={`w-8 h-8 flex items-center justify-center transition-colors cursor-pointer ${mode === 'desktop' ? 'bg-white/[0.06] text-white' : 'text-slate-500 hover:text-white'}`}
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMode('mobile')}
                className={`w-8 h-8 flex items-center justify-center transition-colors cursor-pointer ${mode === 'mobile' ? 'bg-white/[0.06] text-white' : 'text-slate-500 hover:text-white'}`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-slate-400 transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 flex justify-center bg-[#111]">
          <div
            className="bg-white overflow-hidden shadow-lg rounded"
            style={{ width: mode === 'mobile' ? '375px' : '100%', maxWidth: '700px' }}
          >
            <div className="text-xs text-slate-500 bg-slate-100 px-4 py-2 border-b truncate">
              Subject: {subject}
            </div>
            <div className="overflow-auto" style={{ maxHeight: '65vh' }}>
              <iframe
                srcDoc={html}
                className="w-full border-0"
                style={{ minHeight: '500px' }}
                title="Email Preview"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}