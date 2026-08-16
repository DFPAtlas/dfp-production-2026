'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from '@/components/motion'
import {
  Users, Search, X, Plus, Filter, RefreshCw, ChevronDown, MoreHorizontal,
  ArrowUpRight, Clock, CheckCircle2, MinusCircle, Play, Pause, Archive, Trash2,
  BarChart3, Tag, Info, ShieldCheck,
} from 'lucide-react'
import type { EmailAudience } from '@/components/admin/email/contacts/contacts-types'
import { AUDIENCE_TYPE_LABELS } from '@/components/admin/email/contacts/contacts-types'

const SORT_OPTIONS = [
  { value: 'updated_at-desc', label: 'Recently Updated' },
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'created_at-desc', label: 'Recently Created' },
]

const TYPE_FILTERS = [
  { value: 'all', label: 'All Types' },
  { value: 'static', label: 'Static' },
  { value: 'dynamic', label: 'Dynamic' },
  { value: 'test', label: 'Test' },
  { value: 'imported', label: 'Imported' },
  { value: 'crm', label: 'CRM-Backed' },
]

const STATUS_FILTERS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'paused', label: 'Paused' },
  { value: 'archived', label: 'Archived' },
]

export default function AudiencesPage() {
  const [audiences, setAudiences] = useState<EmailAudience[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('updated_at-desc')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [createForm, setCreateForm] = useState({ name: '', description: '', audience_type: 'static' as EmailAudience['audience_type'] })

  const fetchAudiences = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('email_audiences').select('*').order('updated_at', { ascending: false }).limit(100)
    if (data) setAudiences(data as EmailAudience[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAudiences() }, [fetchAudiences])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.action-menu')) setMenuOpenId(null)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const filtered = audiences.filter(a => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !(a.description || '').toLowerCase().includes(search.toLowerCase())) return false
    if (typeFilter !== 'all' && a.audience_type !== typeFilter) return false
    if (statusFilter !== 'all' && a.status !== statusFilter) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    const [field, dir] = sortBy.split('-')
    const mult = dir === 'desc' ? -1 : 1
    if (field === 'name') return mult * a.name.localeCompare(b.name)
    return mult * (new Date(a.updated_at || 0).getTime() - new Date(b.updated_at || 0).getTime())
  })

  const handleCreate = async () => {
    if (!createForm.name.trim()) return
    const { error } = await supabase.from('email_audiences').insert({
      name: createForm.name.trim(),
      description: createForm.description || null,
      audience_type: createForm.audience_type,
      status: 'draft',
    })
    if (error) {
      setStatusMsg({ type: 'error', text: error.message })
    } else {
      setStatusMsg({ type: 'success', text: 'Audience created' })
      setShowCreateModal(false)
      setCreateForm({ name: '', description: '', audience_type: 'static' })
      fetchAudiences()
    }
    setTimeout(() => setStatusMsg(null), 3000)
  }

  const handleStatusChange = async (id: string, status: string) => {
    await supabase.from('email_audiences').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    setAudiences(prev => prev.map(a => a.id === id ? { ...a, status: status as EmailAudience['status'] } : a))
    setMenuOpenId(null)
  }

  const totals = {
    all: audiences.length,
    active: audiences.filter(a => a.status === 'active').length,
    draft: audiences.filter(a => a.status === 'draft').length,
    paused: audiences.filter(a => a.status === 'paused').length,
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
          <h1 className="text-2xl font-bold text-white">Audiences</h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-xl">
            Manage subscriber lists, dynamic segments, and test groups for your email campaigns.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/admin/email/contacts" className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] text-slate-300 rounded-xl font-semibold text-sm hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap">
            View Contacts
          </Link>
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
            <Plus className="w-4 h-4" />
            Create Audience
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Audiences', count: totals.all, icon: Users, color: 'text-slate-400' },
          { label: 'Active', count: totals.active, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Draft', count: totals.draft, icon: MinusCircle, color: 'text-amber-400' },
          { label: 'Paused', count: totals.paused, icon: Pause, color: 'text-slate-400' },
        ].map(stat => (
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

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="Search audiences..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 w-full bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 transition-all" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>}
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2.5 bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8">
          {TYPE_FILTERS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2.5 bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8">
          {STATUS_FILTERS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-3 py-2.5 bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8">
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl animate-pulse" />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-[rgba(255,255,255,0.04)] flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-slate-600" />
          </div>
          <p className="text-lg font-semibold text-white mb-1">No audiences yet</p>
          <p className="text-sm text-slate-400 text-center max-w-sm mb-6">Create your first audience to start sending targeted campaigns.</p>
          <button onClick={() => setShowCreateModal(true)} className="px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] cursor-pointer">Create Audience</button>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(a => (
            <div key={a.id} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 hover:border-[rgba(255,255,255,0.12)] transition-all">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-[rgba(255,255,255,0.04)] flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/email/audiences/${a.id}`} className="text-sm font-semibold text-white hover:text-[#06B6D4] transition-colors truncate">{a.name}</Link>
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium border whitespace-nowrap ${a.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : a.status === 'draft' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' : a.status === 'paused' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                      {a.status}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-[#06B6D4]/10 text-[#06B6D4] text-[10px] font-medium border border-[#06B6D4]/20">{AUDIENCE_TYPE_LABELS[a.audience_type]}</span>
                  </div>
                  {a.description && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{a.description}</p>}
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-[10px] text-slate-500">{a.eligible_estimate || 0} eligible</span>
                    <span className="text-[10px] text-slate-500">{a.suppression_count || 0} suppressed</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/admin/email/audiences/${a.id}`} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] cursor-pointer">
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                  <div className="relative action-menu">
                    <button onClick={(e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); setMenuOpenId(menuOpenId === a.id ? null : a.id) }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] cursor-pointer">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    <AnimatePresence>
                      {menuOpenId === a.id && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute right-0 top-full mt-1 w-40 bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-xl z-30 overflow-hidden">
                          <div className="p-1">
                            <Link href={`/admin/email/audiences/${a.id}`} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/[0.06] rounded-lg cursor-pointer">Edit</Link>
                            {a.status === 'draft' && <button onClick={() => handleStatusChange(a.id, 'active')} className="flex items-center gap-2 px-3 py-2 text-sm text-emerald-400 hover:bg-white/[0.06] rounded-lg cursor-pointer w-full text-left">Activate</button>}
                            {a.status === 'active' && <button onClick={() => handleStatusChange(a.id, 'paused')} className="flex items-center gap-2 px-3 py-2 text-sm text-amber-400 hover:bg-white/[0.06] rounded-lg cursor-pointer w-full text-left">Pause</button>}
                            {a.status === 'paused' && <button onClick={() => handleStatusChange(a.id, 'active')} className="flex items-center gap-2 px-3 py-2 text-sm text-emerald-400 hover:bg-white/[0.06] rounded-lg cursor-pointer w-full text-left">Resume</button>}
                            <button onClick={() => handleStatusChange(a.id, 'archived')} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:bg-white/[0.06] rounded-lg cursor-pointer w-full text-left">Archive</button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center shrink-0 mt-0.5"><Info className="w-4 h-4 text-[#06B6D4]" /></div>
        <div>
          <p className="text-sm font-medium text-white">Audience Health</p>
          <p className="text-xs text-slate-400 mt-1">Suppressions, unsubscribes, and complaints are always enforced at send time regardless of audience membership. Check the Suppressions page for full details.</p>
          <Link href="/admin/email/suppressions" className="inline-block mt-2 text-xs text-[#06B6D4] hover:underline">View Suppressions</Link>
        </div>
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white">Create Audience</h3>
                <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">Name *</label>
                  <input type="text" value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Monthly Newsletter Subscribers"
                    className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">Type</label>
                  <select value={createForm.audience_type} onChange={e => setCreateForm(p => ({ ...p, audience_type: e.target.value as EmailAudience['audience_type'] }))}
                    className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8">
                    <option value="static">Static List</option>
                    <option value="dynamic">Dynamic Segment</option>
                    <option value="test">Test Group</option>
                    <option value="imported">Imported List</option>
                    <option value="crm">CRM-Backed</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">Description</label>
                  <textarea value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))} rows={2} maxLength={300}
                    placeholder="Describe this audience..."
                    className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 resize-none" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-400 rounded-xl text-sm font-semibold hover:bg-white/[0.08] cursor-pointer">Cancel</button>
                <button onClick={handleCreate} disabled={!createForm.name.trim()} className="flex-1 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed">Create</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
