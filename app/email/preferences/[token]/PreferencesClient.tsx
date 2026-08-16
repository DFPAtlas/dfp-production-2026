'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, Mail, ShieldCheck } from 'lucide-react'
import { SUBSCRIPTION_CATEGORIES, TRANSACTIONAL_CATEGORIES, maskEmail } from '@/components/admin/email/contacts/contacts-types'

export default function PublicPreferencesPage() {
  const params = useParams()
  const token = params.token as string
  const [email, setEmail] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [subscribed, setSubscribed] = useState(true)
  const [frequency, setFrequency] = useState('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const decoded = decodeURIComponent(token)
      const { data: prefs } = await supabase.from('email_contact_preferences').select('*').eq('normalised_email_hash', decoded).maybeSingle()
      if (prefs) {
        setEmail(prefs.email || '')
        setCategories(prefs.subscription_categories || [])
        setSubscribed(prefs.marketing_subscribed || false)
        setFrequency(prefs.frequency || 'all')
      } else {
        setEmail(decoded.includes('@') ? decoded : '')
      }
      setLoading(false)
    }
    load()
  }, [token])

  const toggleCategory = (catId: string) => {
    if (TRANSACTIONAL_CATEGORIES.includes(catId)) return
    setCategories(prev => prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId])
  }

  const handleSave = async () => {
    if (!email) return
    setSaving(true)
    setError('')

    const hash = token
    const { data: existing } = await supabase.from('email_contact_preferences').select('*').eq('normalised_email_hash', hash).maybeSingle()

    if (existing) {
      await supabase.from('email_contact_preferences').update({
        subscription_categories: categories,
        frequency,
        marketing_subscribed: subscribed,
        last_updated_at: new Date().toISOString(),
        last_updated_source: 'preference_centre',
      }).eq('id', existing.id)
    } else {
      await supabase.from('email_contact_preferences').insert({
        email,
        normalised_email_hash: hash,
        subscription_categories: categories,
        frequency,
        marketing_subscribed: subscribed,
        last_updated_at: new Date().toISOString(),
        last_updated_source: 'preference_centre',
      })
    }

    setSuccess(true)
    setSaving(false)
  }

  const handleUnsubscribeAll = async () => {
    setSubscribed(false)
    setCategories([])
    await handleSave()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#121215] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-[#06B6D4]/10 border border-[#06B6D4]/20 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6 text-[#06B6D4]" />
          </div>
          <h1 className="text-xl font-bold text-white">Email Preferences</h1>
          {email && <p className="text-sm text-slate-400 mt-1">{maskEmail(email)}</p>}
        </div>

        {success ? (
          <div className="text-center space-y-3 py-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <p className="text-lg font-semibold text-white">Preferences Saved</p>
            <p className="text-sm text-slate-400">Your email preferences have been updated.</p>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl cursor-pointer">
                <span className="text-sm text-white">Marketing Emails</span>
                <button onClick={() => setSubscribed(!subscribed)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${subscribed ? 'bg-[#06B6D4]' : 'bg-slate-600'}`}>
                  <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${subscribed ? 'left-6' : 'left-1'}`} />
                </button>
              </label>

              {subscribed && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1.5">Frequency</label>
                    <select value={frequency} onChange={e => setFrequency(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer appearance-none pr-8">
                      <option value="all">All emails</option>
                      <option value="weekly">Weekly digest</option>
                      <option value="monthly">Monthly roundup</option>
                    </select>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-2">Categories</p>
                    <div className="space-y-1.5">
                      {SUBSCRIPTION_CATEGORIES.map(cat => {
                        const isTx = TRANSACTIONAL_CATEGORIES.includes(cat.id)
                        return (
                          <label key={cat.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm ${categories.includes(cat.id) ? 'text-white' : 'text-slate-500'}`}>
                            <input type="checkbox" checked={categories.includes(cat.id)} onChange={() => toggleCategory(cat.id)}
                              disabled={isTx} className="w-4 h-4 rounded border-[rgba(255,255,255,0.15)] bg-white/5 cursor-pointer disabled:opacity-40" />
                            {cat.label}
                            {isTx && <span className="text-[10px] text-blue-400 ml-1">(required)</span>}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button onClick={handleSave} disabled={saving}
              className="w-full py-3 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] disabled:opacity-50 cursor-pointer">
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>

            <button onClick={handleUnsubscribeAll}
              className="w-full py-3 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-400 rounded-xl font-semibold text-sm hover:bg-white/[0.08] hover:text-red-400 cursor-pointer">
              Unsubscribe from All Marketing
            </button>
          </>
        )}

        <div className="text-center">
          <a href="/privacy" className="text-xs text-slate-500 hover:text-slate-400 mr-4">Privacy Policy</a>
          <a href="/contact" className="text-xs text-slate-500 hover:text-slate-400">Support</a>
        </div>
      </div>
    </div>
  )
}