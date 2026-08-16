'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from '@/components/motion';
import { useRouter } from 'next/navigation';
import {
  Search, Filter, RefreshCw, UserCheck, UserX, Eye, ChevronDown,
  FileText, Users, MessageSquare,
} from 'lucide-react';
import AdminShell from '../../../../components/admin/AdminShell';



interface Application {
  id: string; job_id: string; tester_id: string;
  status: string; application_message: string | null; admin_notes: string | null;
  created_at: string;
  job_title?: string; tester_name?: string; tester_email?: string;
}

export default function AdminApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApps, setFilteredApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [appNote, setAppNote] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: appData } = await supabase.from('uat_job_applications').select('*').order('created_at', { ascending: false });
    if (!appData) { setLoading(false); return; }

    const jobIds = [...new Set(appData.map((a: any) => a.job_id))];
    const testerIds = [...new Set(appData.map((a: any) => a.tester_id))];

    const [{ data: jobs }, { data: testers }] = await Promise.all([
      supabase.from('uat_jobs').select('id, title').in('id', jobIds),
      supabase.from('uat_testers').select('id, full_name, email').in('id', testerIds),
    ]);

    const jobMap: Record<string, string> = {};
    jobs?.forEach((j: any) => { jobMap[j.id] = j.title; });
    const testerMap: Record<string, any> = {};
    testers?.forEach((t: any) => { testerMap[t.id] = t; });

    const merged = appData.map((a: any) => ({
      ...a,
      job_title: jobMap[a.job_id] || 'Unknown',
      tester_name: testerMap[a.tester_id]?.full_name || 'Unknown',
      tester_email: testerMap[a.tester_id]?.email || '',
    }));

    setApplications(merged);
    setFilteredApps(merged);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    let filtered = applications;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((a) =>
        (a.tester_name && a.tester_name.toLowerCase().includes(q)) ||
        (a.job_title && a.job_title.toLowerCase().includes(q)) ||
        (a.tester_email && a.tester_email.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== 'all') filtered = filtered.filter((a) => a.status === statusFilter);
    setFilteredApps(filtered);
  }, [searchQuery, statusFilter, applications]);

  const handleStatus = async (app: Application, newStatus: string) => {
    const noteVal = appNote[app.id] || '';
    await supabase.from('uat_job_applications').update({ status: newStatus, admin_notes: noteVal || null, updated_at: new Date().toISOString() }).eq('id', app.id);
    await supabase.from('uat_audit_log').insert({
      action: `Application ${newStatus}`, entity_type: 'uat_job_application', entity_id: app.id,
      previous_value: { status: app.status }, new_value: { status: newStatus, admin_notes: noteVal },
    });
    setAppNote((prev) => { const n = { ...prev }; delete n[app.id]; return n; });
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
          <h1 className="text-2xl font-bold text-white">UAT Applications</h1>
          <p className="text-sm text-slate-400 mt-0.5">Review and manage tester job applications</p>
        </div>

        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" placeholder="Search by tester name, job title, or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-9 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
                  <option value="all">All Status</option>
                  <option value="applied">Applied</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
              <button onClick={() => { setRefreshing(true); fetchData(); }} disabled={refreshing}
                className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-[#06B6D4] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 whitespace-nowrap">
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>
          </div>

          <div className="space-y-3 p-5">
            {filteredApps.map((app) => (
              <div key={app.id} className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 hover:border-[#06B6D4]/10 transition-all">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-white">{app.tester_name}</p>
                      <span className="text-xs text-slate-500">{app.tester_email}</span>
                    </div>
                    <p className="text-sm text-slate-400">Applied to: <button onClick={() => router.push(`/admin/uat/jobs/${app.job_id}`)} className="text-[#06B6D4] hover:underline cursor-pointer">{app.job_title}</button></p>
                    {app.application_message && <p className="text-xs text-slate-500 mt-1 italic">“{app.application_message}”</p>}
                    {app.admin_notes && <p className="text-xs text-slate-500 mt-0.5">Note: {app.admin_notes}</p>}
                    <p className="text-xs text-slate-600 mt-1">{new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                      app.status === 'applied' ? 'text-blue-400 bg-blue-400/10' :
                      app.status === 'accepted' ? 'text-emerald-400 bg-emerald-400/10' :
                      'text-red-400 bg-red-400/10'
                    }`}>{app.status}</span>

                    {app.status === 'applied' && (
                      <div className="flex items-center gap-1">
                        <input type="text" value={appNote[app.id] || ''} onChange={(e) => setAppNote({ ...appNote, [app.id]: e.target.value })}
                          placeholder="Note..."
                          className="w-24 px-2 py-1 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none" />
                        <button onClick={() => handleStatus(app, 'accepted')} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer" title="Accept">
                          <UserCheck className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleStatus(app, 'rejected')} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer" title="Reject">
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredApps.length === 0 && (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No applications found</p>
              <p className="text-sm text-slate-500 mt-1">{searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Applications will appear here when testers apply to jobs'}</p>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
