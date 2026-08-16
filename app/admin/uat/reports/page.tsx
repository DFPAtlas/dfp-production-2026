'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Search, RefreshCw, Eye, FileText, Plus, ChevronDown, X, Loader2, Download,
  TrendingUp, Bug, CheckCircle, AlertTriangle, Shield, Calendar, Users, Monitor,
} from 'lucide-react';
import AdminShell from '../../../../components/admin/AdminShell';



interface Report {
  id: string; project_id: string; job_id: string | null;
  title: string; summary: string | null;
  total_feedback: number; critical_count: number; high_count: number;
  medium_count: number; low_count: number; fixed_count: number; open_count: number;
  go_no_go_score: number | null; recommendation: string | null;
  generated_at: string;
  project_name?: string; job_title?: string;
  report_data: any;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [generateOpen, setGenerateOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<Report | null>(null);

  const [projects, setProjects] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [genForm, setGenForm] = useState({ type: 'project', project_id: '', job_id: '' });
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: repData } = await supabase.from('uat_reports').select('*').order('generated_at', { ascending: false });
    if (!repData) { setLoading(false); return; }

    const projectIds = [...new Set(repData.map((r: any) => r.project_id).filter(Boolean))];
    const jobIds = [...new Set(repData.map((r: any) => r.job_id).filter(Boolean))];

    const [{ data: projs }, { data: jbs }] = await Promise.all([
      supabase.from('uat_projects').select('id, name').in('id', projectIds),
      supabase.from('uat_jobs').select('id, title').in('id', jobIds),
    ]);

    const projMap: Record<string, string> = {};
    projs?.forEach((p: any) => { projMap[p.id] = p.name; });
    const jobMap: Record<string, string> = {};
    jbs?.forEach((j: any) => { jobMap[j.id] = j.title; });

    const merged = repData.map((r: any) => ({
      ...r,
      project_name: projMap[r.project_id] || null,
      job_title: r.job_id ? jobMap[r.job_id] : null,
    }));

