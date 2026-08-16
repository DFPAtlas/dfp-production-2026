'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from '@/components/motion';
import { useRouter } from 'next/navigation';
import {
  Search, RefreshCw, Eye, ChevronDown, Filter, X, CheckCircle,
  Clock, XCircle, FileText, AlertCircle, Bug, Link, Copy,
  Play, Ban, ChevronLeft, ChevronRight, ExternalLink, MessageSquare,
} from 'lucide-react';
import AdminShell from '../../../../components/admin/AdminShell';



interface Feedback {
  id: string; assignment_id: string; job_id: string;
  project_id: string | null; environment_id: string | null;
  tester_id: string; feedback_type: string; severity: string;
  category: string | null; title: string; description: string;
  steps_to_reproduce: string | null; expected_result: string | null;
  actual_result: string | null; page_url: string | null;
  device: string | null; browser: string | null;
  os_version: string | null; screen_size: string | null;
  status: string; duplicate_of: string | null; admin_notes: string | null;
  created_at: string; updated_at: string;
  tester_name?: string; tester_email?: string;
  job_title?: string; project_name?: string;
}

const severityColors: Record<string, string> = {
  critical: '#EF4444', high: '#F97316', medium: '#F59E0B', low: '#6B7280',
};

const statusColors: Record<string, string> = {
  new: '#06B6D4', reviewing: '#8B5CF6', accepted: '#10B981',
  duplicate: '#F59E0B', rejected: '#EF4444', fixed: '#10B981',
  retest_needed: '#F97316', closed: '#6B7280',
};

