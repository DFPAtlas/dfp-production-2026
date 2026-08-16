'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProjectData } from '@/hooks/useProjectData';
import AdminShell from '../../../../components/admin/AdminShell';
import { motion } from '@/components/motion';
import { getStatusDef, getHealthDef, getPhaseStatusDef, LAUNCH_CHECKLIST, PHASE_STATUSES } from '@/lib/project-definitions';
import {
  FolderKanban, Calendar, Clock, Target, Users, AlertTriangle,
  Bug, FileText, MessageSquare, DollarSign, Shield, Settings,
  GitBranch, Activity, Rocket, ChevronDown, Plus, CheckCircle,
  X, Loader2, ExternalLink, Edit2, Trash2, Eye, Globe, Headphones,
} from 'lucide-react';
import ClientPortalDeliveryPanel from './ClientPortalDeliveryPanel';
import ApprovalsTab from './ApprovalsTab';
import WebsitesTab from './WebsitesTab';
import FilesAssetsTab from './FilesAssetsTab';
import ContentRequestsTab from './ContentRequestsTab';
import MessagesTab from './MessagesTab';
import SupportTicketsTab from './SupportTicketsTab';

const TABS = [
  { id: 'overview', label: 'Overview', icon: FolderKanban },
  { id: 'client-portal', label: 'Client Portal', icon: Eye },
  { id: 'approvals', label: 'Approvals', icon: CheckCircle },
  { id: 'websites', label: 'Websites', icon: Globe },
  { id: 'files-assets', label: 'Files & Assets', icon: FileText },
  { id: 'content-requests', label: 'Content Requests', icon: MessageSquare },
  { id: 'plan', label: 'Plan', icon: Target },
  { id: 'milestones', label: 'Milestones', icon: Calendar },
  { id: 'tasks', label: 'Tasks', icon: CheckCircle },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'risks', label: 'Risks & Issues', icon: AlertTriangle },
  { id: 'decisions', label: 'Decisions', icon: FileText },
  { id: 'changes', label: 'Changes', icon: GitBranch },
  { id: 'files', label: 'Files', icon: FileText },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'support-tickets', label: 'Support Tickets', icon: Headphones },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'uat', label: 'UAT', icon: Bug },
  { id: 'deployments', label: 'Deployments', icon: Rocket },
  { id: 'systems', label: 'Systems', icon: Shield },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function ProjectCommandWorkspace({ projectId }: { projectId: string }) {
  const router = useRouter();
  const {
    project, client, phases, milestones, tasks, risks, issues,
    decisions, changes, files, messages, updates, members,
    activity, deployments, loading, error, refresh,
    updateProject, insertRecord, updateRecord, deleteRecord,
  } = useProjectData(projectId);

  const [activeTab, setActiveTab] = useState('overview');
  const [showModal, setShowModal] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const statusDef = getStatusDef((project?.status as string) || 'draft');
  const healthDef = getHealthDef((project?.health as string) || 'not_enough_data');

  const handleAddRecord = async (table: string) => {
    if (!formData.title && table !== 'project_phases') return;
    setSaving(true);
    const record: Record<string, unknown> = { ...formData };
    if (table === 'milestones') record.status = 'not_started';
    if (table === 'project_risks') record.status = 'open';
    if (table === 'project_issues') record.status = 'open';
    if (table === 'project_decisions') record.status = 'draft';
    if (table === 'project_changes') record.status = 'draft';
    if (table === 'project_updates') record.client_visible = false;
    if (table === 'project_phases') record.status = 'not_started';
    if (table === 'project_messages') record.is_internal = true;
    await insertRecord(table, record);
    setSaving(false);
    setShowModal(null);
    setFormData({});
  };

  const handleStatusChange = async (table: string, id: string, status: string) => {
    await updateRecord(table, id, { status });
  };

  const handleDeleteRecord = async (table: string, id: string) => {
    if (!confirm('Delete this record?')) return;
    await deleteRecord(table, id);
  };

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
        </div>
      </AdminShell>
    );
  }

  if (error || !project) {
    return (
      <AdminShell>
        <div className="text-center py-16">
          <FolderKanban className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">{error || 'Project not found'}</p>
          <Link href="/admin/projects" className="text-sm text-[#06B6D4] hover:underline mt-2 inline-block">Back to Projects</Link>
        </div>
      </AdminShell>
    );
  }

  const renderHeader = () => (
    <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 mb-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/admin/projects" className="text-sm text-slate-400 hover:text-white transition-colors cursor-pointer">
              Projects
            </Link>
            <span className="text-slate-600">/</span>
            <h1 className="text-2xl font-bold text-white">{(project.name as string) || 'Unnamed'}</h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-mono text-slate-500">{(project.project_reference as string) || 'No ref'}</span>
            {client && <span className="text-sm text-slate-400">{(client.company_name as string) || (client.contact_name as string) || 'No client'}</span>}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium" style={{ backgroundColor: `${statusDef.color}15`, color: statusDef.color }}>
              {statusDef.label}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium" style={{ backgroundColor: `${healthDef.color}15`, color: healthDef.color }}>
              {healthDef.label}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => updateProject({ status: project.status === 'active' ? 'on_hold' : 'active' })}
            className="px-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-300 hover:border-[#06B6D4]/30 transition-all cursor-pointer whitespace-nowrap">
            {project.status === 'active' ? 'Put On Hold' : 'Set Active'}
          </button>
          <Link href={`/admin/projects`} className="px-4 py-2 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
            Back to list
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-5 pt-5 border-t border-[rgba(255,255,255,0.06)]">
        {[
          { label: 'Phase', value: (project.current_phase as string) || '—' },
          { label: 'Priority', value: ((project.priority as string) || 'medium').charAt(0).toUpperCase() + ((project.priority as string) || 'medium').slice(1) },
          { label: 'Target', value: (project.end_date as string) ? new Date(project.end_date as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '—' },
          { label: 'Progress', value: `${project.progress || 0}%` },
          { label: 'Budget', value: (project.budget as number) ? `£${(project.budget as number).toLocaleString()}` : '—' },
          { label: 'Milestones', value: `${milestones.filter(m => m.status === 'complete').length}/${milestones.length}` },
        ].map(m => (
          <div key={m.label} className="text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{m.label}</p>
            <p className="text-sm font-semibold text-white">{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderOverviewTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-3">Project Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-slate-400">Objective:</span><p className="text-white mt-0.5">{(project.objective as string) || 'Not specified'}</p></div>
            <div><span className="text-slate-400">Description:</span><p className="text-white mt-0.5">{(project.description as string) || 'Not specified'}</p></div>
            <div><span className="text-slate-400">Type:</span><p className="text-white mt-0.5 capitalize">{(project.project_type as string) || 'standard'}</p></div>
            <div><span className="text-slate-400">Progress Method:</span><p className="text-white mt-0.5 capitalize">{((project.progress_method as string) || 'manual').replace(/_/g, ' ')}</p></div>
            <div><span className="text-slate-400">Environment:</span><p className="text-white mt-0.5">{(project.environment as string) || '—'}</p></div>
            <div><span className="text-slate-400">Domain:</span><p className="text-white mt-0.5">{(project.domain as string) || '—'}</p></div>
            <div><span className="text-slate-400">Start Date:</span><p className="text-white mt-0.5">{(project.start_date as string) ? new Date(project.start_date as string).toLocaleDateString('en-GB') : '—'}</p></div>
            <div><span className="text-slate-400">Target Date:</span><p className="text-white mt-0.5">{(project.end_date as string) ? new Date(project.end_date as string).toLocaleDateString('en-GB') : '—'}</p></div>
          </div>
        </div>

        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-3">Launch Readiness</h3>
          <div className="space-y-2">
            {LAUNCH_CHECKLIST.map(check => (
              <div key={check.id} className="flex items-center gap-3 py-1.5">
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${check.critical ? 'border-amber-500/30' : 'border-slate-600'}`}>
                  <span className="text-[10px] text-slate-600">—</span>
                </div>
                <span className="text-sm text-slate-300">{check.label}</span>
                {check.critical && <span className="text-[10px] text-amber-500 font-medium ml-auto">Critical</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-3">Quick Stats</h3>
          <div className="space-y-3">
            {[
              { label: 'Phases', value: phases.length },
              { label: 'Milestones', value: milestones.length },
              { label: 'Tasks', value: tasks.length },
              { label: 'Open Risks', value: risks.filter(r => r.status === 'open').length },
              { label: 'Open Issues', value: issues.filter(i => i.status === 'open' || i.status === 'in_progress').length },
              { label: 'Files', value: files.length },
              { label: 'Team Members', value: members.length },
              { label: 'Deployments', value: deployments.length },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-sm text-slate-400">{s.label}</span>
                <span className="text-sm font-semibold text-white">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-3">Recent Activity</h3>
          {activity.slice(0, 8).map(a => (
            <div key={a.id as string} className="py-2 border-b border-[rgba(255,255,255,0.04)] last:border-0">
              <p className="text-sm text-white">{(a.title as string) || (a.activity_type as string)}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {a.created_at ? new Date(a.created_at as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
              </p>
            </div>
          ))}
          {activity.length === 0 && <p className="text-sm text-slate-500">No activity yet</p>}
        </div>
      </div>
    </div>
  );

  const renderPhasesTab = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Project Phases</h3>
        <button onClick={() => { setShowModal('project_phases'); setFormData({}); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#06B6D4] text-white rounded-lg text-xs font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
          <Plus className="w-3.5 h-3.5" /> Add Phase
        </button>
      </div>
      {phases.length === 0 ? (
        <div className="text-center py-12 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl">
          <Target className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No phases defined yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...phases].sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)).map((phase: any) => {
            const ps = getPhaseStatusDef(phase.status as string);
            return (
              <div key={phase.id} className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-slate-400">{phase.order_index || 0}</div>
                    <div>
                      <p className="text-sm font-semibold text-white">{phase.name}</p>
                      {phase.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{phase.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium" style={{ backgroundColor: `${ps.color}15`, color: ps.color }}>{ps.label}</span>
                    <button onClick={() => handleDeleteRecord('project_phases', phase.id)} className="text-slate-500 hover:text-red-400 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                {phase.progress > 0 && (
                  <div className="mt-3">
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] rounded-full" style={{ width: `${phase.progress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderMilestonesTab = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Milestones</h3>
        <button onClick={() => { setShowModal('milestones'); setFormData({}); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#06B6D4] text-white rounded-lg text-xs font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
          <Plus className="w-3.5 h-3.5" /> Add Milestone
        </button>
      </div>
      {milestones.length === 0 ? (
        <div className="text-center py-12 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl">
          <Calendar className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No milestones yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)]">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">#</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Title</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Amount</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Target</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...milestones].sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)).map((m: any, i: number) => (
                <tr key={m.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02]">
                  <td className="py-3 px-4 text-xs text-slate-400">{m.order_index || i + 1}</td>
                  <td className="py-3 px-4 text-sm text-white">{m.title || m.name}</td>
                  <td className="py-3 px-4">
                    <div className="relative group inline-block">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border cursor-pointer capitalize"
                        style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#94A3B8' }}>
                        {(m.status || 'not_started').replace(/_/g, ' ')}
                      </span>
                      <div className="absolute left-0 top-full mt-1 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-xl z-10 min-w-[140px] overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                        {['not_started', 'active', 'at_risk', 'blocked', 'complete', 'cancelled'].map(s => (
                          <button key={s} onClick={() => handleStatusChange('milestones', m.id, s)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors cursor-pointer capitalize">{s.replace(/_/g, ' ')}</button>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-white">{m.amount ? `£${(m.amount as number).toLocaleString()}` : '—'}</td>
                  <td className="py-3 px-4 text-xs text-slate-400">{m.target_date ? new Date(m.target_date as string).toLocaleDateString('en-GB') : '—'}</td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => handleDeleteRecord('milestones', m.id)} className="text-slate-500 hover:text-red-400 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderTasksTab = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Tasks</h3>
        <Link href={`/admin/tasks?project=${projectId}`}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#06B6D4] text-white rounded-lg text-xs font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
          <Plus className="w-3.5 h-3.5" /> Add Task
        </Link>
      </div>
      {tasks.length === 0 ? (
        <div className="text-center py-12 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl">
          <CheckCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No tasks yet</p>
          <Link href="/admin/tasks" className="text-sm text-[#06B6D4] hover:underline mt-2 inline-block">Manage tasks</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((t: any) => (
            <Link key={t.id} href={`/admin/tasks/${t.id}`}
              className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl p-4 flex items-center justify-between hover:border-[rgba(255,255,255,0.15)] transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${t.status === 'complete' ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
                  {t.status === 'complete' && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <div>
                  <p className="text-sm text-white">{t.title}</p>
                  {t.due_date && <p className="text-xs text-slate-500 mt-0.5">Due {new Date(t.due_date as string).toLocaleDateString('en-GB')}</p>}
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-lg capitalize ${
                t.status === 'complete' ? 'text-emerald-400 bg-emerald-500/10'
                : t.status === 'in_progress' ? 'text-amber-400 bg-amber-500/10'
                : t.status === 'blocked' ? 'text-red-400 bg-red-500/10'
                : 'text-slate-400 bg-white/5'
              }`}>
                {(t.status as string || 'backlog').replace(/_/g, ' ')}
              </span>
            </Link>
          ))}
        </div>
      )}
      <div className="mt-4 text-center">
        <Link href="/admin/tasks" className="text-xs text-[#06B6D4] hover:underline">View all tasks in Task Manager</Link>
      </div>
    </div>
  );

  const renderRisksIssuesTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Risks</h3>
          <button onClick={() => { setShowModal('project_risks'); setFormData({}); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#06B6D4] text-white rounded-lg text-xs font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
            <Plus className="w-3.5 h-3.5" /> Add Risk
          </button>
        </div>
        {risks.length === 0 ? (
          <div className="text-center py-12 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl">
            <AlertTriangle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No risks identified</p>
          </div>
        ) : (
          <div className="space-y-2">
            {risks.map((r: any) => (
              <div key={r.id} className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{r.title}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 capitalize">{r.rating || r.probability}</span>
                    <button onClick={() => handleDeleteRecord('project_risks', r.id)} className="text-slate-500 hover:text-red-400 cursor-pointer"><X className="w-3 h-3" /></button>
                  </div>
                </div>
                {r.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{r.description}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Issues</h3>
          <button onClick={() => { setShowModal('project_issues'); setFormData({}); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#06B6D4] text-white rounded-lg text-xs font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
            <Plus className="w-3.5 h-3.5" /> Add Issue
          </button>
        </div>
        {issues.length === 0 ? (
          <div className="text-center py-12 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl">
            <Bug className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No issues logged</p>
          </div>
        ) : (
          <div className="space-y-2">
            {issues.map((i: any) => (
              <div key={i.id} className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{i.title}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${i.severity === 'critical' ? 'bg-red-500/10 text-red-400' : i.severity === 'high' ? 'bg-orange-500/10 text-orange-400' : 'bg-white/5 text-slate-400'}`}>{i.severity}</span>
                    <button onClick={() => handleDeleteRecord('project_issues', i.id)} className="text-slate-500 hover:text-red-400 cursor-pointer"><X className="w-3 h-3" /></button>
                  </div>
                </div>
                {i.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{i.description}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderDecisionsTab = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Decisions</h3>
        <button onClick={() => { setShowModal('project_decisions'); setFormData({}); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#06B6D4] text-white rounded-lg text-xs font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
          <Plus className="w-3.5 h-3.5" /> Log Decision
        </button>
      </div>
      {decisions.length === 0 ? (
        <div className="text-center py-12 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl">
          <FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No decisions logged</p>
        </div>
      ) : (
        <div className="space-y-2">
          {decisions.map((d: any) => (
            <div key={d.id} className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{d.title}</p>
                  {d.decision_reference && <p className="text-[10px] text-slate-500 font-mono">{d.decision_reference}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 capitalize">{d.status}</span>
                  <button onClick={() => handleDeleteRecord('project_decisions', d.id)} className="text-slate-500 hover:text-red-400 cursor-pointer"><X className="w-3 h-3" /></button>
                </div>
              </div>
              {d.decision && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{d.decision}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderChangesTab = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Change Requests</h3>
        <button onClick={() => { setShowModal('project_changes'); setFormData({}); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#06B6D4] text-white rounded-lg text-xs font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
          <Plus className="w-3.5 h-3.5" /> New Change
        </button>
      </div>
      {changes.length === 0 ? (
        <div className="text-center py-12 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl">
          <GitBranch className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No change requests</p>
        </div>
      ) : (
        <div className="space-y-2">
          {changes.map((ch: any) => (
            <div key={ch.id} className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{ch.description}</p>
                  {ch.change_reference && <p className="text-[10px] text-slate-500 font-mono">{ch.change_reference}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 capitalize">{ch.status}</span>
                  <button onClick={() => handleDeleteRecord('project_changes', ch.id)} className="text-slate-500 hover:text-red-400 cursor-pointer"><X className="w-3 h-3" /></button>
                </div>
              </div>
              {(ch.scope_impact || ch.time_impact || ch.cost_impact) && (
                <div className="flex gap-3 mt-2 text-[10px] text-slate-500">
                  {ch.scope_impact && <span>Scope: {ch.scope_impact}</span>}
                  {ch.time_impact && <span>Time: {ch.time_impact}</span>}
                  {ch.cost_impact && <span>Cost: {ch.cost_impact}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderFilesTab = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Files</h3>
        <button onClick={() => { setShowModal('project_files'); setFormData({}); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#06B6D4] text-white rounded-lg text-xs font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
          <Plus className="w-3.5 h-3.5" /> Upload File
        </button>
      </div>
      {files.length === 0 ? (
        <div className="text-center py-12 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl">
          <FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No files uploaded</p>
        </div>
      ) : (
        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)]">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Name</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Type</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Size</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Visibility</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Uploaded</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f: any) => (
                <tr key={f.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02]">
                  <td className="py-3 px-4 text-sm text-white">{f.file_name || f.name}</td>
                  <td className="py-3 px-4 text-xs text-slate-400">{f.file_type || '—'}</td>
                  <td className="py-3 px-4 text-xs text-slate-400">{f.file_size ? `${Math.round((f.file_size as number) / 1024)} KB` : '—'}</td>
                  <td className="py-3 px-4"><span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 capitalize">{f.visibility || 'internal'}</span></td>
                  <td className="py-3 px-4 text-xs text-slate-400">{f.created_at ? new Date(f.created_at as string).toLocaleDateString('en-GB') : '—'}</td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => handleDeleteRecord('project_files', f.id)} className="text-slate-500 hover:text-red-400 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderMessagesTab = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Messages</h3>
        <button onClick={() => { setShowModal('project_messages'); setFormData({ message: '', is_internal: 'true' }); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#06B6D4] text-white rounded-lg text-xs font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
          <Plus className="w-3.5 h-3.5" /> New Message
        </button>
      </div>
      {messages.length === 0 ? (
        <div className="text-center py-12 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl">
          <MessageSquare className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No messages yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((msg: any) => (
            <div key={msg.id} className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-white">{msg.sender_name || 'Staff'}</span>
                    {msg.is_internal && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">Internal</span>}
                  </div>
                  <p className="text-sm text-slate-300">{msg.message || msg.content}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{msg.created_at ? new Date(msg.created_at as string).toLocaleString('en-GB') : ''}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderDeploymentsTab = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Deployments</h3>
      </div>
      {deployments.length === 0 ? (
        <div className="text-center py-12 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl">
          <Rocket className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No deployments recorded</p>
        </div>
      ) : (
        <div className="space-y-2">
          {deployments.map((d: any) => (
            <div key={d.id} className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{(d.github_repo as string) || 'Deployment'}</p>
                  {d.branch && <p className="text-xs text-slate-400">{d.branch}</p>}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${d.deployment_status === 'successful' ? 'bg-emerald-500/10 text-emerald-400' : d.deployment_status === 'failed' ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-slate-400'}`}>
                  {d.deployment_status || 'unknown'}
                </span>
              </div>
              {d.deployed_at && <p className="text-[10px] text-slate-500 mt-1">Deployed {new Date(d.deployed_at as string).toLocaleString('en-GB')}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderActivityTab = () => (
    <div>
      <h3 className="text-sm font-semibold text-white mb-4">Activity Timeline</h3>
      {activity.length === 0 ? (
        <div className="text-center py-12 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl">
          <Activity className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No activity recorded yet</p>
        </div>
      ) : (
        <div className="space-y-0">
          {activity.map((a: any, i: number) => (
            <div key={a.id || i} className="flex gap-4 pb-4">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-[#06B6D4] mt-1.5" />
                {i < activity.length - 1 && <div className="w-px flex-1 bg-[rgba(255,255,255,0.06)] mt-1" />}
              </div>
              <div className="flex-1 pb-4 border-b border-[rgba(255,255,255,0.04)]">
                <p className="text-sm text-white">{a.title || a.activity_type}</p>
                {a.description && <p className="text-xs text-slate-400 mt-0.5">{a.description}</p>}
                <p className="text-[10px] text-slate-500 mt-1">{a.created_at ? new Date(a.created_at as string).toLocaleString('en-GB') : ''}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSettingsTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Project Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Project Name</label>
            <p className="text-sm text-white">{(project.name as string) || '—'}</p>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Reference</label>
            <p className="text-sm font-mono text-white">{(project.project_reference as string) || 'Not set'}</p>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Created</label>
            <p className="text-sm text-white">{project.created_at ? new Date(project.created_at as string).toLocaleDateString('en-GB') : '—'}</p>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Updated</label>
            <p className="text-sm text-white">{project.updated_at ? new Date(project.updated_at as string).toLocaleDateString('en-GB') : '—'}</p>
          </div>
        </div>
      </div>

      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Status Management</h3>
        <div className="space-y-3">
          {['draft', 'planning', 'ready', 'active', 'on_hold', 'at_risk', 'awaiting_client', 'awaiting_uat', 'ready_for_launch', 'complete', 'cancelled', 'archived'].map(s => {
            const sd = getStatusDef(s);
            return (
              <button key={s} onClick={() => updateProject({ status: s })}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${project.status === s ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'hover:bg-white/5 text-slate-400'}`}>
                <span className="capitalize">{s.replace(/_/g, ' ')}</span>
                {project.status === s && <CheckCircle className="w-4 h-4" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverviewTab();
      case 'client-portal': return <ClientPortalDeliveryPanel project={project as any} onProjectUpdated={refresh} />;
      case 'approvals': return <ApprovalsTab project={project as any} onProjectUpdated={refresh} />;
      case 'websites': return <WebsitesTab project={project as any} onProjectUpdated={refresh} />;
      case 'plan': return renderPhasesTab();
      case 'milestones': return renderMilestonesTab();
      case 'tasks': return renderTasksTab();
      case 'team': return <div className="text-center py-12 text-slate-400">Team management — manage members via Project Access</div>;
      case 'risks': return renderRisksIssuesTab();
      case 'decisions': return renderDecisionsTab();
      case 'changes': return renderChangesTab();
      case 'files-assets': return <FilesAssetsTab project={project as any} onProjectUpdated={refresh} />;
      case 'content-requests': return <ContentRequestsTab project={project as any} onProjectUpdated={refresh} />;
      case 'files': return renderFilesTab();
      case 'messages': return <MessagesTab project={project as any} onProjectUpdated={refresh} />;
      case 'support-tickets': return <SupportTicketsTab project={project as any} onProjectUpdated={refresh} />;
      case 'finance': return <div className="text-center py-12 text-slate-400">Finance — linked invoices and budget tracking</div>;
      case 'uat': return <div className="text-center py-12 text-slate-400">UAT — linked testing jobs and feedback</div>;
      case 'deployments': return renderDeploymentsTab();
      case 'systems': return <div className="text-center py-12 text-slate-400">Systems — linked services and infrastructure</div>;
      case 'activity': return renderActivityTab();
      case 'settings': return renderSettingsTab();
      default: return renderOverviewTab();
    }
  };

  const renderModal = () => {
    if (!showModal) return null;
    const modalConfigs: Record<string, { title: string; fields: { name: string; label: string; placeholder?: string; type?: string }[] }> = {
      project_phases: { title: 'Add Phase', fields: [{ name: 'title', label: 'Phase Name', placeholder: 'e.g., Discovery' }, { name: 'order_index', label: 'Order', placeholder: '0' }] },
      milestones: { title: 'Add Milestone', fields: [{ name: 'title', label: 'Title', placeholder: 'e.g., Design Sign-off' }, { name: 'target_date', label: 'Target Date', type: 'date' }] },
      project_tasks: { title: 'Add Task', fields: [{ name: 'title', label: 'Task Title', placeholder: 'e.g., Set up staging' }, { name: 'due_date', label: 'Due Date', type: 'date' }] },
      project_risks: { title: 'Add Risk', fields: [{ name: 'title', label: 'Risk Title', placeholder: 'e.g., Third-party API deprecation' }, { name: 'description', label: 'Description' }] },
      project_issues: { title: 'Add Issue', fields: [{ name: 'title', label: 'Issue Title', placeholder: 'e.g., Homepage broken on Safari' }, { name: 'description', label: 'Description' }] },
      project_decisions: { title: 'Log Decision', fields: [{ name: 'title', label: 'Decision Title', placeholder: 'e.g., Use PostgreSQL instead of MySQL' }, { name: 'decision', label: 'Decision' }] },
      project_changes: { title: 'New Change Request', fields: [{ name: 'description', label: 'Description', placeholder: 'Describe the change...' }, { name: 'reason', label: 'Reason' }] },
      project_messages: { title: 'New Message', fields: [{ name: 'message', label: 'Message', placeholder: 'Type your message...' }] },
    };

    const config = modalConfigs[showModal];
    if (!config) return null;

    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(null)}>
        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
          <div className="p-5 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">{config.title}</h3>
            <button onClick={() => setShowModal(null)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-5 space-y-4">
            {config.fields.map(f => (
              <div key={f.name}>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{f.label}</label>
                {f.type === 'date' ? (
                  <input type="date" value={formData[f.name] || ''} onChange={e => setFormData({ ...formData, [f.name]: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all cursor-pointer" />
                ) : (
                  <input type="text" value={formData[f.name] || ''} onChange={e => setFormData({ ...formData, [f.name]: e.target.value })}
                    placeholder={f.placeholder || ''}
                    className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
                )}
              </div>
            ))}
            <button onClick={() => handleAddRecord(showModal)} disabled={saving}
              className="w-full py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto">
        {renderHeader()}

        <div className="flex gap-1 mb-6 overflow-x-auto pb-2 sticky top-[73px] z-20 bg-[#0F172A]/95 backdrop-blur-sm">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#06B6D4]/10 text-[#06B6D4]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-[400px]">
          {renderTabContent()}
        </div>

        {renderModal()}
      </div>
    </AdminShell>
  );
}