'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from '@/components/motion';
import {
  ArrowRight, CalendarDays, Check, CheckCircle2, Clock3, ExternalLink,
  FileText, FolderKanban, Globe, MessageSquare, Monitor, ReceiptText, Sparkles,
  TrendingUp, UserRound, Users, RefreshCw, Flag, CheckCircle, LifeBuoy,
} from 'lucide-react';
import Link from 'next/link';
import PortalShell from '../PortalShell';
import { CDD_PHASES, getPhaseIndex } from '@/lib/project-definitions';

interface Project {
  id: string;
  name: string;
  description?: string | null;
  client_facing_summary?: string | null;
  status: string;
  budget: number;
  end_date: string | null;
  start_date?: string | null;
  project_lead?: string | null;
  assigned_staff?: string[] | null;
  progress?: number | null;
  current_phase?: string | null;
  featured?: boolean | null;
  preview_image?: string | null;
  staging_url?: string | null;
  live_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface WebsiteSummary {
  id: string;
  name: string;
  preview_image?: string | null;
  staging_url?: string | null;
  production_url?: string | null;
  client_staging_access?: boolean;
  status: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  due_date: string | null;
  created_at?: string;
}

interface Message {
  id: string;
  project_id: string;
  thread_id: string | null;
  sender_name: string;
  content: string;
  read: boolean;
  created_at: string;
}

interface Milestone {
  id: string;
  title?: string;
  name?: string;
  description?: string | null;
  status: string;
  due_date?: string | null;
  client_visible?: boolean;
}

interface StaffProfile {
  id: string;
  full_name: string;
  role: string;
}

interface ClientUpdate {
  id: string;
  title?: string;
  summary?: string;
  update_type?: string;
  published_at?: string | null;
  created_at?: string;
}

interface ApprovalItem {
  id: string;
  project_id: string;
  title: string;
  approval_type: string;
  status: string;
  priority: string;
  version: number;
  due_date?: string | null;
  submitted_at?: string | null;
}

interface TicketItem {
  id: string;
  project_id: string | null;
  ticket_reference: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

type ActivityItem = {
  id: string;
  title: string;
  meta: string;
  date: string | undefined;
  icon: typeof MessageSquare;
  color: string;
};

function formatDate(value: string | null | undefined, includeYear = true) {
  if (!value) return null;
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(includeYear ? { year: 'numeric' } : {}),
  });
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function safeProgress(project: Project | undefined) {
  if (!project) return 0;
  const value = Number(project.progress ?? 0);
  return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
}

export default function DashboardPage() {
  const [userName, setUserName] = useState('');
  const [clientId, setClientId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [milestones, setMilestones] = useState<Record<string, Milestone[]>>({});
  const [staffProfiles, setStaffProfiles] = useState<Record<string, StaffProfile>>({});
  const [updates, setUpdates] = useState<ClientUpdate[]>([]);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [websites, setWebsites] = useState<Record<string, WebsiteSummary>>({});
  const [contentRequests, setContentRequests] = useState<any[]>([]);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectsError, setProjectsError] = useState(false);
  const [invoicesError, setInvoicesError] = useState(false);
  const [messagesError, setMessagesError] = useState(false);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || cancelled) {
          if (!cancelled) setAuthError(true);
          setLoading(false);
          return;
        }

        const name =
          session.user.user_metadata?.full_name ||
          session.user.email?.split('@')[0] ||
          'Client';

        setUserName(name);

        const { data: clientData } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        const foundClientId = clientData?.id || null;
        setClientId(foundClientId);

        if (!foundClientId) {
          setLoading(false);
          return;
        }

        const projectsPromise = supabase
          .from('projects')
          .select('*')
          .eq('client_id', foundClientId)
          .order('updated_at', { ascending: false });

        const invoicesPromise = supabase
          .from('invoices')
          .select('*')
          .eq('client_id', foundClientId)
          .order('created_at', { ascending: false });

        const [projectsRes, invoicesRes] = await Promise.all([
          projectsPromise,
          invoicesPromise,
        ]);

