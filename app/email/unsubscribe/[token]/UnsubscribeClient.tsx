'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, Ban } from 'lucide-react'
import { maskEmail } from '@/components/admin/email/contacts/contacts-types'
import Link from 'next/link'

export default function PublicUnsubscribePage() {
  const params = useParams()
  const token = params.token as string
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [complete, setComplete] = useState(false)
  const [alreadyUnsubscribed, setAlreadyUnsubscribed] = useState(false)

  useEffect(() => {
    const process = async () => {
      setLoading(true)
      const decoded = decodeURIComponent(token)

      const { data: lead } = await supabase.from('leads').select('email, consent_marketing, do_not_contact').eq('email', decoded.toLowerCase()).maybeSingle()

      if (lead) {
        setEmail(lead.email || decoded)
        if (!lead.consent_marketing) {
          setAlreadyUnsubscribed(true)
        } else {
          await supabase.from('leads').update({
            consent_marketing: false,
            do_not_contact: true,
            updated_at: new Date().toISOString(),
          }).eq('email', decoded.toLowerCase())
        }

        await supabase.from('email_consent_events').insert({
          email: decoded.toLowerCase(),
          purpose: 'marketing',
          consent_status: 'withdrawn',
          source: 'unsubscribe_link',
          source_type: 'system',
          effective_at: new Date().toISOString(),
          withdrawn_at: new Date().toISOString(),
        })
      } else {
        setEmail(decoded.includes('@') ? decoded : 'your email')
      }

      setComplete(true)
      setLoading(false)
    }
    process()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#121215] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 space-y-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-white">
            {alreadyUnsubscribed ? 'Already Unsubscribed' : 'Unsubscribed'}
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            {email && <span>{maskEmail(email)} has been </span>}
            {alreadyUnsubscribed
              ? 'was already unsubscribed from marketing emails.'
              : 'unsubscribed from all marketing emails. You will still receive important transactional messages such as security alerts and billing updates.'}
          </p>
        </div>

        <div className="pt-2 space-y-2">
          <a href={`/email/preferences/${encodeURIComponent(token)}`}
            className="block w-full py-3 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] cursor-pointer text-center">
            Manage Preferences
          </a>
          <Link href="/"
            className="block w-full py-3 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-400 rounded-xl font-semibold text-sm hover:bg-white/[0.08] cursor-pointer text-center">
            Back to Website
          </Link>
        </div>

        <div className="text-center pt-2">
          <a href="/privacy" className="text-xs text-slate-500 hover:text-slate-400 mr-4">Privacy</a>
          <a href="/contact" className="text-xs text-slate-500 hover:text-slate-400">Support</a>
        </div>
      </div>
    </div>
  )
}
