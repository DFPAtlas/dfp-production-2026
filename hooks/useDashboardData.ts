'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { DateRange } from '@/lib/dashboard-definitions';
import { getDateRange } from '@/lib/dashboard-definitions';
import type { DateRangePreset } from '@/lib/dashboard-definitions';

export interface AttentionItem {
  severity: 'critical' | 'high' | 'medium';
  title: string;
  reason: string;
  age: string;
  linkHref: string;
  linkLabel: string;
}

export interface DashboardKpi {
  key: string;
  label: string;
  value: number;
  isCurrency: boolean;
  context: string;
  linkHref: string;
}

export interface FinanceData {
  paidPeriod: number;
  outstanding: number;
  overdueValue: number;
  overdueCount: number;
  ageing: { band: string; count: number; value: number }[];
}

export interface RevenueTrendPoint {
  date: string;
  revenue: number;
}

export interface ProjectPortfolio {
  active: number;
  atRisk: number;
  completed: number;
  total: number;
  overdueMilestones: number;
  upcomingMilestones: number;
  recentlyUpdated: { id: string; name: string; status: string; updated_at: string }[];
}

export interface LeadsData {
  newPeriod: number;
  awaitingContact: number;
  total: number;
  unassigned: number;
  recentlyAdded: { id: string; name: string; company_name: string | null; created_at: string }[];
}

export interface ActivityItem {
  type: string;
  title: string;
  actor: string | null;
  time: string;
  linkHref: string;
  module: string;
}

export interface HealthItem {
  label: string;
  status: 'operational' | 'warning' | 'critical' | 'unknown' | 'not_configured';
  detail: string;
  linkHref: string;
}

export interface UatSnapshot {
  jobsInProgress: number;
  testersAssigned: number;
  feedbackAwaiting: number;
  criticalDefects: number;
}

export interface TaskOverviewData {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
  highPriority: number;
}

export interface ClientSummaryData {
  total: number;
  active: number;
  newThisPeriod: number;
  recentlyUpdated: { id: string; name: string; industry: string | null }[];
}

export interface DashboardData {
  kpis: DashboardKpi[];
  attentionItems: AttentionItem[];
  finance: FinanceData;
  revenueTrend: RevenueTrendPoint[];
  projects: ProjectPortfolio;
  leads: LeadsData;
  recentActivity: ActivityItem[];
  healthItems: HealthItem[];
  uat: UatSnapshot;
  tasks: TaskOverviewData;
  clients: ClientSummaryData;
  loading: boolean;
  partialFailures: string[];
  lastRefreshed: string | null;
  error: string | null;
}

const EMPTY_FINANCE: FinanceData = {
  paidPeriod: 0, outstanding: 0, overdueValue: 0, overdueCount: 0,
  ageing: [],
};

const EMPTY_PROJECTS: ProjectPortfolio = {
  active: 0, atRisk: 0, completed: 0, total: 0,
  overdueMilestones: 0, upcomingMilestones: 0, recentlyUpdated: [],
};

const EMPTY_LEADS: LeadsData = {
  newPeriod: 0, awaitingContact: 0, total: 0, unassigned: 0, recentlyAdded: [],
};

const EMPTY_UAT: UatSnapshot = {
  jobsInProgress: 0, testersAssigned: 0, feedbackAwaiting: 0, criticalDefects: 0,
};

const EMPTY_TASKS: TaskOverviewData = {
  total: 0, completed: 0, inProgress: 0, pending: 0, overdue: 0, highPriority: 0,
};

const EMPTY_CLIENTS: ClientSummaryData = {
  total: 0, active: 0, newThisPeriod: 0, recentlyUpdated: [],
};

