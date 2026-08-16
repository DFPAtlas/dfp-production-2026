'use client';

import { useState, useEffect } from 'react';
import { motion } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  FileText, Clock, CheckCircle, XCircle, Eye,
} from 'lucide-react';
import { useUATTester } from '@/components/uat/UATTesterProvider';
import UATPortalBreadcrumbs from '@/components/uat/portal/UATPortalBreadcrumbs';
import UATEmptyState from '@/components/uat/portal/UATEmptyState';

interface Application {
  id: string; job_id: string; status: string;
  application_message: string | null; admin_notes: string | null;
  created_at: string;
  job_title?: string; project_name?: string;
}

export default function TesterApplicationsPage() {
  const router = useRouter();
  const { tester } = useUATTester();
  const testerId = tester.id;
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [testerId]);

  const loadData = async () => {
    const { data: appData } = await supabase.from('uat_job_applications').select('*').eq('tester_id', testerId).order('created_at', { ascending: false });
    if (!appData) { setLoading(false); return; }

    const jobIds = [...new Set(appData.map((a: any) => a.job_id).filter(Boolean))];
    const { data: jobsData } = jobIds.length > 0
      ? await supabase.from('uat_jobs').select('id, title, project_id').in('id', jobIds)
      : { data: [] };

    const jobMap: Record<string, any> = {};
    jobsData?.forEach((j: any) => { jobMap[j.id] = j; });

    const projIds = [...new Set(jobsData?.map((j: any) => j.project_id).filter(Boolean) || [])];
    const { data: projData } = projIds.length > 0
      ? await supabase.from('uat_projects').select('id, name').in('id', projIds)
      : { data: [] };
    const projMap: Record<string, string> = {};
    projData?.forEach((p: any) => { projMap[p.id] = p.name; });

    const merged = appData.map((a: any) => ({
      ...a,
      job_title: jobMap[a.job_id]?.title || 'Unknown',
      project_name: projMap[jobMap[a.job_id]?.project_id] || null,
    }));

    setApplications(merged);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-8 h-8 border-[3px] border-[#2878d0]/20 border-t-[#2878d0] rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading applications...</p>
      </div>
    );
  }

  const statusIcons: Record<string, any> = {
    applied: { icon: Clock, color: '#2878d0', bg: 'bg-sky-50', label: 'Pending Review' },
    accepted: { icon: CheckCircle, color: '#10B981', bg: 'bg-emerald-50', label: 'Accepted' },
    rejected: { icon: XCircle, color: '#EF4444', bg: 'bg-red-50', label: 'Rejected' },
    completed: { icon: CheckCircle, color: '#7C3AED', bg: 'bg-violet-50', label: 'Completed' },
  };

  return (
    <>
      <UATPortalBreadcrumbs items={[{ label: 'My Applications' }]} />
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#789265]">Applications</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight sm:text-5xl text-[#17325c]">My Applications</h1>
          <p className="mt-2 text-slate-500">Track your UAT job applications</p>
        </div>
        <button onClick={() => router.push('/uat/jobs')} className="px-4 py-2.5 bg-[#2878d0] rounded-xl text-sm font-semibold text-white shadow-md shadow-blue-200 hover:bg-[#1e68b9] cursor-pointer whitespace-nowrap">Browse Jobs</button>
      </div>

      <div className="mt-8">
        {applications.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
            <UATEmptyState icon={FileText} title="No applications yet" description="Browse available jobs to start applying" actionLabel="View Jobs" actionHref="/uat/jobs" />
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app, i) => {
              const si = statusIcons[app.status] || statusIcons.applied;
              const Icon = si.icon;
              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-[#2878d0]/20 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => router.push(`/uat/jobs/${app.job_id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {app.project_name && (
                          <span className="text-xs font-medium text-[#2878d0] bg-[#edf5ff] px-2 py-0.5 rounded-lg">{app.project_name}</span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-[#17325c] mb-1">{app.job_title}</h3>
                      {app.application_message && (
                        <p className="text-xs text-slate-400 italic">{'\u201C'}{app.application_message}{'\u201D'}</p>
                      )}
                      {app.admin_notes && (
                        <p className="text-xs text-slate-400 mt-1">Admin: {app.admin_notes}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-2">
                        Applied {new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: si.bg, color: si.color }}>
                        <Icon className="w-3.5 h-3.5" />
                        {si.label}
                      </span>
                      <Eye className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}