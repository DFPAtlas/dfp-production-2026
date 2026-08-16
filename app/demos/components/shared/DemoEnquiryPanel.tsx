'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { ProductConfig } from './types'

interface DemoEnquiryPanelProps {
  product: ProductConfig
  open: boolean
  onClose: () => void
}

export default function DemoEnquiryPanel({ product, open, onClose }: DemoEnquiryPanelProps) {
  const [selected, setSelected] = useState<string[]>([])
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    const el = dialogRef.current
    if (el) {
      const first = el.querySelector<HTMLElement>('button')
      first?.focus()
    }
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  const toggle = (opt: string) => {
    setSelected((prev) =>
      prev.includes(opt) ? prev.filter((s) => s !== opt) : [...prev, opt]
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Enquiry panel"
        className="relative w-full max-w-lg rounded-2xl border border-white/[0.1] bg-[#0b0f19] p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${product.accentText}`}>
              {product.shortName}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              {product.enquiryHeading}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/[0.05] hover:text-white cursor-pointer"
            aria-label="Close"
          >
            <i className="ri-close-line text-lg w-5 h-5 flex items-center justify-center" />
          </button>
        </div>

        <p className="mt-3 text-sm text-slate-400">
          What interests you?
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {product.enquiryModules.map((opt) => {
            const active = selected.includes(opt)
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                  active
                    ? `${product.accentBorder} ${product.accentBg} ${product.accentText}`
                    : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:text-slate-200 hover:border-white/[0.14]'
                }`}
              >
                {active && <i className="ri-check-line mr-1 w-3 h-3 inline-flex items-center justify-center" />}
                {opt}
              </button>
            )
          })}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-xs font-medium text-slate-400 transition hover:bg-white/[0.04] hover:text-white cursor-pointer"
          >
            Continue exploring
          </button>
          <Link
            href={`/contact?source=${product.enquirySource}${selected.length > 0 ? `&modules=${encodeURIComponent(selected.join(','))}` : ''}`}
            onClick={onClose}
            className={`inline-flex items-center gap-2 rounded-xl ${product.ctaBg} px-5 py-2.5 text-xs font-semibold ${product.ctaTextColor} transition ${product.ctaHoverBg} cursor-pointer`}
          >
            <i className="ri-message-3-line text-sm w-4 h-4 flex items-center justify-center" />
            Talk To Digital Footprint
          </Link>
        </div>
      </div>
    </div>
  )
}