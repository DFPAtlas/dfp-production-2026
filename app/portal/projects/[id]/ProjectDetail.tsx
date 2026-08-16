'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from '@/components/motion';
import {
  ArrowLeft, FolderKanban, Target, MessageSquare, FileText,
  DollarSign, Map, Calendar, Send, Loader2, CheckCircle, Clock,
  Eye, Download, ChevronRight, Building2, User, Mail, Phone, Globe,
  Users, Flag, Check, ExternalLink, Image, TrendingUp, Rocket,
  Monitor,
} from 'lucide-react';
import Link from 'next/link';
import PortalShell from '../../PortalShell';
import { CDD_PHASES, getPhaseIndex } from '@/lib/project-definitions';
import { getApprovalTypeDef, getApprovalStatusDef } from '@/lib/approval-definitions';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  client_facing_summary?: string | null;
  status: string;
  budget: number | null;
  progress: number | null;
  current_phase?: string | null;
  start_date: string | null;
  end_date: string | null;
  project_lead: string | null;
  assigned_staff?: string[] | null;
  client_id: string | null;
  staging_url?: string | null;
  live_url?: string | null;
  preview_image?: string | null;
}

interface ClientData {
  company_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
}

interface MilestoneData {
  id: string;
  name: string;
  title?: string;
  description: string | null;
  amount: number | null;
  status: string;
  due_date: string | null;
  client_visible?: boolean;
}

interface MessageData {
  id: string;
  sender_name: string;
  content: string;
  created_at: string;
  read: boolean;
}

interface FileData {
  id: string;
  name: string;
  display_name?: string;
  file_path: string;
  file_size: number;
  file_type: string;
  category: string;
  created_at: string;
  version?: number;
  file_status?: string;
  client_downloadable?: boolean;
}

interface InvoiceData {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  due_date: string | null;
}

interface RoadmapData {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
}

interface StaffProfile {
  id: string;
  full_name: string;
  role: string;
}

interface UpdateData {
  id: string;
  title?: string;
  summary?: string;
  update_type?: string;
  published_at?: string | null;
  created_at?: string;
}

