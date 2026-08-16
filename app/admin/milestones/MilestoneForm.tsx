'use client';

import { motion } from '@/components/motion';
import { useState, useEffect, type MouseEvent } from 'react';
import { X, Target, Calendar, FileText, Loader2 } from 'lucide-react';

interface Milestone {
  id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  status: string | null;
  target_date: string | null;
  order_index: number | null;
  amount: number | null;
  payment_status: string | null;
}

interface Project {
  id: string;
  name: string;
}

interface MilestoneFormProps {
  milestone: Milestone | null;
  projects: Project[];
  onClose: () => void;
  onSave: (data: Partial<Milestone>) => void;
}

export default function MilestoneForm({ milestone, projects, onClose, onSave }: MilestoneFormProps) {
  const [formData, setFormData] = useState({ title: '', description: '', project_id: '', status: 'pending', target_date: '', order_index: 1, amount: '', payment_status: 'unpaid' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (milestone) {
      setFormData({ title: milestone.title || '', description: milestone.description || '', project_id: milestone.project_id || '', status: milestone.status || 'pending', target_date: milestone.target_date || '', order_index: milestone.order_index || 1, amount: milestone.amount?.toString() || '', payment_status: milestone.payment_status || 'unpaid' });
    }
  }, [milestone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ title: formData.title, description: formData.description || null, project_id: formData.project_id || null, status: formData.status, target_date: formData.target_date || null, order_index: formData.order_index, amount: formData.amount ? parseFloat(formData.amount) : null, payment_status: formData.payment_status });
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
        className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/8 flex items-center justify-center">
              <Target className="w-5 h-5 text-[#06B6D4]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{milestone ? 'Edit Milestone' : 'Create Milestone'}</h2>
              <p className="text-xs text-slate-400">Set milestone details and payment amount</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Milestone Title *</label>
            <div className="relative">
              <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" value={formData.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Design Phase Complete"
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" required />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <textarea value={formData.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this milestone includes..." rows={3} maxLength={500}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all resize-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Project</label>
              <select value={formData.project_id} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, project_id: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none"
              >
                <option value="">Select project</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Order Index</label>
              <input type="number" value={formData.order_index} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 1 })}
                min={1} className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Payment Amount (£) *</label>
              <input type="number" value={formData.amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00" min={0} step={0.01}
                className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
              <p className="text-xs text-slate-500 mt-1">Amount client pays for this milestone</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="date" value={formData.target_date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, target_date: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all cursor-pointer" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Payment Status</label>
              <select value={formData.payment_status} onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none"
              >
                <option value="unpaid">Unpaid</option>
                <option value="pending">Awaiting Payment</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-white/5 text-slate-400 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={saving || !formData.title}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : milestone ? 'Update Milestone' : 'Create Milestone'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
