'use client';

import { useState, useEffect, useCallback, type MouseEvent } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import { useClientData } from '@/hooks/useClientData';
import AdminShell from '../../../../components/admin/AdminShell';
import { CLIENT_STATUS_STYLES, HEALTH_STATUS_STYLES, ONBOARDING_CHECKLIST, OFFBOARDING_CHECKLIST, calculateHealth } from '@/lib/client-definitions';
import Link from 'next/link';
import {
  ArrowLeft, Building2, Mail, Phone, Globe, MapPin, Calendar, Clock,
  Loader2, Edit2, User, Users, Briefcase, FolderKanban, FileText, Wrench,
  Headphones, DollarSign, Bug, PhoneCall, Workflow, Database, Shield,
  Activity, Settings, ChevronDown, ChevronUp, Plus, Trash2, X, Check,
  AlertTriangle, UserPlus, RefreshCw,
} from 'lucide-react';

type TabKey = 'overview' | 'contacts' | 'services' | 'projects' | 'tasks' | 'communications' | 'support' | 'finance' | 'uat' | 'pbx' | 'automations' | 'files' | 'portal' | 'activity' | 'settings';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'overview', label: 'Overview', icon: Activity },
  { key: 'contacts', label: 'Contacts', icon: Users },
  { key: 'services', label: 'Services', icon: Wrench },
  { key: 'projects', label: 'Projects', icon: FolderKanban },
  { key: 'tasks', label: 'Tasks', icon: FileText },
  { key: 'communications', label: 'Communications', icon: Mail },
  { key: 'support', label: 'Support', icon: Headphones },
  { key: 'finance', label: 'Finance', icon: DollarSign },
  { key: 'uat', label: 'UAT', icon: Bug },
  { key: 'pbx', label: 'PBX', icon: PhoneCall },
  { key: 'automations', label: 'Automations', icon: Workflow },
  { key: 'files', label: 'Files', icon: Database },
  { key: 'portal', label: 'Portal Access', icon: Shield },
  { key: 'activity', label: 'Activity', icon: Activity },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export default function Client360Workspace({ clientId }: { clientId: string }) {
  const {
    client, contacts, services, notes, portalAccess, onboardingItems,
    loading, error,
    fetchClient, fetchContacts, fetchServices, fetchNotes,
    fetchPortalAccess, fetchOnboarding,
    updateClient, addContact, updateContact, deleteContact,
    addNote, addService, updateService,
    updateOnboardingItem, addOnboardingItem,
    addPortalAccess, updatePortalAccess,
  } = useClientData(clientId);

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [loadedTabs, setLoadedTabs] = useState<Set<TabKey>>(new Set(['overview']));
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusReason, setStatusReason] = useState('');
  const [pendingStatus, setPendingStatus] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [showContactForm, setShowContactForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', role: '', email: '', phone: '', is_primary: false, is_billing: false });
  const [serviceForm, setServiceForm] = useState({ service_type: '', product_name: '', status: 'Planned', start_date: '', billing_arrangement: '', notes: '' });
  const [projects, setProjects] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [projectTasks, setProjectTasks] = useState<any[]>([]);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);

  useEffect(() => {
    fetchClient(clientId);
    fetchContacts(clientId);
    fetchServices(clientId);
    fetchNotes(clientId);
    fetchPortalAccess(clientId);
    fetchOnboarding(clientId);
    loadProjects();
    loadInvoices();
    loadActivity();
  }, [clientId]);

  const loadTabData = useCallback((tab: TabKey) => {
    if (loadedTabs.has(tab)) return;
    setLoadedTabs(prev => new Set(prev).add(tab));
    switch (tab) {
      case 'projects': loadProjects(); break;
      case 'tasks': loadTasks(); break;
      case 'finance': loadInvoices(); break;
    }
  }, [loadedTabs]);

  useEffect(() => {
    if (activeTab) loadTabData(activeTab);
  }, [activeTab]);

  const loadProjects = async () => {
    const { data } = await supabase.from('projects').select('id, name, status, progress, end_date, updated_at').eq('client_id', clientId).order('created_at', { ascending: false });
    if (data) setProjects(data);
  };

  const loadTasks = async () => {
    const { data } = await supabase.from('project_tasks').select('id, project_id, title, status, priority, assigned_to, due_date').order('created_at', { ascending: false }).limit(50);
    if (data) setProjectTasks(data);
  };

  const loadInvoices = async () => {
    const { data } = await supabase.from('invoices').select('id, invoice_number, amount, status, due_date, paid_at').eq('client_id', clientId).order('created_at', { ascending: false });
    if (data) setInvoices(data);
  };

  const loadActivity = async () => {
    const { data } = await supabase.from('project_activity').select('id, project_id, activity_type, title, created_at').order('created_at', { ascending: false }).limit(30);
    if (data) setActivityFeed(data);
  };

  const handleStatusChange = async () => {
    if (!pendingStatus || !client) return;
    const sensitive = ['At Risk', 'Paused', 'Offboarding', 'Former Client', 'Archived'];
    if (sensitive.includes(pendingStatus) && !statusReason.trim()) return;
    await updateClient(clientId, { status: pendingStatus });
    if (sensitive.includes(pendingStatus)) {
      await supabase.from('admin_security_audit_log').insert([{
        actor_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'client.status_changed',
        module: 'clients',
        target_record_type: 'client',
        target_record_id: clientId,
        result: 'success',
        reason: statusReason,
        before_summary: `Status was: ${client.status}`, after_summary: `Status changed to: ${pendingStatus}`,
      }]);
    }
    await supabase.from('project_activity').insert([{
      project_id: '00000000-0000-0000-0000-000000000000',
      actor_id: (await supabase.auth.getUser()).data.user?.id,
      activity_type: 'client.status_changed',
      title: `Client status changed to ${pendingStatus}`,
      description: statusReason || '',
    }]);
    setStatusOpen(false);
    setStatusReason('');
    setPendingStatus('');
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    const { data: user } = await supabase.auth.getUser();
    await addNote({ client_id: clientId, author_id: user.user?.id || '', content: noteContent.slice(0, 500), visibility: 'internal' });
    setNoteContent('');
    setShowNoteForm(false);
  };

  const handleAddContact = async () => {
    if (!contactForm.name.trim()) return;
    await addContact({ client_id: clientId, ...contactForm });
    setContactForm({ name: '', role: '', email: '', phone: '', is_primary: false, is_billing: false });
    setShowContactForm(false);
  };

  const handleAddService = async () => {
    if (!serviceForm.service_type.trim()) return;
    await addService({ client_id: clientId, ...serviceForm });
    setServiceForm({ service_type: '', product_name: '', status: 'Planned', start_date: '', billing_arrangement: '', notes: '' });
    setShowServiceForm(false);
  };

  const handleOnboardingToggle = async (item: any) => {
    const newStatus = item.status === 'completed' ? 'pending' : 'completed';
    await updateOnboardingItem(item.id, { status: newStatus });
  };

  const initOnboarding = async () => {
    if (onboardingItems.length > 0) return;
    for (const item of ONBOARDING_CHECKLIST) {
      await addOnboardingItem({ client_id: clientId, item_key: item.key, label: item.label, status: 'pending' });
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
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

  if (error || !client) {
    return (
      <AdminShell>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <AlertTriangle className="w-12 h-12 text-red-400" />
          <p className="text-slate-400">{error || 'Client not found'}</p>
          <Link href="/admin/clients" className="px-4 py-2 bg-white/5 text-slate-300 rounded-xl text-sm hover:bg-white/10 transition-colors cursor-pointer">Back to Clients</Link>
        </div>
      </AdminShell>
    );
  }

  const ss = CLIENT_STATUS_STYLES[client.status] || CLIENT_STATUS_STYLES['Active'];
  const hs = HEALTH_STATUS_STYLES[client.health_status || 'Not Enough Data'] || HEALTH_STATUS_STYLES['Not Enough Data'];
  const healthResult = calculateHealth(0, 0, projects.filter(p => p.status === 'delayed').length, invoices.filter(i => i.status === 'overdue').length, 0, 0, false, client.last_activity_at ? Math.floor((Date.now() - new Date(client.last_activity_at).getTime()) / 86400000) : 0);

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin/clients" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-white">{client.company_name || 'Unnamed Company'}</h1>
                <p className="text-xs font-mono text-slate-500">{client.client_reference || `DFP-CLI-${client.id.slice(0, 8).toUpperCase()}`}</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${ss.bg} ${ss.text} ${ss.border}`}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ss.dot }} />
                {client.status}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${hs.bg} ${hs.text} ${hs.border}`}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: hs.dot }} />
                {client.health_status || 'Not Enough Data'}
              </span>
            </div>
            <div className="flex items-center gap-6 mt-2 text-xs text-slate-400 flex-wrap">
              {client.contact_name && <span className="flex items-center gap-1"><User className="w-3 h-3" />{client.contact_name}</span>}
              {client.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{client.email}</span>}
              {client.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{client.phone}</span>}
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Last active: {formatDate(client.last_activity_at)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setStatusOpen(true)}
              className="px-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-300 hover:border-[#06B6D4]/30 hover:text-[#06B6D4] transition-all cursor-pointer whitespace-nowrap"
            >
              Change Status
            </button>
          </div>
        </div>

        <div className="flex overflow-x-auto gap-1 mb-6 pb-1 border-b border-[rgba(255,255,255,0.08)]">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.key
                  ? 'text-[#06B6D4] border-b-2 border-[#06B6D4]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>

            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-4">Company Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div><p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Company</p><p className="text-sm text-white">{client.company_name || '-'}</p></div>
                      <div><p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Trading As</p><p className="text-sm text-white">{client.trading_name || '-'}</p></div>
                      <div><p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Type</p><p className="text-sm text-white capitalize">{client.client_type || 'Business'}</p></div>
                      <div><p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Industry</p><p className="text-sm text-white">{client.industry || '-'}</p></div>
                      <div><p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Website</p><p className="text-sm text-[#06B6D4]">{client.website || '-'}</p></div>
                      <div><p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Preferred Contact</p><p className="text-sm text-white capitalize">{client.preferred_contact_method || 'Email'}</p></div>
                      <div><p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Data Classification</p><p className="text-sm text-white capitalize">{client.data_classification || 'Internal'}</p></div>
                      <div><p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Timezone</p><p className="text-sm text-white">{client.timezone || 'Europe/London'}</p></div>
                    </div>
                    {client.address && (
                      <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Address</p>
                        <p className="text-sm text-slate-300">{client.address}</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-4">Health Factors</h3>
                    {healthResult.factors.length === 0 || (healthResult.factors.length === 1 && healthResult.factors[0] === 'No health factors detected') ? (
                      <p className="text-sm text-slate-500">No health concerns detected.</p>
                    ) : (
                      <div className="space-y-2">
                        {healthResult.factors.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                            {f}
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-slate-500 mt-3">Calculated: {formatDate(client.health_calculated_at)}</p>
                  </div>

                  <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-white">Internal Notes</h3>
                      <button onClick={() => setShowNoteForm(!showNoteForm)} className="flex items-center gap-1 text-xs text-[#06B6D4] hover:text-[#22D3EE] transition-colors cursor-pointer">
                        <Plus className="w-3.5 h-3.5" /> Add Note
                      </button>
                    </div>
                    {showNoteForm && (
                      <div className="mb-4 p-3 bg-white/[0.02] rounded-xl border border-[rgba(255,255,255,0.06)]">
                        <textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value.slice(0, 500))}
                          rows={3} maxLength={500} placeholder="Add an internal note..."
                          className="w-full px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 resize-none" />
                        <div className="flex justify-end gap-2 mt-2">
                          <button onClick={() => { setShowNoteForm(false); setNoteContent(''); }}
                            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer">Cancel</button>
                          <button onClick={handleAddNote}
                            className="px-3 py-1.5 bg-[#06B6D4] text-white rounded-lg text-xs font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer">Save</button>
                        </div>
                      </div>
                    )}
                    {notes.length === 0 ? (
                      <p className="text-sm text-slate-500">No internal notes yet.</p>
                    ) : (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {notes.map(note => (
                          <div key={note.id} className="p-3 bg-white/[0.02] rounded-xl border border-[rgba(255,255,255,0.06)]">
                            <p className="text-sm text-slate-300">{note.content}</p>
                            <p className="text-xs text-slate-500 mt-1">{formatDate(note.created_at)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-4">Quick Stats</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between"><span className="text-xs text-slate-400">Projects</span><span className="text-sm text-white">{projects.length}</span></div>
                      <div className="flex justify-between"><span className="text-xs text-slate-400">Invoices</span><span className="text-sm text-white">{invoices.length}</span></div>
                      <div className="flex justify-between"><span className="text-xs text-slate-400">Contacts</span><span className="text-sm text-white">{contacts.length}</span></div>
                      <div className="flex justify-between"><span className="text-xs text-slate-400">Services</span><span className="text-sm text-white">{services.filter(s => s.status === 'Active').length}</span></div>
                      <div className="flex justify-between"><span className="text-xs text-slate-400">Portal Users</span><span className="text-sm text-white">{portalAccess.filter(p => !p.is_revoked).length}</span></div>
                    </div>
                  </div>

                  <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-4">Onboarding</h3>
                    {onboardingItems.length === 0 ? (
                      <div>
                        <p className="text-sm text-slate-500 mb-3">Onboarding checklist not yet initialised.</p>
                        <button onClick={initOnboarding} className="px-4 py-2 bg-[#06B6D4] text-white rounded-lg text-xs font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap">
                          Start Onboarding
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {onboardingItems.map(item => (
                          <button key={item.id} onClick={() => handleOnboardingToggle(item)}
                            className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                              item.status === 'completed' ? 'bg-emerald-500 border-emerald-500' : 'border-[rgba(255,255,255,0.20)]'
                            }`}>
                              {item.status === 'completed' && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className={`text-xs ${item.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{item.label}</span>
                          </button>
                        ))}
                        <div className="text-xs text-slate-500 mt-2">
                          {onboardingItems.filter(i => i.status === 'completed').length}/{onboardingItems.length} completed
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-4">Recent Activity</h3>
                    {activityFeed.length === 0 ? (
                      <p className="text-sm text-slate-500">No recent activity.</p>
                    ) : (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {activityFeed.slice(0, 8).map((a: any, i: number) => (
                          <div key={a.id || i} className="flex gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] mt-1.5 shrink-0" />
                            <div>
                              <p className="text-xs text-slate-300">{a.title || a.activity_type}</p>
                              <p className="text-xs text-slate-500">{formatDate(a.created_at)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'contacts' && (
              <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">Contacts ({contacts.length})</h3>
                  <button onClick={() => setShowContactForm(true)} className="flex items-center gap-1 text-xs text-[#06B6D4] hover:text-[#22D3EE] transition-colors cursor-pointer">
                    <Plus className="w-3.5 h-3.5" /> Add Contact
                  </button>
                </div>
                {contacts.length === 0 ? (
                  <p className="text-sm text-slate-500">No contacts added yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contacts.map(c => (
                      <div key={c.id} className="p-4 bg-white/[0.02] rounded-xl border border-[rgba(255,255,255,0.06)]">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-sm text-white">{c.name}</span>
                          {c.is_primary && <span className="px-1.5 py-0.5 bg-[#06B6D4]/10 text-[#06B6D4] text-[10px] rounded-md font-medium whitespace-nowrap">Primary</span>}
                          {c.is_billing && <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] rounded-md font-medium whitespace-nowrap">Billing</span>}
                        </div>
                        <p className="text-xs text-slate-400">{c.role || 'No role'}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                          {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                          {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'services' && (
              <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">Services ({services.length})</h3>
                  <button onClick={() => setShowServiceForm(true)} className="flex items-center gap-1 text-xs text-[#06B6D4] hover:text-[#22D3EE] transition-colors cursor-pointer">
                    <Plus className="w-3.5 h-3.5" /> Add Service
                  </button>
                </div>
                {services.length === 0 ? (
                  <p className="text-sm text-slate-500">No services registered yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[rgba(255,255,255,0.06)]">
                          <th className="text-left py-3 px-3 text-xs text-slate-400 uppercase">Type</th>
                          <th className="text-left py-3 px-3 text-xs text-slate-400 uppercase">Product</th>
                          <th className="text-left py-3 px-3 text-xs text-slate-400 uppercase">Status</th>
                          <th className="text-left py-3 px-3 text-xs text-slate-400 uppercase">Start</th>
                          <th className="text-left py-3 px-3 text-xs text-slate-400 uppercase">Renewal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {services.map(s => (
                          <tr key={s.id} className="border-b border-[rgba(255,255,255,0.04)]">
                            <td className="py-3 px-3 text-sm text-white">{s.service_type}</td>
                            <td className="py-3 px-3 text-sm text-slate-300">{s.product_name || '-'}</td>
                            <td className="py-3 px-3 text-sm text-slate-300">{s.status}</td>
                            <td className="py-3 px-3 text-sm text-slate-400">{formatDate(s.start_date)}</td>
                            <td className="py-3 px-3 text-sm text-slate-400">{formatDate(s.renewal_date)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">Projects ({projects.length})</h3>
                  <Link href="/admin/projects" className="text-xs text-[#06B6D4] hover:text-[#22D3EE] transition-colors cursor-pointer">View All</Link>
                </div>
                {projects.length === 0 ? (
                  <p className="text-sm text-slate-500">No projects associated yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map(p => (
                      <Link key={p.id} href={`/admin/projects`} className="p-4 bg-white/[0.02] rounded-xl border border-[rgba(255,255,255,0.06)] hover:border-[#06B6D4]/20 transition-colors cursor-pointer">
                        <p className="font-semibold text-sm text-white">{p.name}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                          <span>{p.status}</span>
                          <span>{p.progress || 0}%</span>
                          <span>{formatDate(p.start_date)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Tasks ({projectTasks.length})</h3>
                {projectTasks.length === 0 ? (
                  <p className="text-sm text-slate-500">No tasks found.</p>
                ) : (
                  <div className="space-y-2">
                    {projectTasks.slice(0, 20).map(t => (
                      <div key={t.id} className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl border border-[rgba(255,255,255,0.06)]">
                        <span className={`w-2 h-2 rounded-full ${t.status === 'completed' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                        <span className="text-sm text-slate-300 flex-1">{t.title || t.name || 'Untitled'}</span>
                        <span className="text-xs text-slate-500">{t.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'finance' && (
              <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Invoices ({invoices.length})</h3>
                {invoices.length === 0 ? (
                  <p className="text-sm text-slate-500">No invoices found for this client.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[rgba(255,255,255,0.06)]">
                          <th className="text-left py-3 px-3 text-xs text-slate-400 uppercase">Invoice #</th>
                          <th className="text-left py-3 px-3 text-xs text-slate-400 uppercase">Description</th>
                          <th className="text-right py-3 px-3 text-xs text-slate-400 uppercase">Amount</th>
                          <th className="text-left py-3 px-3 text-xs text-slate-400 uppercase">Status</th>
                          <th className="text-left py-3 px-3 text-xs text-slate-400 uppercase">Due</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map(inv => (
                          <tr key={inv.id} className="border-b border-[rgba(255,255,255,0.04)]">
                            <td className="py-3 px-3 text-sm font-mono text-[#06B6D4]">{inv.invoice_number}</td>
                            <td className="py-3 px-3 text-sm text-slate-300 max-w-xs truncate">{inv.description}</td>
                            <td className="py-3 px-3 text-sm text-white text-right">&pound;{Number(inv.amount).toLocaleString()}</td>
                            <td className="py-3 px-3 text-sm text-slate-300">{inv.status}</td>
                            <td className="py-3 px-3 text-sm text-slate-400">{formatDate(inv.due_date)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'portal' && (
              <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Portal Access ({portalAccess.length})</h3>
                {portalAccess.length === 0 ? (
                  <p className="text-sm text-slate-500">No portal access records yet.</p>
                ) : (
                  <div className="space-y-3">
                    {portalAccess.map(pa => (
                      <div key={pa.id} className="p-4 bg-white/[0.02] rounded-xl border border-[rgba(255,255,255,0.06)]">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-white">{pa.access_role}</p>
                            <p className="text-xs text-slate-400">State: {pa.invitation_state}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {pa.is_revoked ? (
                              <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-[10px] rounded-md font-medium">Revoked</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] rounded-md font-medium">Active</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Activity Timeline</h3>
                {activityFeed.length === 0 ? (
                  <p className="text-sm text-slate-500">No activity recorded yet.</p>
                ) : (
                  <div className="space-y-4">
                    {activityFeed.map((a: any, i: number) => (
                      <div key={a.id || i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-[#06B6D4]" />
                          {i < activityFeed.length - 1 && <div className="w-px flex-1 bg-[rgba(255,255,255,0.06)] mt-1" />}
                        </div>
                        <div className="pb-4">
                          <p className="text-sm text-slate-300">{a.title || a.activity_type}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{formatDate(a.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white mb-6">Client Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Status Management</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-slate-300">Current: <span className="font-semibold">{client.status}</span></p>
                      <button onClick={() => setStatusOpen(true)} className="px-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-slate-300 hover:border-[#06B6D4]/30 transition-all cursor-pointer whitespace-nowrap">
                        Change Status
                      </button>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Information</h4>
                    <div className="space-y-2 text-sm text-slate-400">
                      <p>Created: {formatDate(client.created_at)}</p>
                      <p>Last Updated: {formatDate(client.updated_at)}</p>
                      <p>Reference: {client.client_reference || `DFP-CLI-${clientId.slice(0, 8).toUpperCase()}`}</p>
                      <p>Portal State: {client.portal_access_state || 'None'}</p>
                      <p>Onboarding: {client.onboarding_state || 'Not Started'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!['overview','contacts','services','projects','tasks','finance','portal','activity','settings'].includes(activeTab) && (
              <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">{TABS.find(t => t.key === activeTab)?.label}</h3>
                <p className="text-sm text-slate-500">This section will be populated when connected data becomes available.</p>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {statusOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setStatusOpen(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Change Client Status</h3>
                <button onClick={() => setStatusOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {['Prospect', 'Onboarding', 'Active', 'At Risk', 'Paused', 'Offboarding', 'Former Client', 'Archived'].map(s => (
                    <button key={s} onClick={() => setPendingStatus(s)}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                        pendingStatus === s
                          ? 'bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/30'
                          : s === client.status
                            ? 'bg-white/5 text-slate-300 border border-[rgba(255,255,255,0.15)]'
                            : 'bg-white/5 text-slate-400 border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)]'
                      }`}
                    >{s}</button>
                  ))}
                </div>
                {['At Risk', 'Paused', 'Offboarding', 'Former Client', 'Archived'].includes(pendingStatus) && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-2">Reason required for this status change</label>
                    <textarea value={statusReason} onChange={(e) => setStatusReason(e.target.value.slice(0, 500))}
                      rows={3} maxLength={500} placeholder="Explain why..."
                      className="w-full px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 resize-none" />
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => { setStatusOpen(false); setPendingStatus(''); setStatusReason(''); }}
                    className="flex-1 px-4 py-2.5 bg-white/5 text-slate-400 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap">Cancel</button>
                  <button onClick={handleStatusChange} disabled={!pendingStatus}
                    className="flex-1 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer disabled:opacity-40 whitespace-nowrap">
                    Confirm
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showContactForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowContactForm(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Add Contact</h3>
                <button onClick={() => setShowContactForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <input type="text" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  placeholder="Full Name *" className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                <input type="text" value={contactForm.role} onChange={(e) => setContactForm({ ...contactForm, role: e.target.value })}
                  placeholder="Role" className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                <input type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="Email" className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                <input type="tel" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  placeholder="Phone" className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={contactForm.is_primary} onChange={(e) => setContactForm({ ...contactForm, is_primary: e.target.checked })}
                      className="rounded border-[rgba(255,255,255,0.20)] bg-white/5" />
                    <span className="text-xs text-slate-400">Primary Contact</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={contactForm.is_billing} onChange={(e) => setContactForm({ ...contactForm, is_billing: e.target.checked })}
                      className="rounded border-[rgba(255,255,255,0.20)] bg-white/5" />
                    <span className="text-xs text-slate-400">Billing Contact</span>
                  </label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowContactForm(false)} className="flex-1 px-4 py-2.5 bg-white/5 text-slate-400 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap">Cancel</button>
                  <button onClick={handleAddContact} disabled={!contactForm.name}
                    className="flex-1 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer disabled:opacity-40 whitespace-nowrap">
                    Add Contact
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showServiceForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowServiceForm(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Add Service</h3>
                <button onClick={() => setShowServiceForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <input type="text" value={serviceForm.service_type} onChange={(e) => setServiceForm({ ...serviceForm, service_type: e.target.value })}
                  placeholder="Service Type *" className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                <input type="text" value={serviceForm.product_name} onChange={(e) => setServiceForm({ ...serviceForm, product_name: e.target.value })}
                  placeholder="Product Name" className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                <input type="date" value={serviceForm.start_date} onChange={(e) => setServiceForm({ ...serviceForm, start_date: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                <input type="text" value={serviceForm.billing_arrangement} onChange={(e) => setServiceForm({ ...serviceForm, billing_arrangement: e.target.value })}
                  placeholder="Billing Arrangement" className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                <textarea value={serviceForm.notes} onChange={(e) => setServiceForm({ ...serviceForm, notes: e.target.value.slice(0, 300) })}
                  rows={2} maxLength={300} placeholder="Notes"
                  className="w-full px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 resize-none" />
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowServiceForm(false)} className="flex-1 px-4 py-2.5 bg-white/5 text-slate-400 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap">Cancel</button>
                  <button onClick={handleAddService} disabled={!serviceForm.service_type}
                    className="flex-1 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer disabled:opacity-40 whitespace-nowrap">
                    Add Service
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminShell>
  );
}
