'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import { useTasksData } from '@/hooks/useTasksData';
import TasksOverview from '@/components/admin/tasks/TasksOverview';
import TasksTable from '@/components/admin/tasks/TasksTable';
import TaskKanbanBoard from '@/components/admin/tasks/TaskKanbanBoard';
import TaskForm from '@/components/admin/tasks/TaskForm';
import { ListTodo, KanbanSquare, UserCheck, Plus, Search } from 'lucide-react';

export default function TasksPage() {
  const router = useRouter();
  const { tasks, loading, updateTask, insertTask } = useTasksData();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Record<string, unknown> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  const filtered = tasks.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return ((t.title as string) || '').toLowerCase().includes(q)
        || ((t.description as string) || '').toLowerCase().includes(q)
        || ((t.task_reference as string) || '').toLowerCase().includes(q);
    }
    return true;
  });

  const handleStatusChange = async (id: string, status: string) => {
    const updates: Record<string, unknown> = { status };
    if (status === 'complete') updates.completed_at = new Date().toISOString();
    if (status === 'cancelled') updates.cancelled_at = new Date().toISOString();
    if (status === 'archived') updates.archived_at = new Date().toISOString();
    await updateTask(id, updates);
  };

  const handleSaveTask = async (data: Record<string, unknown>) => {
    if (editingTask) {
      await updateTask(editingTask.id as string, data);
      setEditingTask(null);
    } else {
      await insertTask(data);
    }
    setShowForm(false);
  };

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Tasks</h1>
            <p className="text-sm text-slate-400">Task management, Kanban boards, and team workload</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl p-1">
              <button onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${viewMode === 'list' ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'text-slate-400 hover:text-white'}`}>
                <ListTodo className="w-3.5 h-3.5" /> List
              </button>
              <button onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${viewMode === 'kanban' ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'text-slate-400 hover:text-white'}`}>
                <KanbanSquare className="w-3.5 h-3.5" /> Board
              </button>
            </div>
            <button onClick={() => router.push('/admin/tasks/my-work')}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[rgba(255,255,255,0.08)] rounded-xl text-xs font-medium text-slate-300 hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer whitespace-nowrap">
              <UserCheck className="w-3.5 h-3.5" /> My Work
            </button>
            <button onClick={() => { setEditingTask(null); setShowForm(true); }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
              <Plus className="w-4 h-4" /> New Task
            </button>
          </div>
        </div>

        <div className="mb-6">
          <TasksOverview />
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input type="text" placeholder="Search tasks by title, description or reference..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 transition-all" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer">
            <option value="all">All Status</option>
            <option value="backlog">Backlog</option>
            <option value="planned">Planned</option>
            <option value="ready">Ready</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="awaiting_review">Awaiting Review</option>
            <option value="changes_required">Changes Required</option>
            <option value="complete">Complete</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer">
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
          </div>
        ) : viewMode === 'kanban' ? (
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-4">
            <TaskKanbanBoard tasks={filtered} onDragEnd={handleStatusChange as any} />
          </div>
        ) : (
          <TasksTable tasks={filtered} onStatusChange={handleStatusChange} />
        )}

        {showForm && (
          <TaskForm onClose={() => { setShowForm(false); setEditingTask(null); }} onSave={handleSaveTask} editingTask={editingTask} />
        )}
      </div>
    </AdminShell>
  );
}