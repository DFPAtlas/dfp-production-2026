'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  FolderKanban, Search, Filter, RefreshCw, Plus, Edit, Archive, Eye,
  ExternalLink, Globe, Server, ChevronDown, X, Save, Loader2, AlertCircle,
  CheckCircle, PauseCircle,
} from 'lucide-react';
import AdminShell from '../../../../components/admin/AdminShell';



interface UatProject {
  id: string;
  name: string;
  client_company: string | null;
  description: string | null;
  live_url: string | null;
  status: string;
  admin_owner_id: string | null;
  created_at: string;
  updated_at: string;
}

interface UatEnvironment {
  id: string;
  project_id: string;
  environment_name: string;
  environment_type: string;
  base_url: string;
  is_active: boolean;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: '#10B981', bg: 'bg-emerald-500/10' },
  paused: { label: 'Paused', color: '#F59E0B', bg: 'bg-amber-500/10' },
  archived: { label: 'Archived', color: '#6B7280', bg: 'bg-gray-500/10' },
};

const envTypeConfig: Record<string, { color: string }> = {
  development: { color: '#8B5CF6' },
  uat: { color: '#06B6D4' },
  staging: { color: '#F59E0B' },
  production: { color: '#10B981' },
  demo: { color: '#EC4899' },
};