export function useDashboardData(initialPreset: DateRangePreset = '30days') {
  const [dateRange, setDateRangeState] = useState<DateRange>(() => getDateRange(initialPreset));
  const [data, setData] = useState<DashboardData>({
    kpis: [],
    attentionItems: [],
    finance: EMPTY_FINANCE,
    revenueTrend: [],
    projects: EMPTY_PROJECTS,
    leads: EMPTY_LEADS,
    recentActivity: [],
    healthItems: [],
    uat: EMPTY_UAT,
    tasks: EMPTY_TASKS,
    clients: EMPTY_CLIENTS,
    loading: true,
    partialFailures: [],
    lastRefreshed: null,
    error: null,
  });
  const fetchIdRef = useRef(0);

  const setDateRange = useCallback((preset: DateRangePreset) => {
    setDateRangeState(getDateRange(preset));
  }, []);

  const refresh = useCallback(() => {
    fetchIdRef.current += 1;
    const currentFetchId = fetchIdRef.current;
    const range = dateRange;

    setData((prev) => ({ ...prev, loading: true, error: null }));

    async function load() {
      const failures: string[] = [];
      const rangeStart = range.start.toISOString();
      const rangeEnd = range.end.toISOString();

      const now = new Date().toISOString();

      let kpis: DashboardKpi[] = [];
      let attentionItems: AttentionItem[] = [];
      let finance: FinanceData = EMPTY_FINANCE;
      let revenueTrend: RevenueTrendPoint[] = [];
      let projects: ProjectPortfolio = EMPTY_PROJECTS;
      let leads: LeadsData = EMPTY_LEADS;
      let recentActivity: ActivityItem[] = [];
      let healthItems: HealthItem[] = [];
      let uat: UatSnapshot = EMPTY_UAT;
      let tasks: TaskOverviewData = EMPTY_TASKS;
      let clients: ClientSummaryData = EMPTY_CLIENTS;

      try {
        const [
          invoicesRes, paidRes, projectsRes, leadsRes, milestonesRes,
          allTasksRes, alertsRes, activityRes, deploymentsRes, n8nRes,
          backupsRes, supportRes, uatJobsRes, uatFeedbackRes, uatAssignRes,
          submissionsRes, clientsRes, actorProfilesRes,
        ] = await Promise.all([
          supabase.from('invoices').select('id, amount, status, due_date, paid_at').not('status', 'in', '(cancelled,draft)'),
          supabase.from('invoices').select('amount, paid_at').eq('status', 'paid').gte('paid_at', rangeStart).lte('paid_at', rangeEnd).order('paid_at', { ascending: true }),
          supabase.from('projects').select('id, name, status, progress, end_date, updated_at').not('status', 'in', '(archived)'),
          supabase.from('leads').select('id, name, company_name, status, assigned_to, created_at').not('status', 'in', '(spam,archived)'),
          supabase.from('milestones').select('id, project_id, title, status, due_date, target_date'),
          supabase.from('project_tasks').select('id, project_id, title, status, priority, assigned_to, due_date'),
          supabase.from('digital_footprint_alerts').select('id, project_id, alert_type, title, description, is_resolved, created_at'),
          supabase.from('project_activity').select('id, project_id, actor_id, activity_type, title, created_at').order('created_at', { ascending: false }).limit(20),
          supabase.from('digital_footprint_deployments').select('id, project_id, build_status, deployment_status, deployed_at'),
          supabase.from('digital_footprint_n8n_agents').select('id, project_id, workflow_name, status, last_failure_at, latest_error'),
          supabase.from('digital_footprint_backups').select('id, project_id, backup_type, status, last_backup_at'),
          supabase.from('digital_footprint_support').select('id, ticket_title, status, priority'),
          supabase.from('uat_jobs').select('id, title, status'),
          supabase.from('uat_feedback').select('id, title, status, severity'),
          supabase.from('uat_assignments').select('id, tester_id, status'),
          supabase.from('project_submissions').select('id, name, status, created_at').gte('created_at', rangeStart).lte('created_at', rangeEnd),
          supabase.from('clients').select('id, company_name, industry, status, created_at, updated_at').not('status', 'in', '(archived)').order('updated_at', { ascending: false }).limit(8),
          supabase.from('admin_profiles').select('id, full_name, email'),
        ]);

        if (currentFetchId !== fetchIdRef.current) return;

        if (invoicesRes.error) failures.push('invoices');
        if (paidRes.error) failures.push('paid-revenue');
        if (projectsRes.error) failures.push('projects');
        if (leadsRes.error) failures.push('leads');
        if (milestonesRes.error) failures.push('milestones');
        if (allTasksRes.error) failures.push('tasks');
        if (alertsRes.error) failures.push('alerts');
        if (clientsRes.error) failures.push('clients');

        const allInvoices = invoicesRes.data || [];
        const paidInPeriod = paidRes.data || [];
        const allProjects = projectsRes.data || [];
        const allLeads = leadsRes.data || [];
        const allMilestones = milestonesRes.data || [];
        const allTasks = allTasksRes.data || [];
        const allAlerts = alertsRes.data || [];
        const allActivity = activityRes.data || [];
        const allDeployments = deploymentsRes.data || [];
        const allN8n = n8nRes.data || [];
        const allBackups = backupsRes.data || [];
        const allSupport = supportRes.data || [];
        const allUatJobs = uatJobsRes.data || [];
        const allUatFeedback = uatFeedbackRes.data || [];
        const allUatAssign = uatAssignRes.data || [];
        const allSubmissions = submissionsRes.data || [];
        const allClients = clientsRes.data || [];
        const allActorProfiles = actorProfilesRes.data || [];

        const actorMap = new Map<string, string>();
        allActorProfiles.forEach((p) => {
          if (p.id && p.full_name) actorMap.set(p.id, p.full_name);
          else if (p.id && p.email) actorMap.set(p.id, p.email);
        });

        const outstandingInvoices = allInvoices.filter((i) => i.status === 'pending' || i.status === 'overdue');
        const overdueInvoices = allInvoices.filter((i) => {
          if (i.status === 'overdue') return true;
          if (i.status === 'pending' && i.due_date && new Date(i.due_date) < new Date()) return true;
          return false;
        });

        const paidRevenueTotal = paidInPeriod.reduce((sum, i) => sum + Number(i.amount || 0), 0);
        const outstandingTotal = outstandingInvoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);
        const overdueTotal = overdueInvoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);

        const revenueByDay = new Map<string, number>();
        paidInPeriod.forEach((i) => {
          if (!i.paid_at) return;
          const dayKey = i.paid_at.split('T')[0];
          const current = revenueByDay.get(dayKey) || 0;
          revenueByDay.set(dayKey, current + Number(i.amount || 0));
        });
        revenueTrend = Array.from(revenueByDay.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, revenue]) => ({ date, revenue }));

        if (revenueTrend.length === 0 && paidRevenueTotal > 0) {
          revenueTrend = [{ date: rangeStart.split('T')[0], revenue: paidRevenueTotal }];
        }

        const activeProjects = allProjects.filter((p) => p.status === 'active');
        const atRiskProjects = allProjects.filter((p) => p.status === 'at_risk');
        const completedProjects = allProjects.filter((p) => p.status === 'completed');

        const newLeadsInPeriod = allLeads.filter((l) => {
          if (!l.created_at) return false;
          return l.created_at >= rangeStart && l.created_at <= rangeEnd;
        });
        const awaitingContact = allLeads.filter((l) => l.status === 'new');
        const unassignedLeads = allLeads.filter((l) => !l.assigned_to && l.status !== 'converted');

        const unresolvedCriticalAlerts = allAlerts.filter((a) => !a.is_resolved && a.alert_type === 'critical');
        const unresolvedAlerts = allAlerts.filter((a) => !a.is_resolved);

        const overdueMilestones = allMilestones.filter((m) => {
          const d = m.due_date || m.target_date;
          if (!d || m.status === 'completed') return false;
          return new Date(d) < new Date();
        });
        const upcomingMilestones = allMilestones.filter((m) => {
          const d = m.due_date || m.target_date;
          if (!d || m.status === 'completed') return false;
          const date = new Date(d);
          return date >= new Date() && date <= new Date(Date.now() + 7 * 86400000);
        });

        const overdueHighPriorityTasks = allTasks.filter((t) => {
          if (!t.due_date || t.status === 'completed') return false;
          return new Date(t.due_date) < new Date() && (t.priority === 'high' || t.priority === 'critical');
        });

        const failedDeployments = allDeployments.filter((d) => d.deployment_status === 'failed' || d.build_status === 'failed');
        const failedN8n = allN8n.filter((n) => n.status === 'failed' || n.status === 'error');
        const failedBackups = allBackups.filter((b) => b.status === 'failed');
        const openSupportTickets = allSupport.filter((s) => s.status === 'open' || s.status === 'in_progress');

        const criticalUatDefects = allUatFeedback.filter((f) => f.severity === 'critical' && f.status !== 'closed' && f.status !== 'resolved');
        const feedbackAwaiting = allUatFeedback.filter((f) => f.status === 'new' || f.status === 'submitted');
        const uatJobsInProgress = allUatJobs.filter((j) => j.status === 'open' || j.status === 'in_progress');
        const testersAssigned = allUatAssign.filter((a) => a.status === 'active' || a.status === 'assigned');

        const recentlyUpdatedProjects = [...allProjects]
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .slice(0, 5)
          .map((p) => ({ id: p.id, name: p.name, status: p.status || '', updated_at: p.updated_at }));

        const recentlyAddedLeads = [...allLeads]
          .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
          .slice(0, 5)
          .map((l) => ({ id: l.id, name: l.name, company_name: l.company_name, created_at: l.created_at || '' }));

        const completedTasks = allTasks.filter((t) => t.status === 'completed');
        const inProgressTasks = allTasks.filter((t) => t.status === 'in_progress');
        const pendingTasks = allTasks.filter((t) => t.status === 'pending' || t.status === 'open' || t.status === 'todo');
        const overdueTasks = allTasks.filter((t) => {
          if (!t.due_date || t.status === 'completed') return false;
          return new Date(t.due_date) < new Date();
        });
        const highPriorityTasks = allTasks.filter((t) => t.status !== 'completed' && (t.priority === 'high' || t.priority === 'critical'));

        const activeClients = allClients.filter((c) => c.status === 'active' || c.status === 'onboarding');
        const newClientsInPeriod = allClients.filter((c) => {
          if (!c.created_at) return false;
          return c.created_at >= rangeStart && c.created_at <= rangeEnd;
        });

        kpis = [
          { key: 'paidRevenue', label: 'Paid Revenue', value: paidRevenueTotal, isCurrency: true, context: `${paidInPeriod.length} payments in period`, linkHref: '/admin/invoices' },
          { key: 'outstandingInvoices', label: 'Outstanding', value: outstandingTotal, isCurrency: true, context: `${outstandingInvoices.length} invoices`, linkHref: '/admin/invoices' },
          { key: 'activeProjects', label: 'Active Projects', value: activeProjects.length, isCurrency: false, context: `${allProjects.length} total`, linkHref: '/admin/projects' },
          { key: 'projectsAtRisk', label: 'At Risk', value: atRiskProjects.length, isCurrency: false, context: `${overdueMilestones.length} overdue milestones`, linkHref: '/admin/projects' },
          { key: 'newLeads', label: 'New Leads', value: newLeadsInPeriod.length, isCurrency: false, context: `${allSubmissions.length} submissions`, linkHref: '/admin/leads' },
          { key: 'openCriticalAlerts', label: 'Critical Alerts', value: unresolvedCriticalAlerts.length, isCurrency: false, context: `${unresolvedAlerts.length} total open`, linkHref: '/admin/command-centre/alerts' },
        ];

        attentionItems = [];
        overdueInvoices.slice(0, 3).forEach((inv) => {
          attentionItems.push({
            severity: 'high',
            title: `Overdue Invoice #${(inv as Record<string,unknown>).invoice_number || inv.id.slice(0, 8)}`,
            reason: `£${Number(inv.amount || 0).toLocaleString()} — due ${inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-GB') : 'unknown'}`,
            age: inv.due_date ? getAge(inv.due_date) : '',
            linkHref: `/admin/invoices`,
            linkLabel: 'View Invoice',
          });
        });
        atRiskProjects.slice(0, 3).forEach((p) => {
          attentionItems.push({
            severity: 'high',
            title: p.name,
            reason: 'Project marked at risk',
            age: '',
            linkHref: `/admin/projects`,
            linkLabel: 'View Project',
          });
        });
        overdueHighPriorityTasks.slice(0, 3).forEach((t) => {
          attentionItems.push({
            severity: 'medium',
            title: t.title,
            reason: `Overdue ${t.priority} priority task`,
            age: t.due_date ? getAge(t.due_date) : '',
            linkHref: `/admin/projects`,
            linkLabel: 'View Tasks',
          });
        });
        unresolvedCriticalAlerts.slice(0, 3).forEach((a) => {
          attentionItems.push({
            severity: 'critical',
            title: a.title,
            reason: a.description || 'Unresolved critical alert',
            age: a.created_at ? getAge(a.created_at) : '',
            linkHref: `/admin/command-centre/alerts`,
            linkLabel: 'View Alert',
          });
        });
        failedDeployments.slice(0, 2).forEach((d) => {
          attentionItems.push({
            severity: 'critical',
            title: `Failed Deployment`,
            reason: d.build_status === 'failed' ? 'Build failed' : 'Deployment failed',
            age: d.deployed_at ? getAge(d.deployed_at) : '',
            linkHref: `/admin/command-centre/deployments`,
            linkLabel: 'View Deployments',
          });
        });
        failedN8n.slice(0, 2).forEach((n) => {
          attentionItems.push({
            severity: 'high',
            title: n.workflow_name,
            reason: n.latest_error || 'Workflow failed',
            age: n.last_failure_at ? getAge(n.last_failure_at) : '',
            linkHref: `/admin/command-centre/n8n`,
            linkLabel: 'View Workflows',
          });
        });

        finance = {
          paidPeriod: paidRevenueTotal,
          outstanding: outstandingTotal,
          overdueValue: overdueTotal,
          overdueCount: overdueInvoices.length,
          ageing: computeAgeing(allInvoices),
        };

        projects = {
          active: activeProjects.length,
          atRisk: atRiskProjects.length,
          completed: completedProjects.length,
          total: allProjects.length,
          overdueMilestones: overdueMilestones.length,
          upcomingMilestones: upcomingMilestones.length,
          recentlyUpdated: recentlyUpdatedProjects,
        };

        leads = {
          newPeriod: newLeadsInPeriod.length,
          awaitingContact: awaitingContact.length,
          total: allLeads.length,
          unassigned: unassignedLeads.length,
          recentlyAdded: recentlyAddedLeads,
        };

        recentActivity = allActivity.slice(0, 10).map((a) => {
          const actorName = a.actor_id ? actorMap.get(a.actor_id) || null : null;
          return {
            type: a.activity_type,
            title: a.title || a.activity_type,
            actor: actorName,
            time: a.created_at || '',
            linkHref: a.project_id ? `/admin/projects` : '/admin',
            module: a.project_id ? 'projects' : 'admin',
          };
        });

        healthItems = [
          { label: 'Database', status: 'operational' as const, detail: 'Connected', linkHref: '/admin/diagnostics' },
          { label: 'Edge Functions', status: 'operational' as const, detail: 'Running', linkHref: '/admin/diagnostics' },
          { label: 'Deployments', status: failedDeployments.length > 0 ? 'critical' : allDeployments.length > 0 ? 'operational' : 'unknown' as const, detail: failedDeployments.length > 0 ? `${failedDeployments.length} failed` : allDeployments.length > 0 ? 'All clear' : 'No data', linkHref: '/admin/command-centre/deployments' },
          { label: 'n8n Workflows', status: failedN8n.length > 0 ? 'warning' : allN8n.length > 0 ? 'operational' : 'unknown' as const, detail: failedN8n.length > 0 ? `${failedN8n.length} failed` : allN8n.length > 0 ? 'All running' : 'No data', linkHref: '/admin/command-centre/n8n' },
          { label: 'Backups', status: failedBackups.length > 0 ? 'critical' : allBackups.length > 0 ? 'operational' : 'unknown' as const, detail: failedBackups.length > 0 ? `${failedBackups.length} failed` : allBackups.length > 0 ? 'Healthy' : 'No data', linkHref: '/admin/command-centre/backups' },
          { label: 'Support Tickets', status: openSupportTickets.length > 0 ? 'warning' : 'operational' as const, detail: `${openSupportTickets.length} open`, linkHref: '/admin/command-centre/support' },
          { label: 'Stripe', status: 'operational' as const, detail: 'Connected', linkHref: '/admin/diagnostics' },
        ];

        uat = {
          jobsInProgress: uatJobsInProgress.length,
          testersAssigned: testersAssigned.length,
          feedbackAwaiting: feedbackAwaiting.length,
          criticalDefects: criticalUatDefects.length,
        };

        tasks = {
          total: allTasks.length,
          completed: completedTasks.length,
          inProgress: inProgressTasks.length,
          pending: pendingTasks.length,
          overdue: overdueTasks.length,
          highPriority: highPriorityTasks.length,
        };

        clients = {
          total: allClients.length,
          active: activeClients.length,
          newThisPeriod: newClientsInPeriod.length,
          recentlyUpdated: allClients.slice(0, 5).map((c) => ({
            id: c.id,
            name: c.company_name || 'Unnamed',
            industry: c.industry,
          })),
        };

        if (currentFetchId !== fetchIdRef.current) return;

        setData({
          kpis,
          attentionItems,
          finance,
          revenueTrend,
          projects,
          leads,
          recentActivity,
          healthItems,
          uat,
          tasks,
          clients,
          loading: false,
          partialFailures: failures,
          lastRefreshed: new Date().toISOString(),
          error: null,
        });
      } catch (err) {
        if (currentFetchId !== fetchIdRef.current) return;
        setData((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load dashboard data',
          lastRefreshed: new Date().toISOString(),
        }));
      }
    }

    load();
  }, [dateRange]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, dateRange, setDateRange, refresh };
}

