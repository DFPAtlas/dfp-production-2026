'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from '@/components/motion';
import {
  CDD_PHASES, getCddPhaseDef, validateProgressForPhase,
  MILESTONE_STATUSES, PROJECT_UPDATE_TYPES,
} from '@/lib/project-definitions';
import {
  Eye, Globe, Image, Link as LinkIcon, Plus, Save, Trash2, Upload, X,
  Loader2, CheckCircle, AlertTriangle, ExternalLink, Edit2,
  User, Users, Calendar, Target, Flag, Send, Rocket,
} from 'lucide-react';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  client_facing_summary?: string | null;
  description?: string | null;
  status?: string | null;
  current_phase?: string | null;
  progress?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  project_lead?: string | null;
  assigned_staff?: string[] | null;
  featured?: boolean | null;
  client_visible?: boolean | null;
  staging_url?: string | null;
  live_url?: string | null;
  preview_image?: string | null;
  client_id?: string | null;
}

interface StaffMember {
  id: string;
  full_name: string;
  role: string;
}

interface Milestone {
  id: string;
  title?: string;
  name?: string;
  description?: string | null;
  status: string;
  due_date?: string | null;
  order_index?: number;
  client_visible?: boolean;
}

interface ClientUpdate {
  id: string;
  title?: string;
  summary?: string;
  update_type?: string;
  client_visible?: boolean;
  published_at?: string | null;
  created_at?: string;
}

interface Props {
  project: Project;
  onProjectUpdated: () => void;
}

