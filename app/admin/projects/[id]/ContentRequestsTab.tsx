'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Plus, Send, Eye, X, Loader2, FileText, Clock, CheckCircle, AlertTriangle,
} from 'lucide-react';
import { FILE_CATEGORIES, getContentRequestStatusDef, getContentRequestPriorityDef, CONTENT_REQUEST_STATUSES, CONTENT_REQUEST_PRIORITIES } from '@/lib/file-definitions';

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
  client_visible: boolean;
  created_at: string;
}

export default function ContentRequestsTab({ project, onProjectUpdated }: { project: any; onProjectUpdated: () => void }) {
  const [requests, setRequests] = useState<ContentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', category: 'document', priority: 'normal',
    due_date: '', max_file_count: 5, required_file_types: [] as string[],
  });
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchRequests();
  }, [project.id]);

  async function fetchRequests() {
    setLoading(true);
    const { data } = await supabase
      .from('content_requests')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false });
    if (data) setRequests(data as ContentRequest[]);
    setLoading(false);
  }

  async function handleCreate() {
    if (!formData.title.trim()) return;
    setSaving(true);
    setErrorMsg('');

    const { data: clientData } = await supabase
      .from('projects')
      .select('client_id')
      .eq('id', project.id)
      .maybeSingle();

    if (!clientData?.client_id) {
      setErrorMsg('Project has no assigned client');
      setSaving(false);
      return;
    }

    const { error } = await supabase.from('content_requests').insert({
      project_id: project.id,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      priority: formData.priority,
      due_date: formData.due_date || null,
      max_file_count: formData.max_file_count,
      required_file_types: formData.required_file_types,
      status: 'draft',
      client_id: clientData.client_id,
      created_by: (await supabase.auth.getSession()).data.session?.user.id,
      client_visible: false,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setShowModal(false);
      setFormData({ title: '', description: '', category: 'document', priority: 'normal', due_date: '', max_file_count: 5, required_file_types: [] });
      fetchRequests();
      onProjectUpdated();
    }
    setSaving(false);
  }

  async function handleSubmit(request: ContentRequest) {
    if (!confirm('Submit this content request to the client? They will see it in their portal.')) return;
    await supabase.from('content_requests').update({
      status: 'requested',
      client_visible: true,
    }).eq('id', request.id);

    await supabase.from('project_activity').insert({
      project_id: project.id,
      title: 'Content requested from client',
      activity_type: 'content_requested',
      description: request.title,
    });

    fetchRequests();
    onProjectUpdated();
  }

  async function handleCancel(request: ContentRequest) {
    if (!confirm('Cancel this content request?')) return;
    await supabase.from('content_requests').update({ status: 'cancelled', client_visible: false }).eq('id', request.id);
    fetchRequests();
  }

  async function handleAccept(request: ContentRequest) {
    if (!confirm('Accept the submitted content and mark complete?')) return;
    await supabase.from('content_requests').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    }).eq('id', request.id);

    await supabase.from('project_activity').insert({
      project_id: project.id,
      title: 'Content request completed',
      activity_type: 'content_completed',
      description: request.title,
    });

    fetchRequests();
    onProjectUpdated();
  }

  const toggleFileType = (ext: string) => {
    setFormData(prev => {
      const types = prev.required_file_types.includes(ext)
        ? prev.required_file_types.filter(t => t !== ext)
        : [...prev.required_file_types, ext];
      return { ...prev, required_file_types: types };
    });
  };

  const fileTypeOptions = ['pdf', 'docx', 'xlsx', 'csv', 'txt', 'jpg', 'png', 'webp', 'svg', 'mp4', 'zip'];

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
        <h3 className="text-sm font-semibold text-white">Content Requests ({requests.length})</h3>
        <button
          onClick={() => { setShowModal(true); setErrorMsg(''); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#06B6D4] text-white rounded-lg text-xs font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" /> New Request
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl">
          <FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No content requests created yet</p>
          <p className="text-xs text-slate-500 mt-1">Request files, assets or content from the client</p>
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map(r => {
            const statusDef = getContentRequestStatusDef(r.status);
            const priorityDef = getContentRequestPriorityDef(r.priority);
            return (
              <div key={r.id} className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-white truncate">{r.title}</p>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap" style={{ backgroundColor: `${statusDef.color}15`, color: statusDef.color }}>
                        {statusDef.label}
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap" style={{ backgroundColor: `${priorityDef.color}15`, color: priorityDef.color }}>
                        {priorityDef.label}
                      </span>
                    </div>
                    {r.description && <p className="text-xs text-slate-400 line-clamp-1">{r.description}</p>}
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500">
                      <span>{r.category}</span>
                      {r.due_date && <span>Due {new Date(r.due_date).toLocaleDateString('en-GB')}</span>}
                      {r.required_file_types?.length ? <span>Accepts: {r.required_file_types.join(', ')}</span> : null}
                      {r.client_visible && <span className="text-emerald-400">Client visible</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    {r.status === 'draft' && (
                      <button onClick={() => handleSubmit(r)} className="px-3 py-1.5 bg-[#10B981] text-white rounded-lg text-xs font-semibold hover:bg-[#059669] transition-all cursor-pointer whitespace-nowrap flex items-center gap-1">
                        <Send className="w-3 h-3" /> Submit
                      </button>
                    )}
                    {(r.status === 'submitted' || r.status === 'partially_submitted') && (
                      <button onClick={() => handleAccept(r)} className="px-3 py-1.5 bg-[#10B981] text-white rounded-lg text-xs font-semibold hover:bg-[#059669] transition-all cursor-pointer whitespace-nowrap flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Accept
                      </button>
                    )}
                    {r.status !== 'completed' && r.status !== 'cancelled' && (
                      <button onClick={() => handleCancel(r)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">New Content Request</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {errorMsg && <p className="text-sm text-red-400 bg-red-500/10 rounded-lg p-3">{errorMsg}</p>}

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Title *</label>
                <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Brand logo assets"
                  className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what content you need..."
                  rows={3} maxLength={500}
                  className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 pr-8 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:border-[#06B6D4]/30 cursor-pointer">
                    {FILE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Priority</label>
                  <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2.5 pr-8 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:border-[#06B6D4]/30 cursor-pointer">
                    {CONTENT_REQUEST_PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Due Date</label>
                  <input type="date" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:border-[#06B6D4]/30 cursor-pointer" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Max Files</label>
                  <input type="number" min={1} max={50} value={formData.max_file_count} onChange={e => setFormData({ ...formData, max_file_count: parseInt(e.target.value) || 5 })}
                    className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:border-[#06B6D4]/30" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Accepted File Types</label>
                <div className="flex flex-wrap gap-1.5">
                  {fileTypeOptions.map(ext => (
                    <button key={ext} onClick={() => toggleFileType(ext)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                        formData.required_file_types.includes(ext)
                          ? 'bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/30'
                          : 'bg-white/5 text-slate-400 border border-[rgba(255,255,255,0.06)] hover:bg-white/10'
                      }`}>
                      .{ext}
                    </button>
                  ))}
                </div>
                {formData.required_file_types.length === 0 && (
                  <p className="text-[10px] text-slate-500 mt-1">No specific types selected (all types accepted)</p>
                )}
              </div>

              <button onClick={handleCreate} disabled={saving || !formData.title.trim()}
                className="w-full py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</> : 'Create Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}