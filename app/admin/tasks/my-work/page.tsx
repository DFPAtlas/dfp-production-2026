'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import { useTasksData } from '@/hooks/useTasksData';
import TasksTable from '@/components/admin/tasks/TasksTable';
import { ArrowLeft, ListTodo, AlertTriangle, Calendar, Eye, Clock } from 'lucide-react';

const VIEWS = [
  { id: 'today', label: 'Due Today', icon: Calendar, color: '#F59E0B' },
  { id: 'overdue', label: 'Overdue', icon: AlertTriangle, color: '#EF4444' },
  { id: 'upcoming', label: 'Upcoming', icon: Clock, color: '#3B82F6' },
  { id: 'blocked', label: 'Blocked', icon: AlertTriangle, color: '#DC2626' },
  { id: 'awaiting_review', label: 'Awaiting Review', icon: Eye, color: '#8B5CF6' },
  { id: 'assigned', label: 'All Active', icon: ListTodo, color: '#06B6D4' },
];

export default function MyWorkPage() {
  const router = useRouter();
  const { tasks, loading, updateTask } = useTasksData();
  const [activeView, setActiveView] = useState('today');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const active = tasks.filter(t => t.status !== 'archived' && t.status !== 'cancelled' && t.status !== 'complete');

  const getFilteredTasks = () => {
    switch (activeView) {
      case 'today':
        return active.filter(t => {
          if (!t.due_date) return false;
          const d = new Date(t.due_date as string);
          return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
        });
      case 'overdue':
        return active.filter(t => t.due_date && new Date(t.due_date as string) < today);
      case 'upcoming':
        return active.filter(t => {
          if (!t.due_date) return false;
          const d = new Date(t.due_date as string);
          return d >= today && d <= weekFromNow;
        });
      case 'blocked':
        return tasks.filter(t => t.status === 'blocked');
      case 'awaiting_review':
        return tasks.filter(t => t.status === 'awaiting_review' || t.review_status === 'awaiting_review');
      case 'assigned':
        return active;
      default:
        return active;
    }
  };

  const filtered = getFilteredTasks();
  const counts: Record<string, number> = {};
  for (const v of VIEWS) {
    if (v.id === 'today') counts.today = active.filter(t => { if (!t.due_date) return false; const d = new Date(t.due_date as string); return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate(); }).length;
    else if (v.id === 'overdue') counts.overdue = active.filter(t => t.due_date && new Date(t.due_date as string) < today).length;
    else if (v.id === 'upcoming') counts.upcoming = active.filter(t => { if (!t.due_date) return false; const d = new Date(t.due_date as string); return d >= today && d <= weekFromNow; }).length;
    else if (v.id === 'blocked') counts.blocked = tasks.filter(t => t.status === 'blocked').length;
    else if (v.id === 'awaiting_review') counts.awaiting_review = tasks.filter(t => t.status === 'awaiting_review' || t.review_status === 'awaiting_review').length;
    else if (v.id === 'assigned') counts.assigned = active.length;
  }

  const handleStatusChange = async (id: string, status: string) => {
    const updates: Record<string, unknown> = { status };
    if (status === 'complete') updates.completed_at = new Date().toISOString();
    await updateTask(id, updates);
  };

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto">
        <button onClick={() => router.push('/admin/tasks')}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6 transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to Tasks
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">My Work</h1>
          <p className="text-sm text-slate-400">Your tasks, deadlines, and review queue</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {VIEWS.map(v => (
            <button key={v.id} onClick={() => setActiveView(v.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeView === v.id
                  ? 'bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20'
                  : 'border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.15)]'
              }`}>
              <v.icon className="w-4 h-4" style={{ color: activeView === v.id ? v.color : undefined }} />
              {v.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeView === v.id ? 'bg-[#06B6D4]/20' : 'bg-white/5'}`}>
                {loading ? '—' : (counts[v.id] || 0)}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
          </div>
        ) : (
          <TasksTable
            tasks={filtered}
            onStatusChange={handleStatusChange}
            emptyMessage={`No tasks in "${VIEWS.find(v => v.id === activeView)?.label}"`}
          />
        )}
      </div>
    </AdminShell>
  );
}