export default function AdminUATProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<UatProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<UatProject[]>([]);
  const [projectEnvs, setProjectEnvs] = useState<Record<string, UatEnvironment[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Partial<UatProject> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: projData } = await supabase.from('uat_projects').select('id, name, client_company, description, live_url, status, admin_owner_id, created_at, updated_at').order('created_at', { ascending: false });
    const { data: envData } = await supabase.from('uat_environments').select('id, project_id, environment_name, environment_type, base_url, is_active').eq('is_active', true);

    if (projData) {
      setProjects(projData as UatProject[]);
      setFilteredProjects(projData as UatProject[]);
    }
    if (envData) {
      const grouped: Record<string, UatEnvironment[]> = {};
      (envData as UatEnvironment[]).forEach((e) => {
        if (!grouped[e.project_id]) grouped[e.project_id] = [];
        grouped[e.project_id].push(e);
      });
      setProjectEnvs(grouped);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    let filtered = projects;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        (p.client_company && p.client_company.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== 'all') filtered = filtered.filter((p) => p.status === statusFilter);
    setFilteredProjects(filtered);
  }, [searchQuery, statusFilter, projects]);

  const logAudit = async (action: string, entityId: string, prev?: any, next?: any) => {
    await supabase.from('uat_audit_log').insert({
      action, entity_type: 'uat_project', entity_id: entityId,
      previous_value: prev || null, new_value: next || null,
    });
  };

  const openCreateDrawer = () => {
    setEditingProject({ name: '', client_company: '', description: '', live_url: '', status: 'active' });
    setSaveError('');
    setDrawerOpen(true);
  };

  const openEditDrawer = (project: UatProject) => {
    setEditingProject({ ...project });
    setSaveError('');
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!editingProject || !editingProject.name?.trim()) {
      setSaveError('Project name is required.');
      return;
    }
    setSaving(true);
    setSaveError('');

    const payload = {
      name: editingProject.name.trim(),
      client_company: editingProject.client_company?.trim() || null,
      description: editingProject.description?.trim() || null,
      live_url: editingProject.live_url?.trim() || null,
      status: editingProject.status || 'active',
      updated_at: new Date().toISOString(),
    };

    if (editingProject.id) {
      const prev = projects.find((p) => p.id === editingProject.id);
      const { error } = await supabase.from('uat_projects').update(payload).eq('id', editingProject.id);
      if (!error) {
        await logAudit('Project updated', editingProject.id, prev, payload);
        await fetchData();
        setDrawerOpen(false);
      } else {
        setSaveError('Failed to update project.');
      }
    } else {
      const { data, error } = await supabase.from('uat_projects').insert({ ...payload, created_at: new Date().toISOString() }).select('id').single();
      if (!error && data) {
        await logAudit('Project created', data.id, null, payload);
        await fetchData();
        setDrawerOpen(false);
      } else {
        setSaveError('Failed to create project.');
      }
    }
    setSaving(false);
  };

  const handleArchive = async (project: UatProject) => {
    const newStatus = project.status === 'archived' ? 'active' : 'archived';
    const { error } = await supabase.from('uat_projects').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', project.id);
    if (!error) {
      await logAudit(`Status changed to ${newStatus}`, project.id, { status: project.status }, { status: newStatus });
      fetchData();
    }
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

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">UAT Projects</h1>
            <p className="text-sm text-slate-400 mt-0.5">Manage test projects and their environments</p>
          </div>
          <button
            onClick={openCreateDrawer}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] hover:bg-[#0891B2] rounded-xl text-sm font-semibold text-white transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all"
              />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-9 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="archived">Archived</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
              <button
                onClick={() => { setRefreshing(true); fetchData(); }}
                disabled={refreshing}
                className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-[#06B6D4] hover:border-[#06B6D4]/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {filteredProjects.map((project, i) => {
              const sc = statusConfig[project.status] || statusConfig.active;
              const envs = projectEnvs[project.id] || [];
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 hover:border-[#06B6D4]/20 transition-all cursor-pointer"
                  onClick={() => router.push(`/admin/uat/projects/${project.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate">{project.name}</h3>
                      {project.client_company && (
                        <p className="text-xs text-slate-400 mt-0.5">{project.client_company}</p>
                      )}
                    </div>
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium border shrink-0"
                      style={{ backgroundColor: sc.bg, color: sc.color, borderColor: sc.color + '30' }}
                    >
                      {sc.label}
                    </span>
                  </div>

                  {project.description && (
                    <p className="text-sm text-slate-400 leading-relaxed mb-4 line-clamp-2">{project.description}</p>
                  )}

                  <div className="space-y-2 mb-4">
                    {project.live_url && (
                      <a
                        href={project.live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 text-xs text-slate-400 hover:text-[#06B6D4] transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        {project.live_url}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {envs.map((env) => (
                      <div key={env.id} className="flex items-center gap-2 text-xs text-slate-400">
                        <Server className="w-3.5 h-3.5" style={{ color: envTypeConfig[env.environment_type]?.color || '#06B6D4' }} />
                        <span style={{ color: envTypeConfig[env.environment_type]?.color || '#06B6D4' }} className="font-medium uppercase">{env.environment_type}</span>
                        <span className="text-slate-500">—</span>
                        <span className="truncate">{env.base_url}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditDrawer(project); }}
                      className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-[rgba(255,255,255,0.06)] text-xs text-slate-400 hover:text-[#06B6D4] hover:border-[#06B6D4]/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleArchive(project); }}
                      className="px-3 py-2 rounded-lg bg-white/5 border border-[rgba(255,255,255,0.06)] text-xs text-slate-400 hover:text-amber-400 hover:border-amber-400/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      {project.status === 'archived' ? 'Reactivate' : 'Archive'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/admin/uat/projects/${project.id}`); }}
                      className="px-3 py-2 rounded-lg bg-white/5 border border-[rgba(255,255,255,0.06)] text-xs text-slate-400 hover:text-[#06B6D4] hover:border-[#06B6D4]/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-16">
              <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No projects found</p>
              <p className="text-sm text-slate-500 mt-1">
                {searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Create your first test project to get started'}
              </p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {drawerOpen && editingProject && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[#1E293B] border-l border-[rgba(255,255,255,0.08)] z-50 shadow-2xl overflow-y-auto"
            >
              <div className="sticky top-0 bg-[#1E293B] border-b border-[rgba(255,255,255,0.08)] p-6 flex items-center justify-between z-10">
                <h3 className="text-lg font-bold text-white">
                  {editingProject.id ? 'Edit Project' : 'New Project'}
                </h3>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Project Name *</label>
                  <input
                    type="text"
                    value={editingProject.name || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                    placeholder="e.g. QuickGuard"
                    className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Client / Company</label>
                  <input
                    type="text"
                    value={editingProject.client_company || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, client_company: e.target.value })}
                    placeholder="e.g. Digital Footprint"
                    className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                  <textarea
                    value={editingProject.description || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                    rows={3}
                    placeholder="Brief description of the project..."
                    maxLength={500}
                    className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Live URL</label>
                  <input
                    type="url"
                    value={editingProject.live_url || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, live_url: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setEditingProject({ ...editingProject, status: key })}
                        className="px-4 py-2 rounded-xl text-sm font-medium border transition-all cursor-pointer whitespace-nowrap"
                        style={{
                          color: editingProject.status === key ? config.color : '#94A3B8',
                          borderColor: editingProject.status === key ? config.color + '40' : 'rgba(255,255,255,0.08)',
                          backgroundColor: editingProject.status === key ? config.color + '15' : 'transparent',
                        }}
                      >
                        {config.label}
                      </button>
                    ))}
                  </div>
                </div>

                {saveError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{saveError}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="flex-1 px-4 py-3 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 px-4 py-3 bg-[#06B6D4] hover:bg-[#0891B2] rounded-xl text-sm font-semibold text-white transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 whitespace-nowrap"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {editingProject.id ? 'Save Changes' : 'Create Project'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AdminShell>
  );
}