    setReports(merged);
    setFilteredReports(merged);
    setLoading(false);
  };

  useEffect(() => {
    let filtered = reports;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((r) =>
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.project_name && r.project_name.toLowerCase().includes(q)) ||
        (r.job_title && r.job_title.toLowerCase().includes(q))
      );
    }
    setFilteredReports(filtered);
  }, [searchQuery, reports]);

  const openGenerate = async () => {
    const [{ data: projs }, { data: jbs }] = await Promise.all([
      supabase.from('uat_projects').select('id, name').order('name'),
      supabase.from('uat_jobs').select('id, title, project_id').order('created_at', { ascending: false }),
    ]);
    setProjects(projs || []);
    setJobs(jbs || []);
    setGenForm({ type: 'project', project_id: '', job_id: '' });
    setGenerateOpen(true);
  };

  const handleGenerate = async () => {
    setGenerating(true);

    let feedbackQuery = supabase.from('uat_feedback').select('*');
    let projectId = genForm.project_id;
    let jobId: string | null = null;
    let projectName = '';
    let jobTitle: string | null = null;
    const testPeriod = '';

    if (genForm.type === 'project') {
      feedbackQuery = feedbackQuery.eq('project_id', genForm.project_id);
      projectId = genForm.project_id;
      const proj = projects.find((p) => p.id === genForm.project_id);
      projectName = proj?.name || 'Unknown';
    } else {
      feedbackQuery = feedbackQuery.eq('job_id', genForm.job_id);
      jobId = genForm.job_id;
      const job = jobs.find((j) => j.id === genForm.job_id);
      jobTitle = job?.title || null;
      projectId = job?.project_id || '';
      const proj = projects.find((p) => p.id === job?.project_id);
      projectName = proj?.name || 'Unknown';
    }

    const { data: fbData } = await feedbackQuery;
    const feedbacks = fbData || [];

    const total = feedbacks.length;
    const critical = feedbacks.filter((f: any) => f.severity === 'critical').length;
    const high = feedbacks.filter((f: any) => f.severity === 'high').length;
    const medium = feedbacks.filter((f: any) => f.severity === 'medium').length;
    const low = feedbacks.filter((f: any) => f.severity === 'low').length;
    const fixed = feedbacks.filter((f: any) => f.status === 'fixed').length;
    const open = feedbacks.filter((f: any) => ['new', 'reviewing', 'accepted', 'retest_needed'].includes(f.status)).length;
    const accepted = feedbacks.filter((f: any) => f.status === 'accepted').length;
    const duplicate = feedbacks.filter((f: any) => f.status === 'duplicate').length;
    const rejected = feedbacks.filter((f: any) => f.status === 'rejected').length;

    const testerIds = [...new Set(feedbacks.map((f: any) => f.tester_id))];
    const devices = [...new Set(feedbacks.map((f: any) => f.device).filter(Boolean))];
    const browsers = [...new Set(feedbacks.map((f: any) => f.browser).filter(Boolean))];

    let testerNames: string[] = [];
    if (testerIds.length > 0) {
      const { data: testers } = await supabase.from('uat_testers').select('full_name').in('id', testerIds);
      testerNames = testers?.map((t: any) => t.full_name) || [];
    }

    const bugRatio = total > 0 ? Math.round((fixed / total) * 100) : 0;
    const criticalWeight = (total > 0) ? ((critical * 3 + high * 2 + medium * 1) / (total * 3)) * 100 : 100;
    const goNoGoScore = Math.max(0, Math.round(100 - criticalWeight - (total > 0 ? 0 : 50)));

    let recommendation = '';
    if (goNoGoScore >= 80) recommendation = 'GO — Ready for production release.';
    else if (goNoGoScore >= 60) recommendation = 'CONDITIONAL GO — Minor issues remain. Fix critical/high bugs before release.';
    else if (goNoGoScore >= 40) recommendation = 'NO-GO — Significant issues found. Additional testing required.';
    else recommendation = 'CRITICAL — Major issues. Do not release. Requires rework.';

    const reportTitle = genForm.type === 'project' ? `UAT Report: ${projectName}` : `UAT Report: ${jobTitle || 'Job'}`;

    const reportData = {
      project_name: projectName,
      job_title: jobTitle,
      testers: testerNames,
      devices_tested: devices,
      browsers_tested: browsers,
      total_feedback: total,
      critical, high, medium, low,
      fixed, open,
      accepted, duplicate, rejected,
      fix_rate: bugRatio,
      go_no_go_score: goNoGoScore,
      recommendation,
      generated_at: new Date().toISOString(),
    };

    await supabase.from('uat_reports').insert({
      project_id: projectId,
      job_id: jobId,
      title: reportTitle,
      summary: `UAT report for ${projectName}. ${total} feedback items found.`,
      total_feedback: total,
      critical_count: critical,
      high_count: high,
      medium_count: medium,
      low_count: low,
      fixed_count: fixed,
      open_count: open,
      go_no_go_score: goNoGoScore,
      recommendation,
      report_data: reportData,
    });

    await supabase.from('uat_audit_log').insert({
      action: 'Report generated',
      entity_type: 'uat_report',
      entity_id: projectId,
      new_value: { go_no_go_score: goNoGoScore, total_feedback: total },
    });

    setGenerating(false);
    setGenerateOpen(false);
    fetchData();
  };

  const handleExportCSV = (report: Report) => {
    const rd = report.report_data || {};
    const rows = [
      ['Metric', 'Value'],
      ['Project', rd.project_name || ''],
      ['Job', rd.job_title || ''],
      ['Testers', (rd.testers || []).join(', ')],
      ['Devices Tested', (rd.devices_tested || []).join(', ')],
      ['Browsers Tested', (rd.browsers_tested || []).join(', ')],
      ['Total Feedback', String(rd.total_feedback || 0)],
      ['Critical', String(rd.critical || 0)],
      ['High', String(rd.high || 0)],
      ['Medium', String(rd.medium || 0)],
      ['Low', String(rd.low || 0)],
      ['Fixed', String(rd.fixed || 0)],
      ['Open', String(rd.open || 0)],
      ['Accepted', String(rd.accepted || 0)],
      ['Duplicate', String(rd.duplicate || 0)],
      ['Rejected', String(rd.rejected || 0)],
      ['Fix Rate', rd.fix_rate != null ? `${rd.fix_rate}%` : ''],
      ['Go/No-Go Score', String(rd.go_no_go_score || '')],
      ['Recommendation', rd.recommendation || ''],
    ];

    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/[^a-z0-9]/gi, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openView = (report: Report) => {
    setSelected(report);
    setViewOpen(true);
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">UAT Reports</h1>
            <p className="text-sm text-slate-400 mt-0.5">Generate and manage final UAT testing reports</p>
          </div>
          <button onClick={openGenerate} className="px-4 py-2.5 bg-[#06B6D4] hover:bg-[#0891B2] rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap flex items-center gap-2 transition-colors">
            <Plus className="w-4 h-4" /> Generate Report
          </button>
        </div>

        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" placeholder="Search reports..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
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
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Title</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Project</th>
                  <th className="text-center text-xs font-medium text-slate-500 px-3 py-3">Total</th>
                  <th className="text-center text-xs font-medium text-slate-500 px-3 py-3">Critical</th>
                  <th className="text-center text-xs font-medium text-slate-500 px-3 py-3">Fixed</th>
                  <th className="text-center text-xs font-medium text-slate-500 px-3 py-3">Open</th>
                  <th className="text-center text-xs font-medium text-slate-500 px-3 py-3">GNG Score</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Generated</th>
                  <th className="text-right text-xs font-medium text-slate-500 px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((r) => {
                  const scoreColor = (r.go_no_go_score || 0) >= 80 ? '#10B981' : (r.go_no_go_score || 0) >= 60 ? '#F59E0B' : '#EF4444';
                  return (
                    <tr key={r.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-white max-w-xs truncate">{r.title}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-300">{r.project_name || '-'}</p>
                        {r.job_title && <p className="text-xs text-slate-500">{r.job_title}</p>}
                      </td>
                      <td className="px-3 py-4 text-center"><span className="text-sm text-white">{r.total_feedback}</span></td>
                      <td className="px-3 py-4 text-center">
                        <span className={`text-sm font-medium ${r.critical_count > 0 ? 'text-red-400' : 'text-slate-400'}`}>{r.critical_count}</span>
                      </td>
                      <td className="px-3 py-4 text-center"><span className="text-sm text-emerald-400">{r.fixed_count}</span></td>
                      <td className="px-3 py-4 text-center"><span className="text-sm text-amber-400">{r.open_count}</span></td>
                      <td className="px-3 py-4 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded-lg text-xs font-bold" style={{ color: scoreColor, backgroundColor: scoreColor + '15' }}>
                          {r.go_no_go_score}/100
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-400">{new Date(r.generated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => openView(r)} className="p-1.5 rounded-lg bg-white/5 border border-[rgba(255,255,255,0.06)] text-slate-400 hover:text-[#06B6D4] hover:border-[#06B6D4]/20 cursor-pointer" title="View">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleExportCSV(r)} className="p-1.5 rounded-lg bg-white/5 border border-[rgba(255,255,255,0.06)] text-slate-400 hover:text-emerald-400 hover:border-emerald-400/20 cursor-pointer" title="Export CSV">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredReports.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-slate-500/10 flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No Reports Yet</h3>
              <p className="text-sm text-slate-400 mb-6">Generate a UAT report for a project or job to get started.</p>
              <button onClick={openGenerate} className="px-5 py-2.5 bg-[#06B6D4] rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap">Generate Report</button>
            </div>
          )}
        </div>
      </div>

      {generateOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setGenerateOpen(false)}>
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Generate UAT Report</h2>
              <button onClick={() => setGenerateOpen(false)} className="text-slate-500 hover:text-white text-xl cursor-pointer">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Report Type</label>
                <div className="flex gap-2">
                  {['project', 'job'].map((t) => (
                    <button key={t} onClick={() => setGenForm({ ...genForm, type: t, project_id: '', job_id: '' })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap transition-colors capitalize ${genForm.type === t ? 'bg-[#06B6D4] text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              {genForm.type === 'project' ? (
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Project</label>
                  <select value={genForm.project_id} onChange={(e) => setGenForm({ ...genForm, project_id: e.target.value })}
                    className="w-full pl-3 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
                    <option value="">Select project...</option>
                    {projects.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Job</label>
                  <select value={genForm.job_id} onChange={(e) => setGenForm({ ...genForm, job_id: e.target.value })}
                    className="w-full pl-3 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
                    <option value="">Select job...</option>
                    {jobs.map((j: any) => (
                      <option key={j.id} value={j.id}>{j.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="p-5 border-t border-[rgba(255,255,255,0.08)] flex justify-end gap-3">
              <button onClick={() => setGenerateOpen(false)} className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-white cursor-pointer whitespace-nowrap">Cancel</button>
              <button onClick={handleGenerate} disabled={generating || (!genForm.project_id && !genForm.job_id)}
                className="px-4 py-2.5 bg-[#06B6D4] hover:bg-[#0891B2] disabled:opacity-40 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap flex items-center gap-2">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {viewOpen && selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setViewOpen(false)}>
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">{selected.title}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{selected.project_name}{selected.job_title ? ` — ${selected.job_title}` : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleExportCSV(selected)} className="p-2 rounded-lg bg-white/5 border border-[rgba(255,255,255,0.06)] text-slate-400 hover:text-emerald-400 cursor-pointer">
                  <Download className="w-4 h-4" />
                </button>
                <button onClick={() => setViewOpen(false)} className="text-slate-500 hover:text-white text-xl cursor-pointer">&times;</button>
              </div>
            </div>
            <div className="p-5 space-y-5">
              {(() => {
                const rd = selected.report_data || {};
                const scoreColor = (selected.go_no_go_score || 0) >= 80 ? '#10B981' : (selected.go_no_go_score || 0) >= 60 ? '#F59E0B' : '#EF4444';
                return (
                  <>
                    <div className="flex items-center gap-4 p-4 rounded-xl" style={{ backgroundColor: scoreColor + '10', border: '1px solid ' + scoreColor + '20' }}>
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: scoreColor + '20' }}>
                        <span className="text-xl font-bold" style={{ color: scoreColor }}>{selected.go_no_go_score}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Go/No-Go Score: {selected.go_no_go_score}/100</p>
                        <p className="text-xs mt-0.5" style={{ color: scoreColor }}>{selected.recommendation}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-3 text-center">
                        <p className="text-xs text-slate-500 mb-0.5 flex items-center justify-center gap-1"><Bug className="w-3 h-3" /> Total</p>
                        <p className="text-xl font-bold text-white">{selected.total_feedback}</p>
                      </div>
                      <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-3 text-center">
                        <p className="text-xs text-slate-500 mb-0.5 flex items-center justify-center gap-1"><AlertTriangle className="w-3 h-3 text-red-400" /> Critical</p>
                        <p className="text-xl font-bold text-red-400">{selected.critical_count}</p>
                      </div>
                      <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-3 text-center">
                        <p className="text-xs text-slate-500 mb-0.5 flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-400" /> Fixed</p>
                        <p className="text-xl font-bold text-emerald-400">{selected.fixed_count}</p>
                      </div>
                      <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-3 text-center">
                        <p className="text-xs text-slate-500 mb-0.5 flex items-center justify-center gap-1"><TrendingUp className="w-3 h-3 text-amber-400" /> Open</p>
                        <p className="text-xl font-bold text-amber-400">{selected.open_count}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: 'High', value: selected.high_count, color: '#F97316' },
                        { label: 'Medium', value: selected.medium_count, color: '#F59E0B' },
                        { label: 'Low', value: selected.low_count, color: '#6B7280' },
                        { label: 'Fix Rate', value: rd.fix_rate != null ? `${rd.fix_rate}%` : '-', color: '#10B981' },
                      ].map((item) => (
                        <div key={item.label} className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-3 text-center">
                          <p className="text-[10px] text-slate-500 mb-0.5">{item.label}</p>
                          <p className="text-base font-bold" style={{ color: item.color }}>{item.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Accepted', value: rd.accepted || 0, color: '#10B981' },
                        { label: 'Duplicate', value: rd.duplicate || 0, color: '#F59E0B' },
                        { label: 'Rejected', value: rd.rejected || 0, color: '#EF4444' },
                      ].map((item) => (
                        <div key={item.label} className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-3 text-center">
                          <p className="text-[10px] text-slate-500 mb-0.5">{item.label}</p>
                          <p className="text-base font-bold" style={{ color: item.color }}>{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {(rd.testers?.length > 0) && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wide flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Testers</p>
                        <div className="flex flex-wrap gap-1.5">
                          {rd.testers.map((name: string, i: number) => (
                            <span key={i} className="px-2.5 py-1 bg-[#06B6D4]/10 text-[#06B6D4] rounded-lg text-xs font-medium">{name}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      {(rd.devices_tested?.length > 0) && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wide flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5" /> Devices</p>
                          <div className="flex flex-wrap gap-1.5">
                            {rd.devices_tested.map((d: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-white/5 rounded-lg text-xs text-slate-400">{d}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {(rd.browsers_tested?.length > 0) && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wide">Browsers</p>
                          <div className="flex flex-wrap gap-1.5">
                            {rd.browsers_tested.map((b: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-white/5 rounded-lg text-xs text-slate-400">{b}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="p-5 border-t border-[rgba(255,255,255,0.08)] flex justify-end">
              <button onClick={() => setViewOpen(false)} className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-white cursor-pointer whitespace-nowrap">Close</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}