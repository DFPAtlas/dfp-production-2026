'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AdminShell from '@/components/admin/AdminShell';
import { useRouter } from 'next/navigation';
import {
  Search, Filter, RefreshCw, UserCheck, UserX, Eye, ChevronDown,
  FileText, Users, Zap, ChevronDown as ChevronDownIcon,
  MapPin, MonitorSmartphone, Bug, Clock, MessageSquare,
} from 'lucide-react';

interface TesterApplication {
  id: string;
  application_reference: string;
  legal_name: string | null;
  display_name: string | null;
  email: string | null;
  mobile: string | null;
  town_city: string | null;
  county: string | null;
  country: string | null;
  experience_level: string | null;
  devices: string[] | null;
  browsers: string[] | null;
  testing_activities: string[] | null;
  tester_strengths: string[] | null;
  testing_interests: string[] | null;
  accessibility_interest: string | null;
  project_conflict_status: string | null;
  project_conflict_details: string | null;
  availability_hours: string | null;
  availability_days: string[] | null;
  motivation: string | null;
  practical_bug_report: any;
  status: string;
  admin_notes: string | null;
  matching_tags: any;
  submitted_at: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  submitted: { label: 'Submitted', color: '#38BDF8', bg: 'bg-sky-400/10' },
  under_review: { label: 'Under Review', color: '#A78BFA', bg: 'bg-violet-400/10' },
  accepted: { label: 'Accepted', color: '#34D399', bg: 'bg-emerald-400/10' },
  rejected: { label: 'Rejected', color: '#F87171', bg: 'bg-red-400/10' },
  onboarding: { label: 'Onboarding', color: '#FB923C', bg: 'bg-orange-400/10' },
  active: { label: 'Active', color: '#2DD4BF', bg: 'bg-teal-400/10' },
  inactive: { label: 'Inactive', color: '#94A3B8', bg: 'bg-slate-400/10' },
};

