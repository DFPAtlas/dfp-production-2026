'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { ProductConfig } from './types'

interface DemoCompletionOverlayProps {
  product: ProductConfig
  open: boolean
  onExploreAgain: () => void
}

export default function DemoCompletionOverlay({
  product,
  open,
  onExploreAgain,
}: DemoCompletionOverlayProps) {
  const [animatingOut, setAnimatingOut] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  if (!open) return null

  const handleAction = (action: () => void) => {
    setAnimatingOut(true)
    setTimeout(() => {
      if (!mountedRef.current) return
      action()
    }, 350)
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-400 ${animatingOut ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="absolute inset-0 bg-[#060a14]/85 backdrop-blur-xl" />

      <div className="relative mx-6 max-w-xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
          <i className="ri-check-line text-emerald-400 text-3xl w-8 h-8 flex items-center justify-center" />
        </div>

        <p className={`mt-4 text-[10px] font-semibold uppercase tracking-[0.25em] ${product.accentText}`}>
          Experience Complete
        </p>

        <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
          {product.completionHeading}
        </h2>

        <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <p className="text-xs font-semibold text-slate-300 mb-3">You:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-left">
            {product.completionAccomplishments.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <i className="ri-check-line text-emerald-400 text-xs mt-0.5 w-3 h-3 flex items-center justify-center shrink-0" />
                <span className="text-[11px] text-slate-400">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-4 text-sm font-medium text-white">
          {product.completionOutcome}
        </p>

        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/contact?source=${product.enquirySource}`}
            onClick={() => handleAction(() => {})}
            className={`inline-flex items-center gap-2 rounded-xl ${product.ctaBg} px-6 py-3 text-sm font-semibold ${product.ctaTextColor} transition ${product.ctaHoverBg} whitespace-nowrap cursor-pointer`}
          >
            {product.completionCtaText}
            <i className="ri-arrow-right-line w-4 h-4 flex items-center justify-center" />
          </Link>
          <button
            type="button"
            onClick={() => handleAction(onExploreAgain)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08] whitespace-nowrap cursor-pointer"
          >
            <i className="ri-refresh-line w-4 h-4 flex items-center justify-center" />
            Explore Again
          </button>
        </div>
      </div>
    </div>
  )
}