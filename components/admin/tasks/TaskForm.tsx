'use client';

import { useState } from 'react';
import { motion } from '@/components/motion';
import { X, Loader2 } from 'lucide-react';
import { TASK_STATUSES, TASK_PRIORITIES, TASK_TYPES } from '@/lib/task-definitions';

interface TaskFormProps {
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  editingTask?: Record<string, unknown> | null;
}

export default function TaskForm({ onClose, onSave, editingTask }: TaskFormProps) {
  const [formData, setFormData] = useState({
    title: (editingTask?.title as string) || '',
    description: (editingTask?.description as string) || '',
    task_type: (editingTask?.task_type as string) || 'standard',
    status: (editingTask?.status as string) || 'backlog',
    priority: (editingTask?.priority as string) || 'normal',
    due_date: (editingTask?.due_date as string) || '',
    start_date: (editingTask?.start_date as string) || '',
    estimated_effort_hours: (editingTask?.estimated_effort_hours as string) || '',
    review_required: (editingTask?.review_required as boolean) || false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setSaving(true);
    await onSave({
      ...formData,
      estimated_effort_hours: formData.estimated_effort_hours ? parseFloat(formData.estimated_effort_hours) : null,
      due_date: formData.due_date || null,
      start_date: formData.start_date || null,
    });
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
        className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">{editingTask ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Title *</label>
            <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required
              placeholder="Task title..."
              className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={2} maxLength={500} placeholder="Describe the task..."
              className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 transition-all resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Type</label>
              <select value={formData.task_type} onChange={e => setFormData({ ...formData, task_type: e.target.value })}
                className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer">
                {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Priority</label>
              <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer">
                {TASK_PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
              <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer">
                {TASK_STATUSES.filter(s => s.value !== 'archived').map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Due Date</label>
              <input type="date" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Start Date</label>
              <input type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Est. Effort (h)</label>
              <input type="number" step="0.5" min="0" value={formData.estimated_effort_hours} onChange={e => setFormData({ ...formData, estimated_effort_hours: e.target.value })}
                placeholder="e.g., 4"
                className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 transition-all" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="review_required" checked={formData.review_required} onChange={e => setFormData({ ...formData, review_required: e.target.checked })}
              className="w-4 h-4 rounded border-slate-600 bg-transparent cursor-pointer" />
            <label htmlFor="review_required" className="text-sm text-slate-300 cursor-pointer">Requires review</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-400 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : editingTask ? 'Update' : 'Create Task'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
