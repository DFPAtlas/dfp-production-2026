'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from '@/components/motion';
import {
  Clock, AlertTriangle, MessageSquare, AlertCircle,
  FolderKanban, ArrowUpRight, User, Calendar,
  CheckCircle, Plus, Target, FileText, ChevronRight,
  RefreshCw, Loader2, Search,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StaffShell from '../../../components/staff/StaffShell';
import DashboardSkeleton from '../../../components/staff/DashboardSkeleton';

interface StaffProfile { id: string; full_name: string | null; role: string; }
interface TaskItem { id: string; project_id: string; title: string; status: string; priority: string; due_date: string | null; completed_at: string | null; project_name?: string; client_name?: string; assigned_avatar?: string; }
interface ProjectItem { id: string; name: string; client_id: string; status: string; progress: number; health: string | null; start_date: string | null; end_date: string | null; project_lead: string | null; assigned_staff: string[]; next_milestone?: string; next_milestone_due?: string | null; }
interface ActivityItem { id: string; project_id: string; actor_id: string | null; activity_type: string; title: string | null; description: string | null; created_at: string; project_name?: string; actor_name?: string; }
interface ClientRequest { id: string; project_id: string; sender_name: string; content: string; created_at: string; project_name?: string; type: string; }
interface MilestoneItem { id: string; project_id: string; title: string; due_date: string | null; status: string; project_name?: string; }

function getGreeting(firstName: string): { greeting: string; timeOfDay: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { greeting: `Good morning, ${firstName}`, timeOfDay: 'morning' };
  if (hour < 17) return { greeting: `Good afternoon, ${firstName}`, timeOfDay: 'afternoon' };
  return { greeting: `Good evening, ${firstName}`, timeOfDay: 'evening' };
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatActivityLabel(type: string): string {
  switch (type) {
    case 'project_created': return 'Project created';
    case 'project_updated': return 'Project updated';
    case 'task_created': return 'Task created';
    case 'task_completed': return 'Task completed';
    case 'milestone_completed': return 'Milestone completed';
    case 'message_sent': return 'Message sent';
    case 'file_uploaded': return 'File uploaded';
    case 'status_changed': return 'Status changed';
    case 'lead_converted': return 'Lead converted';
    default: return type.replace(/_/g, ' ');
  }
}

const priorityConfig: Record<string, { color: string; bg: string; label: string }> = {
  urgent: { color: '#EF4444', bg: 'bg-[#EF4444]/10', label: 'Urgent' },
  high: { color: '#F59E0B', bg: 'bg-[#F59E0B]/10', label: 'High' },
  medium: { color: '#3B82F6', bg: 'bg-[#3B82F6]/10', label: 'Medium' },
  low: { color: '#9CA3AF', bg: 'bg-white/5', label: 'Low' },
};

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  todo: { color: '#9CA3AF', bg: 'bg-white/5', label: 'To Do' },
  in_progress: { color: '#F59E0B', bg: 'bg-[#F59E0B]/10', label: 'In Progress' },
  review: { color: '#8B5CF6', bg: 'bg-[#8B5CF6]/10', label: 'Review' },
  done: { color: '#10B981', bg: 'bg-[#10B981]/10', label: 'Done' },
};

export default function StaffDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [firstName, setFirstName] = useState('');

  const [dueToday, setDueToday] = useState(0);
  const [overdue, setOverdue] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [projectsAtRisk, setProjectsAtRisk] = useState(0);

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState('');

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState('');

  const [clientRequests, setClientRequests] = useState<ClientRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState('');

  const [schedule, setSchedule] = useState<MilestoneItem[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState('');

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState('');

  const [taskFilter, setTaskFilter] = useState<'today' | 'week' | 'all'>('today');
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskProject, setNewTaskProject] = useState('');
  const [showNewTask, setShowNewTask] = useState(false);
  const [allProjects, setAllProjects] = useState<{ id: string; name: string }[]>([]);
  const [addingTask, setAddingTask] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setTimeout(() => router.replace('/staff/login'), 0); return; }

      const { data: sp } = await supabase.from('staff_profiles').select('id, full_name, role').eq('id', session.user.id).maybeSingle();
      if (!sp) { setTimeout(() => router.replace('/staff/login'), 0); return; }

      if (cancelled) return;
      setProfile(sp);
      setFirstName(sp.full_name?.split(' ')[0] || session.user.email?.split('@')[0] || 'Staff');
      setLoading(false);

      loadAllData(session.user.id, sp.role, () => cancelled);
    }

    init();
    return () => { cancelled = true; };
  }, [router]);

  const loadAllData = async (userId: string, role: string, cancelled: () => boolean) => {
    const todayStr = new Date().toISOString().split('T')[0];

    const tasksPromise = supabase
      .from('project_tasks')
      .select('id, project_id, title, status, priority, due_date, completed_at')
      .neq('status', 'done')
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('priority', { ascending: true })
      .limit(50);

    const projectsPromise = supabase
      .from('projects')
      .select('id, name, client_id, status, progress, health, start_date, end_date, project_lead, assigned_staff')
      .neq('status', 'cancelled')
      .order('updated_at', { ascending: false })
      .limit(20);

    const messagesPromise = supabase
      .from('project_messages')
      .select('id, project_id, sender_name, content, read, created_at, sender_id')
      .eq('is_internal', false)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(30);

    const milestonesPromise = supabase
      .from('milestones')
      .select('id, project_id, title, due_date, status')
      .neq('status', 'completed')
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(20);

    const activityPromise = supabase
      .from('project_activity')
      .select('id, project_id, actor_id, activity_type, title, description, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    const allProjectsPromise = supabase.from('projects').select('id, name').order('name');

    const [tasksRes, projectsRes, messagesRes, milestonesRes, activityRes, allProjectsRes] = await Promise.all([
      tasksPromise, projectsPromise, messagesPromise, milestonesPromise, activityPromise, allProjectsPromise,
    ]);

    if (cancelled()) return;

    if (allProjectsRes.data) setAllProjects(allProjectsRes.data);

    const projectMap = new Map<string, string>();
    const projectClientMap = new Map<string, string>();
    if (projectsRes.data) {
      projectsRes.data.forEach(p => projectMap.set(p.id, p.name));
      const clientIds = [...new Set(projectsRes.data.map(p => p.client_id).filter(Boolean))];
      if (clientIds.length > 0) {
        const { data: clientsData } = await supabase.from('clients').select('id, company_name').in('id', clientIds);
        if (cancelled()) return;
        if (clientsData) {
          clientsData.forEach(c => projectClientMap.set(c.id, c.company_name || ''));
        }
      }
      projectsRes.data.forEach(p => {
        if (p.client_id && projectClientMap.has(p.client_id)) {
          projectMap.set(p.id, `${projectClientMap.get(p.client_id)} - ${p.name}`);
        }
      });
    }

    if (messagesRes.data) {
      const threadProjectMap = new Map<string, string>();
      const threadIds = messagesRes.data.filter(m => m.project_id).map(m => m.project_id);
      if (threadIds.length > 0) {
        const { data: threadProjects } = await supabase.from('projects').select('id, name').in('id', [...new Set(threadIds)]);
        if (cancelled()) return;
        if (threadProjects) threadProjects.forEach(p => threadProjectMap.set(p.id, p.name));
      }
      const requests: ClientRequest[] = messagesRes.data.slice(0, 10).map(m => ({
        id: m.id,
        project_id: m.project_id,
        sender_name: m.sender_name || 'Client',
        content: m.content || '',
        created_at: m.created_at,
        project_name: threadProjectMap.get(m.project_id) || projectMap.get(m.project_id),
        type: 'message',
      }));
      if (cancelled()) return;
      setClientRequests(requests);
      setUnreadMessages(messagesRes.data.length);
    }
    if (cancelled()) return;
    setRequestsLoading(false);

    const nowStr = new Date().toISOString();
    if (tasksRes.data) {
      const enriched: TaskItem[] = tasksRes.data.map(t => ({
        ...t,
        project_name: projectMap.get(t.project_id),
      }));
      if (cancelled()) return;
      setTasks(enriched);

      let dueCount = 0;
      let overCount = 0;
      enriched.forEach(t => {
        if (!t.due_date) return;
        if (t.due_date < todayStr) overCount++;
        else if (t.due_date === todayStr) dueCount++;
      });
      setDueToday(dueCount);
      setOverdue(overCount);
    }
    if (cancelled()) return;
    setTasksLoading(false);

    if (projectsRes.data) {
      let riskCount = 0;
      const enrichedProjects: ProjectItem[] = projectsRes.data.map(p => {
        const isRisk =
          p.health === 'at_risk' ||
          p.health === 'critical' ||
          p.status === 'on_hold' ||
          (p.end_date && p.end_date < todayStr && p.status !== 'completed');
        if (isRisk) riskCount++;
        return { ...p, next_milestone_due: null };
      });
      if (cancelled()) return;
      setProjects(enrichedProjects);
      setProjectsAtRisk(riskCount);

      const activeProjectIds = projectsRes.data.filter(p => p.status === 'active').map(p => p.id);
      if (activeProjectIds.length > 0) {
        const { data: nextMilestones } = await supabase
          .from('milestones')
          .select('project_id, title, due_date')
          .in('project_id', activeProjectIds)
          .neq('status', 'completed')
          .order('due_date', { ascending: true, nullsFirst: false })
          .limit(activeProjectIds.length);

        if (cancelled()) return;
        if (nextMilestones) {
          const seenProjects = new Set<string>();
          nextMilestones.forEach(m => {
            if (!seenProjects.has(m.project_id)) {
              seenProjects.add(m.project_id);
              const proj = enrichedProjects.find(p => p.id === m.project_id);
              if (proj) {
                proj.next_milestone = m.title;
                proj.next_milestone_due = m.due_date;
              }
            }
          });
        }
      }
    }
    if (cancelled()) return;
    setProjectsLoading(false);

    if (milestonesRes.data) {
      const scheduleItems: MilestoneItem[] = milestonesRes.data
        .filter(m => m.due_date)
        .map(m => ({ ...m, project_name: projectMap.get(m.project_id) }))
        .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''));
      if (cancelled()) return;
      setSchedule(scheduleItems);
    }
    if (cancelled()) return;
    setScheduleLoading(false);

    if (activityRes.data) {
      const actorIds = [...new Set(activityRes.data.map(a => a.actor_id).filter(Boolean))];
      const actorMap = new Map<string, string>();
      if (actorIds.length > 0) {
        const { data: actors } = await supabase.from('staff_profiles').select('id, full_name').in('id', actorIds);
        if (cancelled()) return;
        if (actors) actors.forEach(a => actorMap.set(a.id, a.full_name || 'Staff'));
      }

      const enriched: ActivityItem[] = activityRes.data.map(a => ({
        ...a,
        project_name: projectMap.get(a.project_id),
        actor_name: a.actor_id ? (actorMap.get(a.actor_id) || 'Staff') : 'System',
      }));
      if (cancelled()) return;
      setActivities(enriched);
    }
    if (cancelled()) return;
    setActivityLoading(false);
  };

  const handleCompleteTask = async (taskId: string) => {
    setCompletingTaskId(taskId);
    const { error } = await supabase.from('project_tasks').update({
      status: 'done',
      completed_at: new Date().toISOString(),
    }).eq('id', taskId);

    if (!error) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      const completed = tasks.find(t => t.id === taskId);
      if (completed) {
        const todayStr = new Date().toISOString().split('T')[0];
        if (completed.due_date) {
          if (completed.due_date < todayStr) setOverdue(prev => Math.max(0, prev - 1));
          else if (completed.due_date === todayStr) setDueToday(prev => Math.max(0, prev - 1));
        }
      }
    }
    setCompletingTaskId(null);
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !newTaskProject) return;
    setAddingTask(true);
    const { data: { session } } = await supabase.auth.getSession();

    const { data, error } = await supabase.from('project_tasks').insert({
      project_id: newTaskProject,
      title: newTaskTitle.trim(),
      status: 'todo',
      priority: 'medium',
      assigned_to: session?.user?.id || null,
    }).select('id, project_id, title, status, priority, due_date, completed_at').single();

    if (!error && data) {
      const projectName = allProjects.find(p => p.id === newTaskProject)?.name;
      setTasks(prev => [{ ...data, project_name: projectName }, ...prev]);
      setNewTaskTitle('');
      setNewTaskProject('');
      setShowNewTask(false);
    }
    setAddingTask(false);
  };

  const filteredTasks = tasks.filter(t => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (taskFilter === 'today') return t.due_date && t.due_date <= todayStr;
    if (taskFilter === 'week') {
      if (!t.due_date) return false;
      const sevenDays = new Date();
      sevenDays.setDate(sevenDays.getDate() + 7);
      return t.due_date <= sevenDays.toISOString().split('T')[0];
    }
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const today = new Date().toISOString().split('T')[0];
    const aOverdue = a.due_date && a.due_date < today ? 1 : 0;
    const bOverdue = b.due_date && b.due_date < today ? 1 : 0;
    if (aOverdue !== bOverdue) return bOverdue - aOverdue;
    const pOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return (pOrder[a.priority as keyof typeof pOrder] ?? 2) - (pOrder[b.priority as keyof typeof pOrder] ?? 2);
  });

  const displayTasks = sortedTasks.slice(0, 5);

  if (loading) {
    return (
      <StaffShell>
        <DashboardSkeleton />
      </StaffShell>
    );
  }

  if (error) {
    return (
      <StaffShell>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="w-12 h-12 text-[#EF4444] mb-4" />
          <p className="text-white font-bold text-lg mb-1">Unable to load dashboard</p>
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap">
            Retry
          </button>
        </div>
      </StaffShell>
    );
  }

  const { greeting } = getGreeting(firstName);

  return (
    <StaffShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">{greeting}</h1>
              <p className="text-slate-400 mt-1 text-sm">Here&apos;s what needs your attention today.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNewTask(!showNewTask)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> New Task
              </button>
              <Link
                href="/staff/projects"
                className="flex items-center gap-2 px-4 py-2.5 border border-[rgba(255,255,255,0.12)] rounded-xl text-sm font-semibold text-slate-300 hover:bg-white/5 transition-all cursor-pointer whitespace-nowrap"
              >
                <FolderKanban className="w-4 h-4" /> Open Project
              </Link>
            </div>
          </div>

          {showNewTask && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-4 flex flex-col sm:flex-row gap-3"
            >
              <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task title..."
                className="flex-1 px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#06B6D4] transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()} />
              <select value={newTaskProject} onChange={(e) => setNewTaskProject(e.target.value)}
                className="px-4 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer">
                <option value="">Select Project</option>
                {allProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button onClick={handleAddTask} disabled={!newTaskTitle.trim() || !newTaskProject || addingTask}
                className="px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap flex items-center gap-2">
                {addingTask ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Add
              </button>
              <button onClick={() => { setShowNewTask(false); setNewTaskTitle(''); }}
                className="px-5 py-2.5 border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-slate-400 hover:bg-white/5 transition-all cursor-pointer">Cancel</button>
            </motion.div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            label="Due Today"
            value={dueToday}
            caption={dueToday === 0 ? 'All caught up' : `${dueToday} task${dueToday !== 1 ? 's' : ''} due within 24 hours`}
            icon={Clock}
            color="#06B6D4"
            href="/staff/tasks?due=today"
            delay={0}
          />
          <SummaryCard
            label="Overdue"
            value={overdue}
            caption={overdue === 0 ? 'Nothing past due' : `${overdue} task${overdue !== 1 ? 's' : ''} past due date`}
            icon={AlertTriangle}
            color={overdue > 0 ? '#EF4444' : '#9CA3AF'}
            href="/staff/tasks?due=overdue"
            delay={0.06}
          />
          <SummaryCard
            label="Unread Messages"
            value={unreadMessages}
            caption={unreadMessages === 0 ? 'All read' : `${unreadMessages} unread message${unreadMessages !== 1 ? 's' : ''}`}
            icon={MessageSquare}
            color="#8B5CF6"
            href="/staff/messages"
            delay={0.12}
          />
          <SummaryCard
            label="Projects at Risk"
            value={projectsAtRisk}
            caption={projectsAtRisk === 0 ? 'All projects on track' : `${projectsAtRisk} project${projectsAtRisk !== 1 ? 's' : ''} need${projectsAtRisk === 1 ? 's' : ''} attention`}
            icon={AlertCircle}
            color={projectsAtRisk > 0 ? '#F59E0B' : '#10B981'}
            href="/staff/projects"
            delay={0.18}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-sm">
              <div className="p-5 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-lg font-bold text-white">Priority Work Queue</h2>
                <div className="flex items-center gap-1.5 bg-white/5 rounded-xl p-1">
                  {(['today', 'week', 'all'] as const).map(f => (
                    <button key={f} onClick={() => setTaskFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${taskFilter === f ? 'bg-[#06B6D4] text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      {f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'All'}
                    </button>
                  ))}
                </div>
              </div>

              {tasksError ? (
                <div className="p-8 text-center">
                  <AlertCircle className="w-8 h-8 text-[#EF4444] mx-auto mb-3" />
                  <p className="text-sm text-slate-400 mb-3">{tasksError}</p>
                  <button onClick={() => loadAllData(profile?.id || '', profile?.role || '', () => false)}
                    className="px-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-white transition-all cursor-pointer">
                    <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" /> Retry
                  </button>
                </div>
              ) : displayTasks.length > 0 ? (
                <div>
                  {displayTasks.map((task) => {
                    const prio = priorityConfig[task.priority] || priorityConfig.medium;
                    const stat = statusConfig[task.status] || statusConfig.todo;
                    const isOverdue = task.due_date && task.due_date < new Date().toISOString().split('T')[0];
                    return (
                      <div key={task.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                        <button
                          onClick={() => handleCompleteTask(task.id)}
                          disabled={completingTaskId === task.id}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all ${completingTaskId === task.id ? 'border-[#10B981] bg-[#10B981]/20' : 'border-[rgba(255,255,255,0.15)] hover:border-[#10B981]/50'}`}
                          title="Mark complete"
                        >
                          {completingTaskId === task.id && <Loader2 className="w-3 h-3 text-[#10B981] animate-spin" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{task.title}</p>
                          <p className="text-xs text-slate-500 truncate">
                            {task.project_name || 'Unknown project'}
                            {task.client_name ? ` · ${task.client_name}` : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-medium border ${prio.bg}`} style={{ color: prio.color, borderColor: prio.color + '30' }}>
                            {prio.label}
                          </span>
                          {task.due_date && (
                            <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${isOverdue ? 'text-[#EF4444]' : 'text-slate-400'}`}>
                              <Calendar className="w-3 h-3" />
                              {new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                          <Link
                            href={`/staff/projects/${task.project_id}`}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer ml-1"
                            title="Open project"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-10 text-center">
                  <CheckCircle className="w-10 h-10 text-[#10B981] mx-auto mb-3" />
                  <p className="text-sm font-medium text-white">All caught up</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {taskFilter === 'today' ? 'No tasks due today.' : taskFilter === 'week' ? 'No tasks due this week.' : 'No pending tasks.'}
                  </p>
                </div>
              )}

              <div className="p-3 border-t border-[rgba(255,255,255,0.06)]">
                <Link href="/staff/tasks" className="flex items-center justify-center gap-1.5 text-xs text-[#06B6D4] hover:underline cursor-pointer font-medium">
                  View all tasks <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-sm">
              <div className="p-5 border-b border-[rgba(255,255,255,0.06)]">
                <h2 className="text-lg font-bold text-white">Project Health</h2>
              </div>

              {projectsError ? (
                <div className="p-8 text-center">
                  <AlertCircle className="w-8 h-8 text-[#EF4444] mx-auto mb-3" />
                  <p className="text-sm text-slate-400 mb-3">{projectsError}</p>
                  <button onClick={() => loadAllData(profile?.id || '', profile?.role || '', () => false)}
                    className="px-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-white transition-all cursor-pointer">
                    <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" /> Retry
                  </button>
                </div>
              ) : projects.length > 0 ? (
                <div>
                  {projects.slice(0, 4).map((project) => {
                    const isRisk = project.health === 'at_risk' || project.health === 'critical' || project.status === 'on_hold' || (project.end_date && project.end_date < new Date().toISOString().split('T')[0] && project.status !== 'completed');
                    const healthColor = project.health === 'healthy' || project.status === 'active' ? '#10B981'
                      : project.health === 'at_risk' || project.status === 'on_hold' ? '#F59E0B'
                      : project.health === 'critical' ? '#EF4444'
                      : '#9CA3AF';
                    return (
                      <div key={project.id} className="px-5 py-4 border-b border-[rgba(255,255,255,0.04)] last:border-b-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <Link href={`/staff/projects/${project.id}`} className="text-sm font-semibold text-white hover:text-[#06B6D4] transition-colors cursor-pointer truncate block">
                              {project.name}
                            </Link>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium ml-2 shrink-0`}
                            style={{ backgroundColor: healthColor + '15', color: healthColor }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: healthColor }} />
                            {project.status === 'active' ? 'Active' : project.status === 'planning' ? 'Planning' : project.status === 'on_hold' ? 'On Hold' : project.status === 'completed' ? 'Completed' : project.status}
                          </span>
                        </div>

                        <div className="w-full h-1.5 bg-white/5 rounded-full mb-2 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, project.progress || 0)}%`,
                              backgroundColor: (project.progress || 0) >= 100 ? '#10B981' : (project.progress || 0) >= 50 ? '#06B6D4' : '#F59E0B'
                            }}
                          />
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {project.progress || 0}% complete
                          {project.next_milestone ? ` · Next: ${project.next_milestone}${project.next_milestone_due ? ` (${new Date(project.next_milestone_due).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })})` : ''}` : ''}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-10 text-center">
                  <FolderKanban className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                  <p className="text-sm font-medium text-white">No projects yet</p>
                  <p className="text-xs text-slate-400 mt-1">Projects will appear here once created.</p>
                </div>
              )}

              <div className="p-3 border-t border-[rgba(255,255,255,0.06)]">
                <Link href="/staff/projects" className="flex items-center justify-center gap-1.5 text-xs text-[#06B6D4] hover:underline cursor-pointer font-medium">
                  View all projects <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-sm">
            <div className="p-5 border-b border-[rgba(255,255,255,0.06)]">
              <h2 className="text-lg font-bold text-white">Client Messages</h2>
            </div>

            {requestsError ? (
              <div className="p-6 text-center">
                <p className="text-xs text-slate-400">{requestsError}</p>
              </div>
            ) : clientRequests.length > 0 ? (
              <div>
                {clientRequests.slice(0, 5).map((req) => (
                  <Link key={req.id} href={`/staff/messages`}
                    className="flex items-start gap-3 px-5 py-3.5 border-b border-[rgba(255,255,255,0.04)] last:border-b-0 hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-[#8B5CF6]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-white truncate">{req.sender_name}</p>
                        <span className="text-[10px] text-slate-500 shrink-0">{formatRelativeTime(req.created_at)}</span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{req.content}</p>
                      {req.project_name && <p className="text-[10px] text-slate-500 mt-0.5">{req.project_name}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <MessageSquare className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                <p className="text-sm font-medium text-white">No client messages</p>
                <p className="text-xs text-slate-400 mt-1">New client messages will appear here.</p>
              </div>
            )}

            <div className="p-3 border-t border-[rgba(255,255,255,0.06)]">
              <Link href="/staff/messages" className="flex items-center justify-center gap-1.5 text-xs text-[#06B6D4] hover:underline cursor-pointer font-medium">
                View messages <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-sm">
            <div className="p-5 border-b border-[rgba(255,255,255,0.06)]">
              <h2 className="text-lg font-bold text-white">Today&apos;s Deadlines</h2>
            </div>

            {scheduleError ? (
              <div className="p-6 text-center">
                <p className="text-xs text-slate-400">{scheduleError}</p>
              </div>
            ) : schedule.filter(s => {
              const today = new Date().toISOString().split('T')[0];
              return s.due_date && s.due_date <= today;
            }).length > 0 ? (
              <div>
                {schedule.filter(s => {
                  const today = new Date().toISOString().split('T')[0];
                  return s.due_date && s.due_date <= today;
                }).slice(0, 5).map((item, i) => (
                  <div key={item.id} className="flex gap-3 px-5 py-3.5 border-b border-[rgba(255,255,255,0.04)] last:border-b-0">
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-2 h-2 rounded-full ${item.status === 'completed' ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}`} />
                      {i < schedule.filter(s => {
                        const today = new Date().toISOString().split('T')[0];
                        return s.due_date && s.due_date <= today;
                      }).slice(0, 5).length - 1 && <div className="w-px flex-1 bg-white/5 mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <p className="text-sm font-medium text-white truncate">{item.title}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {item.project_name || 'Unknown project'}
                        {item.due_date && ` · Due ${new Date(item.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 capitalize">
                        {item.status === 'completed' ? 'Completed' : 'Milestone'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Target className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                <p className="text-sm font-medium text-white">No upcoming deadlines</p>
                <p className="text-xs text-slate-400 mt-1">Milestones and task deadlines will appear here.</p>
              </div>
            )}

            <div className="p-3 border-t border-[rgba(255,255,255,0.06)]">
              <Link href="/staff/projects" className="flex items-center justify-center gap-1.5 text-xs text-[#06B6D4] hover:underline cursor-pointer font-medium">
                View projects <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-sm">
            <div className="p-5 border-b border-[rgba(255,255,255,0.06)]">
              <h2 className="text-lg font-bold text-white">Recent Activity</h2>
            </div>

            {activityError ? (
              <div className="p-6 text-center">
                <p className="text-xs text-slate-400">{activityError}</p>
              </div>
            ) : activities.length > 0 ? (
              <div>
                {activities.slice(0, 6).map((act) => (
                  <div key={act.id} className="flex items-start gap-3 px-5 py-3 border-b border-[rgba(255,255,255,0.04)] last:border-b-0">
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                      <ActivityIcon type={act.activity_type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-300 truncate">
                        <span className="font-medium text-white">{act.actor_name}</span>{' '}
                        {formatActivityLabel(act.activity_type).toLowerCase()}
                        {act.project_name ? ` in ${act.project_name}` : ''}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{formatRelativeTime(act.created_at)}</p>
                    </div>
                    {act.project_id && (
                      <Link href={`/staff/projects/${act.project_id}`}
                        className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer shrink-0"
                      >
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <FileText className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                <p className="text-sm font-medium text-white">No recent activity</p>
                <p className="text-xs text-slate-400 mt-1">Project activity will be recorded here.</p>
              </div>
            )}

            <div className="p-3 border-t border-[rgba(255,255,255,0.06)]">
              <Link href="/staff/projects" className="flex items-center justify-center gap-1.5 text-xs text-[#06B6D4] hover:underline cursor-pointer font-medium">
                View all activity <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </StaffShell>
  );
}

function SummaryCard({ label, value, caption, icon: Icon, color, href, delay }: {
  label: string; value: number; caption: string; icon: React.ElementType; color: string; href: string; delay: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5 hover:border-[rgba(255,255,255,0.14)] transition-all group"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</span>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '15' }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
      <p className="text-xs text-slate-500 mt-1.5">{caption}</p>
      <Link href={href} className="inline-block mt-2 text-[11px] text-[#06B6D4] hover:underline cursor-pointer font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        View details
      </Link>
    </motion.div>
  );
}

function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case 'project_created': return <Plus className="w-3.5 h-3.5 text-[#06B6D4]" />;
    case 'task_completed': return <CheckCircle className="w-3.5 h-3.5 text-[#10B981]" />;
    case 'milestone_completed': return <Target className="w-3.5 h-3.5 text-[#8B5CF6]" />;
    case 'message_sent': return <MessageSquare className="w-3.5 h-3.5 text-[#06B6D4]" />;
    case 'file_uploaded': return <FileText className="w-3.5 h-3.5 text-[#F59E0B]" />;
    case 'status_changed': return <RefreshCw className="w-3.5 h-3.5 text-[#F59E0B]" />;
    case 'lead_converted': return <User className="w-3.5 h-3.5 text-[#10B981]" />;
    default: return <FileText className="w-3.5 h-3.5 text-slate-400" />;
  }
}