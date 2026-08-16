'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { motion } from '@/components/motion'
import {
  CheckCircle2, X, Info, ShieldCheck, ArrowLeft, Save,
} from 'lucide-react'
import type { ContactPreference } from '@/components/admin/email/contacts/contacts-types'
import { SUBSCRIPTION_CATEGORIES, TRANSACTIONAL_CATEGORIES } from '@/components/admin/email/contacts/contacts-types'

export default function PreferencesPage() {
  const [preferences, setPreferences] = useState<ContactPreference[]>([])
  const [loading, setLoading] = useState(true)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editCategories, setEditCategories] = useState<string[]>([])
  const [editFrequency, setEditFrequency] = useState('all')
  const [editSubscribed, setEditSubscribed] = useState(false)

  const fetchPreferences = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('email_contact_preferences').select('*').order('last_updated_at', { ascending: false }).limit(50)
    if (data) setPreferences(data as ContactPreference[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchPreferences() }, [fetchPreferences])

  const startEdit = (pref: ContactPreference) => {
    setEditingId(pref.id)
    setEditCategories(pref.subscription_categories || [])
    setEditFrequency(pref.frequency || 'all')
    setEditSubscribed(pref.marketing_subscribed || false)
  }

  const saveEdit = async () => {
    if (!editingId) return
    await supabase.from('email_contact_preferences').update({
      subscription_categories: editCategories,
      frequency: editFrequency,
      marketing_subscribed: editSubscribed,
      last_updated_at: new Date().toISOString(),
      last_updated_source: 'admin',
    }).eq('id', editingId)
    setEditingId(null)
    setStatusMsg({ type: 'success', text: 'Preferences saved' })
    fetchPreferences()
    setTimeout(() => setStatusMsg(null), 3000)
  }

  const toggleCategory = (catId: string) => {
    setEditCategories(prev => prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId])
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {statusMsg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className={`px-4 py-3 rounded-xl text-sm font-medium border ${statusMsg.type === 'success' ? 'bg-emerald-500/[0.06] text-emerald-400 border-emerald-500/20' : 'bg-red-500/[0.06] text-red-400 border-red-500/20'}`}>
          {statusMsg.text}
        </motion.div>
      )}

      <div className="flex items-center gap-4">
        <Link href="/admin/email/contacts" className="w-9 h-9 flex items-center justify-center rounded-xl border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Preference Manager</h1>
          <p className="text-sm text-slate-400 mt-1">Manage contact subscription preferences across brands and categories.</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-[#121215] rounded-xl animate-pulse" />)}</div>
      ) : preferences.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl">
          <CheckCircle2 className="w-10 h-10 text-slate-600 mb-3" />
          <p className="text-lg font-semibold text-white">No preference records</p>
          <p className="text-sm text-slate-400 text-center max-w-sm mt-1">Preferences are created when contacts interact with your preference centre.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {preferences.map(pref => (
            <div key={pref.id} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{pref.email || 'Unknown'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] border ${pref.marketing_subscribed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                      {pref.marketing_subscribed ? 'Subscribed' : 'Unsubscribed'}
                    </span>
                    <span className="text-[10px] text-slate-500 capitalize">{pref.frequency}</span>
                  </div>
                  {pref.subscription_categories && pref.subscription_categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {pref.subscription_categories.map(cat => (
                        <span key={cat} className="px-1.5 py-0.5 rounded-md bg-white/[0.02] border border-[rgba(255,255,255,0.04)] text-[9px] text-slate-400">
                          {SUBSCRIPTION_CATEGORIES.find(c => c.id === cat)?.label || cat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => editingId === pref.id ? saveEdit() : startEdit(pref)}
                  className="px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-xs font-semibold hover:bg-white/[0.08] cursor-pointer whitespace-nowrap">
                  {editingId === pref.id ? 'Save' : 'Edit'}
                </button>
              </div>

              {editingId === pref.id && (
                <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.04)] space-y-4">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editSubscribed} onChange={e => setEditSubscribed(e.target.checked)}
                        className="w-4 h-4 rounded border-[rgba(255,255,255,0.15)] bg-white/5 cursor-pointer" />
                      <span className="text-xs text-slate-300">Marketing Subscribed</span>
                    </label>
                    <select value={editFrequency} onChange={e => setEditFrequency(e.target.value)}
                      className="px-3 py-1.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white cursor-pointer appearance-none pr-8">
                      <option value="all">All</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase">Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {SUBSCRIPTION_CATEGORIES.map(cat => {
                      const isTx = TRANSACTIONAL_CATEGORIES.includes(cat.id)
                      return (
                        <label key={cat.id} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border cursor-pointer text-xs transition-all ${editCategories.includes(cat.id) ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/[0.02] text-slate-500 border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.08)]'}`}>
                          <input type="checkbox" checked={editCategories.includes(cat.id)} onChange={() => toggleCategory(cat.id)}
                            disabled={isTx} className="w-3 h-3 rounded border-[rgba(255,255,255,0.15)] bg-white/5 cursor-pointer disabled:opacity-40" />
                          {cat.label}
                          {isTx && <span className="text-[8px] text-blue-400 ml-0.5">required</span>}
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-[#06B6D4] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-white">Preference Management</p>
          <p className="text-xs text-slate-400 mt-1">Transactional messages (security, billing, appointment reminders) are always required and cannot be opted out. The public preference centre lets contacts manage their own subscriptions without an account.</p>
          <Link href="/email/preferences/demo" className="inline-block mt-2 text-xs text-[#06B6D4] hover:underline">Preview Preference Centre</Link>
        </div>
      </div>
    </div>
  )
}