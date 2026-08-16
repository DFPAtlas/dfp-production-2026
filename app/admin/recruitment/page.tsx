'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from '@/components/motion';
import AdminShell from '@/components/admin/AdminShell';
import {
  useCareersVacancies, useCareerApplications, useCareersMetrics,
  vacancyStatusConfig, applicationStatusConfig,
  VACANCY_STATUSES, APPLICATION_STATUSES,
  employmentTypeConfig, workLocationTypeConfig,
} from '@/hooks/useCmsData';

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'ri-dashboard-line' },
  { key: 'vacancies', label: 'Vacancies', icon: 'ri-briefcase-line' },
  { key: 'applications', label: 'Applications', icon: 'ri-file-user-line' },
];

function getConfigEntry<K extends string, T>(config: Record<K, T>, key: string): T | undefined {
  return Object.prototype.hasOwnProperty.call(config, key) ? config[key as K] : undefined;
}

export default function RecruitmentPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { vacancies, loading: vacsLoading, refetch: refetchVacs } = useCareersVacancies();
  const { applications, loading: appsLoading, refetch: refetchApps } = useCareerApplications();
  const { metrics, loading: metricsLoading } = useCareersMetrics();

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Recruitment</h1>
          <p className="text-sm text-slate-400">Manage vacancies, applications, and the hiring pipeline.</p>
        </div>

        <div className="flex gap-1 mb-6 bg-[#1E293B] p-1 rounded-xl border border-[rgba(255,255,255,0.08)] overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
                activeTab === tab.key ? 'bg-[#0F172A] text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <i className={`${tab.icon} w-3.5 h-3.5 flex items-center justify-center`} />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {[
                  { label: 'Total Vacancies', value: metrics.totalVacancies, color: '#3B82F6' },
                  { label: 'Open Vacancies', value: metrics.openVacancies, color: '#10B981' },
                  { label: 'Total Applications', value: metrics.totalApplications, color: '#8B5CF6' },
                  { label: 'Submitted', value: metrics.submittedApps, color: '#06B6D4' },
                  { label: 'In Screening', value: metrics.screeningApps, color: '#F59E0B' },
                  { label: 'Hired', value: metrics.hired, color: '#EC4899' },
                ].map(s => (
                  <div key={s.label} className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                    <p className="text-xs text-slate-400 mb-1">{s.label}</p>
                    <p className="text-xl font-bold" style={{ color: s.color }}>{metricsLoading ? '-' : s.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-white mb-4">Recent Vacancies</h3>
                  {vacsLoading ? (
                    <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-8 bg-white/5 rounded-lg animate-pulse" />)}</div>
                  ) : vacancies.length === 0 ? (
                    <p className="text-sm text-slate-500 py-4 text-center">No vacancies yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {vacancies.slice(0, 5).map(v => {
                        const sc = getConfigEntry(vacancyStatusConfig, v.vacancy_status) || { label: v.vacancy_status, color: '#94A3B8' };
                        return (
                          <div key={v.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.03]">
                            <span className="text-sm text-white truncate">{v.title}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: `${sc.color}15`, color: sc.color }}>
                              {sc.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-white mb-4">Recent Applications</h3>
                  {appsLoading ? (
                    <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-8 bg-white/5 rounded-lg animate-pulse" />)}</div>
                  ) : applications.length === 0 ? (
                    <p className="text-sm text-slate-500 py-4 text-center">No applications yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {applications.slice(0, 5).map(a => {
                        const sc = getConfigEntry(applicationStatusConfig, a.application_status) || { label: a.application_status, color: '#94A3B8' };
                        return (
                          <div key={a.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.03]">
                            <div className="min-w-0">
                              <p className="text-sm text-white truncate">{a.candidate_name}</p>
                              <p className="text-[10px] text-slate-500 truncate">{a.candidate_email}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium shrink-0" style={{ backgroundColor: `${sc.color}15`, color: sc.color }}>
                              {sc.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'vacancies' && (
            <motion.div key="vacancies" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
                {vacsLoading ? (
                  <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin mx-auto" /></div>
                ) : vacancies.length === 0 ? (
                  <div className="p-12 text-center">
                    <i className="ri-briefcase-line w-10 h-10 text-slate-600 mx-auto mb-3 flex items-center justify-center" />
                    <p className="text-slate-400 text-sm">No vacancies. Create your first vacancy to start recruiting.</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[rgba(255,255,255,0.06)]">
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Title</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Ref</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Dept</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Type</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Location</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Status</th>
                        <th className="text-right px-5 py-3 text-xs font-medium text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vacancies.map(v => {
                        const sc = getConfigEntry(vacancyStatusConfig, v.vacancy_status) || { label: v.vacancy_status, color: '#94A3B8' };
                        return (
                          <tr key={v.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02]">
                            <td className="px-5 py-3 text-sm font-medium text-white">{v.title}</td>
                            <td className="px-5 py-3 text-xs text-slate-400 font-mono">{v.reference || '-'}</td>
                            <td className="px-5 py-3 text-xs text-slate-400">{v.department || '-'}</td>
                            <td className="px-5 py-3 text-xs text-slate-400">{getConfigEntry(employmentTypeConfig, v.employment_type)?.label || v.employment_type}</td>
                            <td className="px-5 py-3 text-xs text-slate-400">{getConfigEntry(workLocationTypeConfig, v.work_location_type)?.label || v.work_location_type}</td>
                            <td className="px-5 py-3">
                              <select
                                value={v.vacancy_status}
                                onChange={async (e) => {
                                  const { error } = await supabase.from('careers_vacancies').update({ vacancy_status: e.target.value, updated_at: new Date().toISOString() }).eq('id', v.id);
                                  if (error) showToast(error.message, 'error');
                                  else { showToast('Status updated', 'success'); refetchVacs(); }
                                }}
                                className="bg-[#0F172A] border border-[rgba(255,255,255,0.08)] rounded-lg px-2 py-1 text-xs cursor-pointer pr-8"
                                style={{ color: sc.color }}
                              >
                                {VACANCY_STATUSES.map(s => (
                                  <option key={s} value={s} style={{ color: (vacancyStatusConfig[s] || { color: '#94A3B8' }).color }}>{s}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-5 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <a href={`/careers/${v.slug}`} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer flex items-center justify-center">
                                  <i className="ri-external-link-line w-3.5 h-3.5 flex items-center justify-center" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'applications' && (
            <motion.div key="applications" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
                {appsLoading ? (
                  <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin mx-auto" /></div>
                ) : applications.length === 0 ? (
                  <div className="p-12 text-center">
                    <i className="ri-file-user-line w-10 h-10 text-slate-600 mx-auto mb-3 flex items-center justify-center" />
                    <p className="text-slate-400 text-sm">No applications yet. Applications submitted via the careers page appear here.</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[rgba(255,255,255,0.06)]">
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Candidate</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Email</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Location</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Eligibility</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Status</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Submitted</th>
                        <th className="text-right px-5 py-3 text-xs font-medium text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map(a => {
                        const sc = getConfigEntry(applicationStatusConfig, a.application_status) || { label: a.application_status, color: '#94A3B8' };
                        return (
                          <tr key={a.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02]">
                            <td className="px-5 py-3 text-sm font-medium text-white">{a.candidate_name}</td>
                            <td className="px-5 py-3 text-xs text-slate-400">{a.candidate_email}</td>
                            <td className="px-5 py-3 text-xs text-slate-400">{a.location || '-'}</td>
                            <td className="px-5 py-3 text-xs text-slate-400 max-w-[140px] truncate">{a.work_eligibility_response || '-'}</td>
                            <td className="px-5 py-3">
                              <select
                                value={a.application_status}
                                onChange={async (e) => {
                                  const { error } = await supabase.from('career_applications').update({ application_status: e.target.value, updated_at: new Date().toISOString() }).eq('id', a.id);
                                  if (error) showToast(error.message, 'error');
                                  else { showToast('Status updated', 'success'); refetchApps(); }
                                }}
                                className="bg-[#0F172A] border border-[rgba(255,255,255,0.08)] rounded-lg px-2 py-1 text-xs cursor-pointer pr-8"
                                style={{ color: sc.color }}
                              >
                                {APPLICATION_STATUSES.map(s => (
                                  <option key={s} value={s} style={{ color: (applicationStatusConfig[s] || { color: '#94A3B8' }).color }}>{s}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-5 py-3 text-xs text-slate-500">
                              {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString('en-GB') : '-'}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {a.portfolio_url && (
                                  <a href={a.portfolio_url} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer flex items-center justify-center">
                                    <i className="ri-link w-3.5 h-3.5 flex items-center justify-center" />
                                  </a>
                                )}
                                <a href={`mailto:${a.candidate_email}`} className="w-7 h-7 rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer flex items-center justify-center">
                                  <i className="ri-mail-line w-3.5 h-3.5 flex items-center justify-center" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl text-sm font-medium shadow-lg z-50 ${
                toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}
            >
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminShell>
  );
}
