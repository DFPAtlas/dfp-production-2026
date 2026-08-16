'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from '@/components/motion';
import {
  Search, RefreshCw, Eye, ChevronDown, Filter, X, CheckCircle,
  Clock, XCircle, UserCheck, FileText, AlertCircle, DollarSign, Calendar,
  Play, Ban, ChevronLeft, ChevronRight,
} from 'lucide-react';
import AdminShell from '../../../../components/admin/AdminShell';



interface Assignment {
  id: string; job_id: string; tester_id: string; application_id: string | null;
  status: string; agreed_pay: number | null;
  access_starts_at: string | null; access_expires_at: string | null;
  started_at: string | null; submitted_at: string | null;
  completed_at: string | null; admin_notes: string | null;
  created_at: string;
  job_title?: string; tester_name?: string; tester_email?: string;
  project_name?: string; environment_name?: string;
}

const statusColors: Record<string, string> = {
  assigned: '#06B6D4', testing: '#10B981', submitted: '#F59E0B',
  approved: '#8B5CF6', completed: '#10B981', cancelled: '#EF4444',
  expired: '#6B7280',
};

export default function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const [selected, setSelected] = useState<Assignment | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: assignData } = await supabase.from('uat_assignments').select('*').order('created_at', { ascending: false });
    if (!assignData) { setLoading(false); return; }

    const jobIds = [...new Set(assignData.map((a: any) => a.job_id))];
    const testerIds = [...new Set(assignData.map((a: any) => a.tester_id))];

    const [{ data: jobs }, { data: testers }] = await Promise.all([
      supabase.from('uat_jobs').select('id, title, project_id').in('id', jobIds),
      supabase.from('uat_testers').select('id, full_name, email').in('id', testerIds),
    ]);

    const jobMap: Record<string, any> = {};
    jobs?.forEach((j: any) => { jobMap[j.id] = j; });

    const projectIds = [...new Set(jobs?.map((j: any) => j.project_id).filter(Boolean) || [])];
    const projectMap: Record<string, string> = {};
    if (projectIds.length > 0) {
      const { data: projects } = await supabase.from('uat_projects').select('id, name').in('id', projectIds);
      projects?.forEach((p: any) => { projectMap[p.id] = p.name; });
    }

    const testerMap: Record<string, any> = {};
    testers?.forEach((t: any) => { testerMap[t.id] = t; });

    const merged = assignData.map((a: any) => ({
      ...a,
      job_title: jobMap[a.job_id]?.title || 'Unknown',
      tester_name: testerMap[a.tester_id]?.full_name || 'Unknown',
      tester_email: testerMap[a.tester_id]?.email || '',
      project_name: projectMap[jobMap[a.job_id]?.project_id] || null,
    }));

    setAssignments(merged);
    setFilteredAssignments(merged);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    let filtered = assignments;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((a) =>
        (a.tester_name && a.tester_name.toLowerCase().includes(q)) ||
        (a.job_title && a.job_title.toLowerCase().includes(q)) ||
        (a.project_name && a.project_name.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== 'all') filtered = filtered.filter((a) => a.status === statusFilter);
    setFilteredAssignments(filtered);
  }, [searchQuery, statusFilter, assignments]);

  const openDetail = async (assignment: Assignment) => {
    const { data: envs } = await supabase.from('uat_environments').select('environment_name').eq('project_id', (() => {
      const j = assignments.find((a) => a.id === assignment.id);
      return '';
    })()).maybeSingle();

    setSelected(assignment);
    setDetailOpen(true);
  };

  const handleStatusChange = async (assignmentId: string, newStatus: string) => {
    setStatusUpdating(assignmentId);
    const updates: any = { status: newStatus, updated_at: new Date().toISOString() };
    if (newStatus === 'testing' && !assignments.find((a) => a.id === assignmentId)?.started_at) {
      updates.started_at = new Date().toISOString();
    }
    if (newStatus === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    await supabase.from('uat_assignments').update(updates).eq('id', assignmentId);
    await supabase.from('uat_audit_log').insert({
      action: `Assignment ${newStatus}`,
      entity_type: 'uat_assignment',
      entity_id: assignmentId,
      new_value: { status: newStatus },
    });
    setStatusUpdating(null);
    fetchData();
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">UAT Assignments</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage test assignments, statuses, and access</p>
        </div>

        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" placeholder="Search by tester, job, or project..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-9 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
                  <option value="all">All Status</option>
                  <option value="assigned">Assigned</option>
                  <option value="testing">Testing</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="expired">Expired</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
              <button onClick={() => { setRefreshing(true); fetchData(); }} disabled={refreshing}
                className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-[#06B6D4] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 whitespace-nowrap">
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Tester</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Job / Project</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Pay</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Access</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Created</th>
                  <th className="text-right text-xs font-medium text-slate-500 px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((a) => (
                  <tr key={a.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-white">{a.tester_name}</p>
                      <p className="text-xs text-slate-500">{a.tester_email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-white">{a.job_title}</p>
                      {a.project_name && <p className="text-xs text-slate-500">{a.project_name}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2.5 py-0.5 rounded-lg text-xs font-medium capitalize"
                        style={{ color: statusColors[a.status], backgroundColor: statusColors[a.status] + '15', border: '1px solid ' + statusColors[a.status] + '30' }}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-white">{a.agreed_pay ? '$' + a.agreed_pay : '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      {a.access_expires_at ? (
                        <div className="text-xs">
                          <p className="text-slate-400">
                            {new Date(a.access_expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          {new Date(a.access_expires_at) < new Date() && (
                            <span className="text-red-400 font-medium">Expired</span>
                          )}
                          {new Date(a.access_expires_at) >= new Date() && (
                            <span className="text-emerald-400 font-medium">Active</span>
                          )}
                        </div>
                      ) : <span className="text-xs text-slate-500">-</span>}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-400">{new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openDetail(a)} className="p-1.5 rounded-lg bg-white/5 border border-[rgba(255,255,255,0.06)] text-slate-400 hover:text-[#06B6D4] hover:border-[#06B6D4]/20 cursor-pointer" title="View">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {a.status === 'assigned' && (
                          <>
                            <button onClick={() => handleStatusChange(a.id, 'testing')} disabled={statusUpdating === a.id}
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer" title="Start Testing">
                              <Play className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleStatusChange(a.id, 'cancelled')} disabled={statusUpdating === a.id}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer" title="Cancel">
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {a.status === 'testing' && (
                          <button onClick={() => handleStatusChange(a.id, 'completed')} disabled={statusUpdating === a.id}
                            className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 cursor-pointer" title="Complete">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {a.status === 'submitted' && (
                          <>
                            <button onClick={() => handleStatusChange(a.id, 'approved')} disabled={statusUpdating === a.id}
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer" title="Approve">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleStatusChange(a.id, 'cancelled')} disabled={statusUpdating === a.id}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer" title="Cancel">
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAssignments.length === 0 && (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No assignments found</p>
              <p className="text-sm text-slate-500 mt-1">{searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Accept tester applications to create assignments'}</p>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}