        if (cancelled) return;

        if (projectsRes.error) setProjectsError(true);
        else {
          const projectList = (projectsRes.data || []) as Project[];
          setProjects(projectList);

          const projectIds = projectList.map(p => p.id);

          if (projectIds.length > 0) {
            const [milestonesRes, messagesRes, updatesRes] = await Promise.all([
              supabase.from('milestones').select('*').in('project_id', projectIds).eq('client_visible', true).order('order_index'),
              supabase.from('project_messages').select('*').in('project_id', projectIds).order('created_at', { ascending: false }).limit(10),
              supabase.from('project_updates').select('*').in('project_id', projectIds).eq('client_visible', true).order('published_at', { ascending: false }).limit(10),
            ]);

            if (cancelled) return;

            if (messagesRes.error) setMessagesError(true);
            else setMessages((messagesRes.data || []) as Message[]);

            if (milestonesRes.data) {
              const byProject: Record<string, Milestone[]> = {};
              for (const m of milestonesRes.data) {
                const pid = m.project_id as string;
                if (!byProject[pid]) byProject[pid] = [];
                byProject[pid].push(m);
              }
              setMilestones(byProject);
            }

            if (updatesRes.data) setUpdates(updatesRes.data as ClientUpdate[]);

            const { data: approvalsData } = await supabase
              .from('client_approvals')
              .select('id, project_id, title, approval_type, status, priority, version, due_date, submitted_at')
              .in('project_id', projectIds)
              .in('status', ['awaiting_client', 'viewed', 'resubmitted'])
              .order('priority', { ascending: false })
              .order('submitted_at', { ascending: false });

            if (approvalsData) setApprovals(approvalsData as ApprovalItem[]);

            const { data: crData } = await supabase
              .from('content_requests')
              .select('id, project_id, title, description, category, due_date, priority, status')
              .in('project_id', projectIds)
              .eq('client_visible', true)
              .in('status', ['requested', 'viewed', 'partially_submitted', 'changes_required'])
              .order('priority', { ascending: false })
              .order('due_date', { ascending: true });

            if (crData) setContentRequests(crData);

            const { data: ticketsData } = await supabase
              .from('support_tickets')
              .select('id, project_id, ticket_reference, subject, status, priority, created_at, updated_at')
              .eq('client_id', foundClientId)
              .in('status', ['new', 'open', 'assigned', 'awaiting_client', 'in_progress', 'awaiting_team'])
              .order('priority', { ascending: false })
              .order('created_at', { ascending: false });

            if (ticketsData) setTickets(ticketsData as TicketItem[]);

            const staffIds = new Set<string>();
            for (const p of projectList) {
              if (p.project_lead) staffIds.add(p.project_lead);
              if (p.assigned_staff) p.assigned_staff.forEach(id => staffIds.add(id));
            }

            if (staffIds.size > 0) {
              const { data: staffData } = await supabase
                .from('staff_profiles')
                .select('id, full_name, role')
                .in('id', Array.from(staffIds));
              if (staffData) {
                const map: Record<string, StaffProfile> = {};
                for (const s of staffData) map[s.id] = s;
                setStaffProfiles(map);
              }
            }

            const { data: websitesData } = await supabase
              .from('client_websites')
              .select('id, name, project_id, preview_image, staging_url, production_url, client_staging_access, status')
              .eq('client_id', foundClientId)
              .eq('client_visible', true);

            if (websitesData) {
              const webMap: Record<string, WebsiteSummary> = {};
              for (const w of websitesData) {
                if (w.project_id) webMap[w.project_id] = w;
              }
              setWebsites(webMap);
            }
          }
        }

