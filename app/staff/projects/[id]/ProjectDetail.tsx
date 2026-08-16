'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from '@/components/motion';
import { AlertCircle, FolderKanban } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StaffShell from '../../../../components/staff/StaffShell';
import ProjectDetailSkeleton from '../../../../components/staff/ProjectDetailSkeleton';
import ProjectDetailHeader from '../../../../components/staff/ProjectDetailHeader';
import ProjectTabsNav from '../../../../components/staff/ProjectTabsNav';
import ProjectOverviewTab from '../../../../components/staff/ProjectOverviewTab';
import ProjectMilestonesTab from '../../../../components/staff/ProjectMilestonesTab';
import ProjectTasksTab from '../../../../components/staff/ProjectTasksTab';
import ProjectMessagesTab from '../../../../components/staff/ProjectMessagesTab';
import ProjectFilesTab from '../../../../components/staff/ProjectFilesTab';
import ProjectInvoicesTab from '../../../../components/staff/ProjectInvoicesTab';
import ProjectRoadmapTab from '../../../../components/staff/ProjectRoadmapTab';
import ProjectActivityTab from '../../../../components/staff/ProjectActivityTab';

interface Project {
  id: string;
  name: string;
  description: string | null;
  objective: string | null;
  client_id: string;
  status: string;
  budget: number;
  start_date: string | null;
  end_date: string | null;
  progress: number;
  project_lead: string | null;
  health: string | null;
  completed_at: string | null;
  current_phase: string | null;
  created_at: string;
}

interface ClientInfo {
  id: string;
  company_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
}

interface StaffInfo {
  id: string;
  full_name: string | null;
  role: string;
}

interface Milestone {
  id: string;
  title: string;
  name: string | null;
  description: string | null;
  status: string;
  due_date: string | null;
  amount: number | null;
  payment_status: string | null;
}

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

interface Message {
  id: string;
  sender_id: string | null;
  sender_name: string | null;
  content: string | null;
  message: string | null;
  read: boolean;
  is_internal: boolean;
  created_at: string;
  sender_full_name?: string;
}

interface ProjectFile {
  id: string;
  name: string | null;
  file_name: string | null;
  display_name: string | null;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  category: string;
  visibility: string;
  storage_bucket: string | null;
  created_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  total: number | null;
  amount_outstanding: number | null;
  status: string;
  due_date: string | null;
  issue_date: string | null;
  currency: string;
}

interface RoadmapItem {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  priority: string;
  status: string;
  target_date: string | null;
}

interface ActivityItem {
  id: string;
  description: string | null;
  activity_type: string;
  created_at: string;
  actor_id: string | null;
  actor_name?: string;
}

const VALID_TABS = ['overview', 'milestones', 'tasks', 'messages', 'files', 'invoices', 'roadmap', 'activity'];

