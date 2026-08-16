'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import UatOverviewCards from '@/components/admin/uat/UatOverviewCards';
import TesterOverviewCards from '@/components/admin/uat/TesterOverviewCards';
import {
  Search, RefreshCw, Eye, FolderKanban, Bug, Server,
  FileText, Users, RotateCcw, ShieldCheck, MessageSquare,
} from 'lucide-react';
import {
  UAT_PROJECT_STATUS_CONFIG, UAT_JOB_STATUS_CONFIG, UAT_ENV_STATUS_CONFIG,
  UAT_APP_STATUS_CONFIG, UAT_ASSIGN_STATUS_CONFIG, UAT_FEEDBACK_STATUS_CONFIG,
  UAT_FEEDBACK_TYPE_CONFIG, UAT_SEVERITY_CONFIG,
  UAT_RETEST_STATUS_CONFIG, UAT_APPROVAL_STATUS_CONFIG,
} from '@/lib/uat-definitions';

type TabId = 'overview' | 'projects' | 'environments' | 'jobs' | 'applications' | 'assignments' | 'triage' | 'retests' | 'approval';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: 'ri-dashboard-line' },
  { id: 'projects', label: 'Projects', icon: 'ri-folder-line' },
  { id: 'environments', label: 'Environments', icon: 'ri-server-line' },
  { id: 'jobs', label: 'Jobs', icon: 'ri-briefcase-line' },
  { id: 'applications', label: 'Applications', icon: 'ri-file-text-line' },
  { id: 'assignments', label: 'Assignments', icon: 'ri-user-received-line' },
  { id: 'triage', label: 'Triage', icon: 'ri-bug-line' },
  { id: 'retests', label: 'Retests', icon: 'ri-rotate-lock-line' },
  { id: 'approval', label: 'Approval', icon: 'ri-shield-check-line' },
];

function getConfigEntry<K extends string, T>(config: Record<K, T>, key: unknown): T | undefined {
  return typeof key === 'string' && Object.prototype.hasOwnProperty.call(config, key)
    ? config[key as K]
    : undefined;
}

