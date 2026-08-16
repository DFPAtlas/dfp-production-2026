'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Clock, AlertCircle, Plus, Loader2, ChevronRight, User } from 'lucide-react';
import Link from 'next/link';
import TaskCreateModal, { TaskFormData } from '@/components/staff/TaskCreateModal';
import TaskDetailDrawer from '@/components/staff/TaskDetailDrawer';
import DeleteConfirmDialog from '@/components/staff/DeleteConfirmDialog';

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

interface ProjectOption { id: string; name: string; }
interface StaffOption { id: string; full_name: string; }

const priorityLabels: Record<string, string> = { urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low' };
const priorityColors: Record<string, string> = { urgent: '#EF4444', high: '#F59E0B', medium: '#3B82F6', low: '#9CA3AF' };

export default function ProjectTasksTab({
  tasks,
  loading,
  error,
  projectId,
  projectName,
  currentUserId,
  canCreateTask,
  staffOptions,
  onRefresh,
  onRetry,
}: {
  tasks: TaskItem[];
  loading: boolean;
  error: string | null;
  projectId: string;
  projectName: string;
  currentUserId: string;
  canCreateTask: boolean;
  staffOptions: StaffOption[];
  onRefresh: () => void;
  onRetry: () => void;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const [deleteTask, setDeleteTask] = useState<TaskItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canEdit = true;
  const canDelete = currentUserId ? true : false;

  const handleCreateTask = async (data: TaskFormData) => {
    setSaving(true);
    const { data: inserted, error: insertErr } = await supabase
      .from('project_tasks')
      .insert({
        project_id: projectId,
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        status: data.status,
        assigned_to: data.assigned_to || null,
        due_date: data.due_date || null,
      })
      .select('id, project_id, title, description, status, priority, assigned_to, due_date, completed_at, created_at, updated_at')
      .single();

    if (!insertErr && inserted) {
      setShowCreate(false);
      onRefresh();
    }
    setSaving(false);
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    setStatusChanging(true);
    const previousTasks = [...tasks];
    const taskIndex = tasks.findIndex(t => t.id === taskId);

    if (taskIndex >= 0) {
      const updatedTasks = [...tasks];
      updatedTasks[taskIndex] = {
        ...updatedTasks[taskIndex],
        status: newStatus,
        completed_at: newStatus === 'done' ? new Date().toISOString() : null,
      };
    }

    const { error: updateErr } = await supabase
      .from('project_tasks')
      .update({
        status: newStatus,
        completed_at: newStatus === 'done' ? new Date().toISOString() : null,
      })
      .eq('id', taskId);

    if (updateErr) {
      onRefresh();
    } else {
      onRefresh();
    }
    setStatusChanging(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTask) return;
    setDeleting(true);
    const { error } = await supabase.from('project_tasks').delete().eq('id', deleteTask.id);
    if (!error) {
      setDeleteTask(null);
      onRefresh();
    }
    setDeleting(false);
  };

  const openDrawer = (task: TaskItem) => {
    setSelectedTask(task);
    setDrawerOpen(true);
  };

  const projects: ProjectOption[] = [{ id: projectId, name: projectName }];

  const getStatusIcon = (status: string) => {
    if (status === 'done') return <CheckCircle className="w-3 h-3 text-white" />;
    return null;
  };

  if (loading) {
    return (
      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <div className="space-y-3 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-5 h-5 rounded bg-white/5" />
              <div className="flex-1"><div className="h-4 bg-white/5 rounded w-2/3" /></div>
              <div className="w-16 h-5 bg-white/5 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-10 h-10 text-[#F59E0B] mx-auto mb-3" />
          <p className="text-slate-300 font-medium mb-1">Could not load tasks</p>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <button onClick={onRetry}
            className="px-4 py-2 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const incompleteTasks = tasks.filter(t => t.status !== 'done');
  const completedTasks = tasks.filter(t => t.status === 'done');
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-white">Tasks ({tasks.length})</h3>
          <Link
            href={`/staff/tasks?project=${projectId}`}
            className="text-xs text-[#06B6D4] hover:underline cursor-pointer whitespace-nowrap"
          >
            View All Project Tasks
          </Link>
        </div>
        {canCreateTask && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        )}
      </div>

      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
        {tasks.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-300 font-medium mb-1">No tasks yet</p>
            <p className="text-sm text-slate-500">Tasks for this project will appear here.</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[rgba(255,255,255,0.04)]">
              {[...incompleteTasks.sort((a, b) => {
                const pOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
                return (pOrder[a.priority] ?? 5) - (pOrder[b.priority] ?? 5);
              }), ...completedTasks].map(t => {
                const isOverdue = t.due_date && t.due_date < today && t.status !== 'done';
                const isDueToday = t.due_date && t.due_date === today && t.status !== 'done';
                return (
                  <div
                    key={t.id}
                    onClick={() => openDrawer(t)}
                    className="p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStatusChange(t.id, t.status === 'done' ? 'todo' : 'done'); }}
                      disabled={statusChanging}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                        t.status === 'done'
                          ? 'bg-[#10B981] border-[#10B981]'
                          : 'border-[rgba(255,255,255,0.2)] hover:border-[#10B981]/50'
                      }`}
                      title={t.status === 'done' ? 'Reopen task' : 'Mark complete'}
                    >
                      {getStatusIcon(t.status)}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${t.status === 'done' ? 'text-slate-500 line-through' : 'text-white'}`}>
                        {t.title}
                      </p>
                      {t.description && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{t.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border"
                        style={{ backgroundColor: (priorityColors[t.priority] || '#9CA3AF') + '15', color: priorityColors[t.priority] || '#9CA3AF', borderColor: (priorityColors[t.priority] || '#9CA3AF') + '30' }}
                      >
                        {priorityLabels[t.priority]?.[0] || t.priority}
                      </span>
                      {t.assignee_name && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <User className="w-3 h-3" /> {t.assignee_name.split(' ')[0]}
                        </span>
                      )}
                      {t.due_date && (
                        <span className={`text-xs ${isOverdue ? 'text-[#EF4444] font-medium' : isDueToday ? 'text-[#F59E0B]' : 'text-slate-400'}`}>
                          {new Date(t.due_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <TaskCreateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSave={handleCreateTask}
        saving={saving}
        projects={projects}
        staffOptions={staffOptions}
        showAssignee={true}
        currentUserId={currentUserId}
        defaultStatus="todo"
      />

      <TaskDetailDrawer
        open={drawerOpen}
        task={selectedTask}
        onClose={() => { setDrawerOpen(false); onRefresh(); }}
        onStatusChange={handleStatusChange}
        onDelete={(id) => { setDrawerOpen(false); const t = tasks.find(x => x.id === id); if (t) setDeleteTask(t); }}
        canEdit={canEdit}
        canDelete={canDelete}
        statusChanging={statusChanging}
        deleting={deleting}
      />

      <DeleteConfirmDialog
        open={!!deleteTask}
        taskTitle={deleteTask?.title || ''}
        deleting={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTask(null)}
      />
    </div>
  );
}