'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from '@/components/motion';
import {
  Search, RefreshCw, ChevronDown, ArrowUpRight,
  FolderKanban, Calendar, User, X, Plus,
  Clock, CheckCircle, AlertCircle, Pause,
  LayoutGrid, List, AlertTriangle, Target,
  Milestone, Filter,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import StaffShell from '../../../components/staff/StaffShell';
import ProjectsSkeleton from '../../../components/staff/ProjectsSkeleton';

interface Project {
  id: string;
  name: string;
  description: string | null;
  client_id: string;
  status: string;
  budget: number;
  start_date: string | null;
  end_date: string | null;
  progress: number;
  project_lead: string | null;
  assigned_staff: string[];
  health: string | null;
  completed_at: string | null;
  priority: string;
  created_at: string;
  client_name?: string | null;
  client_company?: string | null;
  lead_name?: string | null;
}

interface ProjectWithHealth extends Project {
  healthState: HealthState;
  overdue: { milestones: number; tasks: number };
  totalIncomplete: number;
}

interface ClientInfo { id: string; company_name: string | null; contact_name: string | null; }
interface StaffInfo { id: string; full_name: string | null; role: string; }
interface StaffProfile { id: string; full_name: string | null; role: string; }
interface MilestoneInfo { id: string; project_id: string; title: string; due_date: string | null; status: string; }
interface TaskInfo { id: string; project_id: string; status: string; due_date: string | null; }

type HealthState = 'on_track' | 'needs_attention' | 'at_risk' | 'on_hold' | 'completed' | 'unknown';
type ViewMode = 'grid' | 'list';
type ProjectScope = 'my' | 'all';
type SortMode = 'needs_attention' | 'end_date' | 'progress' | 'newest' | 'name';
type DateFilter = 'all' | 'ending_soon' | 'overdue_end' | 'no_end_date';

const VALID_STATUSES = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];

function deriveHealth(project: Project, overdues: { milestones: number; tasks: number }, totalIncomplete: number): HealthState {
  if (project.status === 'completed') return 'completed';
  if (project.status === 'on_hold') return 'on_hold';
  if (project.health === 'at_risk' || project.health === 'critical') return 'at_risk';
  if (project.health === 'healthy' || project.health === 'on_track') return 'on_track';

  const today = new Date().toISOString().split('T')[0];
  const endPassed = project.end_date && project.end_date < today;
  const hasOverdueMilestones = overdues.milestones > 0;
  const hasOverdueTasks = overdues.tasks > 0;

  if (endPassed && project.status !== 'completed') return 'at_risk';
  if (hasOverdueMilestones) return 'at_risk';
  if (hasOverdueTasks && overdues.tasks >= 2) return 'at_risk';

  if (hasOverdueTasks && overdues.tasks === 1) return 'needs_attention';
  if (project.end_date) {
    const endDate = new Date(project.end_date);
    const daysUntilEnd = Math.ceil((endDate.getTime() - new Date().getTime()) / 86400000);
    if (daysUntilEnd <= 14 && daysUntilEnd > 0 && (project.progress || 0) < 40) return 'needs_attention';
  }

  if (project.status === 'active' || project.status === 'planning') return 'on_track';
  return 'unknown';
}

function getHealthMeta(state: HealthState): { label: string; color: string; bg: string } {
  switch (state) {
    case 'on_track': return { label: 'On Track', color: '#10B981', bg: 'bg-[#10B981]/10' };
    case 'needs_attention': return { label: 'Needs Attention', color: '#F59E0B', bg: 'bg-[#F59E0B]/10' };
    case 'at_risk': return { label: 'At Risk', color: '#EF4444', bg: 'bg-[#EF4444]/10' };
    case 'on_hold': return { label: 'On Hold', color: '#8B5CF6', bg: 'bg-[#8B5CF6]/10' };
    case 'completed': return { label: 'Completed', color: '#10B981', bg: 'bg-[#10B981]/10' };
    default: return { label: 'Unknown', color: '#9CA3AF', bg: 'bg-white/5' };
  }
}

