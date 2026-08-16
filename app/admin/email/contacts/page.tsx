'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from '@/components/motion'
import {
  Search, X, Plus, Upload, Download, Users, Mail, ShieldCheck, AlertTriangle,
  CheckCircle2, Ban, RefreshCw, Clock, ChevronDown, ArrowUpRight,
  Filter, Tag, MoreHorizontal, UserX, UserCheck, Trash2, Info,
} from 'lucide-react'
import type { EmailContact } from '@/components/admin/email/contacts/contacts-types'
import { CONTACT_STATUS_LABELS, maskEmail } from '@/components/admin/email/contacts/contacts-types'

const PAGE_SIZE = 50

const SORT_OPTIONS = [
  { value: 'created_at-desc', label: 'Recently Added' },
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
  { value: 'email-asc', label: 'Email A–Z' },
  { value: 'last_activity_at-desc', label: 'Last Activity' },
]

const STATUS_FILTERS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'valid', label: 'Valid' },
  { value: 'suppressed', label: 'Suppressed' },
  { value: 'unsubscribed', label: 'Unsubscribed' },
  { value: 'pending_consent', label: 'Pending Consent' },
]

export default function ContactsPage() {
  const [contacts, setContacts] = useState<EmailContact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy] = useState('created_at-desc')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportInfo, setShowImportInfo] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [addForm, setAddForm] = useState({ name: '', email: '', company_name: '', source: '', tags: '' })

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('leads').select('*').limit(PAGE_SIZE)

    if (sortBy) {
      const [field, dir] = sortBy.split('-')
      query = query.order(field, { ascending: dir === 'asc' })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data, error } = await query
    if (!error && data) {
      const enriched = data.map((l: any) => ({
        id: l.id,
        name: l.name || '',
        email: l.email || '',
        masked_email: maskEmail(l.email || ''),
        company_name: l.company_name || '',
        contact_role: l.contact_role || '',
        phone: l.contact_phone || '',
        source: l.source || 'unknown',
        status: l.do_not_contact ? 'suppressed' : l.email ? 'valid' : 'pending_consent',
        consent_marketing: l.consent_marketing || false,
        consent_contact: l.consent_contact || false,
        do_not_contact: l.do_not_contact || false,
        tags: [],
        stage: l.stage || 'new',
        created_at: l.created_at || '',
        updated_at: l.updated_at || '',
        last_activity_at: l.last_activity_at || l.created_at || '',
      }))
      setContacts(enriched as EmailContact[])
    }
    setLoading(false)
  }, [sortBy])

  useEffect(() => { fetchContacts() }, [fetchContacts])

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => setDebouncedSearch(search), 250)
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current) }
  }, [search])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.action-menu')) setMenuOpenId(null)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const filtered = contacts.filter((c) => {
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      if (!(c.email || '').toLowerCase().includes(q) && !(c.name || '').toLowerCase().includes(q) && !(c.company_name || '').toLowerCase().includes(q)) return false
    }
    if (statusFilter === 'suppressed') return c.do_not_contact
    if (statusFilter === 'unsubscribed') return !c.consent_marketing && c.email
    if (statusFilter === 'pending_consent') return !c.consent_marketing && !c.do_not_contact
    if (statusFilter === 'valid') return c.email && !c.do_not_contact
    return true
  })

  const totalCount = contacts.length
  const suppressedCount = contacts.filter(c => c.do_not_contact).length
  const consentCount = contacts.filter(c => c.consent_marketing).length
  const eligibleCount = contacts.filter(c => c.email && !c.do_not_contact && c.consent_marketing).length

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const handleToggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(c => c.id)))
    }
  }

  const handleAddContact = async () => {
    if (!addForm.email || !addForm.email.includes('@')) {
      setStatusMsg({ type: 'error', text: 'Please enter a valid email address' })
      return
    }
    const { error } = await supabase.from('leads').insert({
      name: addForm.name || addForm.email.split('@')[0],
      email: addForm.email.trim().toLowerCase(),
      company_name: addForm.company_name || null,
      source: addForm.source || 'manual',
      consent_marketing: true,
      consent_contact: true,
      stage: 'new',
      priority: 'medium',
      status: 'new',
    })
    if (error) {
      setStatusMsg({ type: 'error', text: error.message })
    } else {
      setStatusMsg({ type: 'success', text: 'Contact added successfully' })
      setShowAddModal(false)
      setAddForm({ name: '', email: '', company_name: '', source: '', tags: '' })
      fetchContacts()
    }
    setTimeout(() => setStatusMsg(null), 3000)
  }

  const handleArchive = async (id: string) => {
    await supabase.from('leads').update({ archived_at: new Date().toISOString() }).eq('id', id)
    setStatusMsg({ type: 'success', text: 'Contact archived' })
    setContacts(prev => prev.filter(c => c.id !== id))
    setTimeout(() => setStatusMsg(null), 3000)
  }

  const statsCards = [
    { label: 'Total Contacts', count: totalCount, icon: Users, color: 'text-slate-400' },
    { label: 'Marketing Consent', count: consentCount, icon: CheckCircle2, color: 'text-emerald-400' },
    { label: 'Suppressed', count: suppressedCount, icon: Ban, color: 'text-red-400' },
    { label: 'Eligible', count: eligibleCount, icon: UserCheck, color: 'text-[#06B6D4]' },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <AnimatePresence>
        {statusMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className={`px-4 py-3 rounded-xl text-sm font-medium border ${
              statusMsg.type === 'success' ? 'bg-emerald-500/[0.06] text-emerald-400 border-emerald-500/20' : 'bg-red-500/[0.06] text-red-400 border-red-500/20'
            }`}
          >
            {statusMsg.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Contacts</h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-xl">
            Manage your email contacts, consent records, and subscription preferences.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Link href="/admin/email/imports" className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] text-slate-300 rounded-xl font-semibold text-sm hover:bg-white/[0.08] hover:border-[rgba(255,255,255,0.12)] transition-all cursor-pointer whitespace-nowrap">
            <Upload className="w-4 h-4" />
            Import
          </Link>
          <Link href="/admin/email/audiences" className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] text-slate-300 rounded-xl font-semibold text-sm hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap">
            <Users className="w-4 h-4" />
            Audiences
          </Link>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
            <Plus className="w-4 h-4" />
            Add Contact
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <div key={stat.label} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-[rgba(255,255,255,0.04)] flex items-center justify-center">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.count}</p>
                <p className="text-[11px] text-slate-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="Search by name, email, company..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 w-full bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 transition-all"
          />
          {search && (
            <button onClick={() => { setSearch(''); setDebouncedSearch('') }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8"
        >
          {STATUS_FILTERS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2.5 bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8"
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{selectedIds.size} selected</span>
            <button className="px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-xs text-amber-400 hover:bg-amber-500/10 cursor-pointer whitespace-nowrap">Add Tag</button>
            <Link href="/admin/email/audiences" className="px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-xs text-slate-300 hover:bg-white/[0.08] cursor-pointer whitespace-nowrap">Add to Audience</Link>
            <button className="px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-xs text-slate-300 hover:bg-white/[0.08] cursor-pointer whitespace-nowrap">Export</button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-[rgba(255,255,255,0.04)] flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-slate-600" />
          </div>
          <p className="text-lg font-semibold text-white mb-1">No contacts found</p>
          <p className="text-sm text-slate-400 text-center max-w-sm mb-6">Try adjusting your search or add a new contact.</p>
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] transition-all cursor-pointer">Add Your First Contact</button>
        </div>
      ) : (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="text-left py-3 px-3">
                    <input type="checkbox" checked={filtered.length > 0 && selectedIds.size === filtered.length}
                      onChange={handleToggleAll} className="w-4 h-4 rounded border-[rgba(255,255,255,0.15)] bg-white/5 cursor-pointer" />
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Contact</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Company</th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Consent</th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Status</th>
                  <th className="text-right px-3 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Added</th>
                  <th className="text-right px-3 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                {filtered.map((c) => (
                  <tr key={c.id} className={`hover:bg-white/[0.02] transition-colors ${selectedIds.has(c.id) ? 'bg-[#06B6D4]/5' : ''}`}>
                    <td className="py-3.5 px-3">
                      <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => handleToggleSelect(c.id)}
                        className="w-4 h-4 rounded border-[rgba(255,255,255,0.15)] bg-white/5 cursor-pointer" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${c.do_not_contact ? 'bg-red-500/10' : 'bg-white/[0.02]'} border border-[rgba(255,255,255,0.04)]`}>
                          {c.do_not_contact ? <Ban className="w-4 h-4 text-red-400" /> : <Mail className="w-4 h-4 text-slate-500" />}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/admin/email/contacts/${c.id}`} className="text-sm font-medium text-white hover:text-[#06B6D4] transition-colors truncate block">{c.name || 'Unnamed'}</Link>
                          <p className="text-[11px] text-slate-500 truncate">{c.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className="text-xs text-slate-400">{c.company_name || '—'}</span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-center">
                      {c.consent_marketing ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400"><CheckCircle2 className="w-3 h-3" /> Yes</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-500/10 border border-slate-500/20 text-[10px] text-slate-400"><X className="w-3 h-3" /> No</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-center">
                      {c.do_not_contact ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-[10px] text-red-400">Suppressed</span>
                      ) : !c.email ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400">No Email</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-500/10 border border-slate-500/20 text-[10px] text-slate-400">Active</span>
                      )}
                    </td>
                    <td className="px-3 py-3.5 hidden sm:table-cell text-right">
                      <span className="text-xs text-slate-500">{c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}</span>
                    </td>
                    <td className="px-3 py-3.5 text-right relative action-menu">
                      <button onClick={(e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); setMenuOpenId(menuOpenId === c.id ? null : c.id) }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors cursor-pointer">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      <AnimatePresence>
                        {menuOpenId === c.id && (
                          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 top-full mt-1 w-44 bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-xl z-30 overflow-hidden">
                            <div className="p-1">
                              <Link href={`/admin/email/contacts/${c.id}`}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/[0.06] rounded-lg cursor-pointer">View Details</Link>
                              <Link href={`/admin/email/consent?contact=${c.id}`}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/[0.06] rounded-lg cursor-pointer">Consent History</Link>
                              <Link href={`/admin/email/preferences?contact=${c.id}`}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/[0.06] rounded-lg cursor-pointer">Preferences</Link>
                              <button onClick={() => { handleArchive(c.id); setMenuOpenId(null) }}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer w-full text-left">Archive</button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-4 h-4 text-[#06B6D4]" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">Contacts & CRM</p>
          <p className="text-xs text-slate-400 mt-1">
            Contacts are synced from your CRM leads. Suppressed or unsubscribed contacts are automatically excluded from campaigns. Manage full CRM details from the Leads section.
          </p>
          <Link href="/admin/leads" className="inline-block mt-2 text-xs text-[#06B6D4] hover:underline">Open CRM Leads</Link>
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
                <h3 className="text-lg font-bold text-white">Add Contact</h3>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">Email *</label>
                  <input type="email" value={addForm.email} onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="contact@example.com"
                    className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">Name</label>
                  <input type="text" value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Full name"
                    className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">Company</label>
                  <input type="text" value={addForm.company_name} onChange={e => setAddForm(p => ({ ...p, company_name: e.target.value }))}
                    placeholder="Company name"
                    className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">Source</label>
                  <input type="text" value={addForm.source} onChange={e => setAddForm(p => ({ ...p, source: e.target.value }))}
                    placeholder="e.g. website, manual, import"
                    className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-400 rounded-xl text-sm font-semibold hover:bg-white/[0.08] cursor-pointer">Cancel</button>
                <button onClick={handleAddContact} className="flex-1 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] cursor-pointer">Add Contact</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
