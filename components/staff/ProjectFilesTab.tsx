'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getSignedUrl, getPublicUrl } from '@/lib/storage-helper';
import { FileText, Download, Eye, Loader2, AlertCircle, ExternalLink } from 'lucide-react';

interface ProjectFile {
  id: string;
  name: string | null;
  file_name: string | null;
  display_name: string | null;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  category: string;
  visibility: string;
  storage_bucket: string | null;
  created_at: string;
}

function formatBytes(bytes: number | null): string {
  if (!bytes || bytes === 0) return '—';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function ProjectFilesTab({
  files,
  loading,
  error,
  onRetry,
}: {
  files: ProjectFile[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState('');

  const handleDownload = async (file: ProjectFile) => {
    setDownloadingId(file.id);
    setDownloadError('');

    try {
      const bucket = file.storage_bucket || 'project-files';
      const path = file.file_path;

      if (file.visibility === 'public') {
        const url = getPublicUrl(bucket, path);
        window.open(url, '_blank');
      } else {
        const { url, error: signedErr } = await getSignedUrl(bucket, path, 3600);
        if (signedErr || !url) {
          setDownloadError(signedErr || 'Failed to generate download link');
        } else {
          window.open(url, '_blank');
        }
      }
    } catch {
      setDownloadError('Download failed');
    }

    setDownloadingId(null);
  };

  const getDisplayName = (f: ProjectFile): string => {
    return f.display_name || f.name || f.file_name || 'Unnamed file';
  };

  const getFileIconColor = (type: string | null): string => {
    if (!type) return '#06B6D4';
    if (type.includes('pdf')) return '#EF4444';
    if (type.includes('image')) return '#10B981';
    if (type.includes('sheet') || type.includes('csv') || type.includes('excel')) return '#10B981';
    if (type.includes('doc')) return '#3B82F6';
    if (type.includes('zip') || type.includes('compressed')) return '#F59E0B';
    return '#06B6D4';
  };

  if (loading) {
    return (
      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5" />
              <div className="flex-1"><div className="h-4 bg-white/5 rounded w-2/3 mb-1" /><div className="h-3 bg-white/5 rounded w-1/3" /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-10 h-10 text-[#F59E0B] mx-auto mb-3" />
          <p className="text-slate-300 font-medium mb-1">Could not load files</p>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <button onClick={onRetry}
            className="px-4 py-2 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl">
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-300 font-medium mb-1">No files uploaded</p>
          <p className="text-sm text-slate-500">Project files will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
      {downloadError && (
        <div className="px-5 py-2.5 bg-[#EF4444]/5 border-b border-[#EF4444]/10 text-xs text-[#EF4444] flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5" />
          {downloadError}
          <button onClick={() => setDownloadError('')} className="ml-auto text-slate-400 hover:text-white cursor-pointer">Dismiss</button>
        </div>
      )}
      <div className="divide-y divide-[rgba(255,255,255,0.04)]">
        {files.map(f => {
          const iconColor = getFileIconColor(f.file_type);
          return (
            <div key={f.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: iconColor + '15' }}>
                  <FileText className="w-5 h-5" style={{ color: iconColor }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{getDisplayName(f)}</p>
                  <p className="text-xs text-slate-400">
                    {formatBytes(f.file_size)}{f.category ? ` · ${f.category}` : ''}{' · '}
                    {new Date(f.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDownload(f)}
                disabled={downloadingId === f.id}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#06B6D4] transition-all cursor-pointer shrink-0"
                title="Download file"
              >
                {downloadingId === f.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}