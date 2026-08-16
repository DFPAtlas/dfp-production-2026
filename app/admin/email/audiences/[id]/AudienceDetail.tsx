'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from '@/components/motion'
import {
  ArrowLeft, Users, Clock, CheckCircle2, Ban, AlertTriangle, X, Edit3, Play, Pause, Archive, RefreshCw,
} from 'lucide-react'
import type { EmailAudience } from '@/components/admin/email/contacts/contacts-types'
import { AUDIENCE_TYPE_LABELS } from '@/components/admin/email/contacts/contacts-types'

export default function AudienceDetailPage() {
  const params = useParams()
  const audienceId = params.id as string
  const [audience, setAudience] = useState<EmailAudience | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', description: '' })
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const fetchAudience = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('email_audiences').select('*').eq('id', audienceId).maybeSingle()
    if (data) {
      setAudience(data as EmailAudience)
      setEditForm({ name: data.name, description: data.description || '' })
    }
    setLoading(false)
  }, [audienceId])

  useEffect(() => { fetchAudience() }, [fetchAudience])

  const handleStatusChange = async (status: string) => {
    await supabase.from('email_audiences').update({ status, updated_at: new Date().toISOString() }).eq('id', audienceId)
    setAudience(prev => prev ? { ...prev, status: status as EmailAudience['status'] } : null)
    setStatusMsg({ type: 'success', text: `Audience ${status}` })
    setTimeout(() => setStatusMsg(null), 3000)
  }

  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) return
    await supabase.from('email_audiences').update({ name: editForm.name, description: editForm.description, updated_at: new Date().toISOString() }).eq('id', audienceId)
    setAudience(prev => prev ? { ...prev, name: editForm.name, description: editForm.description } : null)
    setEditMode(false)
    setStatusMsg({ type: 'success', text: 'Audience updated' })
    setTimeout(() => setStatusMsg(null), 3000)
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="h-12 w-48 bg-[#121215] rounded-xl animate-pulse" />
      <div className="h-64 bg-[#121215] border rounded-2xl animate-pulse" />
    </div>
  )

  if (!audience) return (
    <div className="max-w-4xl mx-auto text-center py-20">
      <p className="text-lg text-white font-semibold">Audience not found</p>
      <Link href="/admin/email/audiences" className="text-sm text-[#06B6D4] hover:underline mt-2 inline-block">Back to Audiences</Link>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {statusMsg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className={`px-4 py-3 rounded-xl text-sm font-medium border ${statusMsg.type === 'success' ? 'bg-emerald-500/[0.06] text-emerald-400 border-emerald-500/20' : 'bg-red-500/[0.06] text-red-400 border-red-500/20'}`}>
          {statusMsg.text}
        </motion.div>
      )}

      <div className="flex items-center gap-4">
        <Link href="/admin/email/audiences" className="w-9 h-9 flex items-center justify-center rounded-xl border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          {editMode ? (
            <div className="flex items-center gap-3">
              <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                className="px-3 py-1.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-lg text-lg font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 w-80" />
              <button onClick={handleSaveEdit} className="px-3 py-1.5 bg-[#06B6D4] text-white rounded-lg text-sm font-semibold cursor-pointer">Save</button>
              <button onClick={() => setEditMode(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{audience.name}</h1>
              <button onClick={() => setEditMode(true)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] cursor-pointer"><Edit3 className="w-3.5 h-3.5" /></button>
            </div>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium border ${audience.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>{audience.status}</span>
            <span className="px-1.5 py-0.5 rounded-md bg-[#06B6D4]/10 text-[#06B6D4] text-[10px] border border-[#06B6D4]/20">{AUDIENCE_TYPE_LABELS[audience.audience_type]}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleStatusChange('active')} className="px-3 py-2 rounded-xl text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 cursor-pointer whitespace-nowrap">Activate</button>
          <button onClick={() => handleStatusChange('paused')} className="px-3 py-2 rounded-xl text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 cursor-pointer whitespace-nowrap">Pause</button>
          <button onClick={() => handleStatusChange('archived')} className="px-3 py-2 rounded-xl text-xs bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:bg-slate-500/20 cursor-pointer whitespace-nowrap">Archive</button>
        </div>
      </div>

      {editMode && (
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1.5">Description</label>
          <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} rows={2} maxLength={300}
            className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 resize-none" />
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Eligible Estimate', value: audience.eligible_estimate || 0, icon: Users, color: 'text-[#06B6D4]' },
          { label: 'Total Source', value: audience.total_source_count || 0, icon: Users, color: 'text-slate-400' },
          { label: 'Suppressed', value: audience.suppression_count || 0, icon: Ban, color: 'text-red-400' },
          { label: 'Consent Coverage', value: audience.consent_coverage_pct != null ? `${audience.consent_coverage_pct}%` : '—', icon: CheckCircle2, color: 'text-emerald-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-[rgba(255,255,255,0.04)] flex items-center justify-center">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-[11px] text-slate-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {audience.description && (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
          <p className="text-sm text-slate-400">{audience.description}</p>
        </div>
      )}

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-white">Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-[10px] text-slate-500 uppercase">Type</p><p className="text-sm text-white">{AUDIENCE_TYPE_LABELS[audience.audience_type]}</p></div>
          <div><p className="text-[10px] text-slate-500 uppercase">Last Refreshed</p><p className="text-sm text-white">{audience.last_refreshed_at ? new Date(audience.last_refreshed_at).toLocaleString('en-GB') : 'Never'}</p></div>
          <div><p className="text-[10px] text-slate-500 uppercase">Created</p><p className="text-sm text-white">{audience.created_at ? new Date(audience.created_at).toLocaleDateString('en-GB') : '—'}</p></div>
          <div><p className="text-[10px] text-slate-500 uppercase">Updated</p><p className="text-sm text-white">{audience.updated_at ? new Date(audience.updated_at).toLocaleDateString('en-GB') : '—'}</p></div>
        </div>
      </div>
    </div>
  )
}