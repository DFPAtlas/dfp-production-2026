'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Search, RefreshCw, Star, Plus, ChevronDown, FileText,
  X, Loader2, User,
} from 'lucide-react';
import AdminShell from '../../../../components/admin/AdminShell';



interface Rating {
  id: string; tester_id: string; assignment_id: string | null;
  communication_score: number; bug_quality_score: number;
  detail_score: number; reliability_score: number; speed_score: number;
  overall_score: number; admin_notes: string | null; created_at: string;
  tester_name?: string; tester_email?: string; job_title?: string;
}

export default function AdminRatingsPage() {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [filteredRatings, setFilteredRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [testers, setTesters] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [newRating, setNewRating] = useState({
    tester_id: '', assignment_id: '',
    communication_score: 3, bug_quality_score: 3, detail_score: 3,
    reliability_score: 3, speed_score: 3, admin_notes: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: ratData } = await supabase.from('uat_tester_ratings').select('*').order('created_at', { ascending: false });
    if (!ratData) { setLoading(false); return; }

    const testerIds = [...new Set(ratData.map((r: any) => r.tester_id))];
    const assignIds = [...new Set(ratData.map((r: any) => r.assignment_id).filter(Boolean))];

    const [{ data: testersData }, { data: assignsData }] = await Promise.all([
      supabase.from('uat_testers').select('id, full_name, email').in('id', testerIds),
      supabase.from('uat_assignments').select('id, job_id').in('id', assignIds),
    ]);

    const testerMap: Record<string, any> = {};
    testersData?.forEach((t: any) => { testerMap[t.id] = t; });

    const jobIds = [...new Set(assignsData?.map((a: any) => a.job_id).filter(Boolean) || [])];
    const jobMap: Record<string, string> = {};
    if (jobIds.length > 0) {
      const { data: jobsData } = await supabase.from('uat_jobs').select('id, title').in('id', jobIds);
      jobsData?.forEach((j: any) => { jobMap[j.id] = j.title; });
    }

    const assignJobMap: Record<string, string> = {};
    assignsData?.forEach((a: any) => { assignJobMap[a.id] = jobMap[a.job_id] || ''; });

    const merged = ratData.map((r: any) => ({
      ...r,
      tester_name: testerMap[r.tester_id]?.full_name || 'Unknown',
      tester_email: testerMap[r.tester_id]?.email || '',
      job_title: r.assignment_id ? assignJobMap[r.assignment_id] : null,
    }));

    setRatings(merged);
    setFilteredRatings(merged);
    setLoading(false);
  };

  useEffect(() => {
    let filtered = ratings;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((r) =>
        (r.tester_name && r.tester_name.toLowerCase().includes(q)) ||
        (r.job_title && r.job_title.toLowerCase().includes(q))
      );
    }
    setFilteredRatings(filtered);
  }, [searchQuery, ratings]);

  const openCreate = async () => {
    const [{ data: testerList }, { data: assignList }] = await Promise.all([
      supabase.from('uat_testers').select('id, full_name').eq('status', 'approved'),
      supabase.from('uat_assignments').select('id, tester_id, job_id').in('status', ['completed', 'submitted', 'approved']).order('created_at', { ascending: false }),
    ]);

    if (assignList) {
      const jobIds = [...new Set(assignList.map((a: any) => a.job_id))];
      const { data: jobs } = await supabase.from('uat_jobs').select('id, title').in('id', jobIds);
      const jMap: Record<string, string> = {};
      jobs?.forEach((j: any) => { jMap[j.id] = j.title; });
      const enriched = assignList.map((a: any) => ({
        ...a,
        job_title: jMap[a.job_id] || 'Unknown',
      }));
      setAssignments(enriched);
    }
    setTesters(testerList || []);
    setNewRating({ tester_id: '', assignment_id: '', communication_score: 3, bug_quality_score: 3, detail_score: 3, reliability_score: 3, speed_score: 3, admin_notes: '' });
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!newRating.tester_id) return;
    setCreating(true);

    const overall = Math.round(
      (newRating.communication_score + newRating.bug_quality_score + newRating.detail_score + newRating.reliability_score + newRating.speed_score) / 5 * 10
    ) / 10;

    await supabase.from('uat_tester_ratings').insert({
      tester_id: newRating.tester_id,
      assignment_id: newRating.assignment_id || null,
      communication_score: newRating.communication_score,
      bug_quality_score: newRating.bug_quality_score,
      detail_score: newRating.detail_score,
      reliability_score: newRating.reliability_score,
      speed_score: newRating.speed_score,
      overall_score: overall,
      admin_notes: newRating.admin_notes,
    });

    await supabase.from('uat_audit_log').insert({
      action: 'Tester rating created',
      entity_type: 'uat_tester_rating',
      entity_id: newRating.tester_id,
      new_value: { overall_score: overall },
    });

    setCreating(false);
    setCreateOpen(false);
    fetchData();
  };

  const scoreStars = (score: number, onChange: (v: number) => void, disabled: boolean) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} onClick={() => !disabled && onChange(s)} disabled={disabled}
          className={`w-6 h-6 flex items-center justify-center cursor-pointer ${disabled ? 'cursor-default' : ''}`}>
          <Star className={`w-5 h-5 ${s <= score ? 'text-amber-400 fill-current' : 'text-slate-600'}`} />
        </button>
      ))}
    </div>
  );

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">UAT Tester Ratings</h1>
            <p className="text-sm text-slate-400 mt-0.5">Rate tester performance after completed assignments</p>
          </div>
          <button onClick={openCreate} className="px-4 py-2.5 bg-[#06B6D4] hover:bg-[#0891B2] rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap flex items-center gap-2 transition-colors">
            <Plus className="w-4 h-4" /> Rate Tester
          </button>
        </div>

        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" placeholder="Search by tester or job..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
            </div>
            <button onClick={fetchData} className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-[#06B6D4] transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Tester</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Job</th>
                  <th className="text-center text-xs font-medium text-slate-500 px-3 py-3">Comm</th>
                  <th className="text-center text-xs font-medium text-slate-500 px-3 py-3">Bugs</th>
                  <th className="text-center text-xs font-medium text-slate-500 px-3 py-3">Detail</th>
                  <th className="text-center text-xs font-medium text-slate-500 px-3 py-3">Reliable</th>
                  <th className="text-center text-xs font-medium text-slate-500 px-3 py-3">Speed</th>
                  <th className="text-center text-xs font-medium text-slate-500 px-3 py-3">Overall</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredRatings.map((r) => (
                  <tr key={r.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-white">{r.tester_name}</p>
                      <p className="text-xs text-slate-500">{r.tester_email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-300">{r.job_title || '-'}</p>
                    </td>
                    <td className="px-3 py-4 text-center"><span className="text-sm text-white font-medium">{r.communication_score}</span></td>
                    <td className="px-3 py-4 text-center"><span className="text-sm text-white font-medium">{r.bug_quality_score}</span></td>
                    <td className="px-3 py-4 text-center"><span className="text-sm text-white font-medium">{r.detail_score}</span></td>
                    <td className="px-3 py-4 text-center"><span className="text-sm text-white font-medium">{r.reliability_score}</span></td>
                    <td className="px-3 py-4 text-center"><span className="text-sm text-white font-medium">{r.speed_score}</span></td>
                    <td className="px-3 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-bold text-amber-400 bg-amber-400/10">
                        <Star className="w-3.5 h-3.5 fill-current" /> {r.overall_score}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRatings.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-slate-500/10 flex items-center justify-center mx-auto mb-6">
                <Star className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No Ratings Yet</h3>
              <p className="text-sm text-slate-400">{ratings.length === 0 ? 'No tester ratings exist yet. Rate a tester to get started.' : 'No ratings match your search.'}</p>
            </div>
          )}
        </div>
      </div>

      {createOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setCreateOpen(false)}>
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Rate Tester</h2>
              <button onClick={() => setCreateOpen(false)} className="text-slate-500 hover:text-white text-xl cursor-pointer">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Tester</label>
                <select value={newRating.tester_id} onChange={(e) => setNewRating({ ...newRating, tester_id: e.target.value })}
                  className="w-full pl-3 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
                  <option value="">Select tester...</option>
                  {testers.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Assignment (optional)</label>
                <select value={newRating.assignment_id} onChange={(e) => setNewRating({ ...newRating, assignment_id: e.target.value })}
                  className="w-full pl-3 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
                  <option value="">No specific assignment</option>
                  {assignments.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.job_title} (Tester: {a.tester_id})</option>
                  ))}
                </select>
              </div>

              {[
                { key: 'communication_score', label: 'Communication' },
                { key: 'bug_quality_score', label: 'Bug Quality' },
                { key: 'detail_score', label: 'Detail Level' },
                { key: 'reliability_score', label: 'Reliability' },
                { key: 'speed_score', label: 'Speed' },
              ].map((cat) => (
                <div key={cat.key}>
                  <label className="text-xs text-slate-400 mb-1.5 block">{cat.label}</label>
                  {scoreStars((newRating as any)[cat.key], (v: number) => setNewRating({ ...newRating, [cat.key]: v }), false)}
                </div>
              ))}

              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Admin Notes</label>
                <textarea value={newRating.admin_notes} onChange={(e) => setNewRating({ ...newRating, admin_notes: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 resize-none" rows={2} />
              </div>
            </div>
            <div className="p-5 border-t border-[rgba(255,255,255,0.08)] flex justify-end gap-3">
              <button onClick={() => setCreateOpen(false)} className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-white cursor-pointer whitespace-nowrap">Cancel</button>
              <button onClick={handleCreate} disabled={creating || !newRating.tester_id}
                className="px-4 py-2.5 bg-[#06B6D4] hover:bg-[#0891B2] disabled:opacity-40 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap flex items-center gap-2">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}