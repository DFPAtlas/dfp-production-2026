'use client';

import { useState } from 'react';
import { motion } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  ArrowLeft, Building2, Mail, Phone, Globe, MapPin, Calendar, User, Briefcase,
  PoundSterling, Target, Flag, Clock, MessageSquare, CheckSquare, FileText,
  History, Settings, Send, ChevronDown, Loader2, Plus, AlertCircle,
} from 'lucide-react';
import AdminShell from '../../../../components/admin/AdminShell';
import { useLeadDetail } from '@/hooks/useCrmData';
import { STAGE_LABELS, STAGE_COLORS, STAGE_DOT_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, SOURCE_LABELS, stageRequiresReason } from '@/lib/crm-definitions';
import type { LeadStage } from '@/lib/crm-definitions';

type Tab = 'overview' | 'contacts' | 'qualification' | 'activity' | 'notes' | 'tasks' | 'communications' | 'opportunities' | 'files' | 'history' | 'settings';

const TABS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'overview', label: 'Overview', icon: Target },
  { key: 'contacts', label: 'Contacts', icon: User },
  { key: 'qualification', label: 'Qualification', icon: Briefcase },
  { key: 'notes', label: 'Notes', icon: MessageSquare },
  { key: 'tasks', label: 'Tasks', icon: CheckSquare },
  { key: 'activity', label: 'Activity', icon: Clock },
  { key: 'history', label: 'History', icon: History },
  { key: 'settings', label: 'Settings', icon: Settings },
];

function formatCurrency(val: number | null): string {
  if (val == null) return '-';
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(val);
}

