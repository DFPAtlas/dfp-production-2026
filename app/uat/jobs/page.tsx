'use client';

import { useState, useEffect } from 'react';
import { motion } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  Briefcase, Search, Clock, DollarSign, Monitor, Smartphone,
  Calendar, Users, ArrowRight,
} from 'lucide-react';
import { useUATTester } from '@/components/uat/UATTesterProvider';
import UATPortalBreadcrumbs from '@/components/uat/portal/UATPortalBreadcrumbs';
import UATEmptyState from '@/components/uat/portal/UATEmptyState';

interface UatJob {
  id: string; project_id: string; title: string; public_summary: string | null;
  required_devices: string[] | null; required_browsers: string[] | null;
  required_experience_level: string | null; estimated_hours: number | null;
  pay_amount: number | null; pay_type: string; max_testers: number | null;
  deadline: string | null; status: string; project_name?: string;
  applicant_count?: number;
}

export default function TesterJobsPage() {
  const router = useRouter();
  const { tester } = useUATTester();
  const testerId = tester.id;
  const [jobs, setJobs] = useState<UatJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<UatJob[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, [testerId]);

  const loadData = async () => {
    const [{ data: jobsData }, { data: appsData }] = await Promise.all([
      supabase.from('uat_jobs').select('*').eq('status', 'open').order('created_at', { ascending: false }),
      supabase.from('uat_job_applications').select('job_id').eq('tester_id', testerId),
    ]);

    const appSet = new Set((appsData || []).map((a: any) => a.job_id));
    setAppliedJobIds(appSet);

    const jobIds = (jobsData || []).map((j: any) => j.project_id).filter(Boolean);
    const { data: projData } = jobIds.length > 0
      ? await supabase.from('uat_projects').select('id, name').in('id', [...new Set(jobIds)])
      : { data: [] };
    const projectMap: Record<string, string> = {};
    projData?.forEach((p: any) => { projectMap[p.id] = p.name; });

    const { data: appCountsData } = await supabase.from('uat_job_applications').select('job_id');
    const appCounts: Record<string, number> = {};
    appCountsData?.forEach((a: any) => { appCounts[a.job_id] = (appCounts[a.job_id] || 0) + 1; });

    const merged = (jobsData || []).map((j: any) => ({
      ...j,
      project_name: projectMap[j.project_id] || null,
      applicant_count: appCounts[j.id] || 0,
    }));

    setJobs(merged as UatJob[]);
    setFilteredJobs(merged as UatJob[]);
    setLoading(false);
  };

  useEffect(() => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      setFilteredJobs(jobs.filter((j) =>
        j.title.toLowerCase().includes(q) ||
        (j.project_name && j.project_name.toLowerCase().includes(q)) ||
        (j.public_summary && j.public_summary.toLowerCase().includes(q))
      ));
    } else {
      setFilteredJobs(jobs);
    }
  }, [searchQuery, jobs]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-8 h-8 border-[3px] border-[#2878d0]/20 border-t-[#2878d0] rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading jobs...</p>
      </div>
    );
  }

  const payTypeLabels: Record<string, string> = { fixed: 'Fixed', hourly: '/hr', 'bonus-only': 'Bonus' };

  return (
    <>
      <UATPortalBreadcrumbs items={[{ label: 'Available Jobs' }]} />
      <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#789265]">Testing Opportunities</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight sm:text-5xl text-[#17325c]">Available Jobs</h1>
          <p className="mt-2 text-slate-500">Browse and apply for UAT testing opportunities</p>
        </div>
      </div>

      <div className="relative mt-6 mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search jobs by title or project..." value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 transition-all" />
      </div>

      <div className="space-y-4">
        {filteredJobs.map((job, i) => {
          const hasApplied = appliedJobIds.has(job.id);
          const spotsLeft = job.max_testers ? job.max_testers - (job.applicant_count || 0) : null;
          const isFull = spotsLeft !== null && spotsLeft <= 0;

          return (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white border border-slate-100 rounded-2xl p-6 hover:border-[#2878d0]/20 hover:shadow-md transition-all cursor-pointer"
              onClick={() => router.push(`/uat/jobs/${job.id}`)}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {job.project_name && (
                      <span className="text-xs font-medium text-[#2878d0] bg-[#edf5ff] px-2 py-0.5 rounded-lg">{job.project_name}</span>
                    )}
                    {hasApplied && (
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">Applied</span>
                    )}
                    {isFull && !hasApplied && (
                      <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-lg">Full</span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-[#17325c] mb-1.5">{job.title}</h3>
                  {job.public_summary && <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{job.public_summary}</p>}
                </div>
                <div className="flex items-center gap-6 shrink-0 text-sm text-slate-500">
                  <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" />{job.estimated_hours ? `${job.estimated_hours}h` : '-'}</div>
                  <div className="flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-slate-400" />{job.pay_amount ? `£${job.pay_amount}${payTypeLabels[job.pay_type] ? ' ' + payTypeLabels[job.pay_type] : ''}` : '-'}</div>
                  <div className="flex items-center gap-1.5"><Users className="w-4 h-4 text-slate-400" />{job.applicant_count || 0}{job.max_testers ? `/${job.max_testers}` : ''}</div>
                  {job.deadline && (
                    <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-400" />{new Date(job.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                  )}
                  <ArrowRight className="w-5 h-5 text-slate-300" />
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-50">
                {job.required_devices && job.required_devices.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Monitor className="w-3.5 h-3.5" />{job.required_devices.join(', ')}
                  </div>
                )}
                {job.required_browsers && job.required_browsers.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Smartphone className="w-3.5 h-3.5" />{job.required_browsers.join(', ')}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredJobs.length === 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <UATEmptyState icon={Briefcase} title="No jobs available" description={searchQuery ? 'No jobs match your search.' : 'Check back later for new testing opportunities.'} />
        </div>
      )}
    </>
  );
}