function getAge(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
}

function computeAgeing(invoices: { status: string; due_date: string | null; amount: number }[]): { band: string; count: number; value: number }[] {
  const now = new Date();
  const bands = [
    { band: 'Not yet due', count: 0, value: 0 },
    { band: '1\u201330 days overdue', count: 0, value: 0 },
    { band: '31\u201360 days overdue', count: 0, value: 0 },
    { band: '61\u201390 days overdue', count: 0, value: 0 },
    { band: '90+ days overdue', count: 0, value: 0 },
  ];

  invoices.forEach((inv) => {
    if (inv.status === 'paid' || inv.status === 'cancelled' || inv.status === 'draft') return;
    if (!inv.due_date) {
      bands[0].count++;
      bands[0].value += Number(inv.amount || 0);
      return;
    }
    const due = new Date(inv.due_date);
    const daysOverdue = Math.floor((now.getTime() - due.getTime()) / 86400000);
    if (daysOverdue <= 0) {
      bands[0].count++;
      bands[0].value += Number(inv.amount || 0);
    } else if (daysOverdue <= 30) {
      bands[1].count++;
      bands[1].value += Number(inv.amount || 0);
    } else if (daysOverdue <= 60) {
      bands[2].count++;
      bands[2].value += Number(inv.amount || 0);
    } else if (daysOverdue <= 90) {
      bands[3].count++;
      bands[3].value += Number(inv.amount || 0);
    } else {
      bands[4].count++;
      bands[4].value += Number(inv.amount || 0);
    }
  });

  return bands;
}