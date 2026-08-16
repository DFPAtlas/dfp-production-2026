'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Edit, Save, Loader2, AlertCircle, Globe, ExternalLink, Server,
  Plus, Trash2, CheckCircle, XCircle, X, ChevronDown, Archive, Power, BarChart3,
  FileText,
} from 'lucide-react';
import AdminShell from '../../../../../components/admin/AdminShell';



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
  login_url: string | null;
  admin_login_url: string | null;
  tester_login_url: string | null;
  current_build: string | null;
  release_candidate: string | null;
  version: string | null;
  git_branch: string | null;
  environment_notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: '#10B981', bg: 'bg-emerald-500/10' },
  paused: { label: 'Paused', color: '#F59E0B', bg: 'bg-amber-500/10' },
  archived: { label: 'Archived', color: '#6B7280', bg: 'bg-gray-500/10' },
};

const envTypeOptions = ['development', 'uat', 'staging', 'production', 'demo'];
const envTypeConfig: Record<string, { color: string }> = {
  development: { color: '#8B5CF6' },
  uat: { color: '#06B6D4' },
  staging: { color: '#F59E0B' },
  production: { color: '#10B981' },
  demo: { color: '#EC4899' },
};

export default function ProjectDetail({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [project, setProject] = useState<UatProject | null>(null);
  const [environments, setEnvironments] = useState<UatEnvironment[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [editingProject, setEditingProject] = useState(false);
  const [projectForm, setProjectForm] = useState<Partial<UatProject>>({});
  const [savingProject, setSavingProject] = useState(false);
  const [projectError, setProjectError] = useState('');

  const [envDrawerOpen, setEnvDrawerOpen] = useState(false);
  const [editingEnv, setEditingEnv] = useState<Partial<UatEnvironment> | null>(null);
  const [savingEnv, setSavingEnv] = useState(false);
  const [envError, setEnvError] = useState('');

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    const { data: proj } = await supabase.from('uat_projects').select('*').eq('id', projectId).maybeSingle();
    if (!proj) { setNotFound(true); setLoading(false); return; }
    setProject(proj as UatProject);
    setProjectForm(proj as UatProject);

    const { data: envs } = await supabase.from('uat_environments').select('*').eq('project_id', projectId).order('created_at', { ascending: true });
    setEnvironments((envs as UatEnvironment[]) || []);
    setLoading(false);
  };

  const logAudit = async (action: string, entityId: string, entityType: string, prev?: any, next?: any) => {
    await supabase.from('uat_audit_log').insert({
      action, entity_type: entityType, entity_id: entityId,
      previous_value: prev || null, new_value: next || null,
    });
  };

  const handleSaveProject = async () => {
    if (!projectForm.name?.trim()) { setProjectError('Project name is required.'); return; }
    setSavingProject(true);
    setProjectError('');

    const payload = {
      name: projectForm.name.trim(),
      client_company: projectForm.client_company?.trim() || null,
      description: projectForm.description?.trim() || null,
      live_url: projectForm.live_url?.trim() || null,
      status: projectForm.status || 'active',
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('uat_projects').update(payload).eq('id', projectId);
    if (!error) {
      await logAudit('Project updated', projectId, 'uat_project', project, payload);
      await fetchData();
      setEditingProject(false);
    } else {
      setProjectError('Failed to save.');
    }
    setSavingProject(false);
  };

  const handleArchiveProject = async () => {
    const newStatus = project?.status === 'archived' ? 'active' : 'archived';
    await supabase.from('uat_projects').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', projectId);
    await logAudit(`Status changed to ${newStatus}`, projectId, 'uat_project', { status: project?.status }, { status: newStatus });
    fetchData();
  };

  const openNewEnv = () => {
    setEditingEnv({
      project_id: projectId,
      environment_name: '',
      environment_type: 'uat',
      base_url: '',
      login_url: '',
      admin_login_url: '',
      tester_login_url: '',
      current_build: '',
      release_candidate: '',
      version: '',
      git_branch: '',
      environment_notes: '',
      is_active: true,
    });
    setEnvError('');
    setEnvDrawerOpen(true);
  };

  const openEditEnv = (env: UatEnvironment) => {
    setEditingEnv({ ...env });
    setEnvError('');
    setEnvDrawerOpen(true);
  };

  const handleSaveEnv = async () => {
    if (!editingEnv) return;
    if (!editingEnv.environment_name?.trim()) { setEnvError('Environment name is required.'); return; }
    if (!editingEnv.base_url?.trim()) { setEnvError('Base URL is required.'); return; }

    setSavingEnv(true);
    setEnvError('');

    const payload: any = {
      project_id: projectId,
      environment_name: editingEnv.environment_name.trim(),
      environment_type: editingEnv.environment_type || 'uat',
      base_url: editingEnv.base_url.trim(),
      login_url: editingEnv.login_url?.trim() || null,
      admin_login_url: editingEnv.admin_login_url?.trim() || null,
      tester_login_url: editingEnv.tester_login_url?.trim() || null,
      current_build: editingEnv.current_build?.trim() || null,
      release_candidate: editingEnv.release_candidate?.trim() || null,
      version: editingEnv.version?.trim() || null,
      git_branch: editingEnv.git_branch?.trim() || null,
      environment_notes: editingEnv.environment_notes?.trim() || null,
      is_active: editingEnv.is_active ?? true,
      updated_at: new Date().toISOString(),
    };

    if (editingEnv.id) {
      const prev = environments.find((e) => e.id === editingEnv.id);
      const { error } = await supabase.from('uat_environments').update(payload).eq('id', editingEnv.id);
      if (!error) {
        await logAudit('Environment updated', editingEnv.id, 'uat_environment', prev, payload);
        await fetchData();
        setEnvDrawerOpen(false);
      } else { setEnvError('Failed to save environment.'); }
    } else {
      const { error } = await supabase.from('uat_environments').insert({ ...payload, created_at: new Date().toISOString() });
      if (!error) {
        await logAudit('Environment created', projectId, 'uat_environment', null, payload);
        await fetchData();
        setEnvDrawerOpen(false);
      } else { setEnvError('Failed to create environment.'); }
    }
    setSavingEnv(false);
  };

  const handleToggleEnvActive = async (env: UatEnvironment) => {
    const newActive = !env.is_active;
    await supabase.from('uat_environments').update({ is_active: newActive, updated_at: new Date().toISOString() }).eq('id', env.id);
    await logAudit(`Environment ${newActive ? 'activated' : 'deactivated'}`, env.id, 'uat_environment', { is_active: env.is_active }, { is_active: newActive });
    fetchData();
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

  if (notFound || !project) {
    return (
      <AdminShell>
        <div className="max-w-7xl mx-auto text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Project Not Found</h2>
          <p className="text-slate-400 mb-6">This project may have been deleted or does not exist.</p>
          <button
            onClick={() => router.push('/admin/uat/projects')}
            className="px-5 py-2.5 bg-[#06B6D4] rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap"
          >
            Back to Projects
          </button>
        </div>
      </AdminShell>
    );
  }

  const sc = statusConfig[project.status] || statusConfig.active;

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => router.push('/admin/uat/projects')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-[#06B6D4] transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>

        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden mb-8">
          <div className="p-6 border-b border-[rgba(255,255,255,0.08)] flex items-start justify-between">
            <div className="flex-1">
              {editingProject ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={projectForm.name || ''}
                    onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-lg font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40"
                    placeholder="Project Name"
                  />
                  <input
                    type="text"
                    value={projectForm.client_company || ''}
                    onChange={(e) => setProjectForm({ ...projectForm, client_company: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40"
                    placeholder="Client / Company"
                  />
                  <textarea
                    value={projectForm.description || ''}
                    onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 resize-none"
                    placeholder="Description"
                  />
                  <input
                    type="url"
                    value={projectForm.live_url || ''}
                    onChange={(e) => setProjectForm({ ...projectForm, live_url: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40"
                    placeholder="Live URL"
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-white">{project.name}</h1>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium border" style={{ backgroundColor: sc.bg, color: sc.color, borderColor: sc.color + '30' }}>
                      {sc.label}
                    </span>
                  </div>
                  {project.client_company && <p className="text-sm text-slate-400 mb-1">{project.client_company}</p>}
                  {project.description && <p className="text-sm text-slate-400 leading-relaxed mb-3">{project.description}</p>}
                  {project.live_url && (
                    <a href={project.live_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-[#06B6D4] hover:underline">
                      <Globe className="w-3.5 h-3.5" />
                      {project.live_url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4">
              {editingProject ? (
                <>
                  <button onClick={() => { setEditingProject(false); setProjectError(''); }} className="px-3 py-2 border border-[rgba(255,255,255,0.08)] rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer whitespace-nowrap">Cancel</button>
                  <button onClick={handleSaveProject} disabled={savingProject} className="px-3 py-2 bg-[#06B6D4] rounded-xl text-xs font-semibold text-white cursor-pointer flex items-center gap-1.5 disabled:opacity-60 whitespace-nowrap">
                    {savingProject ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditingProject(true)} className="px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.06)] rounded-xl text-xs text-slate-400 hover:text-[#06B6D4] hover:border-[#06B6D4]/20 cursor-pointer flex items-center gap-1.5 whitespace-nowrap">
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={handleArchiveProject} className="px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.06)] rounded-xl text-xs text-slate-400 hover:text-amber-400 cursor-pointer flex items-center gap-1.5 whitespace-nowrap">
                    <Archive className="w-3.5 h-3.5" /> {project.status === 'archived' ? 'Reactivate' : 'Archive'}
                  </button>
                  <button onClick={() => router.push(`/admin/uat/projects/${projectId}/matches`)} className="px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.06)] rounded-xl text-xs text-slate-400 hover:text-[#06B6D4] hover:border-[#06B6D4]/20 cursor-pointer flex items-center gap-1.5 whitespace-nowrap">
                    <BarChart3 className="w-3.5 h-3.5" /> Matches
                  </button>
                  <button onClick={() => router.push(`/admin/uat/projects/${projectId}/test-suites`)} className="px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.06)] rounded-xl text-xs text-slate-400 hover:text-[#06B6D4] hover:border-[#06B6D4]/20 cursor-pointer flex items-center gap-1.5 whitespace-nowrap">
                    <FileText className="w-3.5 h-3.5" /> Test Suites
                  </button>
                  <button onClick={() => router.push(`/admin/uat/projects/${projectId}/sandbox`)} className="px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.06)] rounded-xl text-xs text-slate-400 hover:text-[#06B6D4] hover:border-[#06B6D4]/20 cursor-pointer flex items-center gap-1.5 whitespace-nowrap">
                    <i className="ri-box-3-line w-3.5 h-3.5 flex items-center justify-center" /> Sandbox
                  </button>
                </>
              )}
            </div>
          </div>

          {editingProject && projectError && (
            <div className="px-6 pb-4">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-xs text-red-400">{projectError}</p>
              </div>
            </div>
          )}

          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-white">Environments</h2>
                <p className="text-xs text-slate-400 mt-0.5">{environments.length} environment{environments.length !== 1 ? 's' : ''} linked</p>
              </div>
              <button
                onClick={openNewEnv}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#06B6D4] hover:bg-[#0891B2] rounded-xl text-xs font-semibold text-white transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Environment
              </button>
            </div>

            {environments.length === 0 ? (
              <div className="text-center py-12 bg-white/[0.01] border border-dashed border-[rgba(255,255,255,0.06)] rounded-2xl">
                <Server className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">No environments yet</p>
                <p className="text-sm text-slate-500 mt-1">Add a test environment to start linking URLs</p>
              </div>
            ) : (
              <div className="space-y-3">
                {environments.map((env) => (
                  <div
                    key={env.id}
                    className={`bg-white/[0.02] border rounded-2xl p-5 transition-all ${env.is_active ? 'border-[rgba(255,255,255,0.06)]' : 'border-[rgba(255,255,255,0.03)] opacity-60'}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                          style={{ backgroundColor: (envTypeConfig[env.environment_type]?.color || '#06B6D4') + '15', color: envTypeConfig[env.environment_type]?.color || '#06B6D4' }}
                        >
                          {env.environment_type}
                        </span>
                        <div>
                          <h3 className="font-semibold text-white text-sm">{env.environment_name}</h3>
                          <a href={env.base_url} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 hover:text-[#06B6D4] transition-colors flex items-center gap-1">
                            {env.base_url}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditEnv(env)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#06B6D4] cursor-pointer">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleToggleEnvActive(env)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-amber-400 cursor-pointer">
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      {env.version && (
                        <div>
                          <span className="text-slate-500">Version</span>
                          <p className="text-slate-300 font-medium">{env.version}</p>
                        </div>
                      )}
                      {env.current_build && (
                        <div>
                          <span className="text-slate-500">Build</span>
                          <p className="text-slate-300 font-medium font-mono">{env.current_build}</p>
                        </div>
                      )}
                      {env.git_branch && (
                        <div>
                          <span className="text-slate-500">Branch</span>
                          <p className="text-slate-300 font-medium font-mono">{env.git_branch}</p>
                        </div>
                      )}
                      {env.release_candidate && (
                        <div>
                          <span className="text-slate-500">RC</span>
                          <p className="text-slate-300 font-medium font-mono">{env.release_candidate}</p>
                        </div>
                      )}
                    </div>

                    {(env.tester_login_url || env.admin_login_url) && (
                      <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-[rgba(255,255,255,0.04)]">
                        {env.tester_login_url && (
                          <a href={env.tester_login_url} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 hover:text-[#06B6D4] transition-colors flex items-center gap-1">
                            <i className="ri-user-line w-3 h-3 flex items-center justify-center" /> Tester Login
                          </a>
                        )}
                        {env.admin_login_url && (
                          <a href={env.admin_login_url} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 hover:text-[#06B6D4] transition-colors flex items-center gap-1">
                            <i className="ri-shield-user-line w-3 h-3 flex items-center justify-center" /> Admin Login
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {envDrawerOpen && editingEnv && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={() => setEnvDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[#1E293B] border-l border-[rgba(255,255,255,0.08)] z-50 shadow-2xl overflow-y-auto"
            >
              <div className="sticky top-0 bg-[#1E293B] border-b border-[rgba(255,255,255,0.08)] p-6 flex items-center justify-between z-10">
                <h3 className="text-lg font-bold text-white">
                  {editingEnv.id ? 'Edit Environment' : 'New Environment'}
                </h3>
                <button onClick={() => setEnvDrawerOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Environment Name *</label>
                  <input
                    type="text"
                    value={editingEnv.environment_name || ''}
                    onChange={(e) => setEditingEnv({ ...editingEnv, environment_name: e.target.value })}
                    placeholder="e.g. QuickGuard UAT"
                    className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Environment Type *</label>
                  <div className="flex flex-wrap gap-2">
                    {envTypeOptions.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setEditingEnv({ ...editingEnv, environment_type: type })}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider border transition-all cursor-pointer"
                        style={{
                          color: editingEnv.environment_type === type ? (envTypeConfig[type]?.color || '#06B6D4') : '#94A3B8',
                          borderColor: editingEnv.environment_type === type ? (envTypeConfig[type]?.color || '#06B6D4') + '40' : 'rgba(255,255,255,0.08)',
                          backgroundColor: editingEnv.environment_type === type ? (envTypeConfig[type]?.color || '#06B6D4') + '15' : 'transparent',
                        }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Base URL *</label>
                  <input
                    type="url"
                    value={editingEnv.base_url || ''}
                    onChange={(e) => setEditingEnv({ ...editingEnv, base_url: e.target.value })}
                    placeholder="https://example-test.digital-footprint.uk"
                    className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Login URL</label>
                    <input
                      type="url"
                      value={editingEnv.login_url || ''}
                      onChange={(e) => setEditingEnv({ ...editingEnv, login_url: e.target.value })}
                      placeholder="General login URL"
                      className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Admin Login URL</label>
                    <input
                      type="url"
                      value={editingEnv.admin_login_url || ''}
                      onChange={(e) => setEditingEnv({ ...editingEnv, admin_login_url: e.target.value })}
                      placeholder="Admin panel login"
                      className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tester Login URL</label>
                  <input
                    type="url"
                    value={editingEnv.tester_login_url || ''}
                    onChange={(e) => setEditingEnv({ ...editingEnv, tester_login_url: e.target.value })}
                    placeholder="Tester-specific login"
                    className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Current Build</label>
                    <input
                      type="text"
                      value={editingEnv.current_build || ''}
                      onChange={(e) => setEditingEnv({ ...editingEnv, current_build: e.target.value })}
                      placeholder="e.g. build-247"
                      className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Version</label>
                    <input
                      type="text"
                      value={editingEnv.version || ''}
                      onChange={(e) => setEditingEnv({ ...editingEnv, version: e.target.value })}
                      placeholder="e.g. 2.4.1"
                      className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Git Branch</label>
                    <input
                      type="text"
                      value={editingEnv.git_branch || ''}
                      onChange={(e) => setEditingEnv({ ...editingEnv, git_branch: e.target.value })}
                      placeholder="e.g. release/2.4"
                      className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Release Candidate</label>
                    <input
                      type="text"
                      value={editingEnv.release_candidate || ''}
                      onChange={(e) => setEditingEnv({ ...editingEnv, release_candidate: e.target.value })}
                      placeholder="e.g. 2.4.2-rc1"
                      className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Environment Notes</label>
                  <textarea
                    value={editingEnv.environment_notes || ''}
                    onChange={(e) => setEditingEnv({ ...editingEnv, environment_notes: e.target.value })}
                    rows={2}
                    maxLength={500}
                    placeholder="Any notes about this environment..."
                    className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all resize-none"
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingEnv.is_active ?? true}
                    onChange={(e) => setEditingEnv({ ...editingEnv, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-[rgba(255,255,255,0.2)] bg-white/5 text-[#06B6D4] focus:ring-[#06B6D4]/20 cursor-pointer"
                  />
                  <span className="text-sm text-slate-300">Environment is active</span>
                </label>

                {envError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{envError}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setEnvDrawerOpen(false)} className="flex-1 px-4 py-3 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-colors cursor-pointer whitespace-nowrap">
                    Cancel
                  </button>
                  <button onClick={handleSaveEnv} disabled={savingEnv} className="flex-1 px-4 py-3 bg-[#06B6D4] hover:bg-[#0891B2] rounded-xl text-sm font-semibold text-white transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 whitespace-nowrap">
                    {savingEnv ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {editingEnv.id ? 'Save Changes' : 'Create Environment'}
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