'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Paperclip, X, Loader2, FileText, Image, Film, Archive, AlertCircle } from 'lucide-react';
import { validateFile, formatFileSize, ALLOWED_EXTENSIONS, MAX_FILE_SIZE } from '@/lib/file-definitions';

interface AttachmentFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  progress: number;
  error: string | null;
  storagePath: string | null;
}

interface AttachmentUploaderProps {
  onAttachmentsChange: (attachments: AttachmentFile[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.startsWith('video/')) return Film;
  if (mimeType.includes('zip') || mimeType.includes('archive')) return Archive;
  return FileText;
}

export function AttachmentUploader({ onAttachmentsChange, maxFiles = 5, disabled = false }: AttachmentUploaderProps) {
  const [files, setFiles] = useState<AttachmentFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSelectFiles() {
    fileInputRef.current?.click();
  }

  function updateAndNotify(newFiles: AttachmentFile[]) {
    setFiles(newFiles);
    onAttachmentsChange(newFiles);
  }

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    if (files.length + selectedFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newFiles: AttachmentFile[] = [...files];

    for (const file of selectedFiles) {
      const validationError = validateFile(file);
      const id = Math.random().toString(36).slice(2, 10);

      if (validationError) {
        newFiles.push({
          id,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          progress: 0,
          error: validationError,
          storagePath: null,
        });
        continue;
      }

      const attachmentFile: AttachmentFile = {
        id,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        error: null,
        storagePath: null,
      };

      newFiles.push(attachmentFile);
    }

    updateAndNotify(newFiles);
    await uploadAll(newFiles);
  }

  async function uploadAll(currentFiles: AttachmentFile[]) {
    const toUpload = currentFiles.filter(f => !f.error && !f.storagePath);
    if (!toUpload.length) return;

    setUploading(true);

    for (const f of toUpload) {
      const storagePath = generateAttachmentPath(f.file.name, 'message-attachments');

      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(storagePath, f.file, {
          contentType: f.type,
          upsert: false,
        });

      setFiles(prev => {
        const updated = prev.map(pf => {
          if (pf.id === f.id) {
            return {
              ...pf,
              progress: uploadError ? 0 : 100,
              error: uploadError ? (uploadError as any)?.message || 'Upload failed' : null,
              storagePath: uploadError ? null : storagePath,
            };
          }
          return pf;
        });
        onAttachmentsChange(updated);
        return updated;
      });
    }

    setUploading(false);
  }

  function removeFile(id: string) {
    const updated = files.filter(f => f.id !== id);
    updateAndNotify(updated);
  }

  const hasErrors = files.some(f => f.error);
  const uploadingCount = files.filter(f => !f.error && !f.storagePath).length;

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFilesSelected}
        className="hidden"
        accept={ALLOWED_EXTENSIONS.map(e => `.${e}`).join(',')}
      />

      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map(f => {
            const Icon = getFileIcon(f.type);
            const hasError = !!f.error;
            const isUploading = !f.error && !f.storagePath;
            const isDone = !!f.storagePath;

            return (
              <div key={f.id} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs ${
                hasError ? 'bg-red-500/5 border border-red-500/15' :
                isUploading ? 'bg-white/5 border border-white/5' :
                'bg-[#10B981]/5 border border-[#10B981]/10'
              }`}>
                <Icon className={`w-4 h-4 flex-shrink-0 ${
                  hasError ? 'text-red-400' : isUploading ? 'text-[#22D3EE]' : 'text-[#10B981]'
                }`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-slate-300">{f.name}</p>
                  <p className="text-[10px] text-slate-500">
                    {formatFileSize(f.size)}
                    {isUploading && ' · Uploading...'}
                    {hasError && ` · ${f.error}`}
                    {isDone && ' · Ready'}
                  </p>
                </div>
                {isUploading && (
                  <Loader2 className="w-4 h-4 text-[#22D3EE] animate-spin flex-shrink-0" />
                )}
                {hasError && (
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                )}
                <button
                  onClick={() => removeFile(f.id)}
                  className="flex-shrink-0 p-1 text-slate-500 hover:text-white rounded transition-colors cursor-pointer"
                  disabled={disabled}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={handleSelectFiles}
        disabled={disabled || uploading || files.length >= maxFiles}
        className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Paperclip className="w-3.5 h-3.5" />
        {files.length > 0 ? 'Add more files' : 'Attach files'}
      </button>
    </div>
  );
}

function generateAttachmentPath(fileName: string, prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_{2,}/g, '_').toLowerCase();
  return `${prefix}/${timestamp}-${random}-${safeName}`;
}

export type { AttachmentFile };