        if (invoicesRes.error) setInvoicesError(true);
        else setInvoices(invoicesRes.data as Invoice[] || []);
      } catch {
        if (!cancelled) setAuthError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, []);

  const activeProjects = projects.filter(p => p.status === 'active');
  const completedProjects = projects.filter(p => p.status === 'completed');
  const outstandingInvoices = invoices.filter(
    inv => inv.status === 'pending' || inv.status === 'overdue',
  );
  const unreadMessages = messages.filter(m => !m.read);
  const outstandingTotal = outstandingInvoices.reduce(
    (total, inv) => total + Number(inv.amount || 0),
    0,
  );

  const featuredProject =
    projects.find(p => p.featured && (p.status === 'active' || p.status === 'planning')) ||
    activeProjects[0] ||
    projects.find(p => p.status === 'planning') ||
    projects.find(p => p.status !== 'completed') ||
    projects[0] ||
    undefined;

  const progress = safeProgress(featuredProject);
  const phaseValue = featuredProject?.current_phase || 'discovery';
  const phaseIndex = getPhaseIndex(phaseValue);
  const linkedWebsite = featuredProject ? websites[featuredProject.id] : undefined;

  const projectMilestones = featuredProject ? (milestones[featuredProject.id] || []) : [];
  const nextMilestone = projectMilestones.find(
    m => m.status === 'upcoming' || m.status === 'in_progress' || m.status === 'awaiting_client',
  );

  const leadId = featuredProject?.project_lead;
  const leadProfile = leadId ? staffProfiles[leadId] : null;
  const teamIds = featuredProject?.assigned_staff || [];
  const teamMembers = teamIds.filter(id => id !== leadId).map(id => staffProfiles[id]).filter(Boolean);

  const summaryCards = [
    { label: 'Active Projects', value: activeProjects.length, href: '/portal/projects', link: 'View all projects', icon: FolderKanban, color: '#22D3EE' },
    { label: 'Completed Projects', value: completedProjects.length, href: '/portal/projects', link: 'View all projects', icon: CheckCircle2, color: '#4ADE80' },
    { label: 'Outstanding', value: `£${outstandingTotal.toLocaleString('en-GB')}`, href: '/portal/invoices', link: 'View invoices', icon: ReceiptText, color: '#F59E0B' },
    { label: 'Unread Messages', value: unreadMessages.length, href: '/portal/messages', link: 'View messages', icon: MessageSquare, color: '#A78BFA' },
  ];

  const phaseTimelinePhases = CDD_PHASES.map(p => p.label);

  const actions = useMemo(() => {
    const result: Array<{
      id: string; title: string; detail: string; value?: string; href: string;
      icon: typeof MessageSquare; color: string;
    }> = [];

    contentRequests.forEach((c: any) => {
      const projName = projects.find(p => p.id === c.project_id)?.name || 'Project';
      const isUrgent = c.priority === 'urgent';
      const isOverdue = c.due_date && new Date(c.due_date) < new Date();
      result.push({
        id: `cr-${c.id}`,
        title: isUrgent ? 'Urgent content needed' : 'Content requested',
        detail: `${c.title} · ${projName}`,
        value: isOverdue ? 'Overdue' : c.priority === 'high' ? 'Priority' : undefined,
        href: `/portal/files/requests/${c.id}`,
        icon: FileText,
        color: isUrgent || isOverdue ? '#EF4444' : '#F59E0B',
      });
    });

    tickets.forEach(t => {
      const isUrgent = t.priority === 'urgent';
      const isAwaitingClient = t.status === 'awaiting_client';
      result.push({
        id: `ticket-${t.id}`,
        title: isUrgent ? 'Urgent support ticket' : isAwaitingClient ? 'Support response needed' : 'Open support ticket',
        detail: `${t.ticket_reference}: ${t.subject}`,
        value: isUrgent ? 'Urgent' : isAwaitingClient ? 'Reply needed' : undefined,
        href: `/portal/support/${t.id}`,
        icon: LifeBuoy,
        color: isUrgent ? '#EF4444' : '#F59E0B',
      });
    });

    approvals.forEach(a => {
      const projName = projects.find(p => p.id === a.project_id)?.name || 'Project';
      const isUrgent = a.priority === 'urgent';
      const isOverdue = a.due_date && new Date(a.due_date) < new Date();
      result.push({
        id: `approval-${a.id}`,
        title: isUrgent ? 'Urgent approval required' : 'Approval needed',
        detail: `${a.title} · ${projName}`,
        value: isOverdue ? 'Overdue' : a.priority === 'high' ? 'Priority' : undefined,
        href: `/portal/approvals/${a.id}`,
        icon: CheckCircle,
        color: isUrgent || isOverdue ? '#EF4444' : '#8B5CF6',
      });
    });

    if (outstandingInvoices[0]) {
      const invoice = outstandingInvoices[0];
      result.push({
        id: `invoice-${invoice.id}`,
        title: invoice.status === 'overdue' ? 'Invoice overdue' : 'Invoice outstanding',
        detail: `Invoice #${invoice.invoice_number}`,
        value: `£${Number(invoice.amount || 0).toLocaleString('en-GB')}`,
        href: '/portal/invoices',
        icon: ReceiptText,
        color: '#F59E0B',
      });
    }

    if (unreadMessages.length) {
      result.push({
        id: 'unread-messages',
        title: `${unreadMessages.length} unread ${unreadMessages.length === 1 ? 'message' : 'messages'}`,
        detail: `Latest from ${unreadMessages[0].sender_name}`,
        value: `${unreadMessages.length} new`,
        href: '/portal/messages',
        icon: MessageSquare,
        color: '#22D3EE',
      });
    }

    if (featuredProject && progress < 100) {
      const phaseLabel = CDD_PHASES.find(p => p.value === phaseValue)?.label || phaseValue;
      result.push({
        id: `project-${featuredProject.id}`,
        title: 'Project in progress',
        detail: `${featuredProject.name} · ${phaseLabel}`,
        value: `${progress}%`,
        href: `/portal/projects/${featuredProject.id}`,
        icon: FolderKanban,
        color: '#A78BFA',
      });
    }

    if (nextMilestone) {
      result.push({
        id: `milestone-${nextMilestone.id}`,
        title: `Next milestone: ${nextMilestone.title || nextMilestone.name}`,
        detail: nextMilestone.due_date ? `Due ${new Date(nextMilestone.due_date).toLocaleDateString('en-GB')}` : 'No due date',
        value: (nextMilestone.status || '').replace(/_/g, ' '),
        href: `/portal/projects/${featuredProject?.id || ''}`,
        icon: Flag,
        color: '#10B981',
      });
    }

    return result.slice(0, 5);
  }, [featuredProject, nextMilestone, outstandingInvoices, phaseValue, progress, unreadMessages, approvals, projects, contentRequests, tickets]);

  const activity = useMemo<ActivityItem[]>(() => {
    const updateActivity: ActivityItem[] = updates.slice(0, 4).map(u => ({
      id: `update-${u.id}`,
      title: u.title || 'Project update',
      meta: u.update_type || 'general',
      date: u.published_at || u.created_at,
      icon: FileText,
      color: '#8B5CF6',
    }));

    const messageActivity: ActivityItem[] = messages.slice(0, 3).map(msg => ({
      id: `message-${msg.id}`,
      title: msg.read ? 'Project message received' : 'New project message',
      meta: msg.sender_name,
      date: msg.created_at,
      icon: MessageSquare,
      color: '#22D3EE',
    }));

    const invoiceActivity: ActivityItem[] = invoices.slice(0, 3).map(inv => ({
      id: `invoice-${inv.id}`,
      title: `Invoice #${inv.invoice_number} ${inv.status}`,
      meta: 'Digital Footprint',
      date: inv.created_at ?? inv.due_date ?? undefined,
      icon: ReceiptText,
      color: inv.status === 'paid' ? '#4ADE80' : '#F59E0B',
    }));

    return [...updateActivity, ...messageActivity, ...invoiceActivity]
      .sort((a, b) => {
        const aTime = a.date ? new Date(a.date).getTime() : 0;
        const bTime = b.date ? new Date(b.date).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 5);
  }, [invoices, messages, updates]);

  if (loading) {
    return (
      <PortalShell>
        <div className="flex min-h-[55vh] items-center justify-center">
          <div className="h-11 w-11 animate-spin rounded-full border-2 border-[#06B6D4]/25 border-t-[#22D3EE]" />
        </div>
      </PortalShell>
    );
  }

  if (authError) {
    return (
      <PortalShell>
        <div className="flex min-h-[55vh] flex-col items-center justify-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
            <RefreshCw className="h-7 w-7 text-red-400" />
          </div>
          <p className="text-sm text-slate-400">Unable to load your dashboard.</p>
          <button onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#22D3EE] px-5 py-2.5 text-sm font-bold text-[#071221] transition-colors hover:bg-[#67E8F9]">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell>
      <div className="mx-auto max-w-[1460px] space-y-5">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pb-1">
          <h1 className="text-3xl font-bold tracking-tight text-white lg:text-[34px]">{greeting()}, {userName}</h1>
          <p className="mt-1 text-sm text-slate-400 sm:text-base">Here&apos;s what&apos;s happening across your Digital Footprint projects.</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                className="rounded-2xl border border-white/[0.09] bg-[#111F32] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.13)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${card.color}14` }}>
                    <Icon className="h-5 w-5" style={{ color: card.color }} />
                  </div>
                  <p className="text-sm font-medium text-slate-300">{card.label}</p>
                </div>
                <p className="mt-3 text-3xl font-bold tracking-tight text-white">{card.value}</p>
                <Link href={card.href} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#22D3EE] transition-colors hover:text-[#67E8F9]">
                  {card.link}<ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.75fr)_minmax(340px,0.95fr)]">
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="overflow-hidden rounded-2xl border border-white/[0.09] bg-[#111F32]">
            <div className="flex items-center gap-2 border-b border-white/[0.07] px-5 py-4">
              <span className="h-2.5 w-2.5 rounded-full bg-[#22D3EE]" />
              <h2 className="font-semibold text-white">Active Project</h2>
            </div>

            {featuredProject ? (
              <div className="grid gap-5 p-5 md:grid-cols-[230px_minmax(0,1fr)]">
                <div className="flex min-h-52 flex-col justify-between overflow-hidden rounded-xl border border-white/[0.13] bg-[radial-gradient(circle_at_80%_18%,rgba(34,211,238,0.22),transparent_30%),linear-gradient(145deg,#0B1727,#101F33)] p-5">
                  {featuredProject.preview_image ? (
                    <div className="mb-4 -mx-1 -mt-1 rounded-lg overflow-hidden">
                      <img src={featuredProject.preview_image} alt={featuredProject.name}
                        className="w-full h-28 object-cover object-top"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                  ) : (
                    <div>
                      <div className="mb-8 flex items-center gap-2 text-[10px] font-semibold tracking-[0.17em] text-[#67E8F9]">
                        <Sparkles className="h-4 w-4" /> DIGITAL FOOTPRINT
                      </div>
                    </div>
                  )}
                  <p className="text-xl font-bold leading-tight text-white">{featuredProject.name}</p>
                  {(featuredProject.client_facing_summary || featuredProject.description) && (
                    <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-400">
                      {featuredProject.client_facing_summary || featuredProject.description}
                    </p>
                  )}
                  <span className="mt-auto text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Project workspace
                  </span>
                </div>

                <div className="flex min-w-0 flex-col">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-2xl font-bold text-white">{featuredProject.name}</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        Current phase: <span className="font-semibold text-[#22D3EE]">
                          {CDD_PHASES.find(p => p.value === phaseValue)?.label || phaseValue}
                        </span>
                      </p>
                    </div>
                    <span className="rounded-full border border-[#4ADE80]/20 bg-[#4ADE80]/10 px-3 py-1 text-xs font-semibold capitalize text-[#86EFAC]">
                      {featuredProject.status.replaceAll('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-7 overflow-x-auto pb-2">
                    <div className="flex min-w-[530px] items-start">
                      {phaseTimelinePhases.map((phase, index) => {
                        const complete = index < phaseIndex;
                        const current = index === phaseIndex;
                        return (
                          <div key={phase} className="flex flex-1 items-start last:flex-none">
                            <div className="flex w-14 shrink-0 flex-col items-center">
                              <div className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-bold ${
                                complete ? 'border-[#4ADE80] bg-[#4ADE80] text-[#071221]'
                                  : current ? 'border-[#22D3EE] bg-[#22D3EE] text-[#071221] shadow-[0_0_22px_rgba(34,211,238,0.28)]'
                                    : 'border-slate-500 bg-[#0D1929] text-slate-400'
                              }`}>
                                {complete ? <Check className="h-4 w-4" /> : index + 1}
                              </div>
                              <span className={`mt-2 text-[10px] ${current ? 'font-semibold text-[#67E8F9]' : 'text-slate-500'}`}>{phase}</span>
                            </div>
                            {index < phaseTimelinePhases.length - 1 && (
                              <div className={`mt-3.5 h-px flex-1 ${index < phaseIndex ? 'bg-[#4ADE80]' : 'bg-slate-700'}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Next milestone</p>
                      {nextMilestone ? (
                        <div className="mt-1.5 flex items-start gap-2">
                          <Flag className="mt-0.5 h-4 w-4 text-[#10B981]" />
                          <div>
                            <p className="text-sm font-semibold text-slate-200">{nextMilestone.title || nextMilestone.name}</p>
                            <p className="text-xs text-slate-500">
                              {nextMilestone.due_date ? formatDate(nextMilestone.due_date) : 'Date to be confirmed'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1.5 flex items-start gap-2">
                          <CalendarDays className="mt-0.5 h-4 w-4 text-slate-400" />
                          <p className="text-xs text-slate-500">No upcoming milestones</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Project lead</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-bold text-slate-300">
                          {leadProfile ? (leadProfile.full_name || '?')[0].toUpperCase() : 'D'}
                        </div>
                        <p className="text-sm font-semibold text-slate-200">
                          {leadProfile?.full_name || 'Digital Footprint team'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {teamMembers.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-medium text-slate-500 mb-2">Team</p>
                      <div className="flex items-center gap-1.5">
                        {teamMembers.slice(0, 4).map(tm => (
                          <div key={tm.id} title={tm.full_name}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[10px] font-bold text-slate-400">
                            {tm.full_name?.[0]?.toUpperCase() || '?'}
                          </div>
                        ))}
                        {teamMembers.length > 4 && (
                          <span className="text-[10px] text-slate-500 ml-1">+{teamMembers.length - 4} more</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-6">
                    <div className="min-w-44 flex-1">
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Overall progress</span>
                        <span className="font-semibold text-slate-300">{progress}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#06B6D4] to-[#67E8F9]" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/portal/projects/${featuredProject.id}`}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#22D3EE] px-5 text-sm font-bold text-[#071221] transition-colors hover:bg-[#67E8F9]">
                        View project <ArrowRight className="h-4 w-4" />
                      </Link>
                      {linkedWebsite && linkedWebsite.client_staging_access && linkedWebsite.staging_url && (
                        <a href={linkedWebsite.staging_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 text-sm font-semibold text-amber-400 transition-colors hover:bg-amber-500/15 whitespace-nowrap">
                          <ExternalLink className="h-4 w-4" /> Preview Staging
                        </a>
                      )}
                      {linkedWebsite && linkedWebsite.status === 'live' && linkedWebsite.production_url && (
                        <a href={linkedWebsite.production_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 text-sm font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/15 whitespace-nowrap">
                          <Globe className="h-4 w-4" /> Visit Live
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-80 flex-col items-center justify-center px-6 py-12 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#06B6D4]/10">
                  <FolderKanban className="h-7 w-7 text-[#22D3EE]" />
                </div>
                <h3 className="text-lg font-semibold text-white">Your project workspace is ready</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                  Your first project will appear here as soon as the Digital Footprint team completes setup.
                </p>
              </div>
            )}
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="rounded-2xl border border-white/[0.09] bg-[#111F32] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-white">Action needed</h2>
              {actions.length > 0 && (
                <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[#7C3AED]/20 px-2 text-xs font-bold text-[#C4B5FD]">{actions.length}</span>
              )}
            </div>

            {actions.length ? (
              <div className="space-y-2.5">
                {actions.map(action => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.id} href={action.href}
                      className="group flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#0D1929]/65 p-3.5 transition-colors hover:border-white/[0.14] hover:bg-[#132238]">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${action.color}14` }}>
                        <Icon className="h-5 w-5" style={{ color: action.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-200">{action.title}</p>
                        <p className="truncate text-xs text-slate-500">{action.detail}</p>
                      </div>
                      {action.value && (
                        <span className="text-xs font-semibold" style={{ color: action.color }}>{action.value}</span>
                      )}
                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-300" />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-white/[0.07] bg-[#0D1929]/45 p-6 text-center">
                <CheckCircle2 className="mb-3 h-9 w-9 text-[#4ADE80]" />
                <p className="text-sm font-semibold text-white">You&apos;re all caught up</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">We&apos;ll let you know when something needs your attention.</p>
              </div>
            )}
          </motion.section>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-2xl border border-white/[0.09] bg-[#111F32] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#22D3EE]" />
                <h2 className="font-semibold text-white">Recent Activity</h2>
              </div>
              <Link href="/portal/projects" className="text-xs font-semibold text-[#22D3EE] hover:text-[#67E8F9]">View projects</Link>
            </div>

            {activity.length ? (
              <div className="divide-y divide-white/[0.07] overflow-hidden rounded-xl border border-white/[0.08] bg-[#0D1929]/55">
                {activity.map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.id} className="flex items-center gap-3 px-3.5 py-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${item.color}14` }}>
                        <Icon className="h-3.5 w-3.5" style={{ color: item.color }} />
                      </div>
                      <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-200">{item.title}</p>
                      <span className="hidden max-w-36 truncate text-xs text-slate-500 sm:block">{item.meta}</span>
                      <span className="shrink-0 text-[11px] text-slate-600">{formatDate(item.date, false) || 'Recent'}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-white/[0.07] bg-[#0D1929]/45 text-center">
                <Clock3 className="mb-2 h-7 w-7 text-slate-600" />
                <p className="text-sm font-medium text-slate-300">No recent activity</p>
                <p className="mt-1 text-xs text-slate-500">Project updates will appear here.</p>
              </div>
            )}
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="rounded-2xl border border-white/[0.09] bg-[#111F32] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#A78BFA]" />
                <h2 className="font-semibold text-white">Messages</h2>
              </div>
              <Link href="/portal/messages" className="inline-flex items-center gap-1 text-xs font-semibold text-[#22D3EE] hover:text-[#67E8F9]">
                View all messages <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {messages.length ? (
              <div className="space-y-2.5">
                {messages.slice(0, 3).map(msg => (
                  <Link key={msg.id} href="/portal/messages"
                    className="flex items-start gap-3 rounded-xl border border-white/[0.08] bg-[#0D1929]/55 p-3.5 transition-colors hover:bg-[#132238]">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7C3AED]/15 text-xs font-bold text-[#C4B5FD]">
                      {msg.sender_name?.[0]?.toUpperCase() || 'D'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-200">{msg.sender_name}</p>
                        {!msg.read && <span className="h-2 w-2 shrink-0 rounded-full bg-[#A78BFA]" />}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{msg.content}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-slate-600">{formatDate(msg.created_at, false)}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-white/[0.07] bg-[#0D1929]/45 p-5 text-center">
                <MessageSquare className="mb-2 h-8 w-8 text-slate-600" />
                <p className="text-sm font-semibold text-white">No new messages</p>
                <p className="mt-1 text-xs text-slate-500">You&apos;re all caught up. We&apos;ll notify you when there&apos;s an update.</p>
              </div>
            )}
          </motion.section>
        </div>
      </div>
    </PortalShell>
  );
}
