'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from '@/components/motion'
import {
  ArrowLeft, Mail, Building2, Phone, Tag, Clock, ShieldCheck, AlertTriangle,
  CheckCircle2, Ban, X, History, Users, FileText, ChevronDown,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { EmailContact, ContactPreference, ConsentEvent } from '@/components/admin/email/contacts/contacts-types'
import { maskEmail, CONTACT_STATUS_LABELS, CONSENT_STATUS_LABELS, CONSENT_STATUS_COLORS, SUBSCRIPTION_CATEGORIES } from '@/components/admin/email/contacts/contacts-types'

type Tab = 'overview' | 'preferences' | 'consent' | 'activity' | 'audiences'

export default function ContactDetailPage() {
  const params = useParams()
  const contactId = params.id as string
  const [contact, setContact] = useState<EmailContact | null>(null)
  const [preferences, setPreferences] = useState<ContactPreference | null>(null)
  const [consentEvents, setConsentEvents] = useState<ConsentEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const { data: lead } = await supabase.from('leads').select('*').eq('id', contactId).maybeSingle()
    if (lead) {
      const enriched: EmailContact = {
        id: lead.id,
        name: lead.name || '',
        email: lead.email || '',
        masked_email: maskEmail(lead.email || ''),
        company_name: lead.company_name || '',
        contact_role: lead.contact_role || '',
        phone: lead.contact_phone || '',
        source: lead.source || 'unknown',
        status: lead.do_not_contact ? 'suppressed' : lead.email ? 'valid' : 'pending_consent',
        consent_marketing: lead.consent_marketing || false,
        consent_contact: lead.consent_contact || false,
        do_not_contact: lead.do_not_contact || false,
        tags: [],
        stage: lead.stage || 'new',
        created_at: lead.created_at || '',
        updated_at: lead.updated_at || '',
        last_activity_at: lead.last_activity_at || lead.created_at || '',
      }
      setContact(enriched)
    }

    const { data: prefs } = await supabase.from('email_contact_preferences').select('*').eq('contact_id', contactId).maybeSingle()
    if (prefs) setPreferences(prefs as ContactPreference)

    const { data: consents } = await supabase.from('email_consent_events').select('*').eq('contact_id', contactId).order('effective_at', { ascending: false }).limit(50)
    if (consents) setConsentEvents(consents as ConsentEvent[])

    setLoading(false)
  }, [contactId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleToggleSuppression = async () => {
    if (!contact) return
    const newVal = !contact.do_not_contact
    await supabase.from('leads').update({ do_not_contact: newVal }).eq('id', contactId)
    setContact({ ...contact, do_not_contact: newVal, status: newVal ? 'suppressed' : 'valid' })
    setStatusMsg({ type: 'success', text: newVal ? 'Contact suppressed' : 'Suppression removed' })
    setTimeout(() => setStatusMsg(null), 3000)
  }

  const handleToggleConsent = async () => {
    if (!contact) return
    const newVal = !contact.consent_marketing
    await supabase.from('leads').update({ consent_marketing: newVal }).eq('id', contactId)
    setContact({ ...contact, consent_marketing: newVal })
    setStatusMsg({ type: 'success', text: newVal ? 'Marketing consent granted' : 'Marketing consent withdrawn' })
    setTimeout(() => setStatusMsg(null), 3000)
  }

  if (loading) return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="h-12 w-48 bg-[#121215] rounded-xl animate-pulse" />
      <div className="h-64 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl animate-pulse" />
    </div>
  )

  if (!contact) return (
    <div className="max-w-5xl mx-auto text-center py-20">
      <p className="text-lg text-white font-semibold">Contact not found</p>
      <Link href="/admin/email/contacts" className="text-sm text-[#06B6D4] hover:underline mt-2 inline-block">Back to Contacts</Link>
    </div>
  )

  const tabs: { key: Tab; label: string; icon: LucideIcon }[] = [
    { key: 'overview', label: 'Overview', icon: Mail },
    { key: 'preferences', label: 'Preferences', icon: CheckCircle2 },
    { key: 'consent', label: 'Consent', icon: ShieldCheck },
    { key: 'activity', label: 'Activity', icon: History },
    { key: 'audiences', label: 'Audiences', icon: Users },
  ]

  const contactDetails: { label: string; value: string | null | undefined; Icon: LucideIcon }[] = [
    { label: 'Email', value: contact.email, Icon: Mail },
    { label: 'Company', value: contact.company_name, Icon: Building2 },
    { label: 'Phone', value: contact.phone, Icon: Phone },
    { label: 'Role', value: contact.contact_role, Icon: Tag },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {statusMsg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`px-4 py-3 rounded-xl text-sm font-medium border ${statusMsg.type === 'success' ? 'bg-emerald-500/[0.06] text-emerald-400 border-emerald-500/20' : 'bg-red-500/[0.06] text-red-400 border-red-500/20'}`}>
          {statusMsg.text}
        </motion.div>
      )}

      <div className="flex items-center gap-4">
        <Link href="/admin/email/contacts" className="w-9 h-9 flex items-center justify-center rounded-xl border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{contact.name || 'Unnamed Contact'}</h1>
          <p className="text-sm text-slate-400">{contact.email}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={handleToggleConsent}
            className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap border transition-all ${contact.consent_marketing ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20 hover:bg-slate-500/20'}`}>
            {contact.consent_marketing ? 'Withdraw Consent' : 'Grant Consent'}
          </button>
          <button onClick={handleToggleSuppression}
            className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap border transition-all ${contact.do_not_contact ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'}`}>
            {contact.do_not_contact ? 'Unsuppress' : 'Suppress'}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-1">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all whitespace-nowrap ${activeTab === tab.key ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'text-slate-400 hover:text-white'}`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">Contact Details</h3>
            <div className="space-y-3">
              {contactDetails.map(({ label, value, Icon }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.02] border border-[rgba(255,255,255,0.04)] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
                    <p className="text-sm text-white">{value || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">Email Health</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Status</p>
                <p className="text-sm font-semibold text-white mt-1">{CONTACT_STATUS_LABELS[contact.status] || contact.status}</p>
              </div>
              <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Consent</p>
                <p className={`text-sm font-semibold mt-1 ${contact.consent_marketing ? 'text-emerald-400' : 'text-slate-400'}`}>{contact.consent_marketing ? 'Granted' : 'Not Granted'}</p>
              </div>
              <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Source</p>
                <p className="text-sm font-semibold text-white mt-1 capitalize">{contact.source || 'Unknown'}</p>
              </div>
              <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Added</p>
                <p className="text-sm font-semibold text-white mt-1">{contact.created_at ? new Date(contact.created_at).toLocaleDateString('en-GB') : '—'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'preferences' && (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white">Subscription Preferences</h3>
          {preferences ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.04)]">
                <span className="text-sm text-slate-300">Marketing Subscribed</span>
                <span className={preferences.marketing_subscribed ? 'text-emerald-400 text-sm' : 'text-slate-500 text-sm'}>{preferences.marketing_subscribed ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.04)]">
                <span className="text-sm text-slate-300">Frequency</span>
                <span className="text-sm text-white capitalize">{preferences.frequency}</span>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-2">Categories</p>
                <div className="flex flex-wrap gap-2">
                  {SUBSCRIPTION_CATEGORIES.map(cat => (
                    <span key={cat.id} className={`px-2.5 py-1 rounded-lg text-xs border ${preferences.subscription_categories?.includes(cat.id) ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                      {cat.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No preference records configured yet.</p>
          )}
        </div>
      )}

      {activeTab === 'consent' && (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[rgba(255,255,255,0.06)]">
            <h3 className="text-sm font-semibold text-white">Consent Ledger</h3>
          </div>
          {consentEvents.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No consent events recorded.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)]">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase">Purpose</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase hidden lg:table-cell">Basis</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase hidden md:table-cell">Source</th>
                    <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                  {consentEvents.map(ev => (
                    <tr key={ev.id}>
                      <td className="px-4 py-3 text-sm text-white capitalize">{ev.purpose}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border ${CONSENT_STATUS_COLORS[ev.consent_status] || CONSENT_STATUS_COLORS.unknown}`}>
                          {ev.consent_status === 'granted' ? <CheckCircle2 className="w-3 h-3" /> : ev.consent_status === 'withdrawn' ? <X className="w-3 h-3" /> : null}
                          {CONSENT_STATUS_LABELS[ev.consent_status] || ev.consent_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 hidden lg:table-cell">{ev.lawful_basis || '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-400 hidden md:table-cell">{ev.source || ev.source_type || '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 text-right">{new Date(ev.effective_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-8 text-center">
          <History className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Email activity tracking is managed through the Analytics system.</p>
          <Link href="/admin/email/analytics" className="text-xs text-[#06B6D4] hover:underline mt-2 inline-block">View Analytics</Link>
        </div>
      )}

      {activeTab === 'audiences' && (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-8 text-center">
          <Users className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Audience membership is tracked on each audience detail page.</p>
          <Link href="/admin/email/audiences" className="text-xs text-[#06B6D4] hover:underline mt-2 inline-block">View Audiences</Link>
        </div>
      )}
    </div>
  )
}