export default function AdminUatHubPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [projects, setProjects] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [environments, setEnvironments] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [retests, setRetests] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);

  const [, setStatusUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [
      { data: p }, { data: j }, { data: e }, { data: a },
      { data: asgn }, { data: fb }, { data: rt }, { data: appr },
    ] = await Promise.all([
      supabase.from('uat_projects').select('*').order('created_at', { ascending: false }),
      supabase.from('uat_jobs').select('*').order('created_at', { ascending: false }),
      supabase.from('uat_environments').select('*, uat_projects:project_id(name)').order('created_at', { ascending: false }),
      supabase.from('uat_job_applications').select('*').order('created_at', { ascending: false }),
      supabase.from('uat_assignments').select('*').order('created_at', { ascending: false }),
      supabase.from('uat_feedback').select('*, uat_projects:project_id(name)').order('created_at', { ascending: false }),
      supabase.from('uat_retests').select('*').order('created_at', { ascending: false }),
      supabase.from('uat_approvals').select('*').order('created_at', { ascending: false }),
    ]);

    setProjects(p || []);
    setJobs(j || []);
    setEnvironments((e || []).map((env: any) => ({ ...env, project_name: env.uat_projects?.name || '' })));
    setApplications(a || []);
    setAssignments(asgn || []);
    setFeedback((fb || []).map((f: any) => ({ ...f, project_name: f.uat_projects?.name || '' })));
    setRetests(rt || []);
    setApprovals(appr || []);
    setLoading(false);
  };

  const handleMetricClick = (tab: string) => {
    setActiveTab(tab as TabId);
  };

  const handleQuickStatus = async (table: string, id: string, newStatus: string) => {
    setStatusUpdating(id);
    await supabase.from(table).update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
    await supabase.from('uat_audit_log').insert({
      action: `${table} status to ${newStatus}`, entity_type: table, entity_id: id,
      new_value: { status: newStatus },
    });
    setStatusUpdating(null);
    fetchAll();
  };

  const filterBySearch = (items: any[], fields: string[]) => {
    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((i) => fields.some((f) => i[f] && String(i[f]).toLowerCase().includes(q)));
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

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">UAT Control Room</h1>
            <p className="text-sm text-slate-400 mt-0.5">Project → Environment → Plan → Job → Application → Assignment → Session → Feedback → Triage → Fix → Retest → Approval</p>
          </div>
          <button
            onClick={() => router.push('/admin/uat/tester-applications')}
            className="px-4 py-2.5 rounded-xl bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-sm font-medium text-[#06B6D4] hover:bg-[#06B6D4]/20 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap"
          >
            <i className="ri-user-add-line"></i> Tester Registrations
          </button>
        </div>

        <UatOverviewCards onMetricClick={handleMetricClick} />

        <TesterOverviewCards onFilterClick={(filter: string) => {
          if (filter.startsWith('payments:')) router.push('/admin/uat/payments');
          else if (filter.startsWith('disputes:')) router.push('/admin/uat/payments?tab=disputes');
          else if (filter.startsWith('status:')) router.push('/admin/uat/testers');
          else if (filter.startsWith('availability:')) router.push('/admin/uat/testers');
          else if (filter.startsWith('onboarding:')) router.push('/admin/uat/testers');
          else if (filter.startsWith('assignments:')) router.push('/admin/uat/assignments');
          else if (filter.startsWith('capacity:')) router.push('/admin/uat/testers');
          else router.push('/admin/uat/testers');
        }} />

        <div className="mb-6">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">UAT Workflow</h2>
        </div>

        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
          <div className="border-b border-[rgba(255,255,255,0.08)] overflow-x-auto">
            <div className="flex px-2">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                    activeTab === tab.id
                      ? 'text-[#06B6D4] border-[#06B6D4]'
                      : 'text-slate-400 border-transparent hover:text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <i className={`${tab.icon} text-base`} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all"
              />
            </div>
            <button onClick={fetchAll}
              className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-[#06B6D4] transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>

          {activeTab === 'overview' && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><FolderKanban className="w-4 h-4 text-[#06B6D4]" /> Recent Projects</h3>
                {filterBySearch(projects, ['name', 'reference', 'client_company']).slice(0, 5).map((p) => {
                  const sc = getConfigEntry(UAT_PROJECT_STATUS_CONFIG, p.status) || UAT_PROJECT_STATUS_CONFIG.draft;
                  return (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.04)] last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white truncate">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.reference || 'No ref'}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-lg text-xs font-medium ml-2 shrink-0" style={{ color: sc.color, backgroundColor: sc.bg }}>{sc.label}</span>
                    </div>
                  );
                })}
                {projects.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No projects yet</p>}
              </div>
              <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Bug className="w-4 h-4 text-[#EF4444]" /> Recent Feedback</h3>
                {filterBySearch(feedback, ['title', 'reference', 'project_name']).slice(0, 5).map((f) => {
                  const sc = UAT_FEEDBACK_STATUS_CONFIG[f.status] || UAT_FEEDBACK_STATUS_CONFIG.submitted;
                  const sev = UAT_SEVERITY_CONFIG[f.severity] || UAT_SEVERITY_CONFIG.medium;
                  return (
                    <div key={f.id} className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.04)] last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white truncate">{f.title}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">{f.project_name || f.reference || 'No ref'}</span>
                          <span className="text-xs font-medium" style={{ color: sev.color }}>{sev.label}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-lg text-xs font-medium ml-2 shrink-0" style={{ color: sc.color, backgroundColor: sc.bg }}>{sc.label}</span>
                    </div>
                  );
                })}
                {feedback.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No feedback yet</p>}
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.06)]">
                      <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Project</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Reference</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Client</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Status</th>
                      <th className="text-right py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterBySearch(projects, ['name', 'reference', 'client_company']).map((p) => {
                      const sc = getConfigEntry(UAT_PROJECT_STATUS_CONFIG, p.status) || UAT_PROJECT_STATUS_CONFIG.draft;
                      return (
                        <tr key={p.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02]">
                          <td className="py-3 px-5"><p className="text-sm font-semibold text-white">{p.name}</p></td>
                          <td className="py-3 px-5"><span className="text-xs text-slate-400 font-mono">{p.reference || '-'}</span></td>
                          <td className="py-3 px-5"><span className="text-sm text-slate-400">{p.client_company || '-'}</span></td>
                          <td className="py-3 px-5">
                            <span className="px-2 py-0.5 rounded-lg text-xs font-medium" style={{ color: sc.color, backgroundColor: sc.bg }}>{sc.label}</span>
                          </td>
                          <td className="py-3 px-5 text-right">
                            <button onClick={() => router.push(`/admin/uat/projects/${p.id}`)}
                              className="px-3 py-1.5 rounded-lg bg-white/5 border border-[rgba(255,255,255,0.06)] text-xs text-slate-400 hover:text-[#06B6D4] hover:border-[#06B6D4]/20 cursor-pointer whitespace-nowrap">
                              <Eye className="w-3.5 h-3.5 inline mr-1" />View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {projects.length === 0 && (
                <div className="text-center py-16">
                  <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 font-medium">No UAT projects</p>
                  <p className="text-sm text-slate-500 mt-1">Create a UAT project to get started</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'environments' && (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.06)]">
                      <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Name</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Project</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Type</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Build</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterBySearch(environments, ['environment_name', 'project_name', 'base_url', 'current_build']).map((env) => {
                      const etc = UAT_ENV_STATUS_CONFIG[env.environment_type as keyof typeof UAT_ENV_STATUS_CONFIG] || { label: env.environment_type, color: '#94A3B8' };
                      return (
                        <tr key={env.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02]">
                          <td className="py-3 px-5"><p className="text-sm font-semibold text-white">{env.environment_name}</p></td>
                          <td className="py-3 px-5"><span className="text-sm text-slate-400">{env.project_name}</span></td>
                          <td className="py-3 px-5"><span className="text-xs font-bold uppercase" style={{ color: etc.color }}>{env.environment_type}</span></td>
                          <td className="py-3 px-5"><span className="text-sm text-slate-400 font-mono">{env.current_build || '-'}</span></td>
                          <td className="py-3 px-5">
                            <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${env.is_active ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-400 bg-slate-400/10'}`}>
                              {env.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {environments.length === 0 && (
                <div className="text-center py-16">
                  <Server className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 font-medium">No environments configured</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'jobs' && (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.06)]">
                      <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Title</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Reference</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Status</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Pay</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Deadline</th>
                      <th className="text-right py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterBySearch(jobs, ['title', 'reference', 'description']).map((j) => {
                      const sc = getConfigEntry(UAT_JOB_STATUS_CONFIG, j.status) || UAT_JOB_STATUS_CONFIG.draft;
                      return (
                        <tr key={j.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02]">
                          <td className="py-3 px-5"><p className="text-sm font-semibold text-white">{j.title}</p></td>
                          <td className="py-3 px-5"><span className="text-xs text-slate-400 font-mono">{j.reference || '-'}</span></td>
                          <td className="py-3 px-5">
                            <span className="px-2 py-0.5 rounded-lg text-xs font-medium" style={{ color: sc.color, backgroundColor: sc.bg }}>{sc.label}</span>
                          </td>
                          <td className="py-3 px-5"><span className="text-sm text-slate-400">{j.pay_amount ? `$${j.pay_amount}` : '-'}</span></td>
                          <td className="py-3 px-5"><span className="text-xs text-slate-400">{j.deadline ? new Date(j.deadline).toLocaleDateString('en-GB') : '-'}</span></td>
                          <td className="py-3 px-5 text-right">
                            <button onClick={() => router.push(`/admin/uat/jobs/${j.id}`)}
                              className="px-3 py-1.5 rounded-lg bg-white/5 border border-[rgba(255,255,255,0.06)] text-xs text-slate-400 hover:text-[#06B6D4] hover:border-[#06B6D4]/20 cursor-pointer whitespace-nowrap">
                              <Eye className="w-3.5 h-3.5 inline mr-1" />View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {jobs.length === 0 && (
                <div className="text-center py-16">
                  <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 font-medium">No test jobs</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'applications' && (
            <div>
              <div className="space-y-3 p-5">
                {filterBySearch(applications, ['application_message']).map((app) => {
                  const ac = getConfigEntry(UAT_APP_STATUS_CONFIG, app.status) || { label: app.status, color: '#94A3B8', bg: 'bg-slate-500/10' };
                  return (
                    <div key={app.id} className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm text-white font-medium">Application</span>
                          <span className="px-2 py-0.5 rounded-lg text-xs font-medium ml-2" style={{ color: ac.color, backgroundColor: ac.bg }}>{ac.label}</span>
                          {app.application_message && <p className="text-xs text-slate-400 mt-1 italic">&ldquo;{app.application_message}&rdquo;</p>}
                        </div>
                        <div className="flex gap-1">
                          {app.status === 'submitted' && (
                            <>
                              <button onClick={() => handleQuickStatus('uat_job_applications', app.id, 'under_review')} className="px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 text-xs cursor-pointer whitespace-nowrap">Review</button>
                              <button onClick={() => handleQuickStatus('uat_job_applications', app.id, 'accepted')} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs cursor-pointer whitespace-nowrap">Accept</button>
                              <button onClick={() => handleQuickStatus('uat_job_applications', app.id, 'rejected')} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs cursor-pointer whitespace-nowrap">Reject</button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {applications.length === 0 && (
                <div className="text-center py-16">
                  <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 font-medium">No applications</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'assignments' && (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.06)]">
                      <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Status</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Pay</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Access Expires</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((a) => {
                      const ac = getConfigEntry(UAT_ASSIGN_STATUS_CONFIG, a.status) || { label: a.status, color: '#94A3B8', bg: 'bg-slate-500/10' };
                      return (
                        <tr key={a.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02]">
                          <td className="py-3 px-5">
                            <span className="px-2 py-0.5 rounded-lg text-xs font-medium capitalize" style={{ color: ac.color, backgroundColor: ac.bg }}>{ac.label}</span>
                          </td>
                          <td className="py-3 px-5"><span className="text-sm text-slate-400">{a.agreed_pay ? `$${a.agreed_pay}` : '-'}</span></td>
                          <td className="py-3 px-5"><span className="text-xs text-slate-400">{a.access_expires_at ? new Date(a.access_expires_at).toLocaleDateString('en-GB') : '-'}</span></td>
                          <td className="py-3 px-5"><span className="text-xs text-slate-400">{new Date(a.created_at).toLocaleDateString('en-GB')}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {assignments.length === 0 && (
                <div className="text-center py-16">
                  <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 font-medium">No assignments</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'triage' && (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.06)]">
                      <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Title</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Project</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Type</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Severity</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Priority</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Status</th>
                      <th className="text-right py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterBySearch(feedback, ['title', 'reference', 'project_name']).map((fb) => {
                      const sc = UAT_FEEDBACK_STATUS_CONFIG[fb.status] || UAT_FEEDBACK_STATUS_CONFIG.submitted;
                      const sev = UAT_SEVERITY_CONFIG[fb.severity] || UAT_SEVERITY_CONFIG.medium;
                      const fc = UAT_FEEDBACK_TYPE_CONFIG[fb.feedback_type] || { label: fb.feedback_type, color: '#94A3B8' };
                      return (
                        <tr key={fb.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02]">
                          <td className="py-3 px-5"><p className="text-sm font-semibold text-white max-w-xs truncate">{fb.title}</p></td>
                          <td className="py-3 px-5"><span className="text-xs text-slate-400">{fb.project_name || '-'}</span></td>
                          <td className="py-3 px-5"><span className="text-xs capitalize" style={{ color: fc.color }}>{fc.label}</span></td>
                          <td className="py-3 px-5"><span className="px-1.5 py-0.5 rounded text-xs font-medium capitalize" style={{ color: sev.color, backgroundColor: sev.color + '15' }}>{sev.label}</span></td>
                          <td className="py-3 px-5"><span className="text-xs text-slate-400 capitalize">{fb.priority || 'medium'}</span></td>
                          <td className="py-3 px-5"><span className="px-2 py-0.5 rounded-lg text-xs font-medium" style={{ color: sc.color, backgroundColor: sc.bg }}>{sc.label}</span></td>
                          <td className="py-3 px-5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {fb.status === 'submitted' && (
                                <>
                                  <button onClick={() => handleQuickStatus('uat_feedback', fb.id, 'awaiting_triage')} className="px-2 py-1 rounded bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 text-xs cursor-pointer whitespace-nowrap">Triage</button>
                                  <button onClick={() => handleQuickStatus('uat_feedback', fb.id, 'accepted')} className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs cursor-pointer whitespace-nowrap">Accept</button>
                                  <button onClick={() => handleQuickStatus('uat_feedback', fb.id, 'rejected')} className="px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs cursor-pointer whitespace-nowrap">Reject</button>
                                </>
                              )}
                              {fb.status === 'awaiting_triage' && (
                                <>
                                  <button onClick={() => handleQuickStatus('uat_feedback', fb.id, 'accepted')} className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs cursor-pointer whitespace-nowrap">Accept</button>
                                  <button onClick={() => handleQuickStatus('uat_feedback', fb.id, 'duplicate')} className="px-2 py-1 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs cursor-pointer whitespace-nowrap">Dup</button>
                                  <button onClick={() => handleQuickStatus('uat_feedback', fb.id, 'deferred')} className="px-2 py-1 rounded bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 text-xs cursor-pointer whitespace-nowrap">Defer</button>
                                </>
                              )}
                              {fb.status === 'accepted' && (
                                <>
                                  <button onClick={() => handleQuickStatus('uat_feedback', fb.id, 'in_progress')} className="px-2 py-1 rounded bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 text-xs cursor-pointer whitespace-nowrap">Start</button>
                                </>
                              )}
                              {fb.status === 'in_progress' && (
                                <button onClick={() => handleQuickStatus('uat_feedback', fb.id, 'ready_for_retest')} className="px-2 py-1 rounded bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 text-xs cursor-pointer whitespace-nowrap">Retest</button>
                              )}
                              {fb.status === 'ready_for_retest' && (
                                <button onClick={() => handleQuickStatus('uat_feedback', fb.id, 'retest_passed')} className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs cursor-pointer whitespace-nowrap">Pass</button>
                              )}
                              <button onClick={() => router.push(`/admin/uat/feedback/${fb.id}`)}
                                className="px-2 py-1 rounded bg-white/5 border border-[rgba(255,255,255,0.06)] text-xs text-slate-400 hover:text-[#06B6D4] cursor-pointer">
                                <Eye className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {feedback.length === 0 && (
                <div className="text-center py-16">
                  <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 font-medium">No feedback to triage</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'retests' && (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.06)]">
                      <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Status</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Build</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Requested</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Deadline</th>
                      <th className="text-right py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {retests.map((rt) => {
                      const rc = UAT_RETEST_STATUS_CONFIG[rt.status] || { label: rt.status, color: '#94A3B8', bg: 'bg-slate-500/10' };
                      return (
                        <tr key={rt.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02]">
                          <td className="py-3 px-5">
                            <span className="px-2 py-0.5 rounded-lg text-xs font-medium" style={{ color: rc.color, backgroundColor: rc.bg }}>{rc.label}</span>
                          </td>
                          <td className="py-3 px-5"><span className="text-sm text-slate-400 font-mono">{rt.build_tested || '-'}</span></td>
                          <td className="py-3 px-5"><span className="text-xs text-slate-400">{rt.requested_at ? new Date(rt.requested_at).toLocaleDateString('en-GB') : '-'}</span></td>
                          <td className="py-3 px-5"><span className="text-xs text-slate-400">{rt.deadline ? new Date(rt.deadline).toLocaleDateString('en-GB') : '-'}</span></td>
                          <td className="py-3 px-5 text-right">
                            {rt.status === 'requested' && (
                              <button onClick={() => handleQuickStatus('uat_retests', rt.id, 'accepted')} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs cursor-pointer whitespace-nowrap">Accept</button>
                            )}
                            {rt.status === 'submitted' && (
                              <>
                                <button onClick={() => handleQuickStatus('uat_retests', rt.id, 'passed')} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs cursor-pointer whitespace-nowrap">Pass</button>
                                <button onClick={() => handleQuickStatus('uat_retests', rt.id, 'failed')} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs cursor-pointer whitespace-nowrap">Fail</button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {retests.length === 0 && (
                <div className="text-center py-16">
                  <RotateCcw className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 font-medium">No retests</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'approval' && (
            <div>
              <div className="space-y-3 p-5">
                {approvals.map((appr) => {
                  const ac = UAT_APPROVAL_STATUS_CONFIG[appr.status] || { label: appr.status, color: '#94A3B8', bg: 'bg-slate-500/10' };
                  return (
                    <div key={appr.id} className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <span className="px-2 py-0.5 rounded-lg text-xs font-medium" style={{ color: ac.color, backgroundColor: ac.bg }}>{ac.label}</span>
                        {appr.evidence && <p className="text-xs text-slate-400 mt-1">{appr.evidence}</p>}
                      </div>
                      <div className="flex gap-1">
                        {appr.status === 'awaiting_approval' && (
                          <>
                            <button onClick={() => handleQuickStatus('uat_approvals', appr.id, 'approved')} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs cursor-pointer whitespace-nowrap">Approve</button>
                            <button onClick={() => handleQuickStatus('uat_approvals', appr.id, 'rejected')} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs cursor-pointer whitespace-nowrap">Reject</button>
                          </>
                        )}
                        {appr.status === 'approved' && (
                          <button onClick={() => handleQuickStatus('uat_approvals', appr.id, 'revoked')} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs cursor-pointer whitespace-nowrap">Revoke</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {approvals.length === 0 && (
                <div className="text-center py-16">
                  <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 font-medium">No pending approvals</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
