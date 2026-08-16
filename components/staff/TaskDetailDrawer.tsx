'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import {
  X, Edit2, Calendar, Clock, CheckCircle, AlertCircle,
  User, FolderKanban, Loader2, ArrowUpRight, Trash2,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

interface TaskItem {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  project_name?: string;
  assignee_name?: string;
}

const statusLabels: Record<string, string> = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };
const statusColors: Record<string, string> = {
  todo: '#9CA3AF', in_progress: '#F59E0B', review: '#8B5CF6', done: '#10B981',
};
const priorityLabels: Record<string, string> = { urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low' };
const priorityColors: Record<string, string> = {
  urgent: '#EF4444', high: '#F59E0B', medium: '#3B82F6', low: '#9CA3AF',
};

const statusOptions = ['todo', 'in_progress', 'review', 'done'] as const;
const priorityOptions = ['urgent', 'high', 'medium', 'low'] as const;

export default function TaskDetailDrawer({
  open,
  task,
  onClose,
  onStatusChange,
  onDelete,
  canEdit,
  canDelete,
  statusChanging,
  deleting,
}: {
  open: boolean;
  task: TaskItem | null;
  onClose: () => void;
  onStatusChange: (taskId: string, newStatus: string) => Promise<void>;
  onDelete: (taskId: string) => void;
  canEdit: boolean;
  canDelete: boolean;
  statusChanging: boolean;
  deleting: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && task) {
      setIsEditing(false);
      setEditError('');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open, task]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEditing) setIsEditing(false);
        else onClose();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose, isEditing]);

  const startEditing = useCallback(() => {
    if (!task) return;
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditPriority(task.priority);
    setEditStatus(task.status);
    setEditDueDate(task.due_date || '');
    setEditError('');
    setIsEditing(true);
  }, [task]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditError('');
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!task || !editTitle.trim()) return;
    setEditSaving(true);
    setEditError('');

    const { supabase } = await import('@/lib/supabase');
    const updates: Record<string, unknown> = { title: editTitle.trim() };
    if (editDescription !== (task.description || '')) updates.description = editDescription.trim();
    if (editPriority !== task.priority) updates.priority = editPriority;
    if (editStatus !== task.status) {
      updates.status = editStatus;
      updates.completed_at = editStatus === 'done' ? new Date().toISOString() : null;
    }
    if (editDueDate !== (task.due_date || '')) updates.due_date = editDueDate || null;

    const { error } = await supabase.from('project_tasks').update(updates).eq('id', task.id);

    if (!error) {
      setIsEditing(false);
      onClose();
    } else {
      setEditError(error.message || 'Failed to save changes');
    }
    setEditSaving(false);
  }, [task, editTitle, editDescription, editPriority, editStatus, editDueDate, onClose]);

  const handleToggleComplete = async () => {
    if (!task) return;
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    await onStatusChange(task.id, newStatus);
  };

  if (!task) return null;

  const StatusIcon = task.status === 'done' ? CheckCircle : task.status === 'in_progress' ? Clock : task.status === 'review' ? AlertCircle : Clock;
  const isOverdue = !isEditing && task.due_date && task.due_date < new Date().toISOString().split('T')[0] && task.status !== 'done';
  const isDueToday = !isEditing && task.due_date && task.due_date === new Date().toISOString().split('T')[0] && task.status !== 'done';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex justify-end">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />
          <motion.div
            ref={drawerRef}
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="relative w-full max-w-lg bg-[#1E293B] border-l border-[rgba(255,255,255,0.08)] shadow-2xl overflow-y-auto h-full"
            role="dialog"
            aria-labelledby="task-detail-title"
            aria-modal="true"
          >
            <div className="flex items-center justify-between p-5 border-b border-[rgba(255,255,255,0.06)] sticky top-0 bg-[#1E293B] z-10">
              <h2 id="task-detail-title" className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Task Details</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      maxLength={500}
                      className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      maxLength={5000}
                      rows={4}
                      className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 transition-all resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Status</label>
                      <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full px-3 pr-7 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 transition-all"
                      >
                        {statusOptions.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Priority</label>
                      <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)}
                        className="w-full px-3 pr-7 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 transition-all"
                      >
                        {priorityOptions.map(p => <option key={p} value={p}>{priorityLabels[p]}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Due Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                      <input
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 transition-all [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  {editError && (
                    <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl">
                      <p className="text-sm text-[#EF4444]">{editError}</p>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleSaveEdit}
                      disabled={editSaving || !editTitle.trim()}
                      className="flex-1 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap flex items-center justify-center gap-2"
                    >
                      {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Save Changes
                    </button>
                    <button
                      onClick={cancelEditing}
                      disabled={editSaving}
                      className="px-4 py-2.5 border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-slate-400 hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleToggleComplete}
                          disabled={statusChanging}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                            task.status === 'done'
                              ? 'bg-[#10B981] border-[#10B981]'
                              : 'border-[rgba(255,255,255,0.2)] hover:border-[#10B981]/50'
                          }`}
                          title={task.status === 'done' ? 'Reopen task' : 'Mark complete'}
                        >
                          {statusChanging ? (
                            <Loader2 className="w-3 h-3 text-white animate-spin" />
                          ) : task.status === 'done' ? (
                            <CheckCircle className="w-3 h-3 text-white" />
                          ) : null}
                        </button>
                        <h3 className={`text-lg font-bold ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-white'}`}>
                          {task.title}
                        </h3>
                      </div>
                      {canEdit && (
                        <button
                          onClick={startEditing}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-[#06B6D4] hover:border-[#06B6D4]/30 transition-all cursor-pointer shrink-0"
                          title="Edit task"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border"
                        style={{ backgroundColor: (priorityColors[task.priority] || '#9CA3AF') + '15', color: priorityColors[task.priority] || '#9CA3AF', borderColor: (priorityColors[task.priority] || '#9CA3AF') + '30' }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: priorityColors[task.priority] }} />
                        {priorityLabels[task.priority] || task.priority}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border"
                        style={{ backgroundColor: (statusColors[task.status] || '#9CA3AF') + '15', color: statusColors[task.status] || '#9CA3AF', borderColor: (statusColors[task.status] || '#9CA3AF') + '30' }}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusLabels[task.status] || task.status.replace('_', ' ')}
                      </span>
                      {isOverdue && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20">
                          <AlertCircle className="w-3 h-3" /> Overdue
                        </span>
                      )}
                      {isDueToday && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20">
                          <Clock className="w-3 h-3" /> Due Today
                        </span>
                      )}
                    </div>
                  </div>

                  {task.description && (
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</p>
                      <p className="text-sm text-slate-300 leading-relaxed">{task.description}</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 py-2 border-b border-[rgba(255,255,255,0.04)]">
                      <div className="w-8 h-8 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center shrink-0">
                        <FolderKanban className="w-4 h-4 text-[#06B6D4]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Project</p>
                        <Link
                          href={`/staff/projects/${task.project_id}`}
                          className="text-sm font-medium text-[#06B6D4] hover:underline truncate block cursor-pointer"
                        >
                          {task.project_name || 'Unknown project'}
                        </Link>
                      </div>
                      <Link href={`/staff/projects/${task.project_id}`}
                        className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer"
                        title="Open project"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    {task.assignee_name && (
                      <div className="flex items-center gap-3 py-2 border-b border-[rgba(255,255,255,0.04)]">
                        <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-[#8B5CF6]" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Assignee</p>
                          <p className="text-sm text-white font-medium">{task.assignee_name}</p>
                        </div>
                      </div>
                    )}

                    {task.due_date && (
                      <div className="flex items-center gap-3 py-2 border-b border-[rgba(255,255,255,0.04)]">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: isOverdue ? '#EF4444' + '15' : '#F59E0B' + '10' }}>
                          <Calendar className="w-4 h-4" style={{ color: isOverdue ? '#EF4444' : '#F59E0B' }} />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Due Date</p>
                          <p className="text-sm text-white font-medium" style={{ color: isOverdue ? '#EF4444' : undefined }}>
                            {new Date(task.due_date + (task.due_date.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('en-GB', {
                              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 py-2 border-b border-[rgba(255,255,255,0.04)]">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Created</p>
                        <p className="text-sm text-slate-300">
                          {new Date(task.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    {task.completed_at && (
                      <div className="flex items-center gap-3 py-2 border-b border-[rgba(255,255,255,0.04)]">
                        <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 flex items-center justify-center shrink-0">
                          <CheckCircle className="w-4 h-4 text-[#10B981]" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Completed</p>
                          <p className="text-sm text-[#10B981] font-medium">
                            {new Date(task.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {!isEditing && (
              <div className="p-5 border-t border-[rgba(255,255,255,0.06)] space-y-2">
                <div className="flex gap-2">
                  {canEdit && (
                    <button
                      onClick={startEditing}
                      className="flex-1 px-4 py-2.5 border border-[rgba(255,255,255,0.1)] rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" /> Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => onDelete(task.id)}
                      disabled={deleting}
                      className="flex-1 px-4 py-2.5 border border-[#EF4444]/20 rounded-xl text-sm font-medium text-[#EF4444] hover:bg-[#EF4444]/10 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap flex items-center justify-center gap-2"
                    >
                      {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
