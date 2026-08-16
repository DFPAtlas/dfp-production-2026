'use client';

import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, X, Loader2, AlertCircle, FileText, Image, Paperclip } from 'lucide-react';
import { UATEvidence, formatFileSize } from './evidence-types';
import UATEvidenceCard from './UATEvidenceCard';

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const ALLOWED_DOC_TYPES = ['application/pdf', 'text/plain', 'text/csv'];
const MAX_IMAGE_SIZE = 10485760;
const MAX_DOC_SIZE = 15728640;

interface UploadItem {
  file: File;
  progress: number;
  error: string | null;
  uploadedEvidenceId: string | null;
  status: 'pending' | 'uploading' | 'done' | 'error';
}

interface UATEvidenceUploaderProps {
  assignmentId: string;
  assignmentTestCaseId: string | null;
  sessionId: string | null;
  existingEvidence: UATEvidence[];
  onUploadComplete: () => void;
  onRemove: (id: string) => void;
}

export default function UATEvidenceUploader({
  assignmentId, assignmentTestCaseId, sessionId,
  existingEvidence, onUploadComplete, onRemove,
}: UATEvidenceUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [showDrop, setShowDrop] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndQueue = useCallback((files: FileList | File[]) => {
    const items: UploadItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
      const isDoc = ALLOWED_DOC_TYPES.includes(file.type);

      if (!isImage && !isDoc) {
        items.push({ file, progress: 0, error: 'Unsupported file type. Accepted: PNG, JPEG, WebP, PDF, TXT, CSV.', uploadedEvidenceId: null, status: 'error' });
        continue;
      }
      if (isImage && file.size > MAX_IMAGE_SIZE) {
        items.push({ file, progress: 0, error: 'Image too large. Max 10 MB.', uploadedEvidenceId: null, status: 'error' });
        continue;
      }
      if (isDoc && file.size > MAX_DOC_SIZE) {
        items.push({ file, progress: 0, error: 'Document too large. Max 15 MB.', uploadedEvidenceId: null, status: 'error' });
        continue;
      }

      items.push({ file, progress: 0, error: null, uploadedEvidenceId: null, status: 'pending' });
    }
    setUploadItems((prev) => [...prev, ...items]);
  }, []);

  const uploadSingle = async (item: UploadItem, index: number) => {
    setUploadItems((prev) => prev.map((it, i) => i === index ? { ...it, status: 'uploading', progress: 10 } : it));

    const ext = item.file.name.split('.').pop()?.toLowerCase() || '';
    const evidenceType: string = ALLOWED_IMAGE_TYPES.includes(item.file.type) ? 'image' : 'document';

    try {
      const { data: prep, error: prepErr } = await supabase.rpc('prepare_uat_evidence_upload', {
        p_assignment_id: assignmentId,
        p_original_filename: item.file.name,
        p_mime_type: item.file.type,
        p_file_size_bytes: item.file.size,
        p_evidence_type: evidenceType,
        p_assignment_test_case_id: assignmentTestCaseId,
        p_session_id: sessionId,
      });

      if (prepErr) {
        setUploadItems((prev) => prev.map((it, i) => i === index ? { ...it, status: 'error', error: prepErr.message } : it));
        return;
      }

      const prepData = prep as any;
      if (!prepData?.success) {
        setUploadItems((prev) => prev.map((it, i) => i === index ? { ...it, status: 'error', error: prepData?.message || 'Preparation failed' } : it));
        return;
      }

      setUploadItems((prev) => prev.map((it, i) => i === index ? { ...it, progress: 30 } : it));

      const { error: uploadErr } = await supabase.storage
        .from('uat-evidence')
        .upload(prepData.storage_path, item.file, {
          contentType: item.file.type,
          upsert: false,
        });

      setUploadItems((prev) => prev.map((it, i) => i === index ? { ...it, progress: 80 } : it));

      if (uploadErr) {
        await supabase.rpc('soft_delete_uat_evidence', { p_evidence_id: prepData.evidence_id });
        setUploadItems((prev) => prev.map((it, i) => i === index ? { ...it, status: 'error', error: uploadErr.message } : it));
        return;
      }

      setUploadItems((prev) => prev.map((it, i) => i === index ? { ...it, status: 'done', progress: 100, uploadedEvidenceId: prepData.evidence_id } : it));
      onUploadComplete();
    } catch (err: any) {
      setUploadItems((prev) => prev.map((it, i) => i === index ? { ...it, status: 'error', error: err.message || 'Upload failed' } : it));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) validateAndQueue(e.dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) validateAndQueue(e.target.files);
    e.target.value = '';
  };

  const removeUploadItem = (index: number) => {
    setUploadItems((prev) => prev.filter((_, i) => i !== index));
  };

  const pendingCount = uploadItems.filter((it) => it.status === 'pending').length;
  const uploadingCount = uploadItems.filter((it) => it.status === 'uploading').length;

  return (
    <div className="space-y-3">
      {existingEvidence.length > 0 && (
        <div className="space-y-2 mb-4">
          {existingEvidence.map((ev) => (
            <UATEvidenceCard key={ev.id} evidence={ev} onRemove={onRemove} showRemove />
          ))}
        </div>
      )}

      {uploadItems.map((item, idx) => (
        <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
            {item.file.type.startsWith('image/') ? <Image className="w-5 h-5 text-slate-400" /> : <FileText className="w-5 h-5 text-slate-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-700 truncate">{item.file.name}</p>
            <p className="text-[11px] text-slate-400">{formatFileSize(item.file.size)}</p>
            {item.status === 'uploading' && (
              <div className="mt-1 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#2878d0] h-full rounded-full transition-all duration-300" style={{ width: `${item.progress}%` }} />
              </div>
            )}
            {item.status === 'done' && <p className="text-[11px] text-emerald-600 mt-0.5">Uploaded</p>}
            {item.error && <p className="text-[11px] text-red-500 mt-0.5">{item.error}</p>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {item.status === 'pending' && (
              <button onClick={() => uploadSingle(item, idx)}
                className="px-3 py-1.5 bg-[#2878d0] hover:bg-[#1e68b9] rounded-lg text-[11px] font-semibold text-white cursor-pointer whitespace-nowrap transition-colors">Upload</button>
            )}
            {item.status === 'error' && (
              <button onClick={() => uploadSingle(item, idx)}
                className="px-3 py-1.5 bg-[#2878d0] hover:bg-[#1e68b9] rounded-lg text-[11px] font-semibold text-white cursor-pointer whitespace-nowrap transition-colors">Retry</button>
            )}
            {(item.status === 'pending' || item.status === 'error') && (
              <button onClick={() => removeUploadItem(idx)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 cursor-pointer text-slate-400"><X className="w-3.5 h-3.5" /></button>
            )}
          </div>
        </div>
      ))}

      <button onClick={() => setShowDrop(!showDrop)}
        className="w-full py-3 border-2 border-dashed border-slate-200 hover:border-[#2878d0]/40 rounded-xl flex items-center justify-center gap-2 text-xs font-medium text-slate-400 hover:text-[#2878d0] cursor-pointer transition-colors">
        <Paperclip className="w-3.5 h-3.5" /> Add Files
      </button>

      {showDrop && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`p-6 border-2 border-dashed rounded-2xl text-center transition-colors cursor-pointer ${dragOver ? 'border-[#2878d0] bg-[#edf5ff]' : 'border-slate-200 bg-slate-50/50'}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-500 mb-1">Drop files here or click to browse</p>
          <p className="text-[11px] text-slate-400">PNG, JPEG, WebP (max 10 MB) · PDF, TXT, CSV (max 15 MB)</p>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,.pdf,.txt,.csv" multiple onChange={handleFileSelect} className="hidden" />
        </div>
      )}
    </div>
  );
}