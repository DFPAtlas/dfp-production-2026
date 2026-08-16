'use client';

import { useState, useEffect } from 'react';
import { motion } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  Clock, DollarSign, Calendar, AlertCircle,
  FileText, ExternalLink, Bug,
} from 'lucide-react';
import { useUATTester } from '@/components/uat/UATTesterProvider';
import UATPortalBreadcrumbs from '@/components/uat/portal/UATPortalBreadcrumbs';
import UATStatusBadge from '@/components/uat/portal/UATStatusBadge';
import UATEmptyState from '@/components/uat/portal/UATEmptyState';
import UATErrorState from '@/components/uat/portal/UATErrorState';

interface Assignment {
  id: string; job_id: string; tester_id: string;
  status: string; agreed_pay: number | null;
  access_starts_at: string | null; access_expires_at: string | null;
  started_at: string | null; submitted_at: string | null;
  completed_at: string | null;
  created_at: string;
  job_title?: string; project_name?: string;
  deadline?: string; environment_name?: string;
}

const statusColors: Record<string, string> = {
  assigned: 'bg-sky-100 text-sky-700',
  testing: 'bg-emerald-100 text-emerald-700',
  submitted: 'bg-amber-100 text-amber-700',
  approved: 'bg-violet-100 text-violet-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
  expired: 'bg-slate-100 text-slate-600',
};

export default function MyTestsPage() {
  const router = useRouter();
  const { tester } = useUATTester();
  const testerId = tester.id;
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [testerId]);

  const loadData = async () => {
    const { data: assignData, error: assignErr } = await supabase.from('uat_assignments').select('*').eq('tester_id', testerId).order('created_at', { ascending: false });
    if (assignErr) { setError('Failed to load assignments.'); setLoading(false); return; }

    if (assignData && assignData.length > 0) {
      const jobIds = [...new Set(assignData.map((a: any) => a.job_id))];
      const { data: jobs } = await supabase.from('uat_jobs').select('id, title, project_id, deadline').in('id', jobIds);
      const jobMap: Record<string, any> = {};
      jobs?.forEach((j: any) => { jobMap[j.id] = j; });

      const projectIds = [...new Set(jobs?.map((j: any) => j.project_id).filter(Boolean) || [])];
      const projectMap: Record<string, string> = {};
      if (projectIds.length > 0) {
        const { data: projects } = await supabase.from('uat_projects').select('id, name').in('id', projectIds);
        projects?.forEach((p: any) => { projectMap[p.id] = p.name; });
      }

      const merged = assignData.map((a: any) => ({
        ...a,
        job_title: jobMap[a.job_id]?.title || 'Unknown',
        project_name: projectMap[jobMap[a.job_id]?.project_id] || null,
        deadline: jobMap[a.job_id]?.deadline || null,
      }));
      setAssignments(merged);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-8 h-8 border-[3px] border-[#2878d0]/20 border-t-[#2878d0] rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading assignments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <UATPortalBreadcrumbs items={[{ label: 'My Tests' }]} />
        <UATErrorState message={error} onRetry={loadData} />
      </>
    );
  }

  const activeAssignments = assignments.filter((a) => !['cancelled', 'expired', 'completed'].includes(a.status));
  const pastAssignments = assignments.filter((a) => ['cancelled', 'expired', 'completed'].includes(a.status));

  return (
    <>
      <UATPortalBreadcrumbs items={[{ label: 'My Tests' }]} />
      <div className="mt-4">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#789265]">Assignments</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight sm:text-5xl text-[#17325c]">My Tests</h1>
        <p className="mt-2 text-slate-500">Your assigned UAT test assignments</p>
      </div>

      <div className="mt-8">
        {assignments.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
            <UATEmptyState icon={FileText} title="No Test Assignments" description="You haven't been assigned to any tests yet. Browse available jobs and apply to get started." actionLabel="Browse Jobs" actionHref="/uat/jobs" />
          </div>
        ) : (
          <>
            {activeAssignments.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-[#17325c] mb-4 uppercase tracking-wide">Active Tests</h2>
                <div className="space-y-3">
                  {activeAssignments.map((a, i) => (
                    <motion.button
                      key={a.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => router.push(`/uat/my-tests/${a.id}`)}
                      className="w-full bg-white border border-slate-100 rounded-2xl p-5 text-left hover:border-[#2878d0]/20 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {a.project_name && (
                              <span className="text-xs font-medium text-[#2878d0] bg-[#edf5ff] px-2 py-0.5 rounded-lg">{a.project_name}</span>
                            )}
                            <UATStatusBadge status={a.status} colorMap={statusColors} />
                          </div>
                          <h3 className="text-base font-bold text-[#17325c]">{a.job_title}</h3>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-[#2878d0] transition-colors shrink-0" />
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                        {a.agreed_pay && (
                          <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-slate-400" />£{a.agreed_pay}</span>
                        )}
                        {a.deadline && (
                          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(a.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                        {a.access_expires_at && (
                          <span className={`flex items-center gap-1.5 ${new Date(a.access_expires_at) < new Date() ? 'text-red-500' : 'text-emerald-600'}`}>
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(a.access_expires_at) < new Date() ? 'Expired' : 'Active until ' + new Date(a.access_expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-50">
                        <button onClick={(e) => { e.stopPropagation(); router.push(`/uat/feedback/${a.id}`); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#edf5ff] text-[#2878d0] hover:bg-[#d6e8fa] rounded-lg text-xs font-medium cursor-pointer transition-colors whitespace-nowrap">
                          <Bug className="w-3 h-3" /> Submit Feedback
                        </button>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {pastAssignments.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wide">Past Tests</h2>
                <div className="space-y-2">
                  {pastAssignments.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => router.push(`/uat/my-tests/${a.id}`)}
                      className="w-full bg-white border border-slate-100 rounded-xl p-4 text-left hover:border-[#2878d0]/20 transition-all cursor-pointer opacity-60 hover:opacity-80"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="text-sm font-medium text-[#17325c]">{a.job_title}</h3>
                            <UATStatusBadge status={a.status} colorMap={statusColors} />
                          </div>
                          {a.project_name && <p className="text-xs text-slate-400">{a.project_name}</p>}
                        </div>
                        {a.agreed_pay && <span className="text-xs text-slate-400">£{a.agreed_pay}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}