'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { X, Loader2, Calendar } from 'lucide-react';

interface ProjectOption { id: string; name: string; }
interface StaffOption { id: string; full_name: string; }

const statusOptions = ['todo', 'in_progress', 'review', 'done'] as const;
const priorityOptions = ['urgent', 'high', 'medium', 'low'] as const;

const statusLabels: Record<string, string> = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };
const priorityLabels: Record<string, string> = { urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low' };

export interface TaskFormData {
  title: string;
  project_id: string;
  description: string;
  assigned_to: string;
  priority: string;
  status: string;
  due_date: string;
}

export default function TaskCreateModal({
  open,
  onClose,
  onSave,
  saving,
  projects,
  staffOptions,
  showAssignee,
  currentUserId,
  defaultStatus,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: TaskFormData) => Promise<void>;
  saving: boolean;
  projects: ProjectOption[];
  staffOptions: StaffOption[];
  showAssignee: boolean;
  currentUserId: string;
  defaultStatus?: string;
}) {
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState(currentUserId);
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState(defaultStatus || 'todo');
  const [dueDate, setDueDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTitle('');
      setProjectId('');
      setDescription('');
      setAssignee(currentUserId);
      setPriority('medium');
      setStatus(defaultStatus || 'todo');
      setDueDate('');
      setErrors({});
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [open, currentUserId, defaultStatus]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Title is required';
    else if (title.trim().length > 500) e.title = 'Title too long';
    if (!projectId) e.project_id = 'Project is required';
    if (description.length > 5000) e.description = 'Description too long';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || saving) return;
    await onSave({
      title: title.trim(),
      project_id: projectId,
      description: description.trim(),
      assigned_to: assignee || '',
      priority,
      status,
      due_date: dueDate,
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="relative bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-labelledby="create-task-title"
            aria-modal="true"
          >
            <div className="flex items-center justify-between p-5 border-b border-[rgba(255,255,255,0.06)]">
              <h2 id="create-task-title" className="text-lg font-bold text-white">New Task</h2>
              <button
                onClick={onClose}
                disabled={saving}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label htmlFor="task-title" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Title <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  ref={titleRef}
                  id="task-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task title..."
                  maxLength={500}
                  className={`w-full px-4 py-2.5 bg-white/5 border rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 transition-all ${errors.title ? 'border-[#EF4444]' : 'border-[rgba(255,255,255,0.08)]'}`}
                />
                {errors.title && <p className="text-xs text-[#EF4444] mt-1">{errors.title}</p>}
              </div>

              <div>
                <label htmlFor="task-project" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Project <span className="text-[#EF4444]">*</span>
                </label>
                <select
                  id="task-project"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className={`w-full px-4 pr-8 py-2.5 bg-white/5 border rounded-xl text-sm text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 transition-all ${errors.project_id ? 'border-[#EF4444]' : 'border-[rgba(255,255,255,0.08)]'}`}
                >
                  <option value="">Select Project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {errors.project_id && <p className="text-xs text-[#EF4444] mt-1">{errors.project_id}</p>}
              </div>

              <div>
                <label htmlFor="task-desc" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  id="task-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description..."
                  maxLength={5000}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="task-priority" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <select
                    id="task-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-4 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 transition-all"
                  >
                    {priorityOptions.map(p => <option key={p} value={p}>{priorityLabels[p]}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="task-status" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    id="task-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 transition-all"
                  >
                    {statusOptions.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {showAssignee && (
                  <div>
                    <label htmlFor="task-assignee" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Assignee
                    </label>
                    <select
                      id="task-assignee"
                      value={assignee}
                      onChange={(e) => setAssignee(e.target.value)}
                      className="w-full px-4 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 transition-all"
                    >
                      <option value="">Unassigned</option>
                      {staffOptions.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                    </select>
                  </div>
                )}
                <div className={showAssignee ? '' : 'col-span-2'}>
                  <label htmlFor="task-due" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Due Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      id="task-due"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 transition-all [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-[rgba(255,255,255,0.06)]">
              <button
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2.5 border border-[rgba(255,255,255,0.1)] rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !title.trim() || !projectId}
                className="px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}