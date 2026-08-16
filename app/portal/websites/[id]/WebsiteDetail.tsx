'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from '@/components/motion';
import { getWebsiteStatusDef, getWebsiteTypeDef } from '@/lib/website-definitions';
import { CDD_PHASES, getPhaseIndex } from '@/lib/project-definitions';
import {
  ArrowLeft, Globe, ExternalLink, Monitor, Calendar, Building2,
  Layers, FileText, MessageSquare, Target, Users, Check, ChevronRight,
  Shield, Wrench, LifeBuoy, Clock, TrendingUp, Rocket, Image,
} from 'lucide-react';
import Link from 'next/link';
import PortalShell from '../../PortalShell';

interface Website {
  id: string;
  name: string;
  description?: string | null;
  primary_domain?: string | null;
  status: string;
  website_type: string;
  preview_image?: string | null;
  staging_url?: string | null;
  production_url?: string | null;
  client_staging_access?: boolean;
  client_production_access?: boolean;
  featured?: boolean;
  launch_target_date?: string | null;
  live_date?: string | null;
  hosting_plan?: string | null;
  support_plan?: string | null;
  ssl_status?: string | null;
  maintenance_status?: string;
  project_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface Project {
  id: string;
  name: string;
  current_phase?: string | null;
  progress?: number | null;
  status?: string;
  client_facing_summary?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  project_lead?: string | null;
  assigned_staff?: string[] | null;
}

interface StaffProfile {
  id: string;
  full_name: string;
  role: string;
}

interface UpdateItem {
  id: string;
  title?: string;
  summary?: string;
  update_type?: string;
  published_at?: string | null;
}

interface ApprovalItem {
  id: string;
  title: string;
  approval_type: string;
  status: string;
  due_date?: string | null;
  submitted_at?: string | null;
}

interface FileItem {
  id: string;
  name: string;
  file_size: number;
  file_type: string;
  created_at: string;
}

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function WebsiteDetail({ websiteId }: { websiteId: string }) {
  const [website, setWebsite] = useState<Website | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [staffProfiles, setStaffProfiles] = useState<Record<string, StaffProfile>>({});
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { key: 'overview', label: 'Overview', icon: Monitor },
    { key: 'environments', label: 'Environments', icon: Globe },
    { key: 'updates', label: 'Updates', icon: Rocket, count: updates.length },
    { key: 'approvals', label: 'Approvals', icon: Check, count: approvals.length },
    { key: 'files', label: 'Files', icon: FileText, count: files.length },
    { key: 'support', label: 'Support', icon: LifeBuoy },
  ];

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || cancelled) { setError('Session expired'); setLoading(false); return; }

        const { data: clientData } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (!clientData || cancelled) { setError('Access denied'); setLoading(false); return; }

        const { data: webData, error: webErr } = await supabase
          .from('client_websites')
          .select('*')
          .eq('id', websiteId)
          .eq('client_id', clientData.id)
          .eq('client_visible', true)
          .maybeSingle();

        if (webErr || !webData || cancelled) {
          setError('Website not found or you do not have access.');
          setLoading(false);
          return;
        }

        const site = webData as Website;
        setWebsite(site);

        if (site.project_id) {
          const { data: projData } = await supabase
            .from('projects')
            .select('*')
            .eq('id', site.project_id)
            .maybeSingle();

          if (projData && !cancelled) {
            const p = projData as Project;
            setProject(p);

            const [updatesRes, approvalsRes, filesRes] = await Promise.all([
              supabase.from('project_updates').select('id, title, summary, update_type, published_at').eq('project_id', p.id).eq('client_visible', true).order('published_at', { ascending: false }).limit(10),
              supabase.from('client_approvals').select('id, title, approval_type, status, due_date, submitted_at').eq('project_id', p.id).in('status', ['awaiting_client', 'viewed', 'changes_requested', 'approved']).order('created_at', { ascending: false }).limit(8),
              supabase.from('project_files').select('id, name, file_size, file_type, created_at').eq('project_id', p.id).eq('visibility', 'client').order('created_at', { ascending: false }).limit(8),
            ]);

            if (!cancelled) {
              if (updatesRes.data) setUpdates(updatesRes.data as UpdateItem[]);
              if (approvalsRes.data) setApprovals(approvalsRes.data as ApprovalItem[]);
              if (filesRes.data) setFiles(filesRes.data as FileItem[]);
            }

            const staffIds = new Set<string>();
            if (p.project_lead) staffIds.add(p.project_lead);
            if (p.assigned_staff) p.assigned_staff.forEach(id => staffIds.add(id));
            if (staffIds.size > 0) {
              const { data: staffData } = await supabase
                .from('staff_profiles')
                .select('id, full_name, role')
                .in('id', Array.from(staffIds));
              if (staffData && !cancelled) {
                const map: Record<string, StaffProfile> = {};
                for (const s of staffData) map[s.id] = s;
                setStaffProfiles(map);
              }
            }
          }
        }

        setLoading(false);
      } catch {
        if (!cancelled) { setError('An error occurred'); setLoading(false); }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [websiteId]);

  if (loading) {
    return (
      <PortalShell>
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
        </div>
      </PortalShell>
    );
  }

  if (error || !website) {
    return (
      <PortalShell>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-500/10 mb-4">
            <Globe className="h-7 w-7 text-slate-500" />
          </div>
          <p className="text-sm text-slate-400 font-medium">{error || 'Website not found'}</p>
          <Link href="/portal/websites" className="mt-3 text-sm text-[#22D3EE] hover:text-[#67E8F9] transition-colors">
            Back to My Websites
          </Link>
        </div>
      </PortalShell>
    );
  }

  const statusDef = getWebsiteStatusDef(website.status);
  const typeDef = getWebsiteTypeDef(website.website_type);
  const launchDate = formatDate(website.launch_target_date);
  const liveDate = formatDate(website.live_date);
  const leadProfile = project?.project_lead ? staffProfiles[project.project_lead] : null;

  return (
    <PortalShell>
      <div className="mx-auto max-w-[1200px] space-y-6">
        <div>
          <Link href="/portal/websites" className="flex items-center gap-2 text-sm text-slate-400 hover:text-[#22D3EE] transition-colors cursor-pointer mb-3">
            <ArrowLeft className="w-4 h-4" /> Back to My Websites
          </Link>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-white">{website.name}</h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {website.primary_domain || 'No domain set'}
                {project && <span className="ml-2">· {project.name}</span>}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{ backgroundColor: `${statusDef.color}15`, color: statusDef.color, border: `1px solid ${statusDef.color}30` }}>
              {statusDef.label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {website.preview_image && (
              <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#1E293B] overflow-hidden">
                <img src={website.preview_image} alt={website.name}
                  className="w-full h-48 sm:h-64 object-cover object-top"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}

            <div className="flex items-center gap-1 bg-white/5 border border-[rgba(255,255,255,0.06)] rounded-2xl p-1.5 overflow-x-auto">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${isActive ? 'bg-[#06B6D4] text-white' : 'text-slate-400 hover:text-white'}`}>
                    <Icon className="w-4 h-4" /> {tab.label}
                    {(tab.count ?? 0) > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-400'}`}>{tab.count}</span>
                    )}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>

                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
                      <h3 className="text-lg font-bold text-white mb-3">About this website</h3>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        {website.description || project?.client_facing_summary || 'No description provided.'}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-5">
                        <span className="text-[10px] px-2.5 py-1.5 rounded-lg bg-white/5 text-slate-400">{typeDef.label}</span>
                        {website.hosting_plan && <span className="text-[10px] px-2.5 py-1.5 rounded-lg bg-white/5 text-slate-400">{website.hosting_plan}</span>}
                        {website.support_plan && <span className="text-[10px] px-2.5 py-1.5 rounded-lg bg-white/5 text-slate-400">{website.support_plan}</span>}
                      </div>
                    </div>

                    {project && (
                      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-white">Linked Project</h3>
                          <Link href={`/portal/projects/${project.id}`}
                            className="text-xs text-[#22D3EE] hover:text-[#67E8F9] transition-colors flex items-center gap-1 cursor-pointer">
                            View Project <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-[#06B6D4]/10 flex items-center justify-center">
                            <Layers className="w-6 h-6 text-[#22D3EE]" />
                          </div>
                          <div>
                            <p className="text-base font-bold text-white">{project.name}</p>
                            <p className="text-xs text-slate-400">
                              {(project.status || '').replace(/_/g, ' ')}
                              {project.current_phase && <span className="ml-1.5">· {CDD_PHASES.find(p => p.value === project.current_phase)?.label || project.current_phase}</span>}
                            </p>
                          </div>
                        </div>
                        {project.progress !== undefined && project.progress !== null && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="text-slate-500">Progress</span>
                              <span className="font-semibold text-slate-300">{project.progress}%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                              <div className="h-full rounded-full bg-gradient-to-r from-[#06B6D4] to-[#67E8F9]" style={{ width: `${project.progress}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'environments' && (
                  <div className="space-y-4">
                    <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
                      <h3 className="text-lg font-bold text-white mb-5">Environments</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {website.client_staging_access && website.staging_url ? (
                          <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.03] p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                <Wrench className="w-4 h-4 text-amber-400" />
                              </div>
                              <span className="text-sm font-semibold text-white">Staging</span>
                            </div>
                            <p className="text-xs text-slate-400 mb-3">Preview unfinished content — work in progress.</p>
                            <a href={website.staging_url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl text-xs font-semibold hover:bg-amber-500/20 transition-colors cursor-pointer whitespace-nowrap">
                              <ExternalLink className="w-3.5 h-3.5" /> Open Staging
                            </a>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-white/[0.02] p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                <Wrench className="w-4 h-4 text-slate-500" />
                              </div>
                              <span className="text-sm font-semibold text-white">Staging</span>
                            </div>
                            <p className="text-xs text-slate-500">Staging preview is being prepared by the team.</p>
                          </div>
                        )}

                        {website.status === 'live' && website.production_url ? (
                          <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <Globe className="w-4 h-4 text-emerald-400" />
                              </div>
                              <span className="text-sm font-semibold text-white">Production</span>
                            </div>
                            <p className="text-xs text-slate-400 mb-3">Your live website is online.</p>
                            <a href={website.production_url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-semibold hover:bg-emerald-500/20 transition-colors cursor-pointer whitespace-nowrap">
                              <ExternalLink className="w-3.5 h-3.5" /> Visit Live Website
                            </a>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-white/[0.02] p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                <Globe className="w-4 h-4 text-slate-500" />
                              </div>
                              <span className="text-sm font-semibold text-white">Production</span>
                            </div>
                            <p className="text-xs text-slate-500">The live website will be available after launch.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'updates' && (
                  <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
                    {updates.length > 0 ? (
                      <div className="divide-y divide-[rgba(255,255,255,0.04)]">
                        {updates.map(u => (
                          <div key={u.id} className="p-5 hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center shrink-0 mt-0.5">
                                <Rocket className="w-4 h-4 text-[#8B5CF6]" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-white">{u.title || 'Project Update'}</p>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-500 capitalize">{u.update_type || 'general'}</span>
                                </div>
                                <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{u.summary}</p>
                                {u.published_at && <p className="text-[10px] text-slate-500 mt-2">{formatDate(u.published_at)}</p>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <Rocket className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                        <p className="text-slate-400 font-medium">No updates yet</p>
                        <p className="text-xs text-slate-500 mt-1">Updates will appear here once the team shares progress.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'approvals' && (
                  <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
                    {approvals.length > 0 ? (
                      <div className="divide-y divide-[rgba(255,255,255,0.04)]">
                        {approvals.map(a => (
                          <Link key={a.id} href={`/portal/approvals/${a.id}`}
                            className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer">
                            <div className="flex items-center gap-4">
                              <Target className="w-5 h-5 text-slate-400" />
                              <div>
                                <p className="font-medium text-white">{a.title}</p>
                                <p className="text-xs text-slate-400 capitalize">{a.approval_type.replace(/_/g, ' ')}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-[10px] px-2 py-0.5 rounded-lg font-medium capitalize ${
                                a.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-purple-500/10 text-purple-400'
                              }`}>{a.status.replace(/_/g, ' ')}</span>
                              <ChevronRight className="w-4 h-4 text-slate-500" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <Check className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                        <p className="text-slate-400 font-medium">No approvals pending</p>
                        <p className="text-xs text-slate-500 mt-1">Nothing requires your review right now.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'files' && (
                  <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
                    {files.length > 0 ? (
                      <div className="divide-y divide-[rgba(255,255,255,0.04)]">
                        {files.map(f => (
                          <div key={f.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-[#06B6D4]" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{f.name}</p>
                                <p className="text-xs text-slate-400">{f.file_type} · {f.created_at ? new Date(f.created_at).toLocaleDateString('en-GB') : ''}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                        <p className="text-slate-400 font-medium">No files shared</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'support' && (
                  <div className="space-y-4">
                    <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
                      <h3 className="text-lg font-bold text-white mb-4">Support Information</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-white/[0.02] p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-semibold text-slate-300">Hosting Plan</span>
                          </div>
                          <p className="text-sm text-white">{website.hosting_plan || 'Information not available'}</p>
                        </div>
                        <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-white/[0.02] p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <LifeBuoy className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-semibold text-slate-300">Support Plan</span>
                          </div>
                          <p className="text-sm text-white">{website.support_plan || 'Information not available'}</p>
                        </div>
                      </div>
                      <div className="mt-5 pt-5 border-t border-[rgba(255,255,255,0.06)]">
                        <Link href="/support"
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#22D3EE] text-[#071221] rounded-xl text-sm font-bold hover:bg-[#67E8F9] transition-colors cursor-pointer whitespace-nowrap">
                          <LifeBuoy className="w-4 h-4" /> Contact Support
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

          <div className="space-y-6">
            <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Website Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-400">Type</p>
                  <p className="text-sm font-medium text-white mt-0.5">{typeDef.label}</p>
                </div>
                {website.primary_domain && (
                  <div>
                    <p className="text-xs text-slate-400">Domain</p>
                    <p className="text-sm font-medium text-white mt-0.5">{website.primary_domain}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-400">Status</p>
                  <p className="text-sm font-medium mt-0.5" style={{ color: statusDef.color }}>{statusDef.label}</p>
                </div>
                {launchDate && (
                  <div>
                    <p className="text-xs text-slate-400">Launch Target</p>
                    <p className="text-sm font-medium text-white mt-0.5">{launchDate}</p>
                  </div>
                )}
                {liveDate && (
                  <div>
                    <p className="text-xs text-slate-400">Live Since</p>
                    <p className="text-sm font-medium text-white mt-0.5">{liveDate}</p>
                  </div>
                )}
                {website.ssl_status && (
                  <div>
                    <p className="text-xs text-slate-400">SSL Status</p>
                    <p className="text-sm font-medium text-white mt-0.5 capitalize">{website.ssl_status}</p>
                  </div>
                )}
                {website.maintenance_status && website.maintenance_status !== 'none' && (
                  <div>
                    <p className="text-xs text-slate-400">Maintenance</p>
                    <p className="text-sm font-medium text-amber-400 mt-0.5 capitalize">{website.maintenance_status.replace(/_/g, ' ')}</p>
                  </div>
                )}
              </div>
            </div>

            {project && leadProfile && (
              <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Project Lead</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center text-sm font-bold text-[#67E8F9]">
                    {leadProfile.full_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{leadProfile.full_name}</p>
                    <p className="text-xs text-slate-400 capitalize">{leadProfile.role?.replace(/_/g, ' ') || 'Team member'}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {website.client_staging_access && website.staging_url && (
                  <a href={website.staging_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] text-sm font-medium text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer">
                    <ExternalLink className="w-4 h-4" /> Open Staging Website
                  </a>
                )}
                {website.status === 'live' && website.production_url && (
                  <a href={website.production_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] text-sm font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer">
                    <Globe className="w-4 h-4" /> Visit Live Website
                  </a>
                )}
                {project && (
                  <Link href={`/portal/projects/${project.id}`}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] text-sm text-slate-300 hover:bg-white/[0.03] transition-all cursor-pointer">
                    <Layers className="w-4 h-4" /> View Project
                  </Link>
                )}
                <Link href="/support"
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] text-sm text-slate-300 hover:bg-white/[0.03] transition-all cursor-pointer">
                  <LifeBuoy className="w-4 h-4" /> Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}