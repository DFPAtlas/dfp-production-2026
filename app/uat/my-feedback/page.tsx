'use client';

import { useState, useEffect } from 'react';
import { motion } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  FileText, Search, RefreshCw,
  Eye, Filter, ChevronDown,
} from 'lucide-react';
import { useUATTester } from '@/components/uat/UATTesterProvider';
import UATPortalBreadcrumbs from '@/components/uat/portal/UATPortalBreadcrumbs';
import UATStatusBadge from '@/components/uat/portal/UATStatusBadge';
import UATEmptyState from '@/components/uat/portal/UATEmptyState';

const severityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-slate-100 text-slate-600',
};

const statusColors: Record<string, string> = {
  new: 'bg-cyan-100 text-cyan-700',
  reviewing: 'bg-violet-100 text-violet-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  duplicate: 'bg-amber-100 text-amber-700',
  rejected: 'bg-rose-100 text-rose-700',
  fixed: 'bg-emerald-100 text-emerald-700',
  retest_needed: 'bg-orange-100 text-orange-700',
  closed: 'bg-slate-100 text-slate-600',
};

const typeIcons: Record<string, string> = {
  bug: 'ri-bug-line', 'usability issue': 'ri-emotion-unhappy-line',
  'broken link': 'ri-link-unlink', 'payment issue': 'ri-money-dollar-circle-line',
  'login issue': 'ri-lock-line', 'design feedback': 'ri-palette-line',
  'mobile issue': 'ri-smartphone-line', 'accessibility issue': 'ri-eye-line',
  'performance issue': 'ri-speed-up-line', other: 'ri-question-line',
};