export default function ProjectDetail({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [client, setClient] = useState<ClientData | null>(null);
  const [milestones, setMilestones] = useState<MilestoneData[]>([]);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [files, setFiles] = useState<FileData[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [roadmapItems, setRoadmapItems] = useState<RoadmapData[]>([]);
  const [staffProfiles, setStaffProfiles] = useState<Record<string, StaffProfile>>({});
  const [updates, setUpdates] = useState<UpdateData[]>([]);
  const [projectApprovals, setProjectApprovals] = useState<any[]>([]);
  const [linkedWebsite, setLinkedWebsite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const tabs = [
    { key: 'overview', label: 'Overview', icon: FolderKanban },
    { key: 'progress', label: 'CDD Progress', icon: TrendingUp },
    { key: 'milestones', label: 'Milestones', icon: Target, count: milestones.length },
    { key: 'updates', label: 'Updates', icon: Rocket, count: updates.length },
    { key: 'approvals', label: 'Approvals', icon: CheckCircle },
    { key: 'team', label: 'Team', icon: Users },
    { key: 'messages', label: 'Messages', icon: MessageSquare },
    { key: 'files', label: 'Files', icon: FileText, count: files.length },
    { key: 'invoices', label: 'Invoices', icon: DollarSign, count: invoices.length },
    { key: 'roadmap', label: 'Roadmap', icon: Map, count: roadmapItems.length },
  ];

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError('Session expired'); setLoading(false); return; }

      setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Client');
      setUserId(session.user.id);

      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle();

      if (projectError || !projectData) {
        setError('Project not found or you do not have access.');
        setLoading(false);
        return;
      }

      setProject(projectData as ProjectData);

      const [
        milestonesRes, messagesRes, filesRes, invoicesRes, roadmapRes, updatesRes, approvalsRes,
      ] = await Promise.all([
        supabase.from('milestones').select('*').eq('project_id', projectId).eq('client_visible', true).order('order_index'),
        supabase.from('project_messages').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
        supabase.from('project_files').select('*').eq('project_id', projectId).eq('visibility', 'client').order('created_at', { ascending: false }),
        supabase.from('invoices').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
        supabase.from('technology_roadmap').select('*').eq('project_id', projectId),
        supabase.from('project_updates').select('*').eq('project_id', projectId).eq('client_visible', true).order('published_at', { ascending: false }),
        supabase.from('client_approvals').select('*').eq('project_id', projectId).neq('status', 'draft').order('created_at', { ascending: false }),
      ]);

      if (milestonesRes.data) setMilestones(milestonesRes.data);
      if (messagesRes.data) setMessages(messagesRes.data);
      if (filesRes.data) setFiles(filesRes.data);
      if (invoicesRes.data) setInvoices(invoicesRes.data);
      if (roadmapRes.data) setRoadmapItems(roadmapRes.data);
      if (updatesRes.data) setUpdates(updatesRes.data);
      if (approvalsRes) setProjectApprovals(approvalsRes.data || []);

      const { data: websiteData } = await supabase
        .from('client_websites')
        .select('id, name, preview_image, status, staging_url, production_url, client_staging_access')
        .eq('project_id', projectId)
        .eq('client_visible', true)
        .limit(1)
        .maybeSingle();

      if (websiteData) setLinkedWebsite(websiteData);

      if (projectData.client_id) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('company_name, contact_name, email, phone, website')
          .eq('id', projectData.client_id)
          .maybeSingle();
        if (clientData) setClient(clientData);
      }

      const staffIds = new Set<string>();
      if (projectData.project_lead) staffIds.add(projectData.project_lead);
      if (projectData.assigned_staff) (projectData.assigned_staff as string[]).forEach(id => staffIds.add(id));

      if (staffIds.size > 0) {
        const { data: staffData } = await supabase
          .from('staff_profiles')
          .select('id, full_name, role')
          .in('id', Array.from(staffIds));
        if (staffData) {
          const map: Record<string, StaffProfile> = {};
          for (const s of staffData) map[s.id] = s;
          setStaffProfiles(map);
        }
      }

      setLoading(false);
    }
    init();
  }, [projectId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !project) return;
    setSending(true);

    const { data, error: sendError } = await supabase.from('project_messages').insert({
      project_id: projectId,
      sender_id: userId,
      sender_name: userName,
      content: newMessage.trim(),
      read: false,
      is_internal: false,
    }).select().single();

    if (!sendError && data) {
      setMessages(prev => [data as MessageData, ...prev]);
      setNewMessage('');
    }
    setSending(false);
  };

  if (loading) {
    return (
      <PortalShell>
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-3 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
        </div>
      </PortalShell>
    );
  }

  if (error || !project) {
    return (
      <PortalShell>
        <div className="text-center py-20">
          <FolderKanban className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">{error || 'Project not found'}</p>
          <Link href="/portal/projects" className="text-[#06B6D4] text-sm hover:underline mt-2 inline-block">Back to Projects</Link>
        </div>
      </PortalShell>
    );
  }

  const progress = project.progress || 0;
  const phaseValue = project.current_phase || 'discovery';
  const phaseIndex = getPhaseIndex(phaseValue);
  const phaseLabel = CDD_PHASES.find(p => p.value === phaseValue)?.label || phaseValue;
  const phaseTimelinePhases = CDD_PHASES.map(p => p.label);

  const leadProfile = project.project_lead ? staffProfiles[project.project_lead] : null;
  const teamIds = (project.assigned_staff || []) as string[];
  const teamMembers = teamIds.filter(id => id !== project.project_lead).map(id => staffProfiles[id]).filter(Boolean);

  return (
    <PortalShell>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link href="/portal/projects" className="flex items-center gap-2 text-sm text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer mb-3">
            <ArrowLeft className="w-4 h-4" /> Back to Projects
          </Link>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-white">{project.name}</h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {client?.company_name || 'Your Project'}
                {phaseLabel && <span className="ml-2 text-[#22D3EE]">· {phaseLabel}</span>}
              </p>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${
              project.status === 'active' ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20'
              : project.status === 'completed' ? 'bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/20'
              : project.status === 'on_hold' ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20'
              : 'bg-white/5 text-slate-400 border-[rgba(255,255,255,0.08)]'
            }`}>
              {(project.status || '').charAt(0).toUpperCase() + (project.status || '').slice(1).replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Progress', value: `${progress}%`, icon: Target, color: '#8B5CF6' },
            { label: 'Phase', value: phaseLabel, icon: TrendingUp, color: '#22D3EE' },
            { label: 'Start Date', value: project.start_date ? new Date(project.start_date).toLocaleDateString('en-GB') : '\u2014', icon: Calendar, color: '#06B6D4' },
            { label: 'Project Lead', value: leadProfile?.full_name || 'Assigned', icon: User, color: '#F59E0B' },
          ].map(stat => (
            <div key={stat.label} className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                <span className="text-xs text-slate-400 font-medium">{stat.label}</span>
              </div>
              <p className="text-xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-white/5 border border-[rgba(255,255,255,0.06)] rounded-2xl p-1.5 mb-6 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${isActive ? 'bg-[#06B6D4] text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
                <Icon className="w-4 h-4" /> {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-400'}`}>{tab.count}</span>
                )}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>

            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Project Overview</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {project.client_facing_summary || project.description || 'No description provided.'}
                    </p>

                    {(project.staging_url || project.live_url) && (
                      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                        {project.staging_url && (
                          <a href={project.staging_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-medium hover:bg-amber-500/20 transition-colors cursor-pointer">
                            <ExternalLink className="w-3.5 h-3.5" /> Staging
                          </a>
                        )}
                        {project.live_url && (
                          <a href={project.live_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-medium hover:bg-emerald-500/20 transition-colors cursor-pointer">
                            <Globe className="w-3.5 h-3.5" /> Live site
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {project.preview_image && (
                    <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
                      <img src={project.preview_image} alt={project.name}
                        className="w-full h-56 object-cover object-top"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                  )}

                  {linkedWebsite && (
                    <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">Website</h3>
                        <Link href={`/portal/websites/${linkedWebsite.id}`}
                          className="text-xs text-[#22D3EE] hover:text-[#67E8F9] transition-colors flex items-center gap-1 cursor-pointer">
                          View Details <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                      <div className="flex items-center gap-4">
                        {linkedWebsite.preview_image ? (
                          <img src={linkedWebsite.preview_image} alt={linkedWebsite.name}
                            className="w-16 h-12 rounded-lg object-cover object-top shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <div className="w-16 h-12 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center shrink-0">
                            <Monitor className="w-6 h-6 text-[#22D3EE]" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white truncate">{linkedWebsite.name}</p>
                          <p className="text-xs text-slate-400 capitalize">{linkedWebsite.status.replace(/_/g, ' ')}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {linkedWebsite.client_staging_access && linkedWebsite.staging_url && (
                          <a href={linkedWebsite.staging_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-medium hover:bg-amber-500/20 transition-colors cursor-pointer whitespace-nowrap">
                            <ExternalLink className="w-3.5 h-3.5" /> Staging
                          </a>
                        )}
                        {linkedWebsite.status === 'live' && linkedWebsite.production_url && (
                          <a href={linkedWebsite.production_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-medium hover:bg-emerald-500/20 transition-colors cursor-pointer whitespace-nowrap">
                            <Globe className="w-3.5 h-3.5" /> Visit Live
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Progress</h3>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8 }}
                          className="h-full rounded-full bg-gradient-to-r from-[#06B6D4] to-[#10B981]" />
                      </div>
                      <span className="text-lg font-bold text-white">{progress}%</span>
                    </div>
                  </div>

                  {client && (
                    <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
                      <h3 className="text-lg font-bold text-white mb-4">Company Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: 'Company', value: client.company_name, icon: Building2 },
                          { label: 'Contact', value: client.contact_name, icon: User },
                          { label: 'Email', value: client.email, icon: Mail },
                          { label: 'Phone', value: client.phone, icon: Phone },
                          { label: 'Website', value: client.website, icon: Globe },
                        ].map(item => (
                          <div key={item.label}>
                            <p className="text-xs text-slate-400 mb-0.5">{item.label}</p>
                            <div className="flex items-center gap-1.5">
                              <item.icon className="w-3.5 h-3.5 text-slate-500" />
                              <p className="text-sm font-medium text-slate-300">{item.value || '\u2014'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Timeline</h3>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center shrink-0">
                          <Calendar className="w-4 h-4 text-[#06B6D4]" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Start Date</p>
                          <p className="text-sm font-medium text-white">{project.start_date ? new Date(project.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Not set'}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 flex items-center justify-center shrink-0">
                          <Calendar className="w-4 h-4 text-[#10B981]" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Target Completion</p>
                          <p className="text-sm font-medium text-white">{project.end_date ? new Date(project.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Not set'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Recent Milestones</h3>
                    {milestones.length > 0 ? (
                      <div className="space-y-3">
                        {milestones.slice(0, 5).map(m => (
                          <div key={m.id} className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full shrink-0 ${m.status === 'completed' ? 'bg-[#10B981]' : m.status === 'in_progress' ? 'bg-[#F59E0B]' : m.status === 'awaiting_client' ? 'bg-[#8B5CF6]' : m.status === 'delayed' ? 'bg-[#EF4444]' : 'bg-white/20'}`} />
                            <div className="min-w-0">
                              <p className="text-sm text-slate-300 truncate">{m.name || m.title}</p>
                              <p className="text-xs text-slate-500">{(m.status || 'pending').replace(/_/g, ' ')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 text-center py-4">No milestones yet</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'progress' && (
              <div className="space-y-6">
                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-2">CDD Phase Timeline</h3>
                  <p className="text-sm text-slate-400 mb-6">Digital Footprint follows a structured six-phase delivery journey.</p>

                  <div className="overflow-x-auto pb-2">
                    <div className="flex min-w-[600px] items-start">
                      {phaseTimelinePhases.map((phase, index) => {
                        const complete = index < phaseIndex;
                        const current = index === phaseIndex;
                        return (
                          <div key={phase} className="flex flex-1 items-start last:flex-none">
                            <div className="flex w-16 shrink-0 flex-col items-center">
                              <div className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold ${
                                complete ? 'border-[#4ADE80] bg-[#4ADE80] text-[#071221]'
                                  : current ? 'border-[#22D3EE] bg-[#22D3EE] text-[#071221] shadow-[0_0_22px_rgba(34,211,238,0.28)]'
                                    : 'border-slate-500 bg-[#0D1929] text-slate-400'
                              }`}>
                                {complete ? <Check className="h-5 w-5" /> : index + 1}
                              </div>
                              <span className={`mt-2.5 text-xs font-medium ${current ? 'text-[#67E8F9]' : complete ? 'text-[#4ADE80]' : 'text-slate-500'}`}>{phase}</span>
                            </div>
                            {index < phaseTimelinePhases.length - 1 && (
                              <div className={`mt-4 h-0.5 flex-1 ${index < phaseIndex ? 'bg-[#4ADE80]' : 'bg-slate-700'}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Overall Progress</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-4 bg-white/10 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8 }}
                        className="h-full rounded-full bg-gradient-to-r from-[#06B6D4] to-[#10B981]" />
                    </div>
                    <span className="text-2xl font-bold text-white">{progress}%</span>
                  </div>
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-slate-400">Current Phase</p>
                      <p className="text-lg font-bold text-[#22D3EE] mt-0.5">{phaseLabel}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Start Date</p>
                      <p className="text-lg font-bold text-white mt-0.5">{project.start_date ? new Date(project.start_date).toLocaleDateString('en-GB') : '\u2014'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Target Date</p>
                      <p className="text-lg font-bold text-white mt-0.5">{project.end_date ? new Date(project.end_date).toLocaleDateString('en-GB') : '\u2014'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'milestones' && (
              <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
                {milestones.length > 0 ? (
                  <div className="divide-y divide-[rgba(255,255,255,0.04)]">
                    {milestones.map(m => {
                      const statusIcons: Record<string, typeof CheckCircle> = {
                        completed: CheckCircle,
                        in_progress: Clock,
                        awaiting_client: User,
                        delayed: Clock,
                        upcoming: Flag,
                      };
                      const SIcon = statusIcons[m.status] || Target;
                      const statusColors: Record<string, string> = {
                        completed: '#10B981',
                        in_progress: '#3B82F6',
                        awaiting_client: '#8B5CF6',
                        delayed: '#EF4444',
                        upcoming: '#6B7280',
                      };
                      const sColor = statusColors[m.status] || '#6B7280';
                      return (
                        <div key={m.id} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${sColor}15` }}>
                              <SIcon className="w-5 h-5" style={{ color: sColor }} />
                            </div>
                            <div>
                              <p className="font-medium text-white">{m.name || m.title}</p>
                              <p className="text-xs text-slate-400">
                                {m.description || ''}
                                {m.due_date ? `${m.description ? ' · ' : ''}Due ${new Date(m.due_date).toLocaleDateString('en-GB')}` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {m.amount ? <span className="text-sm font-semibold text-slate-300">£{Number(m.amount).toLocaleString()}</span> : null}
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium capitalize"
                              style={{ backgroundColor: `${sColor}15`, color: sColor }}>
                              {(m.status || 'pending').replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Target className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">No milestones yet</p>
                    <p className="text-xs text-slate-500 mt-1">Milestones will appear here once the team sets them up.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'approvals' && (
              <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
                {projectApprovals.length > 0 ? (
                  <div className="divide-y divide-[rgba(255,255,255,0.04)]">
                    {projectApprovals.map((a: any) => {
                      const typeDef = getApprovalTypeDef(a.approval_type);
                      const statusDef = getApprovalStatusDef(a.status);
                      return (
                        <Link key={a.id} href={`/portal/approvals/${a.id}`}
                          className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer">
                          <div className="flex items-center gap-4">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: statusDef.color }} />
                            <div>
                              <p className="font-medium text-white">{a.title}</p>
                              <p className="text-xs text-slate-400">
                                <span style={{ color: typeDef.color }}>{typeDef.label}</span>
                                <span className="mx-1.5 text-slate-600">·</span>
                                v{a.version}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {a.due_date && <span className="text-xs text-slate-500">{new Date(a.due_date).toLocaleDateString('en-GB')}</span>}
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                              style={{ backgroundColor: `${statusDef.color}15`, color: statusDef.color }}>
                              {statusDef.label}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <CheckCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">No approvals yet</p>
                    <p className="text-xs text-slate-500 mt-1">Work submitted for your review will appear here.</p>
                  </div>
                )}
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
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-white">{u.title || 'Project Update'}</p>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-500 capitalize">{u.update_type || 'general'}</span>
                            </div>
                            <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{u.summary}</p>
                            <p className="text-[10px] text-slate-500 mt-2">
                              {u.published_at ? new Date(u.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Rocket className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">No updates yet</p>
                    <p className="text-xs text-slate-500 mt-1">Project updates from the team will appear here.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'team' && (
              <div className="space-y-6">
                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Project Lead</h3>
                  {leadProfile ? (
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#06B6D4]/10 flex items-center justify-center text-lg font-bold text-[#67E8F9]">
                        {leadProfile.full_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white">{leadProfile.full_name}</p>
                        <p className="text-sm text-slate-400 capitalize">{leadProfile.role?.replace(/_/g, ' ') || 'Team member'}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Project lead will be assigned by the Digital Footprint team.</p>
                  )}
                </div>

                <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Team Members</h3>
                  {teamMembers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {teamMembers.map(tm => (
                        <div key={tm.id} className="flex items-center gap-3 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-xl p-3">
                          <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center text-sm font-bold text-[#C4B5FD]">
                            {tm.full_name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-200">{tm.full_name}</p>
                            <p className="text-xs text-slate-500 capitalize">{tm.role?.replace(/_/g, ' ') || 'Team member'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Team assignments will appear here.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
                <div className="space-y-4 max-h-[500px] overflow-y-auto mb-4">
                  {messages.length > 0 ? [...messages].reverse().map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender_name === userName ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-4 py-3 rounded-2xl ${msg.sender_name === userName ? 'bg-[#06B6D4] text-white rounded-br-md' : 'bg-white/5 text-slate-200 rounded-bl-md'}`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-[10px] mt-1 opacity-60">{msg.sender_name} · {new Date(msg.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-10 text-slate-400">
                      <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p className="text-sm">No messages yet</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..." onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#06B6D4] transition-all" />
                  <button onClick={handleSendMessage} disabled={!newMessage.trim() || sending}
                    className="px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap flex items-center gap-2">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'files' && (
              <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
                {files.length > 0 ? (
                  <div className="divide-y divide-[rgba(255,255,255,0.04)]">
                    {files.map(f => {
                      const handleFileDownload = async () => {
                        const { data } = await supabase.storage.from('project-files').createSignedUrl(f.file_path, 120);
                        if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                      };
                      const handleFilePreview = async () => {
                        if (f.file_type && f.file_type.startsWith('image/')) {
                          const { data } = await supabase.storage.from('project-files').createSignedUrl(f.file_path, 300);
                          if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                        } else {
                          handleFileDownload();
                        }
                      };
                      return (
                        <div key={f.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-[#06B6D4]" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{f.display_name || f.name}</p>
                              <p className="text-xs text-slate-400">{formatBytes(f.file_size)} · {f.category} · {new Date(f.created_at).toLocaleDateString('en-GB')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={handleFilePreview} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer"><Eye className="w-4 h-4" /></button>
                            {f.client_downloadable !== false && (
                              <button onClick={handleFileDownload} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer"><Download className="w-4 h-4" /></button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">No files shared yet</p>
                    <p className="text-xs text-slate-500 mt-1">Files shared by the team will appear here.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'invoices' && (
              <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
                {invoices.length > 0 ? (
                  <div className="divide-y divide-[rgba(255,255,255,0.04)]">
                    {invoices.map(inv => (
                      <div key={inv.id} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-[#F59E0B]" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{inv.invoice_number}</p>
                            <p className="text-xs text-slate-400">Due {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-GB') : 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-slate-300">£{Number(inv.amount).toLocaleString()}</span>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                            inv.status === 'paid' ? 'bg-[#10B981]/10 text-[#10B981]'
                            : inv.status === 'overdue' ? 'bg-[#EF4444]/10 text-[#EF4444]'
                            : 'bg-[#F59E0B]/10 text-[#F59E0B]'
                          }`}>{inv.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <DollarSign className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">No invoices yet</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'roadmap' && (
              <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
                {roadmapItems.length > 0 ? (
                  <div className="divide-y divide-[rgba(255,255,255,0.04)]">
                    {roadmapItems.map(item => (
                      <div key={item.id} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center">
                            <Map className="w-5 h-5 text-[#8B5CF6]" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{item.title}</p>
                            <p className="text-xs text-slate-400 capitalize">{item.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-medium border ${
                            item.priority === 'urgent' ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : item.priority === 'high' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-white/5 text-slate-400 border-[rgba(255,255,255,0.08)]'
                          }`}>{item.priority}</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-medium bg-white/5 text-slate-400 border border-[rgba(255,255,255,0.08)] capitalize">{item.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Map className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">No roadmap items</p>
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </PortalShell>
  );
}