function getStatusMeta(status: string): { label: string; color: string; bg: string } {
  switch (status) {
    case 'planning': return { label: 'Planning', color: '#3B82F6', bg: 'bg-[#3B82F6]/10' };
    case 'active': return { label: 'Active', color: '#10B981', bg: 'bg-[#10B981]/10' };
    case 'on_hold': return { label: 'On Hold', color: '#8B5CF6', bg: 'bg-[#8B5CF6]/10' };
    case 'completed': return { label: 'Completed', color: '#06B6D4', bg: 'bg-[#06B6D4]/10' };
    case 'cancelled': return { label: 'Cancelled', color: '#EF4444', bg: 'bg-[#EF4444]/10' };
    default: return { label: status, color: '#9CA3AF', bg: 'bg-white/5' };
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatShortDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

const STORAGE_VIEW_KEY = 'dfp_projects_view';

function ProjectsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [staff, setStaff] = useState<StaffInfo[]>([]);
  const [milestones, setMilestones] = useState<MilestoneInfo[]>([]);
  const [taskSummaries, setTaskSummaries] = useState<TaskInfo[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [milestonesError, setMilestonesError] = useState(false);
  const [tasksError, setTasksError] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [leadFilter, setLeadFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('needs_attention');
  const [scope, setScope] = useState<ProjectScope>('my');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const isAuthorisedAll = profile?.role === 'admin' || profile?.role === 'super_admin';
  const isAuthorisedNew = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'project_lead';

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_VIEW_KEY) : null;
    if (saved === 'list') setViewMode('list');
  }, []);

  useEffect(() => {
    const urlView = searchParams.get('view');
    if (urlView === 'all' && isAuthorisedAll) setScope('all');
    const urlStatus = searchParams.get('status');
    if (urlStatus && VALID_STATUSES.includes(urlStatus)) setStatusFilter(urlStatus);
    const urlHealth = searchParams.get('health');
    if (urlHealth) setHealthFilter(urlHealth);
    const urlClient = searchParams.get('client');
    if (urlClient) setClientFilter(urlClient);
    const urlLead = searchParams.get('lead');
    if (urlLead) setLeadFilter(urlLead);
    const urlSearch = searchParams.get('search');
    if (urlSearch) setSearchQuery(urlSearch);
  }, [searchParams, isAuthorisedAll]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (scope === 'all' && isAuthorisedAll) params.set('view', 'all');
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (healthFilter !== 'all') params.set('health', healthFilter);
    if (clientFilter !== 'all') params.set('client', clientFilter);
    if (leadFilter !== 'all') params.set('lead', leadFilter);
    if (searchQuery) params.set('search', searchQuery);
    const newUrl = params.toString() ? `/staff/projects?${params.toString()}` : '/staff/projects';
    window.history.replaceState(null, '', newUrl);
  }, [scope, statusFilter, healthFilter, clientFilter, leadFilter, searchQuery, isAuthorisedAll]);

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(STORAGE_VIEW_KEY, mode);
  };

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setTimeout(() => router.replace('/staff/login'), 0); return; }
      const { data: sp } = await supabase.from('staff_profiles').select('id, full_name, role').eq('id', session.user.id).maybeSingle();
      if (!sp) { setTimeout(() => router.replace('/staff/login'), 0); return; }
      if (cancelled) return;
      setProfile(sp);
      await fetchData(session.user.id, sp.role, () => cancelled);
    }
    init();
    return () => { cancelled = true; };
  }, [router]);

  const fetchData = async (userId: string, role: string, cancelled: () => boolean) => {
    setLoadError('');

    const projectsPromise = supabase
      .from('projects')
      .select('id, name, description, client_id, status, budget, start_date, end_date, progress, project_lead, assigned_staff, health, completed_at, priority, created_at')
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false });

    const clientsPromise = supabase.from('clients').select('id, company_name, contact_name');
    const staffPromise = supabase.from('staff_profiles').select('id, full_name, role');

    const [projectsRes, clientsRes, staffRes] = await Promise.all([
      projectsPromise, clientsPromise, staffPromise,
    ]);

    if (cancelled()) return;

    if (projectsRes.error) {
      setLoadError(projectsRes.error.message);
      setLoading(false);
      return;
    }
    if (clientsRes.data) setClients(clientsRes.data);
    if (staffRes.data) setStaff(staffRes.data);

    const projectData = (projectsRes.data || []) as Project[];

    const clientMap = new Map<string, ClientInfo>();
    (clientsRes.data || []).forEach(c => clientMap.set(c.id, c));
    const staffMap = new Map<string, StaffInfo>();
    (staffRes.data || []).forEach(s => staffMap.set(s.id, s));

    const staffIdSet = new Set<string>();
    projectData.forEach(p => {
      if (p.project_lead) staffIdSet.add(p.project_lead);
      (p.assigned_staff || []).forEach(sid => staffIdSet.add(sid));
    });

    const enriched = projectData.map(p => {
      const client = clientMap.get(p.client_id);
      const lead = p.project_lead ? staffMap.get(p.project_lead) : null;
      return {
        ...p,
        client_name: client?.contact_name || null,
        client_company: client?.company_name || null,
        lead_name: lead?.full_name || null,
      };
    });
    setProjects(enriched);

    const projectIds = enriched.map(p => p.id);
    if (projectIds.length > 0) {
      const [mRes, tRes] = await Promise.all([
        supabase.from('milestones').select('id, project_id, title, due_date, status').in('project_id', projectIds).neq('status', 'completed').order('due_date', { ascending: true, nullsFirst: false }),
        supabase.from('project_tasks').select('id, project_id, status, due_date').in('project_id', projectIds).neq('status', 'done').neq('status', 'cancelled'),
      ]);

      if (cancelled()) return;
      if (mRes.error) setMilestonesError(true);
      else setMilestones(mRes.data || []);
      if (tRes.error) setTasksError(true);
      else setTaskSummaries(tRes.data || []);
    }

    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (profile) await fetchData(profile.id, profile.role, () => false);
    setRefreshing(false);
  };

  const projectOverdueMap = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const mOverdue: Record<string, number> = {};
    const tOverdue: Record<string, number> = {};
    const tTotal: Record<string, number> = {};
    const tCompleted: Record<string, number> = {};

    milestones.forEach(m => {
      if (m.due_date && m.due_date < today) {
        mOverdue[m.project_id] = (mOverdue[m.project_id] || 0) + 1;
      }
    });

    taskSummaries.forEach(t => {
      tTotal[t.project_id] = (tTotal[t.project_id] || 0) + 1;
      if (t.status === 'done') tCompleted[t.project_id] = (tCompleted[t.project_id] || 0) + 1;
      if (t.due_date && t.due_date < today) {
        tOverdue[t.project_id] = (tOverdue[t.project_id] || 0) + 1;
      }
    });

    return { mOverdue, tOverdue, tTotal, tCompleted };
  }, [milestones, taskSummaries]);

  const nextMilestoneMap = useMemo(() => {
    const map: Record<string, MilestoneInfo> = {};
    const seen = new Set<string>();
    milestones.forEach(m => {
      if (!seen.has(m.project_id)) {
        seen.add(m.project_id);
        map[m.project_id] = m;
      }
    });
    return map;
  }, [milestones]);

  const allProjectsHealth = useMemo<ProjectWithHealth[]>(() => {
    return projects.map(p => {
      const overdue = {
        milestones: projectOverdueMap.mOverdue[p.id] || 0,
        tasks: projectOverdueMap.tOverdue[p.id] || 0,
      };
      const totalIncomplete = (projectOverdueMap.tTotal[p.id] || 0) - (projectOverdueMap.tCompleted[p.id] || 0);
      return { ...p, healthState: deriveHealth(p, overdue, totalIncomplete), overdue, totalIncomplete };
    });
  }, [projects, projectOverdueMap]);

  const myProjects = useMemo(() => {
    if (!profile) return [];
    return allProjectsHealth.filter(p =>
      p.project_lead === profile.id || (p.assigned_staff || []).includes(profile.id)
    );
  }, [allProjectsHealth, profile]);

  const displayedProjects = scope === 'my' ? myProjects : allProjectsHealth;

  const attentionCards = useMemo(() => {
    const active = displayedProjects.filter(p => p.status === 'active').length;
    const atRisk = displayedProjects.filter(p => p.healthState === 'at_risk').length;

    const today = new Date().toISOString().split('T')[0];
    const sevenDays = new Date();
    sevenDays.setDate(sevenDays.getDate() + 7);
    const sevenDaysStr = sevenDays.toISOString().split('T')[0];
    const milestonesDue = milestones.filter(m =>
      m.due_date && m.due_date >= today && m.due_date <= sevenDaysStr &&
      displayedProjects.some(p => p.id === m.project_id)
    ).length;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    let card4Value: number | string = 0;
    let card4Label = 'Completed This Month';
    let card4Color = '#06B6D4';
    let hasCompletionData = false;

    displayedProjects.forEach(p => {
      if (p.status === 'completed') {
        if (p.completed_at && p.completed_at >= startOfMonth && p.completed_at <= endOfMonth) {
          hasCompletionData = true;
          card4Value = (card4Value as number) + 1;
        }
      }
    });

    if (!hasCompletionData) {
      const onHold = displayedProjects.filter(p => p.status === 'on_hold').length;
      card4Value = onHold;
      card4Label = 'On Hold';
      card4Color = '#8B5CF6';
    }

    return [
      { label: 'Active Projects', value: active, color: '#10B981', icon: CheckCircle, filter: { status: 'active' } },
      { label: 'At Risk', value: atRisk, color: atRisk > 0 ? '#EF4444' : '#10B981', icon: AlertTriangle, filter: { health: 'at_risk' } },
      { label: 'Milestones Due', value: milestonesDue, color: '#F59E0B', icon: Milestone, caption: 'Next 7 days' },
      { label: card4Label, value: card4Value, color: card4Color, icon: card4Label === 'On Hold' ? Pause : CheckCircle },
    ];
  }, [displayedProjects, milestones]);

  const clientOptions = useMemo(() => {
    if (scope !== 'all' || !isAuthorisedAll) return [];
    const ids = new Set(displayedProjects.map(p => p.client_id));
    return clients.filter(c => ids.has(c.id));
  }, [clients, displayedProjects, scope, isAuthorisedAll]);

  const leadOptions = useMemo(() => {
    if (scope !== 'all' || !isAuthorisedAll) return [];
    const ids = new Set(displayedProjects.map(p => p.project_lead).filter(Boolean));
    return staff.filter(s => ids.has(s.id));
  }, [staff, displayedProjects, scope, isAuthorisedAll]);

  const filteredProjects = useMemo(() => {
    let result = displayedProjects;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q)) ||
        (p.client_company?.toLowerCase().includes(q)) ||
        (p.client_name?.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'all') result = result.filter(p => p.status === statusFilter);
    if (healthFilter !== 'all') result = result.filter(p => p.healthState === healthFilter);
    if (clientFilter !== 'all') result = result.filter(p => p.client_id === clientFilter);
    if (leadFilter !== 'all') result = result.filter(p => p.project_lead === leadFilter);

    const today = new Date().toISOString().split('T')[0];
    const soonDate = new Date();
    soonDate.setDate(soonDate.getDate() + 30);
    const soonStr = soonDate.toISOString().split('T')[0];

    if (dateFilter === 'ending_soon') result = result.filter(p => p.end_date && p.end_date >= today && p.end_date <= soonStr);
    else if (dateFilter === 'overdue_end') result = result.filter(p => p.end_date && p.end_date < today && p.status !== 'completed');
    else if (dateFilter === 'no_end_date') result = result.filter(p => !p.end_date);

    result = [...result].sort((a, b) => {
      const riskOrder = { at_risk: 0, needs_attention: 1, on_track: 2, on_hold: 3, completed: 4, unknown: 5 };
      switch (sortMode) {
        case 'needs_attention':
          return (riskOrder[a.healthState] ?? 5) - (riskOrder[b.healthState] ?? 5);
        case 'end_date':
          if (!a.end_date && !b.end_date) return 0;
          if (!a.end_date) return 1;
          if (!b.end_date) return -1;
          return a.end_date.localeCompare(b.end_date);
        case 'progress':
          return (b.progress || 0) - (a.progress || 0);
        case 'newest':
          return b.created_at.localeCompare(a.created_at);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return result;
  }, [displayedProjects, searchQuery, statusFilter, healthFilter, clientFilter, leadFilter, dateFilter, sortMode]);

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || healthFilter !== 'all' || clientFilter !== 'all' || leadFilter !== 'all' || dateFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setHealthFilter('all');
    setClientFilter('all');
    setLeadFilter('all');
    setDateFilter('all');
    setSortMode('needs_attention');
  };

  const handleCardFilter = (filter: { status?: string; health?: string }) => {
    if (filter.status) { setStatusFilter(filter.status); setHealthFilter('all'); }
    if (filter.health) { setHealthFilter(filter.health); setStatusFilter('all'); }
  };

  if (loading) {
    return (
      <StaffShell>
        <ProjectsSkeleton />
      </StaffShell>
    );
  }

  if (loadError) {
    return (
      <StaffShell>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-12 h-12 text-[#EF4444] mb-4" />
            <p className="text-white font-bold text-lg mb-1">Unable to load projects</p>
            <p className="text-slate-400 text-sm mb-4">{loadError}</p>
            <button onClick={handleRefresh} className="px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap">
              Retry
            </button>
          </div>
        </div>
      </StaffShell>
    );
  }

  return (
    <StaffShell>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Projects</h1>
            <p className="text-sm text-slate-400 mt-0.5">Track delivery, deadlines and client progress.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white/5 rounded-xl p-1">
              <button
                onClick={() => { setScope('my'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${scope === 'my' ? 'bg-[#06B6D4] text-white' : 'text-slate-400 hover:text-white'}`}
              >
                My Projects
              </button>
              {isAuthorisedAll && (
                <button
                  onClick={() => { setScope('all'); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${scope === 'all' ? 'bg-[#06B6D4] text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  All Projects
                </button>
              )}
            </div>
            <div className="flex items-center bg-white/5 rounded-xl p-1">
              <button
                onClick={() => handleViewChange('grid')}
                className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Grid view"
                aria-label="Grid view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleViewChange('list')}
                className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
                title="List view"
                aria-label="List view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
            {isAuthorisedNew && (
              <Link href="/staff/projects/new"
                className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                New Project
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {attentionCards.map((card) => (
            <button
              key={card.label}
              onClick={() => card.filter ? handleCardFilter(card.filter) : undefined}
              className={`bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5 text-left transition-all group ${card.filter ? 'hover:border-[rgba(255,255,255,0.18)] cursor-pointer' : 'cursor-default'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{card.label}</span>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: card.color + '15' }}>
                  <card.icon className="w-4 h-4" style={{ color: card.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white tracking-tight">{card.value}</p>
              {card.caption && <p className="text-xs text-slate-500 mt-1">{card.caption}</p>}
            </button>
          ))}
        </div>

        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl mb-6">
          <div className="p-4 space-y-3">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search projects by name, client, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 focus:border-[#06B6D4]/30 transition-all"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <FilterSelect value={statusFilter} onChange={setStatusFilter} options={[
                  { value: 'all', label: 'All Status' },
                  ...VALID_STATUSES.map(s => ({ value: s, label: getStatusMeta(s).label })),
                ]} />

                <FilterSelect value={healthFilter} onChange={setHealthFilter} options={[
                  { value: 'all', label: 'All Health' },
                  { value: 'on_track', label: 'On Track' },
                  { value: 'needs_attention', label: 'Needs Attention' },
                  { value: 'at_risk', label: 'At Risk' },
                  { value: 'on_hold', label: 'On Hold' },
                ]} />

                {clientOptions.length > 0 && (
                  <FilterSelect value={clientFilter} onChange={setClientFilter} options={[
                    { value: 'all', label: 'All Clients' },
                    ...clientOptions.map(c => ({ value: c.id, label: c.company_name || c.contact_name || 'Unknown' })),
                  ]} />
                )}

                {leadOptions.length > 0 && (
                  <FilterSelect value={leadFilter} onChange={setLeadFilter} options={[
                    { value: 'all', label: 'All Leads' },
                    ...leadOptions.map(s => ({ value: s.id, label: s.full_name || 'Unknown' })),
                  ]} />
                )}

                <FilterSelect value={dateFilter} onChange={(v) => setDateFilter(v as DateFilter)} options={[
                  { value: 'all', label: 'All Dates' },
                  { value: 'ending_soon', label: 'Ending Soon' },
                  { value: 'overdue_end', label: 'Overdue End Date' },
                  { value: 'no_end_date', label: 'No End Date' },
                ]} />

                <FilterSelect value={sortMode} onChange={(v) => setSortMode(v as SortMode)} options={[
                  { value: 'needs_attention', label: 'Needs Attention' },
                  { value: 'end_date', label: 'End Date' },
                  { value: 'progress', label: 'Progress' },
                  { value: 'newest', label: 'Newest' },
                  { value: 'name', label: 'Name' },
                ]} />

                {hasActiveFilters && (
                  <button onClick={clearFilters}
                    className="px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-xs text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}

                <button onClick={handleRefresh} disabled={refreshing}
                  className="px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-[#06B6D4] hover:border-[#06B6D4]/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
                  aria-label="Refresh projects"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            <div className="text-xs text-slate-500">
              {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
              {hasActiveFilters && ' filtered'}
            </div>
          </div>
        </div>

        {(milestonesError || tasksError) && (
          <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[rgba(245,158,11,0.2)] bg-[#F59E0B]/5 text-[#F59E0B] text-xs">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {milestonesError && 'Milestone data unavailable. '}
            {tasksError && 'Task data unavailable. '}
            Some health indicators may be incomplete.
          </div>
        )}

        {filteredProjects.length === 0 ? (
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl">
            <div className="text-center py-16">
              <FolderKanban className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-300 font-medium mb-1">
                {scope === 'my' ? 'No projects assigned to you' : 'No projects found'}
              </p>
              <p className="text-sm text-slate-500 mb-4">
                {hasActiveFilters ? 'Try adjusting your filters.' : scope === 'my' ? 'Projects you lead or are assigned to will appear here.' : 'Create your first project to get started.'}
              </p>
              {hasActiveFilters && (
                <button onClick={clearFilters}
                  className="px-4 py-2 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProjects.map(p => (
              <ProjectGridCard
                key={p.id}
                project={p}
                nextMilestone={nextMilestoneMap[p.id] || null}
                overdueTasks={projectOverdueMap.tOverdue[p.id] || 0}
                totalIncomplete={projectOverdueMap.tTotal[p.id] || 0}
                completedTasks={projectOverdueMap.tCompleted[p.id] || 0}
                milestonesError={milestonesError}
                tasksError={tasksError}
              />
            ))}
          </div>
        ) : (
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)]">
                    <th className="text-left py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Project</th>
                    <th className="text-left py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Client</th>
                    <th className="text-left py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Lead</th>
                    <th className="text-left py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status/Health</th>
                    <th className="text-left py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Progress</th>
                    <th className="text-left py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Next Milestone</th>
                    <th className="text-left py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">End Date</th>
                    <th className="text-left py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Overdue</th>
                    <th className="text-right py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map(p => (
                    <ProjectListRow
                      key={p.id}
                      project={p}
                      nextMilestone={nextMilestoneMap[p.id] || null}
                      overdueTasks={projectOverdueMap.tOverdue[p.id] || 0}
                      totalIncomplete={projectOverdueMap.tTotal[p.id] || 0}
                      completedTasks={projectOverdueMap.tCompleted[p.id] || 0}
                      milestonesError={milestonesError}
                      tasksError={tasksError}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden grid grid-cols-1 gap-0 divide-y divide-[rgba(255,255,255,0.04)]">
              {filteredProjects.map(p => (
                <ProjectGridCard
                  key={p.id}
                  project={p}
                  nextMilestone={nextMilestoneMap[p.id] || null}
                  overdueTasks={projectOverdueMap.tOverdue[p.id] || 0}
                  totalIncomplete={projectOverdueMap.tTotal[p.id] || 0}
                  completedTasks={projectOverdueMap.tCompleted[p.id] || 0}
                  milestonesError={milestonesError}
                  tasksError={tasksError}
                  compact
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </StaffShell>
  );
}

function FilterSelect({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 pr-7 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30 cursor-pointer appearance-none whitespace-nowrap"
      >
        {options.map(o => (
          <option key={o.value} value={o.value} className="bg-[#1E293B] text-white">{o.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
    </div>
  );
}

function ProjectGridCard({ project: p, nextMilestone, overdueTasks, totalIncomplete, completedTasks, milestonesError, tasksError, compact }: {
  project: ProjectWithHealth;
  nextMilestone: MilestoneInfo | null;
  overdueTasks: number;
  totalIncomplete: number;
  completedTasks: number;
  milestonesError: boolean;
  tasksError: boolean;
  compact?: boolean;
}) {
  const healthMeta = getHealthMeta(p.healthState as HealthState);
  const statusMeta = getStatusMeta(p.status);
  const today = new Date().toISOString().split('T')[0];
  const nmIsOverdue = nextMilestone?.due_date && nextMilestone.due_date < today;

  const progressLabel = p.progress !== null && p.progress !== undefined && p.progress > 0
    ? `${p.progress}%`
    : totalIncomplete + completedTasks > 0
      ? `${completedTasks} of ${totalIncomplete + completedTasks} tasks`
      : null;

  const progressValue = p.progress || 0;

  return (
    <Link href={`/staff/projects/${p.id}`}
      className={`block bg-[#1E293B] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.16)] transition-all cursor-pointer group ${compact ? 'p-4' : 'rounded-2xl p-5'}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-[#06B6D4]">{p.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate group-hover:text-[#06B6D4] transition-colors">{p.name}</p>
            <p className="text-xs text-slate-400 truncate">{p.client_company || p.client_name || 'No client'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium ${healthMeta.bg}`} style={{ color: healthMeta.color }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: healthMeta.color }} />
            {healthMeta.label}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3 text-xs">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium ${statusMeta.bg}`} style={{ color: statusMeta.color }}>
          {statusMeta.label}
        </span>
        <span className="text-slate-500 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatShortDate(p.start_date)} → {formatShortDate(p.end_date)}
        </span>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          {progressLabel ? (
            <span className="text-[10px] text-slate-400">{progressLabel}</span>
          ) : (
            <span className="text-[10px] text-slate-500">No progress data</span>
          )}
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.max(0, progressValue))}%`,
              backgroundColor: progressValue >= 100 ? '#10B981' : progressValue >= 60 ? '#06B6D4' : progressValue >= 30 ? '#F59E0B' : 'rgba(255,255,255,0.15)',
            }}
          />
        </div>
      </div>

      <div className="space-y-1.5 mb-3">
        {nextMilestone ? (
          <div className="flex items-center gap-1.5 text-xs">
            <Target className={`w-3 h-3 ${nmIsOverdue ? 'text-[#EF4444]' : 'text-slate-400'}`} />
            <span className="text-slate-400 truncate">{nextMilestone.title}</span>
            <span className={`shrink-0 ${nmIsOverdue ? 'text-[#EF4444] font-medium' : 'text-slate-500'}`}>
              {formatShortDate(nextMilestone.due_date)}
              {nmIsOverdue && ' — Overdue'}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Target className="w-3 h-3" />
            <span>{milestonesError ? 'Status unavailable' : 'No upcoming milestone'}</span>
          </div>
        )}

        {!tasksError && (
          <div className="flex items-center gap-1.5 text-xs">
            <AlertCircle className={`w-3 h-3 ${overdueTasks > 0 ? 'text-[#EF4444]' : 'text-slate-400'}`} />
            <span className="text-slate-400">
              {totalIncomplete} incomplete task{totalIncomplete !== 1 ? 's' : ''}
              {overdueTasks > 0 && (
                <span className="text-[#EF4444] font-medium"> · {overdueTasks} overdue</span>
              )}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <User className="w-3 h-3" />
          <span>{p.lead_name || 'Unassigned'}</span>
        </div>
        <div className="w-7 h-7 flex items-center justify-center rounded-lg group-hover:bg-white/5 text-slate-400 group-hover:text-[#06B6D4] transition-all">
          <ArrowUpRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </Link>
  );
}

function ProjectListRow({ project: p, nextMilestone, overdueTasks, totalIncomplete, completedTasks, milestonesError, tasksError }: {
  project: ProjectWithHealth;
  nextMilestone: MilestoneInfo | null;
  overdueTasks: number;
  totalIncomplete: number;
  completedTasks: number;
  milestonesError: boolean;
  tasksError: boolean;
}) {
  const healthMeta = getHealthMeta(p.healthState as HealthState);
  const statusMeta = getStatusMeta(p.status);
  const today = new Date().toISOString().split('T')[0];
  const nmIsOverdue = nextMilestone?.due_date && nextMilestone.due_date < today;

  const progressLabel = p.progress !== null && p.progress !== undefined && p.progress > 0
    ? `${p.progress}%`
    : totalIncomplete + completedTasks > 0
      ? `${completedTasks}/${totalIncomplete + completedTasks}`
      : '—';

  const progressValue = p.progress || 0;

  return (
    <tr className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
      <td className="py-3.5 px-4">
        <Link href={`/staff/projects/${p.id}`} className="flex items-center gap-3 cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-[#06B6D4]">{p.name.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white hover:text-[#06B6D4] transition-colors truncate max-w-[200px]">{p.name}</p>
          </div>
        </Link>
      </td>
      <td className="py-3.5 px-4 text-sm text-slate-400">{p.client_company || p.client_name || '—'}</td>
      <td className="py-3.5 px-4 text-sm text-slate-400">{p.lead_name || 'Unassigned'}</td>
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium ${statusMeta.bg}`} style={{ color: statusMeta.color }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusMeta.color }} />
            {statusMeta.label}
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium ${healthMeta.bg}`} style={{ color: healthMeta.color }}>
            {healthMeta.label}
          </span>
        </div>
      </td>
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(0, progressValue))}%`,
                backgroundColor: progressValue >= 100 ? '#10B981' : progressValue >= 60 ? '#06B6D4' : progressValue >= 30 ? '#F59E0B' : 'rgba(255,255,255,0.15)',
              }}
            />
          </div>
          <span className="text-[10px] text-slate-400">{progressLabel}</span>
        </div>
      </td>
      <td className="py-3.5 px-4">
        {nextMilestone ? (
          <div className="flex items-center gap-1 text-xs">
            <span className={nmIsOverdue ? 'text-[#EF4444]' : 'text-slate-300'}>{nextMilestone.title}</span>
            <span className={nmIsOverdue ? 'text-[#EF4444]' : 'text-slate-500'}>
              {formatShortDate(nextMilestone.due_date)}
            </span>
          </div>
        ) : (
          <span className="text-xs text-slate-500">{milestonesError ? 'Unavailable' : '—'}</span>
        )}
      </td>
      <td className="py-3.5 px-4 text-sm text-slate-400">{formatShortDate(p.end_date)}</td>
      <td className="py-3.5 px-4">
        {tasksError ? (
          <span className="text-xs text-slate-500">—</span>
        ) : overdueTasks > 0 ? (
          <span className="inline-flex items-center gap-1 text-xs text-[#EF4444] font-medium">
            <AlertTriangle className="w-3 h-3" />
            {overdueTasks}
          </span>
        ) : (
          <span className="text-xs text-slate-400">0</span>
        )}
      </td>
      <td className="py-3.5 px-4 text-right">
        <Link href={`/staff/projects/${p.id}`}
          className="inline-flex w-7 h-7 items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer"
          title="Open project"
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </td>
    </tr>
  );
}

export default function StaffProjectsPage() {
  return (
    <Suspense fallback={
      <StaffShell>
        <ProjectsSkeleton />
      </StaffShell>
    }>
      <ProjectsContent />
    </Suspense>
  );
}
