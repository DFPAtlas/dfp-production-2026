'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from '@/components/motion'
import {
  ShieldCheck, Search, X, Plus, CheckCircle2, Clock, AlertTriangle, Ban, Info,
  History, Filter, ArrowUpDown, Eye, EyeOff,
} from 'lucide-react'
import type { ConsentEvent } from '@/components/admin/email/contacts/contacts-types'
import { CONSENT_STATUS_LABELS, CONSENT_STATUS_COLORS, maskEmail } from '@/components/admin/email/contacts/contacts-types'

const STATUS_FILTERS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'granted', label: 'Granted' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'pending', label: 'Pending' },
  { value: 'unknown', label: 'Unknown' },
]

export default function ConsentPage() {
  const [events, setEvents] = useState<ConsentEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEmails, setShowEmails] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [addForm, setAddForm] = useState({
    email: '', purpose: 'marketing', consent_status: 'granted' as ConsentEvent['consent_status'],
    lawful_basis: '', source: '', policy_version: '',
  })

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('email_consent_events').select('*').order('effective_at', { ascending: false }).limit(100)
    if (data) setEvents(data as ConsentEvent[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const handleAddEvent = async () => {
    if (!addForm.email || !addForm.email.includes('@')) {
      setStatusMsg({ type: 'error', text: 'Valid email required' })
      return
    }
    const { error } = await supabase.from('email_consent_events').insert({
      email: addForm.email.trim().toLowerCase(),
      purpose: addForm.purpose,
      consent_status: addForm.consent_status,
      lawful_basis: addForm.lawful_basis || null,
      source: addForm.source || 'manual',
      policy_version: addForm.policy_version || null,
      effective_at: new Date().toISOString(),
      source_type: 'manual',
    })
    if (error) {
      setStatusMsg({ type: 'error', text: error.message })
    } else {
      setStatusMsg({ type: 'success', text: 'Consent event recorded' })
      setShowAddModal(false)
      setAddForm({ email: '', purpose: 'marketing', consent_status: 'granted', lawful_basis: '', source: '', policy_version: '' })
      fetchEvents()
    }
    setTimeout(() => setStatusMsg(null), 3000)
  }

  const filtered = events.filter(e => {
    if (search && !e.email.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter !== 'all' && e.consent_status !== statusFilter) return false
    return true
  })

  const stats = {
    total: events.length,
    granted: events.filter(e => e.consent_status === 'granted').length,
    withdrawn: events.filter(e => e.consent_status === 'withdrawn').length,
    pending: events.filter(e => e.consent_status === 'pending').length,
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <AnimatePresence>
        {statusMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className={`px-4 py-3 rounded-xl text-sm font-medium border ${statusMsg.type === 'success' ? 'bg-emerald-500/[0.06] text-emerald-400 border-emerald-500/20' : 'bg-red-500/[0.06] text-red-400 border-red-500/20'}`}>
            {statusMsg.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Consent Ledger</h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-xl">
            Auditable record of marketing consent events. New events are appended — historical events are never overwritten.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/admin/email/contacts" className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] text-slate-300 rounded-xl font-semibold text-sm hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap">
            View Contacts
          </Link>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
            <Plus className="w-4 h-4" />
            Record Event
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', count: stats.total, icon: ShieldCheck, color: 'text-slate-400' },
          { label: 'Granted', count: stats.granted, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Withdrawn', count: stats.withdrawn, icon: X, color: 'text-red-400' },
          { label: 'Pending', count: stats.pending, icon: Clock, color: 'text-amber-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-[rgba(255,255,255,0.04)] flex items-center justify-center">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div><p className="text-2xl font-bold text-white">{stat.count}</p><p className="text-[11px] text-slate-500">{stat.label}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="Search by email..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 w-full bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 transition-all" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>}
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8">
          {STATUS_FILTERS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button onClick={() => setShowEmails(!showEmails)}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            showEmails ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' : 'bg-white/[0.02] border border-[rgba(255,255,255,0.06)] text-slate-400 hover:text-white'
          }`}>
          {showEmails ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showEmails ? 'Hide Emails' : 'Show Emails'}
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-[#121215] rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl">
          <ShieldCheck className="w-10 h-10 text-slate-600 mb-3" />
          <p className="text-lg font-semibold text-white">No consent events recorded</p>
          <p className="text-sm text-slate-400 text-center max-w-sm mt-1 mb-4">Record your first consent event to start tracking.</p>
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] cursor-pointer">Record Event</button>
        </div>
      ) : (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase">Email</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase">Purpose</th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase hidden lg:table-cell">Basis</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase hidden md:table-cell">Source</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                {filtered.map(ev => (
                  <tr key={ev.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-sm text-white">{showEmails ? ev.email : maskEmail(ev.email)}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 capitalize">{ev.purpose}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border ${CONSENT_STATUS_COLORS[ev.consent_status] || ''}`}>
                        {CONSENT_STATUS_LABELS[ev.consent_status]}
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
        </div>
      )}

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-[#06B6D4] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-white">Consent Best Practices</p>
          <p className="text-xs text-slate-400 mt-1">Unknown consent must never count as marketing consent. Transactional relationships do not automatically grant marketing permission. All consent events are append-only — historical records are preserved for audit purposes.</p>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white">Record Consent Event</h3>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">Email *</label>
                  <input type="email" value={addForm.email} onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="contact@example.com"
                    className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1.5">Purpose</label>
                    <select value={addForm.purpose} onChange={e => setAddForm(p => ({ ...p, purpose: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer appearance-none pr-8">
                      <option value="marketing">Marketing</option>
                      <option value="newsletter">Newsletter</option>
                      <option value="product_updates">Product Updates</option>
                      <option value="events">Events</option>
                      <option value="transactional">Transactional</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1.5">Status</label>
                    <select value={addForm.consent_status} onChange={e => setAddForm(p => ({ ...p, consent_status: e.target.value as ConsentEvent['consent_status'] }))}
                      className="w-full px-3 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer appearance-none pr-8">
                      <option value="granted">Granted</option>
                      <option value="not_granted">Not Granted</option>
                      <option value="pending">Pending</option>
                      <option value="withdrawn">Withdrawn</option>
                      <option value="expired">Expired</option>
                      <option value="not_required">Not Required</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">Lawful Basis</label>
                  <input type="text" value={addForm.lawful_basis} onChange={e => setAddForm(p => ({ ...p, lawful_basis: e.target.value }))}
                    placeholder="e.g. consent, legitimate_interest"
                    className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">Source</label>
                  <input type="text" value={addForm.source} onChange={e => setAddForm(p => ({ ...p, source: e.target.value }))}
                    placeholder="e.g. website_form, event_signup"
                    className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-400 rounded-xl text-sm font-semibold hover:bg-white/[0.08] cursor-pointer">Cancel</button>
                <button onClick={handleAddEvent} className="flex-1 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] cursor-pointer">Record</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