export default function AdminFeedbackPage() {
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [filteredFeedback, setFilteredFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [projects, setProjects] = useState<any[]>([]);
  const [selected, setSelected] = useState<Feedback | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [noteUpdating, setNoteUpdating] = useState(false);

  const [counts, setCounts] = useState({
    new: 0, critical: 0, high: 0, accepted: 0, duplicate: 0, fixed: 0, retest_needed: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: fb } = await supabase.from('uat_feedback').select('*').order('created_at', { ascending: false });
    if (!fb) { setLoading(false); return; }

    const testerIds = [...new Set(fb.map((f: any) => f.tester_id))];
    const jobIds = [...new Set(fb.map((f: any) => f.job_id).filter(Boolean))];
    const projectIds = [...new Set(fb.map((f: any) => f.project_id).filter(Boolean))];

    const [{ data: testers }, { data: jobs }, { data: projs }] = await Promise.all([
      supabase.from('uat_testers').select('id, full_name, email').in('id', testerIds),
      supabase.from('uat_jobs').select('id, title').in('id', jobIds as any),
      supabase.from('uat_projects').select('id, name').in('id', projectIds as any),
    ]);

    const testerMap: Record<string, any> = {};
    testers?.forEach((t: any) => { testerMap[t.id] = t; });
    const jobMap: Record<string, any> = {};
    jobs?.forEach((j: any) => { jobMap[j.id] = j; });
    const projMap: Record<string, string> = {};
    projs?.forEach((p: any) => { projMap[p.id] = p.name; });

    const merged = fb.map((f: any) => ({
      ...f,
      tester_name: testerMap[f.tester_id]?.full_name || 'Unknown',
      tester_email: testerMap[f.tester_id]?.email || '',
      job_title: jobMap[f.job_id]?.title || null,
      project_name: projMap[f.project_id] || null,
    }));

    setFeedback(merged);
    setFilteredFeedback(merged);
    setProjects(projs || []);

    const c = { new: 0, critical: 0, high: 0, accepted: 0, duplicate: 0, fixed: 0, retest_needed: 0 };
    merged.forEach((f: any) => {
      if (f.status === 'new') c.new++;
      if (f.severity === 'critical') c.critical++;
      if (f.severity === 'high') c.high++;
      if (f.status === 'accepted') c.accepted++;
      if (f.status === 'duplicate') c.duplicate++;
      if (f.status === 'fixed') c.fixed++;
      if (f.status === 'retest_needed') c.retest_needed++;
    });
    setCounts(c);
    setLoading(false);
  };

  useEffect(() => {
    let filtered = feedback;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((f) =>
        (f.title && f.title.toLowerCase().includes(q)) ||
        (f.tester_name && f.tester_name.toLowerCase().includes(q)) ||
        (f.project_name && f.project_name.toLowerCase().includes(q)) ||
        (f.job_title && f.job_title.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== 'all') filtered = filtered.filter((f) => f.status === statusFilter);
    if (severityFilter !== 'all') filtered = filtered.filter((f) => f.severity === severityFilter);
    if (projectFilter !== 'all') filtered = filtered.filter((f) => f.project_id === projectFilter);
    setFilteredFeedback(filtered);
  }, [searchQuery, statusFilter, severityFilter, projectFilter, feedback]);

  const handleStatusChange = async (fbId: string, newStatus: string) => {
    setStatusUpdating(fbId);
    await supabase.from('uat_feedback').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', fbId);
    await supabase.from('uat_audit_log').insert({
      action: `Feedback ${newStatus}`,
      entity_type: 'uat_feedback',
      entity_id: fbId,
      new_value: { status: newStatus },
    });
    setStatusUpdating(null);
    if (detailOpen) {
      setSelected((prev) => prev ? { ...prev, status: newStatus } : null);
    }
    fetchData();
  };

  const handleSaveNote = async () => {
    if (!selected) return;
    setNoteUpdating(true);
    await supabase.from('uat_feedback').update({ admin_notes: adminNote, updated_at: new Date().toISOString() }).eq('id', selected.id);
    await supabase.from('uat_audit_log').insert({
      action: 'Admin note added',
      entity_type: 'uat_feedback',
      entity_id: selected.id,
      new_value: { admin_notes: adminNote },
    });
    setNoteUpdating(false);
    setSelected({ ...selected, admin_notes: adminNote });
    fetchData();
  };

  const openDetail = (item: Feedback) => {
    setSelected(item);
    setAdminNote(item.admin_notes || '');
    setDetailOpen(true);
  };

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
        </div>
      </AdminShell>
    );
  }

  const statCards = [
    { label: 'New', value: counts.new, color: '#06B6D4', filter: 'new' },
    { label: 'Critical', value: counts.critical, color: '#EF4444', filter: 'critical', isSeverity: true },
    { label: 'High', value: counts.high, color: '#F97316', filter: 'high', isSeverity: true },
    { label: 'Accepted', value: counts.accepted, color: '#10B981', filter: 'accepted' },
    { label: 'Duplicate', value: counts.duplicate, color: '#F59E0B', filter: 'duplicate' },
    { label: 'Fixed', value: counts.fixed, color: '#10B981', filter: 'fixed' },
    { label: 'Retest', value: counts.retest_needed, color: '#F97316', filter: 'retest_needed' },
  ];

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">UAT Feedback</h1>
          <p className="text-sm text-slate-400 mt-0.5">Review and manage bug reports and feedback from testers</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {statCards.map((card) => (
            <button key={card.label}
              onClick={() => {
                if (card.isSeverity) { setSeverityFilter(card.filter); setStatusFilter('all'); }
                else { setStatusFilter(card.filter); setSeverityFilter('all'); }
              }}
              className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-3 text-left hover:border-[rgba(255,255,255,0.1)] transition-all cursor-pointer">
              <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{card.label}</p>
            </button>
          ))}
        </div>

        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" placeholder="Search feedback..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-3 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
                  <option value="all">All Status</option>
                  <option value="new">New</option><option value="reviewing">Reviewing</option>
                  <option value="accepted">Accepted</option><option value="duplicate">Duplicate</option>
                  <option value="rejected">Rejected</option><option value="fixed">Fixed</option>
                  <option value="retest_needed">Retest Needed</option><option value="closed">Closed</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
              <div className="relative">
                <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}
                  className="pl-3 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
                  <option value="all">All Severity</option>
                  <option value="critical">Critical</option><option value="high">High</option>
                  <option value="medium">Medium</option><option value="low">Low</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
              <div className="relative">
                <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}
                  className="pl-3 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
                  <option value="all">All Projects</option>
                  {projects.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
              <button onClick={fetchData}
                className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-[#06B6D4] transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Title</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Tester</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Project</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Type</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Severity</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Date</th>
                  <th className="text-right text-xs font-medium text-slate-500 px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedback.map((fb) => (
                  <tr key={fb.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-white max-w-xs truncate">{fb.title}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-white">{fb.tester_name}</p>
                      <p className="text-xs text-slate-500">{fb.tester_email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-400">{fb.project_name || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-400 capitalize">{fb.feedback_type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-0.5 rounded-lg text-xs font-medium capitalize"
                        style={{ color: severityColors[fb.severity] || '#6B7280', backgroundColor: (severityColors[fb.severity] || '#6B7280') + '15' }}>
                        {fb.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-0.5 rounded-lg text-xs font-medium capitalize"
                        style={{ color: statusColors[fb.status] || '#94A3B8', backgroundColor: (statusColors[fb.status] || '#94A3B8') + '15' }}>
                        {fb.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-500">{new Date(fb.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openDetail(fb)} className="p-1.5 rounded-lg bg-white/5 border border-[rgba(255,255,255,0.06)] text-slate-400 hover:text-[#06B6D4] hover:border-[#06B6D4]/20 cursor-pointer" title="View">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {fb.status === 'new' && (
                          <>
                            <button onClick={() => handleStatusChange(fb.id, 'reviewing')} disabled={statusUpdating === fb.id}
                              className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 cursor-pointer" title="Start Review">
                              <Play className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleStatusChange(fb.id, 'accepted')} disabled={statusUpdating === fb.id}
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer" title="Accept">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleStatusChange(fb.id, 'rejected')} disabled={statusUpdating === fb.id}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer" title="Reject">
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {fb.status === 'reviewing' && (
                          <>
                            <button onClick={() => handleStatusChange(fb.id, 'accepted')} disabled={statusUpdating === fb.id}
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer" title="Accept">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleStatusChange(fb.id, 'rejected')} disabled={statusUpdating === fb.id}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer" title="Reject">
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleStatusChange(fb.id, 'duplicate')} disabled={statusUpdating === fb.id}
                              className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 cursor-pointer" title="Mark Duplicate">
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {fb.status === 'accepted' && (
                          <>
                            <button onClick={() => handleStatusChange(fb.id, 'fixed')} disabled={statusUpdating === fb.id}
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer" title="Mark Fixed">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleStatusChange(fb.id, 'closed')} disabled={statusUpdating === fb.id}
                              className="p-1.5 rounded-lg bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 cursor-pointer" title="Close">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {fb.status === 'fixed' && (
                          <button onClick={() => handleStatusChange(fb.id, 'retest_needed')} disabled={statusUpdating === fb.id}
                            className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 cursor-pointer" title="Retest Needed">
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {fb.status === 'retest_needed' && (
                          <>
                            <button onClick={() => handleStatusChange(fb.id, 'closed')} disabled={statusUpdating === fb.id}
                              className="p-1.5 rounded-lg bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 cursor-pointer" title="Close">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredFeedback.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-slate-500/10 flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No Feedback Found</h3>
              <p className="text-sm text-slate-400">
                {feedback.length === 0 ? 'No feedback has been submitted yet.' : 'No feedback matches your filters.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {detailOpen && selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setDetailOpen(false)}>
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex px-2 py-0.5 rounded-lg text-xs font-medium capitalize"
                  style={{ color: statusColors[selected.status] || '#94A3B8', backgroundColor: (statusColors[selected.status] || '#94A3B8') + '15' }}>
                  {selected.status.replace('_', ' ')}
                </span>
                <span className="inline-flex px-2 py-0.5 rounded-lg text-xs font-medium capitalize"
                  style={{ color: severityColors[selected.severity] || '#6B7280', backgroundColor: (severityColors[selected.severity] || '#6B7280') + '15' }}>
                  {selected.severity}
                </span>
              </div>
              <button onClick={() => setDetailOpen(false)} className="text-slate-500 hover:text-white text-xl leading-none cursor-pointer">&times;</button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">{selected.title}</h2>
                <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                  <span>Tester: {selected.tester_name}</span>
                  <span>Project: {selected.project_name || '-'}</span>
                  <span>Type: {selected.feedback_type}</span>
                  <span>Category: {selected.category || '-'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {selected.device && (
                  <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-0.5">Device</p>
                    <p className="text-slate-300">{selected.device}</p>
                  </div>
                )}
                {selected.browser && (
                  <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-0.5">Browser</p>
                    <p className="text-slate-300">{selected.browser}</p>
                  </div>
                )}
                {selected.os_version && (
                  <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-0.5">OS</p>
                    <p className="text-slate-300">{selected.os_version}</p>
                  </div>
                )}
                {selected.screen_size && (
                  <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-0.5">Screen Size</p>
                    <p className="text-slate-300">{selected.screen_size}</p>
                  </div>
                )}
              </div>

              {selected.page_url && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Page URL</p>
                  <a href={selected.page_url} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-[#06B6D4] hover:underline break-all flex items-center gap-1.5">
                    {selected.page_url} <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              <div>
                <p className="text-xs text-slate-500 mb-1">Description</p>
                <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{selected.description}</p>
                </div>
              </div>

              {selected.steps_to_reproduce && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Steps to Reproduce</p>
                  <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{selected.steps_to_reproduce}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selected.expected_result && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Expected Result</p>
                    <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">{selected.expected_result}</p>
                    </div>
                  </div>
                )}
                {selected.actual_result && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Actual Result</p>
                    <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">{selected.actual_result}</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1">Admin Notes</p>
                <div className="flex gap-2">
                  <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Add internal notes..."
                    className="flex-1 px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all resize-none"
                    rows={2} />
                  <button onClick={handleSaveNote} disabled={noteUpdating || adminNote === selected.admin_notes}
                    className="px-4 py-2 bg-[#06B6D4] hover:bg-[#0891B2] disabled:opacity-40 rounded-xl text-sm font-semibold text-white transition-colors cursor-pointer whitespace-nowrap self-end">
                    Save
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                {selected.status === 'new' && (
                  <>
                    <button onClick={() => handleStatusChange(selected.id, 'reviewing')} disabled={statusUpdating === selected.id}
                      className="px-3 py-2 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap">Start Review</button>
                    <button onClick={() => handleStatusChange(selected.id, 'accepted')} disabled={statusUpdating === selected.id}
                      className="px-3 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap">Accept</button>
                    <button onClick={() => handleStatusChange(selected.id, 'rejected')} disabled={statusUpdating === selected.id}
                      className="px-3 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap">Reject</button>
                    <button onClick={() => handleStatusChange(selected.id, 'duplicate')} disabled={statusUpdating === selected.id}
                      className="px-3 py-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap">Duplicate</button>
                  </>
                )}
                {selected.status === 'reviewing' && (
                  <>
                    <button onClick={() => handleStatusChange(selected.id, 'accepted')} disabled={statusUpdating === selected.id}
                      className="px-3 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap">Accept</button>
                    <button onClick={() => handleStatusChange(selected.id, 'rejected')} disabled={statusUpdating === selected.id}
                      className="px-3 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap">Reject</button>
                    <button onClick={() => handleStatusChange(selected.id, 'duplicate')} disabled={statusUpdating === selected.id}
                      className="px-3 py-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap">Duplicate</button>
                  </>
                )}
                {selected.status === 'accepted' && (
                  <>
                    <button onClick={() => handleStatusChange(selected.id, 'fixed')} disabled={statusUpdating === selected.id}
                      className="px-3 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap">Mark Fixed</button>
                    <button onClick={() => handleStatusChange(selected.id, 'closed')} disabled={statusUpdating === selected.id}
                      className="px-3 py-2 bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap">Close</button>
                  </>
                )}
                {selected.status === 'fixed' && (
                  <button onClick={() => handleStatusChange(selected.id, 'retest_needed')} disabled={statusUpdating === selected.id}
                    className="px-3 py-2 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap">Retest Needed</button>
                )}
                {selected.status === 'retest_needed' && (
                  <button onClick={() => handleStatusChange(selected.id, 'closed')} disabled={statusUpdating === selected.id}
                    className="px-3 py-2 bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap">Close</button>
                )}
                {['duplicate', 'rejected'].includes(selected.status) && (
                  <button onClick={() => handleStatusChange(selected.id, 'closed')} disabled={statusUpdating === selected.id}
                    className="px-3 py-2 bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap">Close</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}