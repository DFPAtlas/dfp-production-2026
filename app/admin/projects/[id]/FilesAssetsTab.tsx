'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Plus, Search, FileText, Download, Eye, Trash2, X, Loader2, Filter,
} from 'lucide-react';
import { FILE_CATEGORIES, FILE_STATUSES, getFileStatusDef, formatFileSize } from '@/lib/file-definitions';

interface ProjectFile {
  id: string;
  project_id: string;
  name: string;
  display_name?: string;
  file_name?: string;
  description?: string;
  file_path: string;
  file_type: string;
  file_size: number;
  category: string;
  visibility: string;
  source?: string;
  file_status?: string;
  version?: number;
  client_downloadable?: boolean;
  client_replaceable?: boolean;
  original_name?: string;
  created_at: string;
  updated_at: string;
}

export default function FilesAssetsTab({ project, onProjectUpdated }: { project: any; onProjectUpdated: () => void }) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({ display_name: '', category: 'document', description: '', visibility: 'client', client_downloadable: true, client_replaceable: false });
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchFiles();
  }, [project.id]);

  async function fetchFiles() {
    setLoading(true);
    const { data } = await supabase
      .from('project_files')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false });
    if (data) setFiles(data as ProjectFile[]);
    setLoading(false);
  }

  async function handleUpload() {
    if (!uploadFile) return;
    setUploading(true);
    setErrorMsg('');

    const filePath = `projects/${project.id}/${Date.now()}-${uploadFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    const { error: uploadError } = await supabase.storage
      .from('project-files')
      .upload(filePath, uploadFile, { contentType: uploadFile.type, upsert: false });

    if (uploadError) {
      setErrorMsg(uploadError.message);
      setUploading(false);
      return;
    }

    const { error: insertError } = await supabase.from('project_files').insert({
      project_id: project.id,
      name: formData.display_name || uploadFile.name,
      display_name: formData.display_name || uploadFile.name,
      original_name: uploadFile.name,
      file_name: uploadFile.name,
      file_path: filePath,
      file_size: uploadFile.size,
      file_type: uploadFile.type,
      category: formData.category,
      description: formData.description,
      visibility: formData.visibility,
      source: 'admin',
      file_status: 'ready',
      version: 1,
      client_downloadable: formData.client_downloadable,
      client_replaceable: formData.client_replaceable,
      storage_bucket: 'project-files',
      uploaded_by: (await supabase.auth.getSession()).data.session?.user.id,
    });

    if (insertError) {
      setErrorMsg(insertError.message);
    } else {
      setShowModal(false);
      setUploadFile(null);
      setFormData({ display_name: '', category: 'document', description: '', visibility: 'client', client_downloadable: true, client_replaceable: false });
      fetchFiles();
      onProjectUpdated();
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

  async function handleArchive(file: ProjectFile) {
    if (!confirm(`Archive "${file.display_name || file.name}"? The client will no longer see it.`)) return;
    await supabase.from('project_files').update({
      file_status: 'archived',
      archived_at: new Date().toISOString(),
      visibility: 'internal',
    }).eq('id', file.id);
    fetchFiles();
  }

  async function handleToggleVisibility(file: ProjectFile) {
    const newVis = file.visibility === 'client' ? 'internal' : 'client';
    await supabase.from('project_files').update({ visibility: newVis }).eq('id', file.id);
    fetchFiles();
  }

  async function handleDelete(file: ProjectFile) {
    if (!confirm(`Delete "${file.display_name || file.name}"? This removes it from storage.`)) return;
    await supabase.storage.from('project-files').remove([file.file_path]);
    await supabase.from('project_files').delete().eq('id', file.id);
    fetchFiles();
  }

  const filtered = files.filter(f => {
    const matchesSearch = (f.display_name || f.name || '').toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCategory === 'all' || f.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || (f.file_status || 'ready') === filterStatus;
    return matchesSearch && matchesCat && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">
          Files &amp; Assets ({files.length})
        </h3>
        <button
          onClick={() => { setShowModal(true); setErrorMsg(''); setUploadFile(null); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#06B6D4] text-white rounded-lg text-xs font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" /> Upload File
        </button>
      </div>

      {files.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text" placeholder="Search files..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#06B6D4]/30 transition-all"
            />
          </div>
          <select
            value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 pr-8 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:border-[#06B6D4]/30 cursor-pointer"
          >
            <option value="all">All categories</option>
            {FILE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select
            value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 pr-8 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:border-[#06B6D4]/30 cursor-pointer"
          >
            <option value="all">All statuses</option>
            {FILE_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl">
          <FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No files found</p>
        </div>
      ) : (
        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">File</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Category</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Size</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Vis</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase hidden sm:table-cell">Date</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(f => {
                  const statusDef = getFileStatusDef(f.file_status || 'ready');
                  return (
                    <tr key={f.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02]">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm text-white truncate">{f.display_name || f.name}</p>
                            {f.description && <p className="text-xs text-slate-500 truncate">{f.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4"><span className="text-xs text-slate-400 capitalize whitespace-nowrap">{f.category}</span></td>
                      <td className="py-3 px-4"><span className="text-xs text-slate-400 whitespace-nowrap">{formatFileSize(f.file_size)}</span></td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap" style={{ backgroundColor: `${statusDef.color}15`, color: statusDef.color }}>
                          {statusDef.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${f.visibility === 'client' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                          {f.visibility === 'client' ? 'Client' : 'Internal'}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell"><span className="text-xs text-slate-500 whitespace-nowrap">{new Date(f.created_at).toLocaleDateString('en-GB')}</span></td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handlePreview(f)} className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer"><Eye className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDownload(f)} className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer"><Download className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleToggleVisibility(f)} className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-amber-400 transition-colors cursor-pointer" title="Toggle visibility">
                            <Eye className={`w-3.5 h-3.5 ${f.visibility !== 'client' ? 'line-through' : ''}`} />
                          </button>
                          <button onClick={() => handleArchive(f)} className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-amber-400 transition-colors cursor-pointer">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                          </button>
                          <button onClick={() => handleDelete(f)} className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-red-400 transition-colors cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Upload File</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {errorMsg && <p className="text-sm text-red-400 bg-red-500/10 rounded-lg p-3">{errorMsg}</p>}

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">File</label>
                <input type="file" onChange={e => { const f = e.target.files?.[0] || null; setUploadFile(f); if (f && !formData.display_name) setFormData({ ...formData, display_name: f.name }); }}
                  className="w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#06B6D4] file:text-white hover:file:bg-[#0891B2] cursor-pointer" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Display Name</label>
                <input type="text" value={formData.display_name} onChange={e => setFormData({ ...formData, display_name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 pr-8 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:border-[#06B6D4]/30 cursor-pointer">
                  {FILE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description (optional)</label>
                <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Visibility</label>
                  <select value={formData.visibility} onChange={e => setFormData({ ...formData, visibility: e.target.value })}
                    className="w-full px-3 py-2.5 pr-8 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:border-[#06B6D4]/30 cursor-pointer">
                    <option value="client">Client visible</option>
                    <option value="internal">Internal only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Downloadable</label>
                  <select value={formData.client_downloadable ? 'yes' : 'no'} onChange={e => setFormData({ ...formData, client_downloadable: e.target.value === 'yes' })}
                    className="w-full px-3 py-2.5 pr-8 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:border-[#06B6D4]/30 cursor-pointer">
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>

              <button onClick={handleUpload} disabled={uploading || !uploadFile}
                className="w-full py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap">
                {uploading ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading...</> : 'Upload'}
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
  );
}