export default function ProjectDetail({ projectId }: { projectId: string }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [profile, setProfile] = useState<StaffInfo | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [staffList, setStaffList] = useState<StaffInfo[]>([]);

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const [tabLoading, setTabLoading] = useState<Record<string, boolean>>({});
  const [tabErrors, setTabErrors] = useState<Record<string, string>>({});
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set());

  const [activeTab, setActiveTab] = useState('overview');
  const [statusSaving, setStatusSaving] = useState(false);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
  const isLead = profile?.role === 'project_lead';
  const canEditStatus = isAdmin || isLead;
  const canEditProject = isAdmin || isLead;
  const canViewInvoices = isAdmin || (profile?.role === 'project_lead');

  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);

  useEffect(() => {
    const urlTab = new URLSearchParams(window.location.search).get('tab');
    if (urlTab && VALID_TABS.includes(urlTab)) setActiveTab(urlTab);
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', tab);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!isValidUUID) {
        setLoadError('Invalid project ID');
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setTimeout(() => router.replace('/staff/login'), 0); return; }

      const { data: sp } = await supabase
        .from('staff_profiles')
        .select('id, full_name, role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!sp) { setTimeout(() => router.replace('/staff/login'), 0); return; }
      if (cancelled) return;
      setProfile(sp);

      const { data: proj, error: projErr } = await supabase
        .from('projects')
        .select('id, name, description, objective, client_id, status, budget, start_date, end_date, progress, project_lead, health, completed_at, current_phase, created_at')
        .eq('id', projectId)
        .maybeSingle();

      if (cancelled) return;

      if (projErr) {
        setLoadError(projErr.message);
        setLoading(false);
        return;
      }
      if (!proj) {
        setLoadError('Project not found');
        setLoading(false);
        return;
      }

      setProject(proj);

      if (proj.client_id) {
        const { data: cl } = await supabase
          .from('clients')
          .select('id, company_name, contact_name, email, phone, website')
          .eq('id', proj.client_id)
          .maybeSingle();
        if (!cancelled && cl) setClient(cl);
      }

      const { data: st } = await supabase
        .from('staff_profiles')
        .select('id, full_name, role');
      if (!cancelled && st) setStaffList(st);

      setLoading(false);
    }

    init();
    return () => { cancelled = true; };
  }, [projectId, router, isValidUUID]);

  const loadTabData = useCallback(async (tab: string) => {
    if (loadedTabs.has(tab) || !project) return;

    setTabLoading(prev => ({ ...prev, [tab]: true }));
    setTabErrors(prev => { const n = { ...prev }; delete n[tab]; return n; });

    try {
      switch (tab) {
        case 'milestones': {
          const { data, error } = await supabase
            .from('milestones')
            .select('id, title, name, description, status, due_date, amount, payment_status')
            .eq('project_id', project.id)
            .order('due_date', { ascending: true, nullsFirst: false });
          if (error) throw error;
          setMilestones(data || []);
          break;
        }
        case 'tasks': {
          const { data, error } = await supabase
            .from('project_tasks')
            .select('id, project_id, title, description, status, priority, assigned_to, due_date, completed_at, created_at, updated_at')
            .eq('project_id', project.id)
            .order('created_at', { ascending: false });
          if (error) throw error;

          const tasksData = (data || []) as TaskItem[];
          const assigneeIds = [...new Set(tasksData.map(t => t.assigned_to).filter(Boolean))] as string[];
          const assigneeMap = new Map<string, string>();
          staffList.forEach(s => assigneeMap.set(s.id, s.full_name || 'Unknown'));

          const enriched = tasksData.map(t => ({
            ...t,
            project_name: project.name,
            assignee_name: t.assigned_to ? (assigneeMap.get(t.assigned_to) || 'Unknown') : undefined,
          }));
          setTasks(enriched);
          break;
        }
        case 'messages': {
          const { data, error } = await supabase
            .from('project_messages')
            .select('id, sender_id, sender_name, content, message, read, is_internal, created_at')
            .eq('project_id', project.id)
            .order('created_at', { ascending: false })
            .limit(50);
          if (error) throw error;

          const msgData = (data || []) as Message[];
          const senderIds = [...new Set(msgData.map(m => m.sender_id).filter(Boolean))] as string[];
          const senderMap = new Map<string, string>();
          staffList.forEach(s => senderMap.set(s.id, s.full_name || 'Unknown'));

          const enriched = msgData.map(m => ({
            ...m,
            sender_full_name: m.sender_id ? (senderMap.get(m.sender_id) || undefined) : undefined,
          }));
          setMessages(enriched);
          break;
        }
        case 'files': {
          const { data, error } = await supabase
            .from('project_files')
            .select('id, name, file_name, display_name, file_path, file_type, file_size, category, visibility, storage_bucket, created_at')
            .eq('project_id', project.id)
            .order('created_at', { ascending: false });
          if (error) throw error;
          setFiles(data || []);
          break;
        }
        case 'invoices': {
          const { data, error } = await supabase
            .from('invoices')
            .select('id, invoice_number, amount, total, amount_outstanding, status, due_date, issue_date, currency')
            .eq('project_id', project.id)
            .order('created_at', { ascending: false });
          if (error) throw error;
          setInvoices(data || []);
          break;
        }
        case 'roadmap': {
          const { data, error } = await supabase
            .from('technology_roadmap')
            .select('id, title, description, category, priority, status, target_date')
            .eq('project_id', project.id)
            .order('created_at', { ascending: false });
          if (error) throw error;
          setRoadmapItems(data || []);
          break;
        }
        case 'activity': {
          const { data, error } = await supabase
            .from('project_activity')
            .select('id, description, activity_type, created_at, actor_id')
            .eq('project_id', project.id)
            .order('created_at', { ascending: false })
            .limit(30);
          if (error) throw error;

          const actData = (data || []) as ActivityItem[];
          const actorIds = [...new Set(actData.map(a => a.actor_id).filter(Boolean))] as string[];
          const actorMap = new Map<string, string>();
          staffList.forEach(s => actorMap.set(s.id, s.full_name || 'Unknown'));

          const enriched = actData.map(a => ({
            ...a,
            actor_name: a.actor_id ? (actorMap.get(a.actor_id) || undefined) : undefined,
          }));
          setActivities(enriched);
          break;
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load data';
      setTabErrors(prev => ({ ...prev, [tab]: message }));
    }

    setTabLoading(prev => ({ ...prev, [tab]: false }));
    setLoadedTabs(prev => new Set(prev).add(tab));
  }, [project, loadedTabs, staffList]);

  useEffect(() => {
    if (activeTab && project && !loadedTabs.has(activeTab)) {
      loadTabData(activeTab);
    }
  }, [activeTab, project, loadedTabs, loadTabData]);

  const handleStatusChange = useCallback(async (newStatus: string) => {
    if (!project) return;
    setStatusSaving(true);

    const prevStatus = project.status;
    setProject(prev => prev ? { ...prev, status: newStatus } : null);

    const { error } = await supabase
      .from('projects')
      .update({ status: newStatus })
      .eq('id', project.id);

    if (error) {
      setProject(prev => prev ? { ...prev, status: prevStatus } : null);
    }
    setStatusSaving(false);
  }, [project]);

  const refreshTasks = useCallback(() => {
    setLoadedTabs(prev => {
      const next = new Set(prev);
      next.delete('tasks');
      return next;
    });
  }, []);

  const refreshMessages = useCallback(() => {
    setLoadedTabs(prev => {
      const next = new Set(prev);
      next.delete('messages');
      return next;
    });
  }, []);

  const summaryData = useMemo(() => {
    if (!project) return { progress: 0, progressLabel: '0%', openTasks: 0, overdueTasks: 0, nextMilestone: null as { title: string; due_date: string | null; isOverdue: boolean } | null, leadName: 'Unassigned' };

    const today = new Date().toISOString().split('T')[0];
    const openTasksCount = tasks.filter(t => t.status !== 'done').length;
    const overdueTasksCount = tasks.filter(t => t.status !== 'done' && t.due_date && t.due_date < today).length;

    const incompleteMilestones = milestones.filter(m => m.status !== 'completed');
    const orderedMs = [...incompleteMilestones].sort((a, b) => {
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return 0;
    });

    const nextMs = orderedMs[0] || null;
    const nextMilestone = nextMs ? {
      title: nextMs.title || nextMs.name || 'Untitled',
      due_date: nextMs.due_date,
      isOverdue: !!(nextMs.due_date && nextMs.due_date < today),
    } : null;

    const progressLabel = project.progress !== null && project.progress !== undefined && project.progress > 0
      ? `${project.progress}%`
      : openTasksCount > 0 || tasks.filter(t => t.status === 'done').length > 0
        ? `${tasks.filter(t => t.status === 'done').length} of ${tasks.length} tasks`
        : 'Not available';

    const leadStaff = staffList.find(s => s.id === project.project_lead);

    return {
      progress: project.progress || 0,
      progressLabel,
      openTasks: openTasksCount,
      overdueTasks: overdueTasksCount,
      nextMilestone,
      leadName: leadStaff?.full_name || 'Unassigned',
    };
  }, [project, tasks, milestones, staffList]);

  const tabCounts = useMemo(() => ({
    milestones: milestones.length,
    tasks: tasks.filter(t => t.status !== 'done').length,
    messages: messages.filter(m => !m.read).length,
    files: files.length,
    invoices: invoices.length,
    roadmap: roadmapItems.length,
  }), [milestones, tasks, messages, files, invoices, roadmapItems]);

  const overviewActivity = useMemo(() => {
    return activities.slice(0, 8);
  }, [activities]);

  if (loading) {
    return (
      <StaffShell>
        <ProjectDetailSkeleton />
      </StaffShell>
    );
  }

  if (loadError || !project) {
    return (
      <StaffShell>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FolderKanban className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-300 font-medium mb-1">{loadError || 'Project not found'}</p>
            <p className="text-sm text-slate-500 mb-4">The project may have been removed or you may not have access.</p>
            <Link href="/staff/projects"
              className="px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
            >
              Back to Projects
            </Link>
          </div>
        </div>
      </StaffShell>
    );
  }

  return (
    <StaffShell>
      <div className="max-w-7xl mx-auto">
        <ProjectDetailHeader
          project={project}
          client={client}
          summary={summaryData}
          staffList={staffList}
          canEditStatus={canEditStatus}
          onStatusChange={handleStatusChange}
          statusSaving={statusSaving}
          canEditProject={canEditProject}
          onEditProject={() => {}}
        />

        <ProjectTabsNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
          counts={tabCounts}
          canViewInvoices={canViewInvoices}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'overview' && (
              <ProjectOverviewTab
                project={project}
                client={client}
                recentActivity={overviewActivity}
                staffList={staffList}
                leadId={project.project_lead}
                openTasks={summaryData.openTasks}
                overdueTasks={summaryData.overdueTasks}
                milestonesTotal={milestones.length}
                milestonesCompleted={milestones.filter(m => m.status === 'completed').length}
              />
            )}

            {activeTab === 'milestones' && (
              <ProjectMilestonesTab
                milestones={milestones}
                loading={tabLoading.milestones || false}
                error={tabErrors.milestones || null}
                canEdit={canEditProject}
                canViewFinance={canViewInvoices}
                onRetry={() => {
                  setLoadedTabs(prev => { const n = new Set(prev); n.delete('milestones'); return n; });
                }}
              />
            )}

            {activeTab === 'tasks' && profile && (
              <ProjectTasksTab
                tasks={tasks}
                loading={tabLoading.tasks || false}
                error={tabErrors.tasks || null}
                projectId={project.id}
                projectName={project.name}
                currentUserId={profile.id}
                canCreateTask={true}
                staffOptions={staffList.map(s => ({ id: s.id, full_name: s.full_name || 'Unknown' }))}
                onRefresh={refreshTasks}
                onRetry={() => {
                  setLoadedTabs(prev => { const n = new Set(prev); n.delete('tasks'); return n; });
                }}
              />
            )}

            {activeTab === 'messages' && profile && (
              <ProjectMessagesTab
                messages={messages}
                loading={tabLoading.messages || false}
                error={tabErrors.messages || null}
                projectId={project.id}
                currentUserId={profile.id}
                currentUserName={profile.full_name || 'Staff'}
                staffList={staffList}
                onRefresh={refreshMessages}
                onRetry={() => {
                  setLoadedTabs(prev => { const n = new Set(prev); n.delete('messages'); return n; });
                }}
              />
            )}

            {activeTab === 'files' && (
              <ProjectFilesTab
                files={files}
                loading={tabLoading.files || false}
                error={tabErrors.files || null}
                onRetry={() => {
                  setLoadedTabs(prev => { const n = new Set(prev); n.delete('files'); return n; });
                }}
              />
            )}

            {activeTab === 'invoices' && (
              <ProjectInvoicesTab
                invoices={invoices}
                loading={tabLoading.invoices || false}
                error={tabErrors.invoices || null}
                onRetry={() => {
                  setLoadedTabs(prev => { const n = new Set(prev); n.delete('invoices'); return n; });
                }}
              />
            )}

            {activeTab === 'roadmap' && (
              <ProjectRoadmapTab
                items={roadmapItems}
                loading={tabLoading.roadmap || false}
                error={tabErrors.roadmap || null}
                onRetry={() => {
                  setLoadedTabs(prev => { const n = new Set(prev); n.delete('roadmap'); return n; });
                }}
              />
            )}

            {activeTab === 'activity' && (
              <ProjectActivityTab
                activities={activities}
                loading={tabLoading.activity || false}
                error={tabErrors.activity || null}
                onRetry={() => {
                  setLoadedTabs(prev => { const n = new Set(prev); n.delete('activity'); return n; });
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </StaffShell>
  );
}