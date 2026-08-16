'use client';

import { useState, useEffect, type MouseEvent } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import CommandShell from '@/components/admin/CommandShell';
import {
  Plus, Search, Filter, X, Edit3, Archive, RotateCcw, ExternalLink,
  FolderKanban, Heart, Users, DollarSign, Calendar, ChevronDown, RefreshCw
} from 'lucide-react';



const STATUS_OPTIONS = [
  { value: 'idea', label: 'Idea', color: '#6366F1' },
  { value: 'planning', label: 'Planning', color: '#8B5CF6' },
  { value: 'development', label: 'Development', color: '#F59E0B' },
  { value: 'testing', label: 'Testing', color: '#3B82F6' },
  { value: 'uat', label: 'UAT', color: '#06B6D4' },
  { value: 'live', label: 'Live', color: '#10B981' },
  { value: 'maintenance', label: 'Maintenance', color: '#EC4899' },
  { value: 'paused', label: 'Paused', color: '#9CA3AF' },
  { value: 'archived', label: 'Archived', color: '#6B7280' },
];

export default function CommandProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [formData, setFormData] = useState({
    name: '', slug: '', description: '', status: 'idea', owner: '',
    contact_email: '', launch_date: '', monthly_running_cost: '', notes: '',
    github_url: '', live_url: '', admin_url: '', supabase_url: '', stripe_url: '', n8n_url: ''
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    const { data } = await supabase.from('digital_footprint_projects').select('*').order('created_at', { ascending: false });
    if (data) { setProjects(data); setFilteredProjects(data); }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    let filtered = projects;
    if (!showArchived) filtered = filtered.filter(p => p.status !== 'archived');
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q) || (p.owner && p.owner.toLowerCase().includes(q)));
    }
    if (statusFilter !== 'all') filtered = filtered.filter(p => p.status === statusFilter);
    setFilteredProjects(filtered);
  }, [searchQuery, statusFilter, showArchived, projects]);

  const openNewForm = () => {
    setEditingProject(null);
    setFormData({ name: '', slug: '', description: '', status: 'idea', owner: '', contact_email: '', launch_date: '', monthly_running_cost: '', notes: '', github_url: '', live_url: '', admin_url: '', supabase_url: '', stripe_url: '', n8n_url: '' });
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (project: any) => {
    setEditingProject(project);
    setFormData({
      name: project.name || '', slug: project.slug || '', description: project.description || '',
      status: project.status || 'idea', owner: project.owner || '', contact_email: project.contact_email || '',
      launch_date: project.launch_date || '', monthly_running_cost: project.monthly_running_cost?.toString() || '',
      notes: project.notes || '', github_url: project.github_url || '', live_url: project.live_url || '',
      admin_url: project.admin_url || '', supabase_url: project.supabase_url || '',
      stripe_url: project.stripe_url || '', n8n_url: project.n8n_url || ''
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formData.name || !formData.slug) { setFormError('Name and slug are required'); return; }
    setSaving(true);

    const payload = {
      name: formData.name,
      slug: formData.slug.toLowerCase().replace(/\s+/g, '-'),
      description: formData.description || null,
      status: formData.status,
      owner: formData.owner || null,
      contact_email: formData.contact_email || null,
      launch_date: formData.launch_date || null,
      monthly_running_cost: formData.monthly_running_cost ? parseFloat(formData.monthly_running_cost) : 0,
      notes: formData.notes || null,
      github_url: formData.github_url || null,
      live_url: formData.live_url || null,
      admin_url: formData.admin_url || null,
      supabase_url: formData.supabase_url || null,
      stripe_url: formData.stripe_url || null,
      n8n_url: formData.n8n_url || null,
    };

    if (editingProject) {
      const { error } = await supabase.from('digital_footprint_projects').update(payload).eq('id', editingProject.id);
      if (error) { setFormError(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from('digital_footprint_projects').insert([payload]);
      if (error) { setFormError(error.message); setSaving(false); return; }
    }

    setSaving(false);
    setShowForm(false);
    fetchProjects();
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Archive this project?')) return;
    await supabase.from('digital_footprint_projects').update({ status: 'archived', archived_at: new Date().toISOString() }).eq('id', id);
    fetchProjects();
  };

  const handleRestore = async (id: string) => {
    await supabase.from('digital_footprint_projects').update({ status: 'idea', archived_at: null }).eq('id', id);
    fetchProjects();
  };

  const getStatusStyle = (status: string) => {
    const s = STATUS_OPTIONS.find(o => o.value === status);
    return s || { label: status, color: '#64748B' };
  };

  if (loading) {
    return (
      <CommandShell>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
        </div>
      </CommandShell>
    );
  }

  return (
    <CommandShell>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Projects</h1>
            <p className="text-sm text-slate-400">Manage all Digital-Footprint projects from one place</p>
          </div>
          <button onClick={openNewForm} className="flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap">
            <Plus className="w-4 h-4" />New Project
          </button>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden mb-6">
          <div className="p-4 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" placeholder="Search by name, slug or owner..." value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select value={statusFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
                  className="pl-9 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
                  <option value="all">All Status</option>
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
              <button onClick={() => setShowArchived(!showArchived)}
                className={`px-3 py-2.5 rounded-xl text-sm border transition-all cursor-pointer whitespace-nowrap ${showArchived ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-white/5 border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white'}`}>
                {showArchived ? 'Hide Archived' : 'Show Archived'}
              </button>
              <button onClick={() => { setRefreshing(true); fetchProjects(); }} disabled={refreshing}
                className="px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50">
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="glass-card rounded-2xl p-16 text-center">
            <FolderKanban className="w-14 h-14 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Projects Found</h3>
            <p className="text-sm text-slate-400 mb-6">{projects.length === 0 ? 'Create your first project to start monitoring' : 'Try adjusting your filters'}</p>
            {projects.length === 0 && (
              <button onClick={openNewForm} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer">
                <Plus className="w-4 h-4" />Create First Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProjects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card rounded-2xl p-5 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getStatusStyle(project.status).color }} />
                    <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: getStatusStyle(project.status).color }}>
                      {getStatusStyle(project.status).label}
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditForm(project)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {project.status !== 'archived' ? (
                      <button onClick={() => handleArchive(project.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors cursor-pointer">
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button onClick={() => handleRestore(project.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-green-500/10 text-slate-400 hover:text-green-400 transition-colors cursor-pointer">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="font-bold text-white mb-1 truncate">{project.name}</h3>
                <p className="text-xs text-slate-500 mb-3 font-mono">{project.slug}</p>

                {project.description && (
                  <p className="text-xs text-slate-400 mb-3 line-clamp-2">{project.description}</p>
                )}

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Heart className="w-3 h-3" />
                    <span>Health: </span>
                    <span className="font-semibold" style={{ color: (project.health_score || 0) >= 80 ? '#10B981' : (project.health_score || 0) >= 50 ? '#F59E0B' : '#EF4444' }}>
                      {project.health_score || '--'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Users className="w-3 h-3" />
                    <span>{project.user_count || 0} users</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <DollarSign className="w-3 h-3" />
                    <span>£{(project.monthly_running_cost || 0).toLocaleString()}/mo</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>{project.launch_date ? new Date(project.launch_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : 'TBD'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {project.live_url && (
                    <a href={project.live_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.03] border border-[rgba(255,255,255,0.06)] text-[10px] text-slate-400 hover:text-[#06B6D4] hover:border-[#06B6D4]/30 transition-colors cursor-pointer">
                      <ExternalLink className="w-3 h-3" />Live
                    </a>
                  )}
                  {project.github_url && (
                    <a href={project.github_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.03] border border-[rgba(255,255,255,0.06)] text-[10px] text-slate-400 hover:text-[#06B6D4] hover:border-[#06B6D4]/30 transition-colors cursor-pointer">
                      <ExternalLink className="w-3 h-3" />GitHub
                    </a>
                  )}
                  {project.owner && (
                    <span className="px-2 py-1 rounded-lg bg-white/[0.03] border border-[rgba(255,255,255,0.06)] text-[10px] text-slate-500">
                      {project.owner}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowForm(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
                className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white">{editingProject ? 'Edit Project' : 'Create Project'}</h2>
                    <p className="text-xs text-slate-400">Configure project details and integrations</p>
                  </div>
                  <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSave} className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Name *</label>
                      <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., QuickGuard"
                        className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Slug *</label>
                      <input type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="e.g., quickguard"
                        className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all font-mono" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                    <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the project..." rows={2} maxLength={500}
                      className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all resize-none" />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                      <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
                        {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Owner</label>
                      <input type="text" value={formData.owner} onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                        placeholder="James Mitchell"
                        className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Contact Email</label>
                      <input type="email" value={formData.contact_email} onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                        placeholder="hello@example.com"
                        className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Launch Date</label>
                      <input type="date" value={formData.launch_date} onChange={(e) => setFormData({ ...formData, launch_date: e.target.value })}
                        className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all cursor-pointer" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Monthly Cost (£)</label>
                      <input type="number" value={formData.monthly_running_cost} onChange={(e) => setFormData({ ...formData, monthly_running_cost: e.target.value })}
                        placeholder="0.00" step="0.01"
                        className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">URLs & Integrations</label>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="url" value={formData.github_url} onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                        placeholder="GitHub URL"
                        className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
                      <input type="url" value={formData.live_url} onChange={(e) => setFormData({ ...formData, live_url: e.target.value })}
                        placeholder="Live URL"
                        className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
                      <input type="url" value={formData.admin_url} onChange={(e) => setFormData({ ...formData, admin_url: e.target.value })}
                        placeholder="Admin URL"
                        className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
                      <input type="url" value={formData.supabase_url} onChange={(e) => setFormData({ ...formData, supabase_url: e.target.value })}
                        placeholder="Supabase URL"
                        className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
                      <input type="url" value={formData.stripe_url} onChange={(e) => setFormData({ ...formData, stripe_url: e.target.value })}
                        placeholder="Stripe URL"
                        className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
                      <input type="url" value={formData.n8n_url} onChange={(e) => setFormData({ ...formData, n8n_url: e.target.value })}
                        placeholder="n8n URL"
                        className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Notes</label>
                    <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Internal notes..." rows={2} maxLength={1000}
                      className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all resize-none" />
                  </div>

                  {formError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <p className="text-red-400 text-xs">{formError}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowForm(false)}
                      className="flex-1 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-400 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all cursor-pointer">
                      Cancel
                    </button>
                    <button type="submit" disabled={saving}
                      className="flex-1 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                      {saving ? 'Saving...' : editingProject ? 'Update Project' : 'Create Project'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </CommandShell>
  );
}
