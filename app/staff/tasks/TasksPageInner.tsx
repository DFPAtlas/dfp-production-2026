'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from '@/components/motion';
import {
  Search, RefreshCw, Plus, CheckCircle, Clock, AlertCircle,
  Loader2, Calendar, ChevronDown, X, ArrowUpRight,
  FolderKanban, Users, User, SlidersHorizontal, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import TaskAttentionCards from '@/components/staff/TaskAttentionCards';
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
  progress: number | null;
  project_name?: string;
  assignee_name?: string;
}

interface ProjectOption { id: string; name: string; }
interface StaffOption { id: string; full_name: string; }

const STATUS_VALUES = ['todo', 'in_progress', 'review', 'done'] as const;
const PRIORITY_VALUES = ['urgent', 'high', 'medium', 'low'] as const;

const statusLabels: Record<string, string> = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };
const statusColors: Record<string, string> = { todo: '#9CA3AF', in_progress: '#F59E0B', review: '#8B5CF6', done: '#10B981' };
const priorityLabels: Record<string, string> = { urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low' };
const priorityColors: Record<string, string> = { urgent: '#EF4444', high: '#F59E0B', medium: '#3B82F6', low: '#9CA3AF' };

const TEAM_VIEW_ROLES = ['admin', 'super_admin', 'project_lead'];

function formatDateShort(dateStr: string): string {
  return new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function getGroupLabel(group: string, tasks: TaskItem[]): string {
  if (tasks.length === 0) return '';
  switch (group) {
    case 'overdue': return 'Overdue';
    case 'today': return 'Due Today';
    case 'this_week': return 'This Week';
    case 'later': return 'Later';
    case 'no_date': return 'No Due Date';
    case 'completed': return 'Completed';
    default: return group;
  }
}

function getGroupColor(group: string): string {
  switch (group) {
    case 'overdue': return '#EF4444';
    case 'today': return '#F59E0B';
    case 'this_week': return '#06B6D4';
    case 'later': return '#8B5CF6';
    case 'completed': return '#10B981';
    default: return '#9CA3AF';
  }
}

export default function TasksPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<{ id: string; full_name: string; role: string } | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [viewMode, setViewMode] = useState<'personal' | 'team'>(() => {
    const v = searchParams.get('view');
    return v === 'team' ? 'team' : 'personal';
  });

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || 'all');
  const [projectFilter, setProjectFilter] = useState(searchParams.get('project') || 'all');
  const [dueFilter, setDueFilter] = useState(searchParams.get('due') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'priority');
  const [groupBy, setGroupBy] = useState(searchParams.get('group') || 'due_date');
  const [activeCard, setActiveCard] = useState(searchParams.get('active_card') || '');

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState('');
  const [statusChangingId, setStatusChangingId] = useState<string | null>(null);

  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [completedExpanded, setCompletedExpanded] = useState(false);
  const cancelledRef = useRef(false);

  const updateUrlParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'all') params.set(key, value);
      else params.delete(key);
    });
    const newUrl = `/staff/tasks${params.toString() ? '?' + params.toString() : ''}`;
    router.replace(newUrl, { scroll: false });
  }, [searchParams, router]);

  const canViewTeam = profile ? TEAM_VIEW_ROLES.includes(profile.role) : false;
  const canAssignOthers = profile ? ['admin', 'super_admin', 'project_lead'].includes(profile.role) : false;
  const canDelete = profile ? ['admin', 'super_admin'].includes(profile.role) : false;

  useEffect(() => {
    cancelledRef.current = false;
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/staff/login'); return; }
      const { data: sp } = await supabase.from('staff_profiles').select('id, full_name, role').eq('id', session.user.id).maybeSingle();
      if (!sp) { router.replace('/staff/login'); return; }
      if (cancelledRef.current) return;
      setProfile(sp);

      const tasksPromise = supabase
        .from('project_tasks')
        .select('id, project_id, title, description, status, priority, assigned_to, due_date, completed_at, created_at, updated_at, progress')
        .order('created_at', { ascending: false })
        .limit(200);

      const projectsPromise = supabase.from('projects').select('id, name').order('name');
      const staffPromise = supabase.from('staff_profiles').select('id, full_name').order('full_name');

      const [tasksRes, projectsRes, staffRes] = await Promise.all([tasksPromise, projectsPromise, staffPromise]);

      if (cancelledRef.current) return;

      if (tasksRes.error) { setError(tasksRes.error.message); setLoading(false); return; }
      if (projectsRes.data) setProjects(projectsRes.data);
      if (staffRes.data) setStaffOptions(staffRes.data);

      const projectMap = new Map<string, string>();
      projectsRes.data?.forEach(p => projectMap.set(p.id, p.name));
      const staffMap = new Map<string, string>();
      staffRes.data?.forEach(s => staffMap.set(s.id, s.full_name || 'Staff'));

      const enriched: TaskItem[] = (tasksRes.data || []).map(t => ({
        ...t,
        project_name: projectMap.get(t.project_id) || 'Unknown',
        assignee_name: t.assigned_to ? (staffMap.get(t.assigned_to) || 'Unknown') : undefined,
      }));

      setTasks(enriched);
      setLoading(false);
    }
    init();
    return () => { cancelledRef.current = true; };
  }, [router]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const due = params.get('due');
    const status = params.get('status');
    const activeCardParam = params.get('active_card');

    if (due === 'overdue') { setDueFilter('overdue'); setActiveCard('overdue'); }
    else if (due === 'today') { setDueFilter('today'); setActiveCard('due_today'); }
    else if (activeCardParam === 'overdue') { setDueFilter('overdue'); setActiveCard('overdue'); }
    else if (activeCardParam === 'due_today') { setDueFilter('today'); setActiveCard('due_today'); }
    else if (activeCardParam === 'in_progress') { setStatusFilter('in_progress'); setActiveCard('in_progress'); }
    else if (activeCardParam === 'completed_week') { setStatusFilter('done'); setActiveCard('completed_week'); }
    else if (status === 'in_progress') { setStatusFilter('in_progress'); setActiveCard('in_progress'); }

    const projectParam = params.get('project');
    if (projectParam) setProjectFilter(projectParam);
    const searchParam = params.get('search');
    if (searchParam) setSearchQuery(searchParam);
    const sortParam = params.get('sort');
    if (sortParam) setSortBy(sortParam);
    const groupParam = params.get('group');
    if (groupParam) setGroupBy(groupParam);
    const viewParam = params.get('view');
    if (viewParam === 'team' && canViewTeam) setViewMode('team');
  }, []);

  const handleCardSelect = useCallback((key: string | null) => {
    setActiveCard(key || '');
    if (!key) {
      setDueFilter('all');
      setStatusFilter('all');
      updateUrlParams({ active_card: '', due: '', status: '' });
      return;
    }
    switch (key) {
      case 'overdue':
        setDueFilter('overdue'); setStatusFilter('all');
        updateUrlParams({ active_card: 'overdue', due: 'overdue', status: '' });
        break;
      case 'due_today':
        setDueFilter('today'); setStatusFilter('all');
        updateUrlParams({ active_card: 'due_today', due: 'today', status: '' });
        break;
      case 'in_progress':
        setStatusFilter('in_progress'); setDueFilter('all');
        updateUrlParams({ active_card: 'in_progress', status: 'in_progress', due: '' });
        break;
      case 'completed_week':
        setStatusFilter('done'); setDueFilter('all');
        updateUrlParams({ active_card: 'completed_week', status: 'done', due: '' });
        break;
    }
  }, [updateUrlParams]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setProjectFilter('all');
    setDueFilter('all');
    setSortBy('priority');
    setActiveCard('');
    router.replace('/staff/tasks', { scroll: false });
  }, [router]);

  const refreshData = useCallback(async () => {
    if (!profile) return;
    setRefreshing(true);
    const tasksPromise = supabase
      .from('project_tasks')
      .select('id, project_id, title, description, status, priority, assigned_to, due_date, completed_at, created_at, updated_at, progress')
      .order('created_at', { ascending: false })
      .limit(200);

    const projectsPromise = supabase.from('projects').select('id, name').order('name');
    const [tasksRes, projectsRes] = await Promise.all([tasksPromise, projectsPromise]);

    if (cancelledRef.current) return;
    if (tasksRes.error) { setRefreshing(false); return; }
    if (projectsRes.data) setProjects(projectsRes.data);

    const projectMap = new Map<string, string>();
    projectsRes.data?.forEach(p => projectMap.set(p.id, p.name));
    const staffMap = new Map<string, string>();
    staffOptions.forEach(s => staffMap.set(s.id, s.full_name || 'Staff'));

    const enriched: TaskItem[] = (tasksRes.data || []).map(t => ({
      ...t,
      project_name: projectMap.get(t.project_id) || 'Unknown',
      assignee_name: t.assigned_to ? (staffMap.get(t.assigned_to) || 'Unknown') : undefined,
    }));

    setTasks(enriched);

    const stillExists = selectedTaskId && enriched.find(t => t.id === selectedTaskId);
    if (!stillExists) setSelectedTaskId(null);

    setRefreshing(false);
  }, [profile, staffOptions, selectedTaskId]);

  const filteredTasks = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    const startOfWeek = new Date();
    const dayOfWeek = startOfWeek.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(startOfWeek.getDate() + mondayOffset);
    startOfWeek.setHours(0, 0, 0, 0);
    const weekStartStr = startOfWeek.toISOString().split('T')[0];

    let filtered = tasks.filter(t => {
      if (viewMode === 'personal' && profile) {
        if (t.assigned_to !== profile.id) return false;
      }
      return true;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description?.toLowerCase().includes(q)) ||
        (t.project_name?.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'all') filtered = filtered.filter(t => t.status === statusFilter);
    if (priorityFilter !== 'all') filtered = filtered.filter(t => t.priority === priorityFilter);
    if (projectFilter !== 'all') filtered = filtered.filter(t => t.project_id === projectFilter);

    if (dueFilter === 'overdue') {
      filtered = filtered.filter(t => t.due_date && t.due_date < todayStr && t.status !== 'done');
    } else if (dueFilter === 'today') {
      filtered = filtered.filter(t => t.due_date === todayStr && t.status !== 'done');
    } else if (dueFilter === 'this_week') {
      filtered = filtered.filter(t => t.due_date && t.due_date >= todayStr && t.due_date <= weekEndStr && t.status !== 'done');
    } else if (dueFilter === 'no_date') {
      filtered = filtered.filter(t => !t.due_date && t.status !== 'done');
    }

    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    filtered.sort((a, b) => {
      if (sortBy === 'priority') {
        const aPO = priorityOrder[a.priority] ?? 2;
        const bPO = priorityOrder[b.priority] ?? 2;
        if (aPO !== bPO) return aPO - bPO;
        if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
        if (a.due_date) return -1;
        if (b.due_date) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'due_date') {
        if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
        if (a.due_date) return -1;
        if (b.due_date) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return 0;
    });

    const today = new Date().toISOString().split('T')[0];
    const groups: Record<string, TaskItem[]> = {
      overdue: [],
      today: [],
      this_week: [],
      later: [],
      no_date: [],
      completed: [],
    };

    filtered.forEach(t => {
      if (t.status === 'done') { groups.completed.push(t); return; }
      if (t.due_date && t.due_date < today) { groups.overdue.push(t); return; }
      if (t.due_date === today) { groups.today.push(t); return; }
      if (t.due_date && t.due_date <= weekEndStr) { groups.this_week.push(t); return; }
      if (t.due_date) { groups.later.push(t); return; }
      groups.no_date.push(t);
    });

    return groups;
  }, [tasks, viewMode, profile, searchQuery, statusFilter, priorityFilter, projectFilter, dueFilter, sortBy]);

  const attentionStats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const startOfWeek = new Date();
    const dayOfWeek = startOfWeek.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(startOfWeek.getDate() + mondayOffset);
    startOfWeek.setHours(0, 0, 0, 0);

    const personal = tasks.filter(t => profile && t.assigned_to === profile.id);
    return {
      dueToday: personal.filter(t => t.due_date === todayStr && t.status !== 'done').length,
      overdue: personal.filter(t => t.due_date && t.due_date < todayStr && t.status !== 'done').length,
      inProgress: personal.filter(t => t.status === 'in_progress').length,
      completedThisWeek: personal.filter(t => t.status === 'done' && t.completed_at && new Date(t.completed_at) >= startOfWeek).length,
    };
  }, [tasks, profile]);

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return tasks.find(t => t.id === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    setStatusChangingId(taskId);
    const prevTasks = [...tasks];
    const prevTask = tasks.find(t => t.id === taskId);

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: newStatus,
          completed_at: newStatus === 'done' ? new Date().toISOString() : null,
        };
      }
      return t;
    }));

    const updatePayload: Record<string, unknown> = { status: newStatus };
    if (newStatus === 'done') updatePayload.completed_at = new Date().toISOString();
    else updatePayload.completed_at = null;

    const { error } = await supabase.from('project_tasks').update(updatePayload).eq('id', taskId);

    if (error) {
      setTasks(prevTasks);
    }
    setStatusChangingId(null);
  };

  const handleCreateTask = async (data: TaskFormData) => {
    setSaving(true);
    setCreateError('');

    const payload: Record<string, unknown> = {
      project_id: data.project_id,
      title: data.title,
      status: data.status,
      priority: data.priority,
    };
    if (data.description) payload.description = data.description;
    if (data.assigned_to) payload.assigned_to = data.assigned_to;
    if (data.due_date) payload.due_date = data.due_date;

    const { data: created, error } = await supabase
      .from('project_tasks')
      .insert(payload)
      .select('id, project_id, title, description, status, priority, assigned_to, due_date, completed_at, created_at, updated_at, progress')
      .single();

    if (error) {
      setCreateError(error.message);
      setSaving(false);
      return;
    }

    if (created) {
      const projectName = projects.find(p => p.id === created.project_id)?.name || 'Unknown';
      const assigneeName = created.assigned_to
        ? staffOptions.find(s => s.id === created.assigned_to)?.full_name
        : undefined;

      setTasks(prev => [{
        ...created,
        project_name: projectName,
        assignee_name: assigneeName,
      }, ...prev]);
      setShowCreateModal(false);
    }
    setSaving(false);
  };

  const handleDeleteTask = async () => {
    if (!deleteTaskId) return;
    setDeleting(true);
    const { error } = await supabase.from('project_tasks').delete().eq('id', deleteTaskId);
    if (!error) {
      setTasks(prev => prev.filter(t => t.id !== deleteTaskId));
      if (selectedTaskId === deleteTaskId) setSelectedTaskId(null);
      setDeleteTaskId(null);
    }
    setDeleting(false);
  };

  const handleViewModeToggle = (mode: 'personal' | 'team') => {
    setViewMode(mode);
    updateUrlParams({ view: mode === 'team' ? 'team' : '' });
  };

  const totalFiltered = Object.values(filteredTasks).reduce((sum, g) => sum + g.length, 0);
  const totalTasks = tasks.length;
  const hasActiveFilters = searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || projectFilter !== 'all' || dueFilter !== 'all' || activeCard;

  if (loading) return null;

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="w-12 h-12 text-[#EF4444] mb-4" />
          <p className="text-white font-bold text-lg mb-1">Unable to load tasks</p>
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <button onClick={refreshData}
            className="px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">My Tasks</h1>
            <p className="text-slate-400 mt-1 text-sm">Plan, prioritise and complete your project work.</p>
          </div>
          <div className="flex items-center gap-2">
            {canViewTeam && (
              <div className="flex items-center bg-white/5 rounded-xl p-1">
                <button
                  onClick={() => handleViewModeToggle('personal')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${viewMode === 'personal' ? 'bg-[#06B6D4] text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  My Tasks
                </button>
                <button
                  onClick={() => handleViewModeToggle('team')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${viewMode === 'team' ? 'bg-[#06B6D4] text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Team Tasks
                </button>
              </div>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> New Task
            </button>
          </div>
        </div>
      </motion.div>

      <TaskAttentionCards
        dueToday={attentionStats.dueToday}
        overdue={attentionStats.overdue}
        inProgress={attentionStats.inProgress}
        completedThisWeek={attentionStats.completedThisWeek}
        loading={loading}
        selectedCard={activeCard}
        onSelect={handleCardSelect}
      />

      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search tasks by title, description or project..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                updateUrlParams({ search: e.target.value });
              }}
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 focus:border-[#06B6D4]/30 transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); updateUrlParams({ status: e.target.value }); }}
              className="px-3 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 transition-all"
            >
              <option value="all">All Status</option>
              {STATUS_VALUES.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); updateUrlParams({ priority: e.target.value }); }}
              className="px-3 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 transition-all"
            >
              <option value="all">All Priority</option>
              {PRIORITY_VALUES.map(p => <option key={p} value={p}>{priorityLabels[p]}</option>)}
            </select>

            <select
              value={projectFilter}
              onChange={(e) => { setProjectFilter(e.target.value); updateUrlParams({ project: e.target.value }); }}
              className="px-3 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 transition-all max-w-[180px]"
            >
              <option value="all">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <select
              value={dueFilter}
              onChange={(e) => { setDueFilter(e.target.value); updateUrlParams({ due: e.target.value }); }}
              className="px-3 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 transition-all"
            >
              <option value="all">All Dates</option>
              <option value="overdue">Overdue</option>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="no_date">No Due Date</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); updateUrlParams({ sort: e.target.value }); }}
              className="px-3 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 transition-all"
            >
              <option value="priority">Priority</option>
              <option value="due_date">Due Date</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2.5 border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}

            <button
              onClick={refreshData}
              disabled={refreshing}
              className="p-2.5 border border-[rgba(255,255,255,0.08)] rounded-xl text-slate-400 hover:text-[#06B6D4] transition-all cursor-pointer disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[rgba(255,255,255,0.04)]">
          <p className="text-xs text-slate-500">
            {totalFiltered} task{totalFiltered !== 1 ? 's' : ''}
            {hasActiveFilters && ` filtered`}
            {viewMode === 'team' && ` · Team view`}
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 uppercase mr-1">Group:</span>
            {(['due_date', 'project', 'status'] as const).map(g => (
              <button
                key={g}
                onClick={() => setGroupBy(g)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${groupBy === g ? 'bg-[#06B6D4]/15 text-[#06B6D4]' : 'text-slate-400 hover:text-white'}`}
              >
                {g === 'due_date' ? 'Due Date' : g === 'project' ? 'Project' : 'Status'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
        {totalFiltered === 0 ? (
          <div className="text-center py-16 px-4">
            {hasActiveFilters ? (
              <>
                <SlidersHorizontal className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-300 font-medium">No results match these filters</p>
                <p className="text-sm text-slate-500 mt-1">Try adjusting or clearing your filters.</p>
                <button onClick={clearFilters}
                  className="mt-4 px-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  Clear Filters
                </button>
              </>
            ) : viewMode === 'personal' ? (
              <>
                <CheckCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-300 font-medium">No tasks assigned</p>
                <p className="text-sm text-slate-500 mt-1">You don&apos;t have any tasks yet.</p>
                <button onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" /> Create Your First Task
                </button>
              </>
            ) : (
              <>
                <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-300 font-medium">No team tasks</p>
                <p className="text-sm text-slate-500 mt-1">No tasks are visible in team view.</p>
              </>
            )}
          </div>
        ) : (
          <div>
            {groupBy === 'due_date' && (
              <>
                {(['overdue', 'today', 'this_week', 'later', 'no_date', 'completed'] as const).map(groupKey => {
                  const groupTasks = filteredTasks[groupKey];
                  if (groupTasks.length === 0) return null;
                  const isCompleted = groupKey === 'completed';
                  const isExpanded = !isCompleted || completedExpanded;

                  return (
                    <div key={groupKey}>
                      <button
                        onClick={() => isCompleted && setCompletedExpanded(!completedExpanded)}
                        className={`w-full flex items-center gap-3 px-5 py-3 border-b border-[rgba(255,255,255,0.06)] ${isCompleted ? 'cursor-pointer hover:bg-white/[0.02]' : ''}`}
                      >
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getGroupColor(groupKey) }} />
                        <span className="text-sm font-semibold text-white">{getGroupLabel(groupKey, groupTasks)}</span>
                        <span className="text-xs text-slate-500">({groupTasks.length})</span>
                        {isCompleted && (
                          <ChevronDown className={`w-4 h-4 text-slate-400 ml-auto transition-transform ${completedExpanded ? 'rotate-180' : ''}`} />
                        )}
                      </button>
                      {isExpanded && groupTasks.map(task => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          onToggleStatus={handleStatusChange}
                          onSelect={(id) => setSelectedTaskId(id === selectedTaskId ? null : id)}
                          isSelected={selectedTaskId === task.id}
                          statusChanging={statusChangingId === task.id}
                          showAssignee={viewMode === 'team'}
                        />
                      ))}
                      {isCompleted && !completedExpanded && (
                        <div className="px-5 py-2 border-b border-[rgba(255,255,255,0.04)]">
                          <p className="text-xs text-slate-500">{groupTasks.length} completed task{groupTasks.length !== 1 ? 's' : ''} hidden</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}

            {groupBy === 'status' && STATUS_VALUES.map(status => {
              const groupTasks = Object.values(filteredTasks).flat().filter(t => t.status === status);
              if (groupTasks.length === 0) return null;
              return (
                <div key={status}>
                  <div className="flex items-center gap-3 px-5 py-3 border-b border-[rgba(255,255,255,0.06)]">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusColors[status] || '#9CA3AF' }} />
                    <span className="text-sm font-semibold text-white">{statusLabels[status]}</span>
                    <span className="text-xs text-slate-500">({groupTasks.length})</span>
                  </div>
                  {groupTasks.map(task => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onToggleStatus={handleStatusChange}
                      onSelect={(id) => setSelectedTaskId(id === selectedTaskId ? null : id)}
                      isSelected={selectedTaskId === task.id}
                      statusChanging={statusChangingId === task.id}
                      showAssignee={viewMode === 'team'}
                    />
                  ))}
                </div>
              );
            })}

            {groupBy === 'project' && (() => {
              const byProject = new Map<string, TaskItem[]>();
              Object.values(filteredTasks).flat().forEach(t => {
                const key = t.project_name || 'Unknown';
                if (!byProject.has(key)) byProject.set(key, []);
                byProject.get(key)!.push(t);
              });
              const sortedProjects = [...byProject.entries()].sort((a, b) => a[0].localeCompare(b[0]));
              return sortedProjects.map(([projectName, groupTasks]) => (
                <div key={projectName}>
                  <div className="flex items-center gap-3 px-5 py-3 border-b border-[rgba(255,255,255,0.06)]">
                    <FolderKanban className="w-4 h-4 text-[#06B6D4]" />
                    <span className="text-sm font-semibold text-white">{projectName}</span>
                    <span className="text-xs text-slate-500">({groupTasks.length})</span>
                  </div>
                  {groupTasks.map(task => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onToggleStatus={handleStatusChange}
                      onSelect={(id) => setSelectedTaskId(id === selectedTaskId ? null : id)}
                      isSelected={selectedTaskId === task.id}
                      statusChanging={statusChangingId === task.id}
                      showAssignee={viewMode === 'team'}
                    />
                  ))}
                </div>
              ));
            })()}
          </div>
        )}
      </div>

      <TaskCreateModal
        open={showCreateModal}
        onClose={() => { setShowCreateModal(false); setCreateError(''); }}
        onSave={handleCreateTask}
        saving={saving}
        projects={projects}
        staffOptions={staffOptions}
        showAssignee={canAssignOthers}
        currentUserId={profile?.id || ''}
      />

      <TaskDetailDrawer
        open={selectedTaskId !== null}
        task={selectedTask}
        onClose={() => setSelectedTaskId(null)}
        onStatusChange={handleStatusChange}
        onDelete={(id) => setDeleteTaskId(id)}
        canEdit={true}
        canDelete={canDelete}
        statusChanging={statusChangingId === selectedTaskId}
        deleting={deleting}
      />

      <DeleteConfirmDialog
        open={deleteTaskId !== null}
        taskTitle={selectedTask?.title || ''}
        deleting={deleting}
        onConfirm={handleDeleteTask}
        onCancel={() => setDeleteTaskId(null)}
      />
    </div>
  );
}

function TaskRow({
  task,
  onToggleStatus,
  onSelect,
  isSelected,
  statusChanging,
  showAssignee,
}: {
  task: TaskItem;
  onToggleStatus: (id: string, status: string) => Promise<void>;
  onSelect: (id: string) => void;
  isSelected: boolean;
  statusChanging: boolean;
  showAssignee: boolean;
}) {
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = task.due_date && task.due_date < today && task.status !== 'done';
  const isDueToday = task.due_date && task.due_date === today && task.status !== 'done';
  const isDone = task.status === 'done';

  return (
    <div
      onClick={() => onSelect(task.id)}
      className={`flex items-center gap-3 lg:gap-4 px-5 py-3.5 border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors cursor-pointer ${isSelected ? 'bg-[#06B6D4]/5 border-l-2 border-l-[#06B6D4]' : ''}`}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onToggleStatus(task.id, isDone ? 'todo' : 'done'); }}
        disabled={statusChanging}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all ${
          isDone
            ? 'bg-[#10B981] border-[#10B981]'
            : 'border-[rgba(255,255,255,0.15)] hover:border-[#10B981]/50'
        }`}
        title={isDone ? 'Reopen task' : 'Mark complete'}
        aria-label={isDone ? 'Reopen task' : 'Mark complete'}
      >
        {statusChanging ? (
          <Loader2 className="w-3 h-3 text-white animate-spin" />
        ) : isDone ? (
          <CheckCircle className="w-3 h-3 text-white" />
        ) : null}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0"
            style={{
              backgroundColor: (priorityColors[task.priority] || '#9CA3AF') + '15',
              color: priorityColors[task.priority] || '#9CA3AF',
              borderColor: (priorityColors[task.priority] || '#9CA3AF') + '30',
            }}
          >
            {priorityLabels[task.priority]?.charAt(0) || 'M'}
          </span>
          <p className={`text-sm font-medium truncate ${isDone ? 'text-slate-500 line-through' : 'text-white'}`}>
            {task.title}
          </p>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <Link
            href={`/staff/projects/${task.project_id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-[#06B6D4] hover:underline truncate max-w-[180px] cursor-pointer"
          >
            {task.project_name || 'Unknown'}
          </Link>
          {task.description && (
            <span className="text-xs text-slate-500 truncate hidden sm:inline">{task.description}</span>
          )}
        </div>
      </div>

      {showAssignee && task.assignee_name && (
        <div className="hidden lg:flex items-center gap-1.5 shrink-0" title={task.assignee_name}>
          <div className="w-6 h-6 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center text-[#8B5CF6] text-[10px] font-bold">
            {task.assignee_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
        </div>
      )}

      <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border shrink-0`}
        style={{
          backgroundColor: (statusColors[task.status] || '#9CA3AF') + '15',
          color: statusColors[task.status] || '#9CA3AF',
          borderColor: (statusColors[task.status] || '#9CA3AF') + '30',
        }}
      >
        {statusLabels[task.status]}
      </span>

      {task.due_date ? (
        <span className={`inline-flex items-center gap-1 text-xs shrink-0 ${isOverdue ? 'text-[#EF4444] font-semibold' : isDueToday ? 'text-[#F59E0B] font-medium' : 'text-slate-400'}`}>
          <Calendar className="w-3 h-3" />
          {formatDateShort(task.due_date)}
        </span>
      ) : (
        <span className="text-xs text-slate-600 shrink-0 hidden sm:inline">—</span>
      )}

      <div className="w-6 h-6 flex items-center justify-center shrink-0 text-slate-500">
        <ChevronRight className="w-4 h-4" />
      </div>
    </div>
  );
}