export default function ClientPortalDeliveryPanel({ project, onProjectUpdated }: Props) {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [updates, setUpdates] = useState<ClientUpdate[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [phaseWarning, setPhaseWarning] = useState<string | null>(null);

  const [form, setForm] = useState({
    client_facing_summary: project.client_facing_summary || '',
    current_phase: project.current_phase || 'discovery',
    progress: project.progress ?? 0,
    start_date: project.start_date || '',
    end_date: project.end_date || '',
    project_lead: project.project_lead || '',
    featured: project.featured || false,
    client_visible: project.client_visible !== false,
    staging_url: project.staging_url || '',
    live_url: project.live_url || '',
    preview_image: project.preview_image || '',
  });

  const [newMilestone, setNewMilestone] = useState({ title: '', description: '', due_date: '', status: 'upcoming', client_visible: true });
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<string | null>(null);
  const [editingMilestoneData, setEditingMilestoneData] = useState<Record<string, string | boolean>>({});

  const [newUpdate, setNewUpdate] = useState({ title: '', summary: '', update_type: 'general' });
  const [showUpdateForm, setShowUpdateForm] = useState(false);

  useEffect(() => {
    fetchStaff();
    fetchMilestones();
    fetchUpdates();
  }, [project.id]);

  useEffect(() => {
    const warning = validateProgressForPhase(form.progress, form.current_phase);
    setPhaseWarning(warning.warning || null);
  }, [form.progress, form.current_phase]);

  async function fetchStaff() {
    const { data } = await supabase.from('staff_profiles').select('id, full_name, role').eq('active', true).order('full_name');
    if (data) setStaffList(data);
  }

  async function fetchMilestones() {
    const { data } = await supabase.from('milestones').select('*').eq('project_id', project.id).order('order_index');
    if (data) setMilestones(data);
  }

  async function fetchUpdates() {
    const { data } = await supabase.from('project_updates').select('*').eq('project_id', project.id).order('created_at', { ascending: false });
    if (data) setUpdates(data);
  }

  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);

    if (form.progress < 0 || form.progress > 100) {
      setSaveMsg({ type: 'error', text: 'Progress must be between 0 and 100.' });
      setSaving(false);
      return;
    }

    if (form.featured && project.client_id) {
      await supabase.from('projects').update({ featured: false }).eq('client_id', project.client_id).neq('id', project.id);
    }

    const { error } = await supabase.from('projects').update({
      client_facing_summary: form.client_facing_summary || null,
      current_phase: form.current_phase,
      progress: form.progress,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      project_lead: form.project_lead || null,
      featured: form.featured,
      client_visible: form.client_visible,
      staging_url: form.staging_url || null,
      live_url: form.live_url || null,
      preview_image: form.preview_image || null,
      updated_at: new Date().toISOString(),
    }).eq('id', project.id);

    if (error) {
      setSaveMsg({ type: 'error', text: error.message });
    } else {
      setSaveMsg({ type: 'success', text: 'Delivery settings saved.' });
      onProjectUpdated();
      setTimeout(() => setSaveMsg(null), 3000);
    }
    setSaving(false);
  }

  async function handleAddMilestone() {
    if (!newMilestone.title.trim()) return;
    const nextOrder = milestones.length + 1;
    const { error } = await supabase.from('milestones').insert({
      project_id: project.id,
      title: newMilestone.title,
      name: newMilestone.title,
      description: newMilestone.description || null,
      status: newMilestone.status,
      due_date: newMilestone.due_date || null,
      order_index: nextOrder,
      client_visible: newMilestone.client_visible,
    });
    if (!error) {
      setNewMilestone({ title: '', description: '', due_date: '', status: 'upcoming', client_visible: true });
      setShowMilestoneForm(false);
      fetchMilestones();
    }
  }

  async function handleUpdateMilestone(id: string) {
    const { error } = await supabase.from('milestones').update(editingMilestoneData).eq('id', id);
    if (!error) {
      setEditingMilestone(null);
      setEditingMilestoneData({});
      fetchMilestones();
    }
  }

  async function handleDeleteMilestone(id: string) {
    if (!confirm('Delete this milestone?')) return;
    await supabase.from('milestones').delete().eq('id', id);
    fetchMilestones();
  }

  async function handlePublishUpdate() {
    if (!newUpdate.title.trim() || !newUpdate.summary.trim()) return;
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from('project_updates').insert({
      project_id: project.id,
      title: newUpdate.title,
      summary: newUpdate.summary,
      period: newUpdate.update_type,
      update_type: newUpdate.update_type,
      client_visible: true,
      published_at: new Date().toISOString(),
      published_by: session?.user?.id,
      author_id: session?.user?.id,
    });
    if (!error) {
      setNewUpdate({ title: '', summary: '', update_type: 'general' });
      setShowUpdateForm(false);
      fetchUpdates();
    }
  }

  async function handleToggleClientVisible(updateId: string, current: boolean) {
    await supabase.from('project_updates').update({ client_visible: !current }).eq('id', updateId);
    fetchUpdates();
  }

  const assignedStaff = (project.assigned_staff || []) as string[];
  const leadName = staffList.find(s => s.id === form.project_lead)?.full_name || '';

  return (
    <div className="space-y-6 max-w-4xl">
      {saveMsg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
          saveMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {saveMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {saveMsg.text}
        </div>
      )}

      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Eye className="w-4 h-4 text-[#06B6D4]" /> Portal Visibility
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.client_visible} onChange={e => setForm({ ...form, client_visible: e.target.checked })}
              className="w-5 h-5 rounded border-slate-600 bg-white/5 text-[#06B6D4] focus:ring-[#06B6D4] cursor-pointer" />
            <span className="text-sm text-slate-300">Visible to client</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })}
              className="w-5 h-5 rounded border-slate-600 bg-white/5 text-[#06B6D4] focus:ring-[#06B6D4] cursor-pointer" />
            <span className="text-sm text-slate-300">Featured project</span>
          </label>
          {project.client_id && (
            <Link href={`/portal/projects/${project.id}`} target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-300 hover:border-[#06B6D4]/30 transition-all cursor-pointer whitespace-nowrap">
              <ExternalLink className="w-4 h-4" /> Preview as client
            </Link>
          )}
        </div>
      </div>

      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-[#F59E0B]" /> Delivery Status
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">CDD Phase</label>
            <select value={form.current_phase} onChange={e => setForm({ ...form, current_phase: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
              {CDD_PHASES.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Overall Progress (%)</label>
            <input type="number" min={0} max={100} value={form.progress}
              onChange={e => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v >= 0 && v <= 100) setForm({ ...form, progress: v });
                else if (e.target.value === '') setForm({ ...form, progress: 0 });
              }}
              className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
            {phaseWarning && (
              <p className="flex items-center gap-1.5 text-xs text-amber-400 mt-1.5">
                <AlertTriangle className="w-3 h-3" /> {phaseWarning}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Start Date</label>
            <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer transition-all" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Target Completion Date</label>
            <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer transition-all" />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
          <label className="block text-xs text-slate-400 mb-1.5">Client-Facing Summary</label>
          <textarea value={form.client_facing_summary}
            onChange={e => setForm({ ...form, client_facing_summary: e.target.value })}
            placeholder="A summary your client will see on their dashboard..."
            rows={3} maxLength={500}
            className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all resize-none" />
        </div>
      </div>

      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-[#8B5CF6]" /> Team
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Project Lead</label>
            <select value={form.project_lead} onChange={e => setForm({ ...form, project_lead: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
              <option value="">Select lead...</option>
              {staffList.map(s => (
                <option key={s.id} value={s.id}>{s.full_name} — {s.role}</option>
              ))}
            </select>
            {leadName && <p className="text-xs text-slate-500 mt-1">Current: {leadName}</p>}
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Assigned Team ({assignedStaff.length})</label>
            <div className="max-h-32 overflow-y-auto space-y-1 bg-white/5 rounded-xl p-2 border border-[rgba(255,255,255,0.08)]">
              {staffList.filter(s => assignedStaff.includes(s.id)).map(s => (
                <div key={s.id} className="flex items-center justify-between px-2 py-1 text-sm">
                  <span className="text-slate-300">{s.full_name}</span>
                  <span className="text-[10px] text-slate-500">{s.role}</span>
                </div>
              ))}
              {assignedStaff.length === 0 && <p className="text-xs text-slate-500 px-2 py-1">No team members assigned</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Flag className="w-4 h-4 text-[#10B981]" /> Milestones
          </h3>
          <button onClick={() => { setShowMilestoneForm(true); setEditingMilestone(null); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#06B6D4] text-white rounded-lg text-xs font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>

        {showMilestoneForm && (
          <div className="mb-4 p-4 bg-white/[0.03] border border-[rgba(255,255,255,0.08)] rounded-xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" placeholder="Milestone title" value={newMilestone.title}
                onChange={e => setNewMilestone({ ...newMilestone, title: e.target.value })}
                className="px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#06B6D4]/40" />
              <select value={newMilestone.status} onChange={e => setNewMilestone({ ...newMilestone, status: e.target.value })}
                className="px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white focus:outline-none focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
                {MILESTONE_STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <input type="text" placeholder="Description (optional)" value={newMilestone.description}
              onChange={e => setNewMilestone({ ...newMilestone, description: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#06B6D4]/40" />
            <div className="flex items-center gap-3">
              <input type="date" value={newMilestone.due_date} onChange={e => setNewMilestone({ ...newMilestone, due_date: e.target.value })}
                className="px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white cursor-pointer" />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={newMilestone.client_visible}
                  onChange={e => setNewMilestone({ ...newMilestone, client_visible: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-600 bg-white/5 text-[#06B6D4] focus:ring-[#06B6D4] cursor-pointer" />
                <span className="text-xs text-slate-400">Client visible</span>
              </label>
              <button onClick={handleAddMilestone}
                className="ml-auto px-4 py-2 bg-[#06B6D4] text-white rounded-lg text-xs font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">Save</button>
              <button onClick={() => setShowMilestoneForm(false)}
                className="px-3 py-2 text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {milestones.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No milestones yet</p>
        ) : (
          <div className="space-y-2">
            {milestones.map(m => {
              const msDef = MILESTONE_STATUSES.find(s => s.value === m.status);
              const isEditing = editingMilestone === m.id;
              return (
                <div key={m.id} className="flex items-center gap-3 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-xl p-3">
                  {isEditing ? (
                    <div className="flex-1 flex items-center gap-2 flex-wrap">
                      <input type="text" defaultValue={m.title || m.name || ''}
                        onChange={e => setEditingMilestoneData({ ...editingMilestoneData, title: e.target.value, name: e.target.value })}
                        className="flex-1 min-w-[120px] px-3 py-1.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white" />
                      <select defaultValue={m.status}
                        onChange={e => setEditingMilestoneData({ ...editingMilestoneData, status: e.target.value })}
                        className="px-2 py-1.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white cursor-pointer appearance-none">
                        {MILESTONE_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                      <input type="date" defaultValue={m.due_date || ''}
                        onChange={e => setEditingMilestoneData({ ...editingMilestoneData, due_date: e.target.value })}
                        className="px-2 py-1.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white cursor-pointer" />
                      <button onClick={() => handleUpdateMilestone(m.id)}
                        className="px-2 py-1.5 bg-[#06B6D4] text-white rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap"><Save className="w-3 h-3" /></button>
                      <button onClick={() => setEditingMilestone(null)}
                        className="text-slate-400 hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <>
                      <div className={`w-2 h-2 rounded-full shrink-0`} style={{ backgroundColor: msDef?.color || '#6B7280' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200 truncate">{m.title || m.name}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                          <span style={{ color: msDef?.color }}>{msDef?.label || m.status}</span>
                          {m.due_date && <span><Calendar className="w-3 h-3 inline mr-0.5" />{new Date(m.due_date).toLocaleDateString('en-GB')}</span>}
                          {!m.client_visible && <span className="text-amber-400">Internal only</span>}
                        </div>
                      </div>
                      <button onClick={() => { setEditingMilestone(m.id); setEditingMilestoneData({ title: m.title || m.name || '', status: m.status, due_date: m.due_date || '' }); }}
                        className="text-slate-500 hover:text-[#06B6D4] cursor-pointer"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteMilestone(m.id)}
                        className="text-slate-500 hover:text-red-400 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Image className="w-4 h-4 text-[#EC4899]" /> Project Presentation
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Staging URL</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="url" value={form.staging_url} onChange={e => setForm({ ...form, staging_url: e.target.value })}
                placeholder="https://staging.example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Live URL</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="url" value={form.live_url} onChange={e => setForm({ ...form, live_url: e.target.value })}
                placeholder="https://example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-slate-400 mb-1.5">Preview Image URL</label>
            <input type="url" value={form.preview_image} onChange={e => setForm({ ...form, preview_image: e.target.value })}
              placeholder="https://..."
              className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
            {form.preview_image && (
              <div className="mt-3 rounded-xl overflow-hidden border border-[rgba(255,255,255,0.08)] max-w-sm">
                <img src={form.preview_image} alt="Preview" className="w-full h-32 object-cover object-top" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-[#06B6D4]" /> Client Updates
          </h3>
          <button onClick={() => setShowUpdateForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#06B6D4] text-white rounded-lg text-xs font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
            <Plus className="w-3.5 h-3.5" /> Publish Update
          </button>
        </div>

        {showUpdateForm && (
          <div className="mb-4 p-4 bg-white/[0.03] border border-[rgba(255,255,255,0.08)] rounded-xl space-y-3">
            <input type="text" placeholder="Update title" value={newUpdate.title}
              onChange={e => setNewUpdate({ ...newUpdate, title: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#06B6D4]/40" />
            <select value={newUpdate.update_type} onChange={e => setNewUpdate({ ...newUpdate, update_type: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white focus:outline-none focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
              {PROJECT_UPDATE_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <textarea value={newUpdate.summary} onChange={e => setNewUpdate({ ...newUpdate, summary: e.target.value })}
              placeholder="Update message for the client..." rows={3} maxLength={500}
              className="w-full px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#06B6D4]/40 resize-none" />
            <div className="flex items-center gap-2">
              <button onClick={handlePublishUpdate} disabled={!newUpdate.title.trim() || !newUpdate.summary.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#06B6D4] text-white rounded-lg text-xs font-semibold hover:bg-[#0891B2] transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap">
                <Rocket className="w-3.5 h-3.5" /> Publish to client
              </button>
              <button onClick={() => setShowUpdateForm(false)}
                className="px-3 py-2 text-slate-400 hover:text-white cursor-pointer">Cancel</button>
            </div>
          </div>
        )}

        {updates.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No updates published yet</p>
        ) : (
          <div className="space-y-2">
            {updates.map(u => {
              const typeDef = PROJECT_UPDATE_TYPES.find(t => t.value === u.update_type);
              return (
                <div key={u.id} className="flex items-start gap-3 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-xl p-3">
                  <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: typeDef?.color || '#94A3B8' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-200">{u.title || 'Update'}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-500">{typeDef?.label || u.update_type}</span>
                      {!u.client_visible && <span className="text-[10px] text-amber-400">Hidden</span>}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{u.summary}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500">
                      {u.published_at && <span>Published {new Date(u.published_at).toLocaleDateString('en-GB')}</span>}
                      <button onClick={() => handleToggleClientVisible(u.id, !!u.client_visible)}
                        className={`hover:underline cursor-pointer ${u.client_visible ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {u.client_visible ? 'Visible' : 'Hidden'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Delivery Settings
        </button>
      </div>
    </div>
  );
}