export default function AdminTesterApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<TesterApplication[]>([]);
  const [filteredApps, setFilteredApps] = useState<TesterApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [appNote, setAppNote] = useState<Record<string, string>>({});
  const [selectedApp, setSelectedApp] = useState<TesterApplication | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data } = await supabase
      .from('uat_tester_applications')
      .select('*')
      .order('created_at', { ascending: false });

    setApplications(data || []);
    setFilteredApps(data || []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    let filtered = applications;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((a) =>
        (a.legal_name && a.legal_name.toLowerCase().includes(q)) ||
        (a.email && a.email.toLowerCase().includes(q)) ||
        (a.application_reference && a.application_reference.toLowerCase().includes(q)) ||
        (a.town_city && a.town_city.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== 'all') filtered = filtered.filter((a) => a.status === statusFilter);
    setFilteredApps(filtered);
  }, [searchQuery, statusFilter, applications]);

  const handleStatus = async (app: TesterApplication, newStatus: string) => {
    const noteVal = appNote[app.id] || '';
    await supabase.from('uat_tester_applications').update({
      status: newStatus,
      admin_notes: noteVal || app.admin_notes,
      updated_at: new Date().toISOString(),
    }).eq('id', app.id);

    setAppNote((prev) => { const n = { ...prev }; delete n[app.id]; return n; });
    fetchData();
  };

  const getConflictBadge = (app: TesterApplication) => {
    if (app.project_conflict_status === 'Yes') {
      return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-400/10 text-red-400">Conflict</span>;
    }
    if (app.project_conflict_status === 'Unsure') {
      return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-400/10 text-amber-400">Maybe Conflict</span>;
    }
    return null;
  };

  const getMatchingTags = (app: TesterApplication): string[] => {
    if (Array.isArray(app.matching_tags)) return app.matching_tags;
    return [];
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

  const statusCounts: Record<string, number> = {};
  applications.forEach((a) => { statusCounts[a.status] = (statusCounts[a.status] || 0) + 1; });

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => router.push('/admin/uat')} className="text-sm text-slate-400 hover:text-[#06B6D4] transition cursor-pointer flex items-center gap-1">
              <i className="ri-arrow-left-line"></i> UAT Hub
            </button>
          </div>
          <h1 className="text-2xl font-bold text-white">Tester Applications</h1>
          <p className="text-sm text-slate-400 mt-0.5">Review new tester registration applications from the public UAT apply form</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
              className={`rounded-xl p-3 text-left transition-all cursor-pointer border ${
                statusFilter === key
                  ? 'border-[#06B6D4]/30 bg-[#06B6D4]/5'
                  : 'border-[rgba(255,255,255,0.06)] bg-white/[0.02] hover:border-[rgba(255,255,255,0.12)]'
              }`}
            >
              <p className="text-2xl font-bold text-white">{statusCounts[key] || 0}</p>
              <p className="text-xs text-slate-400 mt-1" style={{ color: cfg.color }}>{cfg.label}</p>
            </button>
          ))}
        </div>

        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" placeholder="Search by name, email, reference, or location..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-9 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
                  <option value="all">All Status</option>
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
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
            {filteredApps.map((app) => {
              const sc = STATUS_CONFIG[app.status] || STATUS_CONFIG.submitted;
              const isExpanded = expandedId === app.id;
              const tags = getMatchingTags(app);

              return (
                <div key={app.id} className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden hover:border-[#06B6D4]/10 transition-all">
                  <div className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-sm font-semibold text-white">{app.legal_name || 'Unknown'}</p>
                          {app.display_name && <span className="text-xs text-slate-500">({app.display_name})</span>}
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-medium`} style={{ color: sc.color, backgroundColor: sc.bg }}>{sc.label}</span>
                          {getConflictBadge(app)}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1"><i className="ri-mail-line"></i> {app.email || '—'}</span>
                          {app.mobile && <span className="flex items-center gap-1"><i className="ri-phone-line"></i> {app.mobile}</span>}
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {[app.town_city, app.county, app.country].filter(Boolean).join(', ') || '—'}</span>
                          <span className="text-[10px] font-mono text-slate-600">{app.application_reference}</span>
                        </div>
                        {!isExpanded && (
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {app.experience_level && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/5 text-slate-400">{app.experience_level}</span>}
                            {app.availability_hours && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/5 text-slate-400 flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{app.availability_hours}</span>}
                            {Array.isArray(app.devices) && app.devices.length > 0 && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/5 text-slate-400">{app.devices.length} devices</span>}
                            {Array.isArray(app.testing_activities) && app.testing_activities.length > 0 && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/5 text-slate-400">{app.testing_activities.length} testing skills</span>}
                            {tags.slice(0, 4).map((tag) => (
                              <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#06B6D4]/5 text-[#06B6D4]">{tag}</span>
                            ))}
                          </div>
                        )}
                        {app.admin_notes && <p className="text-xs text-slate-500 mt-1 italic">Note: {app.admin_notes}</p>}
                        <p className="text-[10px] text-slate-600 mt-1">{new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => setExpandedId(isExpanded ? null : app.id)}
                          className="px-3 py-1.5 rounded-lg bg-white/5 border border-[rgba(255,255,255,0.06)] text-xs text-slate-400 hover:text-[#06B6D4] hover:border-[#06B6D4]/20 cursor-pointer whitespace-nowrap flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> {isExpanded ? 'Collapse' : 'Details'}
                        </button>

                        {(app.status === 'submitted' || app.status === 'under_review') && (
                          <div className="flex items-center gap-1">
                            {app.status === 'submitted' && (
                              <button onClick={() => handleStatus(app, 'under_review')} className="px-2 py-1.5 rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 text-xs cursor-pointer whitespace-nowrap">Review</button>
                            )}
                            <button onClick={() => handleStatus(app, 'accepted')} className="px-2 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs cursor-pointer whitespace-nowrap">
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleStatus(app, 'rejected')} className="px-2 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs cursor-pointer whitespace-nowrap">
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {app.status === 'accepted' && (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleStatus(app, 'onboarding')} className="px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 text-xs cursor-pointer whitespace-nowrap">Onboard</button>
                          </div>
                        )}

                        {app.status === 'onboarding' && (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleStatus(app, 'active')} className="px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 text-xs cursor-pointer whitespace-nowrap">Activate</button>
                          </div>
                        )}

                        {(app.status === 'accepted' || app.status === 'onboarding' || app.status === 'active') && (
                          <button onClick={() => {
                            const noteVal = appNote[app.id] || '';
                            handleStatus(app, 'rejected');
                          }} className="px-2 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs cursor-pointer whitespace-nowrap">Revoke</button>
                        )}
                      </div>
                    </div>

                    {(app.status === 'submitted' || app.status === 'under_review') && (
                      <div className="mt-3 flex items-center gap-2">
                        <input type="text" value={appNote[app.id] || ''} onChange={(e) => setAppNote({ ...appNote, [app.id]: e.target.value })}
                          placeholder="Add a note before changing status..."
                          className="flex-1 px-3 py-1.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 transition" />
                      </div>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="border-t border-[rgba(255,255,255,0.06)] p-5 bg-white/[0.01]">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <DetailSection title="Personal Info" icon="ri-user-line">
                          <DetailRow label="Legal Name" value={app.legal_name} />
                          <DetailRow label="Display Name" value={app.display_name} />
                          <DetailRow label="Email" value={app.email} />
                          <DetailRow label="Mobile" value={app.mobile} />
                          <DetailRow label="Location" value={[app.town_city, app.county, app.country, 'United Kingdom'].filter(Boolean).join(', ')} />
                        </DetailSection>

                        <DetailSection title="Experience" icon="ri-award-line">
                          <DetailRow label="Level" value={app.experience_level} />
                          <DetailRow label="Industries" value={Array.isArray(app.matching_tags) ? app.matching_tags.filter((t: string) => t.startsWith('industry:')).map((t: string) => t.replace('industry:', '')).join(', ') : '—'} />
                          <DetailRow label="Availability" value={app.availability_hours} />
                          <DetailRow label="Days" value={Array.isArray(app.availability_days) ? app.availability_days.join(', ') : '—'} />
                        </DetailSection>

                        <DetailSection title="Devices" icon="ri-smartphone-line">
                          <DetailRow label="Devices" value={Array.isArray(app.devices) ? app.devices.join(', ') : '—'} />
                          <DetailRow label="Browsers" value={Array.isArray(app.browsers) ? app.browsers.join(', ') : '—'} />
                        </DetailSection>

                        <DetailSection title="Testing" icon="ri-bug-line">
                          <DetailRow label="Activities" value={Array.isArray(app.testing_activities) ? app.testing_activities.join(', ') : '—'} />
                          <DetailRow label="Strengths" value={Array.isArray(app.tester_strengths) ? app.tester_strengths.join(', ') : '—'} />
                          <DetailRow label="Interests" value={Array.isArray(app.testing_interests) ? app.testing_interests.join(', ') : '—'} />
                          <DetailRow label="Accessibility" value={app.accessibility_interest} />
                        </DetailSection>

                        <DetailSection title="Conflict Check" icon="ri-alert-line">
                          <DetailRow label="Conflict?" value={app.project_conflict_status} />
                          {app.project_conflict_details && <DetailRow label="Details" value={app.project_conflict_details} />}
                        </DetailSection>

                        {app.practical_bug_report && (
                          <DetailSection title="Bug Report" icon="ri-file-list-3-line">
                            <DetailRow label="Title" value={app.practical_bug_report.bugTitle} />
                            <DetailRow label="Steps" value={app.practical_bug_report.stepsToReproduce} />
                            <DetailRow label="Expected" value={app.practical_bug_report.expectedResult} />
                            <DetailRow label="Actual" value={app.practical_bug_report.actualResult} />
                          </DetailSection>
                        )}

                        {app.motivation && (
                          <div className="md:col-span-2 lg:col-span-3">
                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Motivation</h4>
                            <p className="text-sm text-slate-300 bg-white/[0.02] rounded-lg p-3">{app.motivation}</p>
                          </div>
                        )}

                        {tags.length > 0 && (
                          <div className="md:col-span-2 lg:col-span-3">
                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Zap className="w-3 h-3 text-[#06B6D4]" /> Matching Tags</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {tags.map((tag) => (
                                <span key={tag} className="px-2 py-1 rounded-lg text-[11px] font-medium bg-[#06B6D4]/5 text-[#06B6D4] border border-[#06B6D4]/10">{tag}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredApps.length === 0 && (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No tester applications found</p>
              <p className="text-sm text-slate-500 mt-1">{searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Applications will appear here when testers submit the UAT apply form'}</p>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

function DetailSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <i className={`${icon} text-sm`}></i> {title}
      </h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-slate-500 shrink-0 min-w-[80px]">{label}:</span>
      <span className="text-slate-200 break-words">{value || '—'}</span>
    </div>
  );
}