'use client';

import { motion } from '@/components/motion';
import { useState, useEffect, type MouseEvent } from 'react';
import { X, Layers, FileText, Users, Calendar, Loader2, Target } from 'lucide-react';
import { PROJECT_STATUSES } from '@/lib/project-definitions';

interface Project {
  id?: string;
  name: string;
  description: string | null;
  client_id: string | null;
  status: string | null;
  health: string | null;
  priority: string | null;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  project_reference?: string | null;
  project_type?: string | null;
  objective?: string | null;
  progress_method?: string | null;
  environment?: string | null;
  domain?: string | null;
}

interface ProjectFormProps {
  project: Project | null;
  clients: { id: string; name: string }[];
  onClose: () => void;
  onSave: (data: Partial<Project>) => void;
}

export default function ProjectForm({ project, clients, onClose, onSave }: ProjectFormProps) {
  const [formData, setFormData] = useState({
    name: '', description: '', client_id: '', status: 'draft', health: 'not_enough_data',
    priority: 'medium', budget: '', start_date: '', end_date: '',
    project_type: 'standard', objective: '', progress_method: 'manual',
    environment: '', domain: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        client_id: project.client_id || '',
        status: project.status || 'draft',
        health: project.health || 'not_enough_data',
        priority: project.priority || 'medium',
        budget: project.budget?.toString() || '',
        start_date: project.start_date || '',
        end_date: project.end_date || '',
        project_type: project.project_type || 'standard',
        objective: project.objective || '',
        progress_method: project.progress_method || 'manual',
        environment: project.environment || '',
        domain: project.domain || '',
      });
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      name: formData.name,
      description: formData.description || null,
      client_id: formData.client_id || null,
      status: formData.status,
      health: formData.health,
      priority: formData.priority,
      budget: formData.budget ? parseFloat(formData.budget) : null,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      project_type: formData.project_type,
      objective: formData.objective || null,
      progress_method: formData.progress_method,
      environment: formData.environment || null,
      domain: formData.domain || null,
    });
    setSaving(false);
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-[#06B6D4]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{project ? 'Edit Project' : 'Create Project'}</h2>
              <p className="text-xs text-slate-400">{project ? project.project_reference : 'Define scope, timeline, and objectives'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Project Name *</label>
            <div className="relative">
              <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Website Redesign 2026"
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" required />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Objective</label>
            <div className="relative">
              <Target className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <textarea value={formData.objective} onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                placeholder="What are we trying to achieve with this project?" rows={3} maxLength={500}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all resize-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the project scope..." rows={3} maxLength={500}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all resize-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Client</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select value={formData.client_id} onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  className="w-full pl-10 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
                  <option value="">Select client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Project Type</label>
              <select value={formData.project_type} onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
                <option value="standard">Standard</option>
                <option value="discovery">Discovery</option>
                <option value="design">Design</option>
                <option value="development">Development</option>
                <option value="migration">Migration</option>
                <option value="integration">Integration</option>
                <option value="support">Support / Retainer</option>
                <option value="consulting">Consulting</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
                {PROJECT_STATUSES.slice(0, 10).map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Priority</label>
              <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Progress Method</label>
              <select value={formData.progress_method} onChange={(e) => setFormData({ ...formData, progress_method: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
                <option value="manual">Manual</option>
                <option value="task_based">Task Based</option>
                <option value="milestone_based">Milestone Based</option>
                <option value="phase_based">Phase Based</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Project Budget (£)</label>
            <input type="number" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              placeholder="0.00" min={0} step={0.01}
              className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all cursor-pointer" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all cursor-pointer" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Environment</label>
              <input type="text" value={formData.environment} onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                placeholder="e.g., production, staging"
                className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Domain</label>
              <input type="text" value={formData.domain} onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="e.g., example.com"
                className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-white/5 text-slate-400 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap">
              Cancel
            </button>
            <button type="submit" disabled={saving || !formData.name}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : project ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