function formatDate(d: string | null): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Lead360Workspace({ leadId }: { leadId: string }) {
  const { lead, notes, followUps, stageHistory, loading, error, fetchAll, addNote, addFollowUp, completeFollowUp, changeStage } = useLeadDetail(leadId);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [newNote, setNewNote] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [stageModal, setStageModal] = useState<{ stage: LeadStage } | null>(null);
  const [stageReason, setStageReason] = useState('');
  const [stageChanging, setStageChanging] = useState(false);
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [fuAction, setFuAction] = useState('');
  const [fuDue, setFuDue] = useState('');
  const [fuChannel, setFuChannel] = useState('email');
  const [fuSaving, setFuSaving] = useState(false);

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-[#0066FF]/30 border-t-[#0066FF] rounded-full animate-spin" />
        </div>
      </AdminShell>
    );
  }

  if (error || !lead) {
    return (
      <AdminShell>
        <div className="text-center py-20">
          <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">{error || 'Lead not found'}</p>
          <Link href="/admin/leads" className="inline-flex items-center gap-2 mt-4 text-sm text-[#06B6D4] hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to Leads
          </Link>
        </div>
      </AdminShell>
    );
  }

  const handleStageClick = async (stage: LeadStage) => {
    if (stageRequiresReason(stage)) {
      setStageModal({ stage });
      setStageReason('');
      return;
    }
    setStageChanging(true);
    const userId = (await supabase.auth.getUser()).data.user?.id;
    await changeStage(stage, userId || '');
    setStageChanging(false);
  };

  const confirmStageChange = async () => {
    if (!stageModal) return;
    setStageChanging(true);
    const userId = (await supabase.auth.getUser()).data.user?.id;
    await changeStage(stageModal.stage, userId || '', stageReason || undefined);
    setStageChanging(false);
    setStageModal(null);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setNoteSaving(true);
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (userId) { await addNote(newNote, userId); setNewNote(''); }
    setNoteSaving(false);
  };

  const handleAddFollowUp = async () => {
    if (!fuAction.trim() || !fuDue) return;
    setFuSaving(true);
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (userId) {
      await addFollowUp({ owner_id: userId, action: fuAction, channel: fuChannel, due_at: new Date(fuDue).toISOString() });
      setFuAction(''); setFuDue(''); setShowFollowUpForm(false);
    }
    setFuSaving(false);
  };

  const initials = (lead.contact_name || lead.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin/leads" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{lead.company_name || lead.name}</h1>
              {lead.lead_reference && <span className="text-sm font-mono text-slate-400">{lead.lead_reference}</span>}
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              {lead.contact_name || lead.name} · {lead.email} · {lead.phone || 'No phone'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <div className="relative">
            <button onClick={() => setStageModal({ stage: lead.stage })} disabled={stageChanging}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border cursor-pointer whitespace-nowrap transition-colors ${STAGE_COLORS[lead.stage] || STAGE_COLORS.new}`}
            >
              {stageChanging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STAGE_DOT_COLORS[lead.stage] }} />}
              {STAGE_LABELS[lead.stage] || lead.stage}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${PRIORITY_COLORS[lead.priority]}`}>
            <Flag className="w-3 h-3" /> {PRIORITY_LABELS[lead.priority]}
          </span>
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Created {formatDate(lead.created_at)}
          </span>
          {lead.next_action_due && (
            <span className={`text-xs flex items-center gap-1.5 ${new Date(lead.next_action_due) < new Date() ? 'text-red-400' : 'text-slate-400'}`}>
              <Clock className="w-3.5 h-3.5" /> Next: {lead.next_action || 'Follow up'} ({formatDate(lead.next_action_due)})
            </span>
          )}
        </div>

        <div className="flex gap-1 border-b border-[rgba(255,255,255,0.06)] mb-6 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.key ? 'border-[#06B6D4] text-[#06B6D4]' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Estimated Value', value: formatCurrency(lead.estimated_value), icon: PoundSterling },
                { label: 'Source', value: SOURCE_LABELS[lead.source] || lead.source, icon: Target },
                { label: 'Service Interest', value: lead.service_interest || '-', icon: Briefcase },
                { label: 'Industry', value: lead.industry || '-', icon: Building2 },
              ].map((card, i) => (
                <div key={i} className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <card.icon className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-400">{card.label}</span>
                  </div>
                  <p className="text-lg font-bold text-white">{card.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4">Lead Message</h3>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{lead.message || 'No message provided.'}</p>
            </div>
            <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4">Key Details</h3>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div><dt className="text-xs text-slate-400 mb-1">Website</dt><dd className="text-sm text-slate-300">{lead.website ? <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-[#06B6D4] hover:underline">{lead.website}</a> : '-'}</dd></div>
                <div><dt className="text-xs text-slate-400 mb-1">Location</dt><dd className="text-sm text-slate-300">{lead.location || '-'}</dd></div>
                <div><dt className="text-xs text-slate-400 mb-1">Contact Role</dt><dd className="text-sm text-slate-300">{lead.contact_role || '-'}</dd></div>
                <div><dt className="text-xs text-slate-400 mb-1">Budget Range</dt><dd className="text-sm text-slate-300">{lead.budget_range || '-'}</dd></div>
                <div><dt className="text-xs text-slate-400 mb-1">Organisation Size</dt><dd className="text-sm text-slate-300">{lead.organisation_size || '-'}</dd></div>
                <div><dt className="text-xs text-slate-400 mb-1">Campaign</dt><dd className="text-sm text-slate-300">{lead.campaign || '-'}</dd></div>
                <div>
                  <dt className="text-xs text-slate-400 mb-1">Consent</dt>
                  <dd className="text-sm">
                    {lead.do_not_contact ? <span className="text-red-400">Do Not Contact</span> : 
                      <span className="text-emerald-400">{lead.consent_contact ? 'Contact Allowed' : 'No Contact Consent'}</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400 mb-1">Duplicate</dt>
                  <dd className="text-sm">{lead.duplicate_warning ? <span className="text-amber-400">Possible duplicate</span> : <span className="text-slate-500">None detected</span>}</dd>
                </div>
              </dl>
            </div>
          </motion.div>
        )}

        {activeTab === 'notes' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4">Add Note</h3>
              <textarea value={newNote} onChange={e => setNewNote(e.target.value.slice(0, 500))}
                rows={3} maxLength={500} placeholder="Write an internal note..."
                className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 resize-none"
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-slate-500">{newNote.length}/500</span>
                <button onClick={handleAddNote} disabled={noteSaving || !newNote.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >{noteSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Add Note</button>
              </div>
            </div>
            <div className="space-y-3">
              {notes.map(note => (
                <div key={note.id} className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-4">
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{note.content}</p>
                  <p className="text-xs text-slate-500 mt-2">{formatDate(note.created_at)}</p>
                </div>
              ))}
              {notes.length === 0 && <p className="text-sm text-slate-500 text-center py-8">No notes yet.</p>}
            </div>
          </motion.div>
        )}

        {activeTab === 'tasks' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Follow-ups</h3>
              <button onClick={() => setShowFollowUpForm(!showFollowUpForm)}
                className="flex items-center gap-2 px-4 py-2 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] cursor-pointer"
              ><Plus className="w-4 h-4" /> Add Follow-up</button>
            </div>

            {showFollowUpForm && (
              <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5 space-y-3">
                <input type="text" value={fuAction} onChange={e => setFuAction(e.target.value)}
                  placeholder="Action description" className="w-full px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                <div className="flex gap-3">
                  <input type="datetime-local" value={fuDue} onChange={e => setFuDue(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                  <div className="relative">
                    <select value={fuChannel} onChange={e => setFuChannel(e.target.value)}
                      className="px-3 pr-8 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs cursor-pointer appearance-none">
                      <option value="email">Email</option>
                      <option value="telephone">Phone</option>
                      <option value="meeting">Meeting</option>
                      <option value="sms">SMS</option>
                      <option value="other">Other</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <button onClick={handleAddFollowUp} disabled={fuSaving || !fuAction.trim() || !fuDue}
                  className="w-full px-4 py-2 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] disabled:opacity-40 cursor-pointer"
                >{fuSaving ? 'Saving...' : 'Save Follow-up'}</button>
              </div>
            )}

            <div className="space-y-2">
              {followUps.map(fu => (
                <div key={fu.id} className={`bg-[#1E293B] border rounded-2xl p-4 ${fu.completed_at ? 'border-[rgba(255,255,255,0.04)] opacity-60' : 'border-[rgba(255,255,255,0.08)]'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`text-sm font-medium ${fu.completed_at ? 'text-slate-500 line-through' : 'text-white'}`}>{fu.action}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {fu.channel} · Due {formatDate(fu.due_at)}
                        {fu.completed_at && ` · Completed ${formatDate(fu.completed_at)}`}
                        {fu.outcome && ` · ${fu.outcome}`}
                      </p>
                    </div>
                    {!fu.completed_at && (
                      <button onClick={async () => {
                        const userId = (await supabase.auth.getUser()).data.user?.id;
                        if (userId) await completeFollowUp(fu.id, 'Completed', userId);
                      }}
                        className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-medium hover:bg-emerald-500/20 cursor-pointer whitespace-nowrap"
                      >Complete</button>
                    )}
                  </div>
                </div>
              ))}
              {followUps.length === 0 && !showFollowUpForm && (
                <p className="text-sm text-slate-500 text-center py-8">No follow-ups scheduled.</p>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'activity' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4">Stage History</h3>
              <div className="space-y-3">
                {stageHistory.map(h => (
                  <div key={h.id || h.created_at} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#06B6D4]" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-300">
                        {h.from_stage ? <span>Changed from <span className="text-slate-400">{STAGE_LABELS[h.from_stage as LeadStage] || h.from_stage}</span> to </span> : 'Created as '}
                        <span className="font-medium text-white">{STAGE_LABELS[h.to_stage as LeadStage] || h.to_stage}</span>
                      </p>
                      <p className="text-xs text-slate-500">{formatDate(h.created_at)}{h.reason ? ` · ${h.reason}` : ''}</p>
                    </div>
                  </div>
                ))}
                {stageHistory.length === 0 && <p className="text-sm text-slate-500">No stage changes recorded.</p>}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4">Stage Change History</h3>
              <div className="space-y-3">
                {stageHistory.map(h => (
                  <div key={h.id || h.created_at} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#06B6D4]" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-300">
                        {h.from_stage ? <span>Changed from <span className="text-slate-400">{STAGE_LABELS[h.from_stage as LeadStage] || h.from_stage}</span> to </span> : 'Created as '}
                        <span className="font-medium text-white">{STAGE_LABELS[h.to_stage as LeadStage] || h.to_stage}</span>
                      </p>
                      <p className="text-xs text-slate-500">{formatDate(h.created_at)}{h.reason ? ` · ${h.reason}` : ''}</p>
                    </div>
                  </div>
                ))}
                {stageHistory.length === 0 && <p className="text-sm text-slate-500">No stage changes recorded.</p>}
              </div>
            </div>
            
            <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 mt-4">
              <h3 className="font-semibold text-white mb-4">Follow-up History</h3>
              <div className="space-y-3">
                {followUps.filter(f => f.completed_at).map(fu => (
                  <div key={fu.id} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-300">{fu.action}</p>
                      <p className="text-xs text-slate-500">
                        Completed {formatDate(fu.completed_at)}{fu.outcome ? ` · ${fu.outcome}` : ''} · {fu.channel}
                      </p>
                    </div>
                  </div>
                ))}
                {followUps.filter(f => f.completed_at).length === 0 && (
                  <p className="text-sm text-slate-500">No completed follow-ups yet.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'contacts' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4">Primary Contact</h3>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div><dt className="text-xs text-slate-400 mb-1">Name</dt><dd className="text-sm text-white">{lead.contact_name || lead.name}</dd></div>
                <div><dt className="text-xs text-slate-400 mb-1">Role</dt><dd className="text-sm text-slate-300">{lead.contact_role || '-'}</dd></div>
                <div><dt className="text-xs text-slate-400 mb-1">Email</dt><dd className="text-sm text-[#06B6D4]">{lead.email}</dd></div>
                <div><dt className="text-xs text-slate-400 mb-1">Phone</dt><dd className="text-sm text-slate-300">{lead.contact_phone || lead.phone || '-'}</dd></div>
              </dl>
            </div>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4">Lead Settings</h3>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={lead.consent_contact} onChange={async () => { await supabase.from('leads').update({ consent_contact: !lead.consent_contact }).eq('id', leadId); fetchAll(); }}
                    className="w-4 h-4 rounded border-[rgba(255,255,255,0.15)] bg-white/5 cursor-pointer" />
                  <span className="text-sm text-slate-300">Consent to contact</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={lead.consent_marketing} onChange={async () => { await supabase.from('leads').update({ consent_marketing: !lead.consent_marketing }).eq('id', leadId); fetchAll(); }}
                    className="w-4 h-4 rounded border-[rgba(255,255,255,0.15)] bg-white/5 cursor-pointer" />
                  <span className="text-sm text-slate-300">Consent to marketing</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={lead.do_not_contact} onChange={async () => { await supabase.from('leads').update({ do_not_contact: !lead.do_not_contact }).eq('id', leadId); fetchAll(); }}
                    className="w-4 h-4 rounded border-[rgba(255,255,255,0.15)] bg-white/5 cursor-pointer" />
                  <span className="text-sm text-red-400">Do not contact</span>
                </label>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'qualification' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4">Qualification</h3>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { label: 'Budget Range', value: lead.budget_range || 'Not specified' },
                  { label: 'Estimated Value', value: formatCurrency(lead.estimated_value) },
                  { label: 'Service Interest', value: lead.service_interest || 'Not specified' },
                  { label: 'Industry', value: lead.industry || 'Not specified' },
                  { label: 'Organisation Size', value: lead.organisation_size || 'Not specified' },
                  { label: 'Source', value: SOURCE_LABELS[lead.source] || lead.source },
                  { label: 'Stage', value: STAGE_LABELS[lead.stage] },
                  { label: 'Value Confidence', value: lead.value_confidence || 'estimated' },
                ].map((item, i) => (
                  <div key={i}><dt className="text-xs text-slate-400 mb-1">{item.label}</dt><dd className="text-sm text-slate-300">{item.value}</dd></div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {(activeTab === 'communications' || activeTab === 'opportunities' || activeTab === 'files') && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-12 text-center">
              <FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">{activeTab === 'communications' ? 'Communications' : activeTab === 'opportunities' ? 'Opportunities' : 'Files'}</p>
              <p className="text-sm text-slate-500 mt-1">This section will be available in a future update.</p>
            </div>
          </motion.div>
        )}
      </div>

      {stageModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setStageModal(null)}
        >
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
            className="bg-[#1E293B] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white mb-1">Change Stage to &ldquo;{STAGE_LABELS[stageModal.stage]}&rdquo;</h3>
            <p className="text-sm text-slate-400 mb-4">A reason is required for this stage change.</p>
            <textarea value={stageReason} onChange={e => setStageReason(e.target.value.slice(0, 500))}
              rows={3} maxLength={500} placeholder="Enter reason..."
              className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setStageModal(null)} className="flex-1 px-4 py-2.5 bg-white/5 text-slate-400 rounded-xl text-sm font-semibold hover:bg-white/10 cursor-pointer">Cancel</button>
              <button onClick={confirmStageChange} disabled={!stageReason.trim() || stageChanging}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] disabled:opacity-40 cursor-pointer"
              >{stageChanging ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Confirm</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AdminShell>
  );
}
