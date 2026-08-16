'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { productConfigs } from './product-config'

const experienceList = [
  'business-command-centre',
  'ai-lead-system',
  'customer-portal',
  'quickguard-walkthrough',
  'guardianhub-preview',
  'lethub-lettings-tour',
  'synqoro-event-demo',
]

const categoryLabels: Record<string, string> = {
  'business-command-centre': 'Operations',
  'ai-lead-system': 'AI & Sales',
  'customer-portal': 'Customer Experience',
  'quickguard-walkthrough': 'Marketplaces',
  'guardianhub-preview': 'Security',
  'lethub-lettings-tour': 'Property',
  'synqoro-event-demo': 'Events',
}

interface ExperienceSwitcherProps {
  currentId: string
  onClose: () => void
}

export default function ExperienceSwitcher({ currentId, onClose }: ExperienceSwitcherProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    const el = dialogRef.current
    if (el) {
      const first = el.querySelector<HTMLElement>('a')
      first?.focus()
    }
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Switch experience"
        className="relative w-full max-w-sm rounded-2xl border border-white/[0.1] bg-[#0b0f19] p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Explore Another Experience</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 transition hover:bg-white/[0.05] hover:text-white cursor-pointer"
            aria-label="Close"
          >
            <i className="ri-close-line w-4 h-4 flex items-center justify-center" />
          </button>
        </div>

        <div className="space-y-1">
          {experienceList.map((id) => {
            const cfg = productConfigs[id]
            if (!cfg) return null
            const isCurrent = id === currentId
            return (
              <Link
                key={id}
                href={`/demos/${id}`}
                prefetch={false}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition cursor-pointer ${
                  isCurrent
                    ? 'bg-white/[0.04] cursor-default pointer-events-none'
                    : 'hover:bg-white/[0.04]'
                }`}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg.accentBg} text-xs font-bold ${cfg.accentText}`}>
                  {cfg.shortName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold ${isCurrent ? 'text-slate-400' : 'text-white'}`}>
                    {cfg.shortName}
                    {isCurrent && <span className="ml-2 text-[9px] text-slate-500">(current)</span>}
                  </p>
                  <p className="text-[10px] text-slate-500">{categoryLabels[id]}</p>
                </div>
                <span className={`rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.08em] ${cfg.accentBg} ${cfg.accentText}`}>
                  {cfg.statusLabel}
                </span>
              </Link>
            )
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-white/[0.06]">
          <Link
            href="/demos"
            onClick={onClose}
            className="flex items-center gap-2 text-[11px] text-slate-500 transition hover:text-slate-300 cursor-pointer"
          >
            <i className="ri-arrow-left-s-line w-3 h-3 flex items-center justify-center" />
            Back to Experience Centre
          </Link>
        </div>
      </div>
    </div>
  )
}