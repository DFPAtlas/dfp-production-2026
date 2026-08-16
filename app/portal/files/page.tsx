'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from '@/components/motion';
import {
  Upload, Download, Search, FileText, FileImage, File,
  FileSpreadsheet, Filter, X, Eye, Clock, CheckCircle,
  AlertTriangle, FolderOpen, ArrowUpCircle, Replace,
  Send, Loader2, ExternalLink, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import PortalShell from '../PortalShell';
import { formatFileSize, getFileStatusDef, FILE_CATEGORIES, ALLOWED_EXTENSIONS, generateStoragePath } from '@/lib/file-definitions';
import { getContentRequestStatusDef, getContentRequestPriorityDef } from '@/lib/file-definitions';

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
  content_request_id?: string | null;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  name: string;
}

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

function getFileIcon(fileType: string) {
  if (!fileType) return File;
  if (fileType.startsWith('image/')) return FileImage;
  if (fileType.includes('spreadsheet') || fileType.includes('csv')) return FileSpreadsheet;
  if (fileType.includes('pdf') || fileType.includes('document')) return FileText;
  return File;
}

export default function FilesPage() {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [contentRequests, setContentRequests] = useState<ContentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [activeTab, setActiveTab] = useState<'assets' | 'requests'>('assets');
  const [uploadModal, setUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ project_id: '', category: 'document', description: '', request_id: '' });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [requestUploadModal, setRequestUploadModal] = useState<ContentRequest | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Client');
      setUserId(session.user.id);

      const { data: clientData } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!clientData) { setLoading(false); return; }

      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name')
        .eq('client_id', clientData.id)
        .order('created_at', { ascending: false });

      if (projectsData) {
        setProjects(projectsData);
        const projectIds = projectsData.map(p => p.id);

        if (projectIds.length > 0) {
          const [filesRes, requestsRes] = await Promise.all([
            supabase.from('project_files').select('*').in('project_id', projectIds).eq('visibility', 'client').order('created_at', { ascending: false }),
            supabase.from('content_requests').select('*').in('project_id', projectIds).eq('client_visible', true).neq('status', 'cancelled').order('created_at', { ascending: false }),
          ]);

          if (filesRes.data) setFiles(filesRes.data as ProjectFile[]);
          if (requestsRes.data) setContentRequests(requestsRes.data as ContentRequest[]);
        }
      }
      setLoading(false);
    }
    init();
  }, []);

  async function handleUpload() {
    if (!uploadFile || !uploadForm.project_id) return;
    setUploading(true);
    setUploadError('');
    setUploadSuccess(false);

    const filePath = generateStoragePath('client-uploads', uploadFile.name, uploadForm.project_id);

    const { error: uploadErr } = await supabase.storage
      .from('project-files')
      .upload(filePath, uploadFile, { contentType: uploadFile.type, upsert: false });

    if (uploadErr) {
      setUploadError(uploadErr.message);
      setUploading(false);
      return;
    }

    const { data: inserted, error: insertErr } = await supabase.from('project_files').insert({
      project_id: uploadForm.project_id,
      name: uploadFile.name,
      display_name: uploadFile.name,
      original_name: uploadFile.name,
      file_name: uploadFile.name,
      file_path: filePath,
      file_size: uploadFile.size,
      file_type: uploadFile.type,
      category: uploadForm.category,
      description: uploadForm.description || '',
      visibility: 'client',
      source: 'client',
      file_status: 'ready',
      version: 1,
      client_downloadable: true,
      client_replaceable: true,
      storage_bucket: 'project-files',
      uploaded_by: userId,
      content_request_id: uploadForm.request_id || null,
    }).select().single();

    if (insertErr) {
      setUploadError(insertErr.message);
    } else {
      setUploadSuccess(true);
      if (inserted) setFiles(prev => [inserted as ProjectFile, ...prev]);
      setUploadFile(null);
      setUploadForm({ project_id: '', category: 'document', description: '', request_id: '' });
      setTimeout(() => { setUploadModal(false); setUploadSuccess(false); }, 1500);
    }
    setUploading(false);
  }

  async function handleDownload(file: ProjectFile) {
    const { data } = await supabase.storage.from('project-files').createSignedUrl(file.file_path, 120);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  }

  async function handlePreview(file: ProjectFile) {
    if (file.file_type && (file.file_type.startsWith('image/') || file.file_type === 'application/pdf')) {
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
      if (!newFile) return;
      target.removeEventListener('change', listener);

      const filePath = generateStoragePath('client-uploads', newFile.name, file.project_id);

      const { error: uploadErr } = await supabase.storage
        .from('project-files')
        .upload(filePath, newFile, { contentType: newFile.type, upsert: false });

      if (uploadErr) return;

      await supabase.from('project_files').update({
        file_status: 'replaced',
      }).eq('id', file.id);

      const { data: newVersion } = await supabase.from('project_files').insert({
        project_id: file.project_id,
        name: newFile.name,
        display_name: file.display_name || newFile.name,
        original_name: newFile.name,
        file_name: newFile.name,
        file_path: filePath,
        file_size: newFile.size,
        file_type: newFile.type,
        category: file.category,
        description: file.description || '',
        visibility: 'client',
        source: 'client',
        file_status: 'ready',
        version: (file.version || 1) + 1,
        client_downloadable: true,
        client_replaceable: true,
        storage_bucket: 'project-files',
        uploaded_by: userId,
      }).select().single();

      if (newVersion) {
        setFiles(prev => [newVersion as ProjectFile, ...prev.filter(f => f.id !== file.id)]);
      }
    };
    fileInputRef.current?.addEventListener('change', listener);
  }

  const filteredFiles = files.filter(f => {
    const matchesSearch = (f.display_name || f.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = filterProject === 'all' || f.project_id === filterProject;
    const matchesCategory = filterCategory === 'all' || f.category === filterCategory;
    let matchesSection = true;
    if (activeSection === 'my-uploads') matchesSection = f.source === 'client';
    else if (activeSection === 'shared') matchesSection = f.source !== 'client';
    else if (activeSection === 'branding') matchesSection = f.category === 'branding' || f.category === 'logo';
    return matchesSearch && matchesProject && matchesCategory && matchesSection;
  });

  const activeRequests = contentRequests.filter(r => r.status !== 'completed' && r.status !== 'cancelled');
  const completedRequests = contentRequests.filter(r => r.status === 'completed');

  if (loading) {
    return (
      <PortalShell>
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-3 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
        </div>
      </PortalShell>
    );
  }

  const sections = [
    { value: 'all', label: 'All Files', count: files.length },
    { value: 'shared', label: 'Recently Shared', count: files.filter(f => f.source !== 'client').length },
    { value: 'my-uploads', label: 'Your Uploads', count: files.filter(f => f.source === 'client').length },
    { value: 'branding', label: 'Brand Assets', count: files.filter(f => f.category === 'branding' || f.category === 'logo').length },
  ];

  return (
    <PortalShell>
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">Content &amp; Assets</h1>
            <p className="text-slate-400 mt-1">Securely share and review project files</p>
          </div>
          <button
            onClick={() => { setUploadModal(true); setUploadError(''); setUploadSuccess(false); setUploadFile(null); }}
            disabled={projects.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl font-medium hover:bg-[#0891B2] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer whitespace-nowrap"
          >
            <Upload className="w-4 h-4" /> Upload File
          </button>
          <input ref={fileInputRef} type="file" className="hidden" />
        </motion.div>

        <div className="flex items-center gap-2 border-b border-white/[0.07] pb-0">
          <button
            onClick={() => setActiveTab('assets')}
            className={`px-5 py-2.5 text-sm font-semibold transition-all cursor-pointer whitespace-nowrap rounded-t-xl ${
              activeTab === 'assets' ? 'text-[#22D3EE] border-b-2 border-[#22D3EE] bg-[#22D3EE]/5' : 'text-slate-400 hover:text-white'
            }`}
          >
            Files &amp; Assets
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-5 py-2.5 text-sm font-semibold transition-all cursor-pointer whitespace-nowrap rounded-t-xl ${
              activeTab === 'requests' ? 'text-[#22D3EE] border-b-2 border-[#22D3EE] bg-[#22D3EE]/5' : 'text-slate-400 hover:text-white'
            }`}
          >
            Content Requests
            {activeRequests.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#7C3AED]/20 text-[#C4B5FD]">{activeRequests.length}</span>
            )}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'assets' && (
            <motion.div key="assets" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-6">
              {files.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {sections.map(s => (
                      <button key={s.value} onClick={() => setActiveSection(s.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                          activeSection === s.value ? 'bg-[#06B6D4]/15 text-[#22D3EE]' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}>{s.label} ({s.count})</button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input type="text" placeholder="Search files..." value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full sm:w-48 pl-9 pr-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#06B6D4]/30 transition-all" />
                    </div>
                    <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
                      className="px-3 py-2 pr-8 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-xs text-white focus:outline-none focus:border-[#06B6D4]/30 cursor-pointer">
                      <option value="all">All projects</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {files.length === 0 ? (
                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FolderOpen className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">No files yet</h3>
                  <p className="text-slate-400 max-w-sm mx-auto mb-6">Upload your first file or wait for the team to share project assets with you.</p>
                  <button
                    onClick={() => { setUploadModal(true); setUploadError(''); setUploadSuccess(false); setUploadFile(null); }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl font-medium hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Upload className="w-4 h-4" /> Upload your first file
                  </button>
                </div>
              ) : (
                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[rgba(255,255,255,0.06)] bg-white/[0.02]">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">File</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Project</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Size</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Date</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredFiles.map(file => {
                          const FIcon = getFileIcon(file.file_type);
                          const projectName = projects.find(p => p.id === file.project_id)?.name || 'Project';
                          const statusDef = getFileStatusDef(file.file_status || 'ready');
                          return (
                            <tr key={file.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                                    <FIcon className="w-4 h-4 text-slate-400" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{file.display_name || file.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] text-slate-500 capitalize">{file.category}</span>
                                      {(file.file_status && file.file_status !== 'ready') && (
                                        <span className="text-[10px] px-1 py-0.5 rounded" style={{ backgroundColor: `${statusDef.color}15`, color: statusDef.color }}>
                                          {statusDef.label}
                                        </span>
                                      )}
                                      {file.version && file.version > 1 && (
                                        <span className="text-[10px] text-slate-600">v{file.version}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 hidden md:table-cell">
                                <Link href={`/portal/projects/${file.project_id}`} className="text-xs text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer">{projectName}</Link>
                              </td>
                              <td className="py-3 px-4"><span className="text-xs text-slate-400 whitespace-nowrap">{formatFileSize(file.file_size)}</span></td>
                              <td className="py-3 px-4 hidden sm:table-cell">
                                <span className="text-xs text-slate-500 whitespace-nowrap">
                                  {new Date(file.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button onClick={() => handlePreview(file)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#06B6D4] hover:bg-[#06B6D4]/5 transition-colors cursor-pointer"><Eye className="w-4 h-4" /></button>
                                  {file.client_downloadable !== false && (
                                    <button onClick={() => handleDownload(file)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#06B6D4] hover:bg-[#06B6D4]/5 transition-colors cursor-pointer"><Download className="w-4 h-4" /></button>
                                  )}
                                  {file.client_replaceable && (
                                    <button onClick={() => handleReplace(file)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-400/5 transition-colors cursor-pointer" title="Replace with new version"><Replace className="w-4 h-4" /></button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {filteredFiles.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                      <Search className="w-8 h-8 mx-auto mb-3 opacity-40" />
                      <p className="text-sm">No files match your filters</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'requests' && (
            <motion.div key="requests" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-6">
              {activeRequests.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">Awaiting Your Response</h3>
                  <div className="space-y-3">
                    {activeRequests.map(r => {
                      const statusDef = getContentRequestStatusDef(r.status);
                      const priorityDef = getContentRequestPriorityDef(r.priority);
                      const isOverdue = r.due_date && new Date(r.due_date) < new Date();
                      const project = projects.find(p => p.id === r.project_id);
                      const submittedCount = files.filter(f => f.content_request_id === r.id).length;
                      return (
                        <div key={r.id} className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-5 hover:bg-white/[0.02] transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
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
                              <p className="text-lg font-bold text-white">{r.title}</p>
                              {r.description && <p className="text-sm text-slate-400 mt-1 line-clamp-2">{r.description}</p>}
                              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                                {project && <span>{project.name}</span>}
                                <span className="capitalize">{r.category}</span>
                                {r.due_date && <span>Due {new Date(r.due_date).toLocaleDateString('en-GB')}</span>}
                                <span>{submittedCount}/{r.max_file_count} files</span>
                                {r.required_file_types?.length ? <span>Format: {r.required_file_types.join(', ')}</span> : null}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => {
                                  setUploadModal(true);
                                  setUploadError('');
                                  setUploadSuccess(false);
                                  setUploadFile(null);
                                  setUploadForm({ project_id: r.project_id, category: r.category, description: '', request_id: r.id });
                                }}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
                              >
                                <Upload className="w-4 h-4" /> Upload
                              </button>
                              <Link href={`/portal/files/requests/${r.id}`}
                                className="inline-flex items-center gap-1 px-3 py-2 text-slate-400 hover:text-white transition-colors cursor-pointer">
                                <ChevronRight className="w-5 h-5" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {completedRequests.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">Completed</h3>
                  <div className="space-y-2">
                    {completedRequests.map(r => {
                      const project = projects.find(p => p.id === r.project_id);
                      return (
                        <div key={r.id} className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 opacity-75">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-300 truncate">{r.title}</p>
                              <p className="text-xs text-slate-500">{project?.name} · {r.category}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {contentRequests.length === 0 && (
                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-12 text-center">
                  <CheckCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">No content requests</h3>
                  <p className="text-slate-400 max-w-sm mx-auto">When the team needs files or content from you, those requests will appear here.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

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

                {!uploadForm.request_id && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Project</label>
                    <select value={uploadForm.project_id} onChange={e => setUploadForm({ ...uploadForm, project_id: e.target.value })}
                      className="w-full px-3 py-2.5 pr-8 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:border-[#06B6D4]/30 cursor-pointer">
                      <option value="">Select project...</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                  <select value={uploadForm.category} onChange={e => setUploadForm({ ...uploadForm, category: e.target.value })}
                    className="w-full px-3 py-2.5 pr-8 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:border-[#06B6D4]/30 cursor-pointer">
                    {FILE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description (optional)</label>
                  <input type="text" value={uploadForm.description} onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })}
                    placeholder="Brief note about this file..."
                    className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
                </div>

                <div className="text-xs text-slate-500">
                  Accepted: {ALLOWED_EXTENSIONS.map(e => `.${e}`).join(', ')}. Max 50MB.
                </div>

                <button onClick={handleUpload} disabled={uploading || !uploadFile || (!uploadForm.request_id && !uploadForm.project_id)}
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
              {previewUrl.endsWith('.pdf') || previewUrl.includes('pdf') ? (
                <iframe src={previewUrl} className="w-[80vw] h-[85vh] rounded-2xl" />
              ) : (
                <img src={previewUrl} alt="Preview" className="max-w-full max-h-[85vh] rounded-2xl object-contain" />
              )}
            </div>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