export default function MyFeedbackPage() {
  const router = useRouter();
  const { tester } = useUATTester();
  const testerId = tester.id;
  const [feedback, setFeedback] = useState<any[]>([]);
  const [filteredFeedback, setFilteredFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedFb, setSelectedFb] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [testerId]);

  const loadData = async () => {
    const { data: fb } = await supabase.from('uat_feedback').select('*').eq('tester_id', testerId).order('created_at', { ascending: false });

    if (fb && fb.length > 0) {
      const jobIds = [...new Set(fb.map((f: any) => f.job_id).filter(Boolean))];
      const projectIds = [...new Set(fb.map((f: any) => f.project_id).filter(Boolean))];

      const [{ data: jobs }, { data: projects }] = await Promise.all([
        jobIds.length > 0 ? supabase.from('uat_jobs').select('id, title').in('id', jobIds as any) : Promise.resolve({ data: [] }),
        projectIds.length > 0 ? supabase.from('uat_projects').select('id, name').in('id', projectIds as any) : Promise.resolve({ data: [] }),
      ]);

      const jobMap: Record<string, string> = {};
      jobs?.forEach((j: any) => { jobMap[j.id] = j.title; });
      const projMap: Record<string, string> = {};
      projects?.forEach((p: any) => { projMap[p.id] = p.name; });

      const merged = fb.map((f: any) => ({
        ...f,
        job_title: jobMap[f.job_id] || null,
        project_name: projMap[f.project_id] || null,
      }));
      setFeedback(merged);
      setFilteredFeedback(merged);
    }

    setLoading(false);
  };

  useEffect(() => {
    let filtered = feedback;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((f) =>
        (f.title && f.title.toLowerCase().includes(q)) ||
        (f.description && f.description.toLowerCase().includes(q)) ||
        (f.project_name && f.project_name.toLowerCase().includes(q)) ||
        (f.job_title && f.job_title.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== 'all') filtered = filtered.filter((f) => f.status === statusFilter);
    setFilteredFeedback(filtered);
  }, [searchQuery, statusFilter, feedback]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-8 h-8 border-[3px] border-[#2878d0]/20 border-t-[#2878d0] rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading feedback...</p>
      </div>
    );
  }

  return (
    <>
      <UATPortalBreadcrumbs items={[{ label: 'My Feedback' }]} />
      <div className="mt-4">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#789265]">Reports</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight sm:text-5xl text-[#17325c]">My Feedback</h1>
        <p className="mt-2 text-slate-500">All the bugs, issues, and feedback you&apos;ve submitted</p>
      </div>

      <div className="mt-8 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search feedback..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 transition-all" />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 cursor-pointer appearance-none">
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="reviewing">Reviewing</option>
                <option value="accepted">Accepted</option>
                <option value="duplicate">Duplicate</option>
                <option value="rejected">Rejected</option>
                <option value="fixed">Fixed</option>
                <option value="retest_needed">Retest Needed</option>
                <option value="closed">Closed</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
            <button onClick={loadData}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 hover:text-[#2878d0] transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        {filteredFeedback.length === 0 ? (
          <UATEmptyState
            icon={FileText}
            title={feedback.length === 0 ? 'No Feedback Yet' : 'No Feedback Matches'}
            description={feedback.length === 0 ? 'You haven\'t submitted any feedback. Go to an active test to report issues.' : 'No feedback matches your filters.'}
            actionLabel={feedback.length === 0 ? 'Go to My Tests' : undefined}
            actionHref={feedback.length === 0 ? '/uat/my-tests' : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Title</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Type</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Severity</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Project</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Date</th>
                  <th className="text-right text-xs font-medium text-slate-400 px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedback.map((fb: any) => (
                  <tr key={fb.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-[#17325c] max-w-xs truncate">{fb.title}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <i className={`${typeIcons[fb.feedback_type] || 'ri-question-line'} text-sm text-slate-400`}></i>
                        <span className="text-xs text-slate-500 capitalize">{fb.feedback_type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <UATStatusBadge status={fb.severity} colorMap={severityColors} />
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-500">{fb.project_name || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <UATStatusBadge status={fb.status} colorMap={statusColors} />
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-400">{new Date(fb.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => { setSelectedFb(fb); setDetailOpen(true); }}
                        className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-400 hover:text-[#2878d0] hover:border-[#2878d0]/20 cursor-pointer">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailOpen && selectedFb && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setDetailOpen(false)}>
          <div className="bg-white border border-slate-100 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <UATStatusBadge status={selectedFb.status} colorMap={statusColors} />
                <button onClick={() => setDetailOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer text-xl leading-none">&times;</button>
              </div>
              <h2 className="text-lg font-bold text-[#17325c] mb-1">{selectedFb.title}</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs text-slate-500 capitalize">{selectedFb.feedback_type}</span>
                <UATStatusBadge status={selectedFb.severity} colorMap={severityColors} />
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Description</p>
                  <p className="text-slate-600 whitespace-pre-wrap">{selectedFb.description}</p>
                </div>
                {selectedFb.steps_to_reproduce && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Steps to Reproduce</p>
                    <p className="text-slate-600 whitespace-pre-wrap">{selectedFb.steps_to_reproduce}</p>
                  </div>
                )}
                {selectedFb.expected_result && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Expected Result</p>
                    <p className="text-slate-600 whitespace-pre-wrap">{selectedFb.expected_result}</p>
                  </div>
                )}
                {selectedFb.actual_result && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Actual Result</p>
                    <p className="text-slate-600 whitespace-pre-wrap">{selectedFb.actual_result}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-3 text-xs text-slate-400 pt-2 border-t border-slate-100 mt-3">
                  {selectedFb.device && <span>Device: {selectedFb.device}</span>}
                  {selectedFb.browser && <span>Browser: {selectedFb.browser}</span>}
                  {selectedFb.page_url && <span className="block w-full truncate">URL: {selectedFb.page_url}</span>}
                </div>
                {selectedFb.admin_notes && (
                  <div className="pt-2 border-t border-slate-100 mt-3">
                    <p className="text-xs text-slate-400 mb-1">Admin Notes</p>
                    <p className="text-slate-600 whitespace-pre-wrap">{selectedFb.admin_notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}