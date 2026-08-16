'use client';

import { useState, useEffect } from 'react';
import { motion } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  Briefcase, Search, Filter, RefreshCw, Plus, Edit, Eye, Users,
  ChevronDown, Clock, DollarSign, Calendar, Archive, Play, Pause,
  CheckCircle, XCircle, ExternalLink,
} from 'lucide-react';
import AdminShell from '../../../../components/admin/AdminShell';



interface UatJob {
  id: string;
  project_id: string | null;
  environment_id: string | null;
  title: string;
  public_summary: string | null;
  pay_amount: number | null;
  pay_type: string;
  max_testers: number | null;
  deadline: string | null;
  status: string;
  created_at: string;
  project_name?: string;
  environment_name?: string;
  applicant_count?: number;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: '#94A3B8', bg: 'bg-slate-500/10' },
  open: { label: 'Open', color: '#10B981', bg: 'bg-emerald-500/10' },
  in_testing: { label: 'In Testing', color: '#06B6D4', bg: 'bg-cyan-500/10' },
  completed: { label: 'Completed', color: '#8B5CF6', bg: 'bg-violet-500/10' },
  closed: { label: 'Closed', color: '#6B7280', bg: 'bg-gray-500/10' },
};

const payTypeLabels: Record<string, string> = {
  fixed: 'Fixed Rate',
  hourly: 'Per Hour',
  'bonus-only': 'Bonus Only',
};

export default function AdminUATJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<UatJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<UatJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    const { data: jobData } = await supabase.from('uat_jobs').select('*').order('created_at', { ascending: false });
    const { data: projData } = await supabase.from('uat_projects').select('id, name');
    const { data: envData } = await supabase.from('uat_environments').select('id, environment_name');
    const { data: appData } = await supabase.from('uat_job_applications').select('job_id');

    const projectMap: Record<string, string> = {};
    projData?.forEach((p: any) => { projectMap[p.id] = p.name; });
    const envMap: Record<string, string> = {};
    envData?.forEach((e: any) => { envMap[e.id] = e.environment_name; });
    const appCounts: Record<string, number> = {};
    appData?.forEach((a: any) => { appCounts[a.job_id] = (appCounts[a.job_id] || 0) + 1; });

    const merged = (jobData || []).map((j: any) => ({
      ...j,
      project_name: projectMap[j.project_id] || '-',
      environment_name: envMap[j.environment_id] || '-',
      applicant_count: appCounts[j.id] || 0,
    }));

    setJobs(merged as UatJob[]);
    setFilteredJobs(merged as UatJob[]);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    let filtered = jobs;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((j) =>
        j.title.toLowerCase().includes(q) ||
        (j.project_name && j.project_name.toLowerCase().includes(q)) ||
        (j.public_summary && j.public_summary.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== 'all') filtered = filtered.filter((j) => j.status === statusFilter);
    setFilteredJobs(filtered);
  }, [searchQuery, statusFilter, jobs]);

  const quickStatus = async (job: UatJob, newStatus: string) => {
    await supabase.from('uat_jobs').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', job.id);
    await supabase.from('uat_audit_log').insert({
      action: `Job status changed to ${newStatus}`,
      entity_type: 'uat_job',
      entity_id: job.id,
      previous_value: { status: job.status },
      new_value: { status: newStatus },
    });
    fetchJobs();
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">UAT Jobs</h1>
            <p className="text-sm text-slate-400 mt-0.5">Create and manage test jobs linked to registered projects</p>
          </div>
          <button
            onClick={() => router.push('/admin/uat/jobs/new')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] hover:bg-[#0891B2] rounded-xl text-sm font-semibold text-white transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Post New Job
          </button>
        </div>

        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text" placeholder="Search jobs..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all"
              />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-9 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="open">Open</option>
                  <option value="in_testing">In Testing</option>
                  <option value="completed">Completed</option>
                  <option value="closed">Closed</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
              <button onClick={() => { setRefreshing(true); fetchJobs(); }} disabled={refreshing}
                className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-[#06B6D4] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 whitespace-nowrap">
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Job</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Project</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pay</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Deadline</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Applicants</th>
                  <th className="text-right py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => {
                  const sc = statusConfig[job.status] || statusConfig.draft;
                  return (
                    <tr key={job.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-5">
                        <p className="text-sm font-semibold text-white">{job.title}</p>
                        {job.public_summary && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{job.public_summary}</p>}
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-sm text-slate-400">{job.project_name}</span>
                        {job.environment_name && <p className="text-xs text-slate-500">{job.environment_name}</p>}
                      </td>
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium border"
                          style={{ backgroundColor: sc.bg, color: sc.color, borderColor: sc.color + '30' }}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-sm text-slate-400">{payTypeLabels[job.pay_type] || job.pay_type}</span>
                        {job.pay_amount && <p className="text-xs text-slate-500">${job.pay_amount}</p>}
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-sm text-slate-400">
                          {job.deadline ? new Date(job.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center gap-1 text-sm text-slate-400">
                          <Users className="w-3.5 h-3.5" />
                          {job.applicant_count || 0}{job.max_testers ? ` / ${job.max_testers}` : ''}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {job.status === 'draft' && (
                            <button onClick={() => quickStatus(job, 'open')} title="Publish"
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 cursor-pointer">
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                          {job.status === 'open' && (
                            <button onClick={() => quickStatus(job, 'in_testing')} title="Start Testing"
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-400 cursor-pointer">
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                          {job.status === 'in_testing' && (
                            <button onClick={() => quickStatus(job, 'completed')} title="Mark Complete"
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-violet-500/10 text-slate-400 hover:text-violet-400 cursor-pointer">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {job.status !== 'closed' && (
                            <button onClick={() => quickStatus(job, 'closed')} title="Close"
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 cursor-pointer">
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => router.push(`/admin/uat/jobs/${job.id}`)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#06B6D4] cursor-pointer">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredJobs.length === 0 && (
            <div className="text-center py-16">
              <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No jobs found</p>
              <p className="text-sm text-slate-500 mt-1">
                {searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Post your first test job to get started'}
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}