'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from '@/components/motion';
import {
  ArrowLeft, Upload, Download, Eye, FileText, Clock, Send,
  CheckCircle, AlertTriangle, X, Loader2, Calendar, File,
  FolderKanban, Replace,
} from 'lucide-react';
import Link from 'next/link';
import PortalShell from '../../../PortalShell';
import { formatFileSize, getContentRequestStatusDef, getContentRequestPriorityDef, ALLOWED_EXTENSIONS, generateStoragePath, FILE_CATEGORIES } from '@/lib/file-definitions';

interface ContentRequest {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  category: string;
  required_file_types?: string[];
  max_file_count: number;
  due_date?: string;
  priority: string;
  status: string;
  created_at: string;
}

interface ProjectFile {
  id: string;
  name: string;
  display_name?: string;
  file_path: string;
  file_type: string;
  file_size: number;
  category: string;
  version?: number;
  file_status?: string;
  client_replaceable?: boolean;
  created_at: string;
  description?: string;
}

interface Project {
  id: string;
  name: string;
}

export default function RequestDetail({ requestId }: { requestId: string }) {
  const [request, setRequest] = useState<ContentRequest | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadModal, setUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError('Session expired'); setLoading(false); return; }
      setUserId(session.user.id);

      const { data: req, error: reqErr } = await supabase
        .from('content_requests')
        .select('*')
        .eq('id', requestId)
        .eq('client_visible', true)
        .maybeSingle();

      if (reqErr || !req) {
        setError('Request not found or you do not have access.');
        setLoading(false);
        return;
      }

      setRequest(req as ContentRequest);

      const [projRes, filesRes] = await Promise.all([
        supabase.from('projects').select('id, name').eq('id', req.project_id).maybeSingle(),
        supabase.from('project_files').select('*').eq('content_request_id', requestId).order('created_at', { ascending: false }),
      ]);

      if (projRes.data) setProject(projRes.data as Project);
      if (filesRes.data) setFiles(filesRes.data as ProjectFile[]);

      setLoading(false);
    }
    init();
  }, [requestId]);

  async function handleUpload() {
    if (!uploadFile || !request) return;
    setUploading(true);
    setUploadError('');
    setUploadSuccess(false);

    const filePath = generateStoragePath('client-uploads', uploadFile.name, request.project_id);

    const { error: uploadErr } = await supabase.storage
      .from('project-files')
      .upload(filePath, uploadFile, { contentType: uploadFile.type, upsert: false });

    if (uploadErr) {
      setUploadError(uploadErr.message);
      setUploading(false);
      return;
    }

    const { data: inserted, error: insertErr } = await supabase.from('project_files').insert({
      project_id: request.project_id,
      name: uploadFile.name,
      display_name: uploadFile.name,
      original_name: uploadFile.name,
      file_name: uploadFile.name,
      file_path: filePath,
      file_size: uploadFile.size,
      file_type: uploadFile.type,
      category: request.category,
      description: '',
      visibility: 'client',
      source: 'client',
      file_status: 'ready',
      version: 1,
      client_downloadable: true,
      client_replaceable: true,
      storage_bucket: 'project-files',
      uploaded_by: userId,
      content_request_id: requestId,
    }).select().single();

    if (insertErr) {
      setUploadError(insertErr.message);
    } else {
      setUploadSuccess(true);
      if (inserted) setFiles(prev => [inserted as ProjectFile, ...prev]);

      if (request.status === 'requested' || request.status === 'viewed') {
        await supabase.from('content_requests').update({ status: 'partially_submitted' }).eq('id', requestId);
        setRequest(prev => prev ? { ...prev, status: 'partially_submitted' } : prev);
      }

      setTimeout(() => { setUploadModal(false); setUploadSuccess(false); setUploadFile(null); }, 1500);
    }
    setUploading(false);
  }

  async function handleDownload(file: ProjectFile) {
    const { data } = await supabase.storage.from('project-files').createSignedUrl(file.file_path, 120);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  }

  async function handlePreview(file: ProjectFile) {
    if (file.file_type && file.file_type.startsWith('image/')) {
      const { data } = await supabase.storage.from('project-files').createSignedUrl(file.file_path, 300);
      if (data?.signedUrl) setPreviewUrl(data.signedUrl);
    } else {
      handleDownload(file);
    }
  }

  async function handleReplace(file: ProjectFile) {
    fileInputRef.current?.click();
    const listener = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const newFile = target.files?.[0];
      if (!newFile || !request) return;
      target.removeEventListener('change', listener);

      const filePath = generateStoragePath('client-uploads', newFile.name, request.project_id);
      const { error: uploadErr } = await supabase.storage
        .from('project-files')
        .upload(filePath, newFile, { contentType: newFile.type, upsert: false });
      if (uploadErr) return;

      await supabase.from('project_files').update({ file_status: 'replaced' }).eq('id', file.id);

      const { data: newVersion } = await supabase.from('project_files').insert({
        project_id: request.project_id,
        name: newFile.name,
        display_name: file.display_name || newFile.name,
        original_name: newFile.name,
        file_name: newFile.name,
        file_path: filePath,
        file_size: newFile.size,
        file_type: newFile.type,
        category: file.category,
        visibility: 'client',
        source: 'client',
        file_status: 'ready',
        version: (file.version || 1) + 1,
        client_downloadable: true,
        client_replaceable: true,
        storage_bucket: 'project-files',
        uploaded_by: userId,
        content_request_id: requestId,
      }).select().single();

      if (newVersion) {
        setFiles(prev => [newVersion as ProjectFile, ...prev.filter(f => f.id !== file.id)]);
      }
    };
    fileInputRef.current?.addEventListener('change', listener);
  }

  if (loading) {
    return (
      <PortalShell>
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-3 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
        </div>
      </PortalShell>
    );
  }

  if (error || !request) {
    return (
      <PortalShell>
        <div className="text-center py-20">
          <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">{error || 'Request not found'}</p>
          <Link href="/portal/files" className="text-[#06B6D4] text-sm hover:underline mt-2 inline-block">Back to Content &amp; Assets</Link>
        </div>
      </PortalShell>
    );
  }

  const statusDef = getContentRequestStatusDef(request.status);
  const priorityDef = getContentRequestPriorityDef(request.priority);
  const isOverdue = request.due_date && new Date(request.due_date) < new Date();
  const canUpload = ['requested', 'viewed', 'partially_submitted', 'changes_required'].includes(request.status);

  return (
    <PortalShell>
      <div className="max-w-4xl mx-auto">
        <Link href="/portal/files" className="flex items-center gap-2 text-sm text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Content &amp; Assets
        </Link>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
            <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap"
                    style={{ backgroundColor: `${priorityDef.color}15`, color: priorityDef.color }}>
                    {priorityDef.label}
                  </span>
                  {isOverdue && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-500/10 text-red-400">
                      <AlertTriangle className="w-3 h-3" /> Overdue
                    </span>
                  )}
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap"
                    style={{ backgroundColor: `${statusDef.color}15`, color: statusDef.color }}>
                    {statusDef.label}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-white">{request.title}</h1>
              </div>
              {canUpload && (
                <button
                  onClick={() => { setUploadModal(true); setUploadError(''); setUploadSuccess(false); setUploadFile(null); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
                >
                  <Upload className="w-4 h-4" /> Upload Files
                </button>
              )}
            </div>

            {request.description && (
              <p className="text-sm text-slate-400 leading-relaxed mb-4">{request.description}</p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
              <div>
                <p className="text-xs text-slate-500">Category</p>
                <p className="text-sm font-medium text-white mt-0.5 capitalize">{request.category}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Required Files</p>
                <p className="text-sm font-medium text-white mt-0.5">{request.required_file_types?.length ? request.required_file_types.map(e => `.${e}`).join(', ') : 'Any type'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Max Files</p>
                <p className="text-sm font-medium text-white mt-0.5">{request.max_file_count}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Due Date</p>
                <p className="text-sm font-medium text-white mt-0.5">{request.due_date ? new Date(request.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'No deadline'}</p>
              </div>
            </div>

            {project && (
              <Link href={`/portal/projects/${project.id}`}
                className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)] flex items-center gap-2 text-xs text-[#22D3EE] hover:text-[#67E8F9] transition-colors cursor-pointer">
                <FolderKanban className="w-3.5 h-3.5" /> View project: {project.name}
              </Link>
            )}
          </div>

          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-[rgba(255,255,255,0.06)]">
              <h3 className="text-lg font-bold text-white">Submitted Files ({files.length}/{request.max_file_count})</h3>
            </div>

            {files.length > 0 ? (
              <div className="divide-y divide-[rgba(255,255,255,0.04)]">
                {files.map(f => (
                  <div key={f.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-[#06B6D4]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{f.display_name || f.name}</p>
                        <p className="text-xs text-slate-400">{formatFileSize(f.file_size)} · {new Date(f.created_at).toLocaleDateString('en-GB')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handlePreview(f)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => handleDownload(f)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer"><Download className="w-4 h-4" /></button>
                      {f.client_replaceable && canUpload && (
                        <button onClick={() => handleReplace(f)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-400 transition-colors cursor-pointer" title="Replace"><Replace className="w-4 h-4" /></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">No files uploaded yet</p>
                {canUpload && (
                  <p className="text-sm text-slate-500 mt-1">Use the Upload button above to submit your files.</p>
                )}
              </div>
            )}
          </div>
        </motion.div>

        <input ref={fileInputRef} type="file" className="hidden" />

        {uploadModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setUploadModal(false)}>
            <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Upload File</h3>
                <button onClick={() => setUploadModal(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                {uploadError && <p className="text-sm text-red-400 bg-red-500/10 rounded-lg p-3">{uploadError}</p>}
                {uploadSuccess && <p className="text-sm text-emerald-400 bg-emerald-500/10 rounded-lg p-3">File uploaded successfully!</p>}

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">File</label>
                  <input type="file" onChange={e => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#06B6D4] file:text-white hover:file:bg-[#0891B2] cursor-pointer" />
                </div>

                <div className="text-xs text-slate-500">
                  Accepted: {ALLOWED_EXTENSIONS.map(e => `.${e}`).join(', ')}. Max 50MB.
                </div>

                <button onClick={handleUpload} disabled={uploading || !uploadFile}
                  className="w-full py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap">
                  {uploading ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading...</> : <><Send className="w-4 h-4" /> Upload File</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {previewUrl && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
            <div className="relative max-w-3xl max-h-[85vh]" onClick={e => e.stopPropagation()}>
              <button onClick={() => setPreviewUrl(null)} className="absolute -top-10 right-0 w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
              <img src={previewUrl} alt="Preview" className="max-w-full max-h-[85vh] rounded-2xl object-contain" />
            </div>
          </div>
        )}
      </div>
    </PortalShell>
  );
}