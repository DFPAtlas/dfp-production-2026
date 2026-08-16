'use client'

import { useEffect, useRef, useState } from 'react'
import type { ProductConfig } from './types'

interface DemoEntryOverlayProps {
  product: ProductConfig
  onStartTour: () => void
  onExploreFreely: () => void
  extraAction?: { label: string; icon: string; action: () => void }
  storageKey: string
}

export default function DemoEntryOverlay({
  product,
  onStartTour,
  onExploreFreely,
  extraAction,
  storageKey,
}: DemoEntryOverlayProps) {
  const [visible, setVisible] = useState(true)
  const [animateOut, setAnimateOut] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    const skip = sessionStorage.getItem(storageKey)
    if (skip === '1') setVisible(false)
    return () => { mountedRef.current = false }
  }, [storageKey])

  const handleAction = (action: () => void) => {
    setAnimateOut(true)
    sessionStorage.setItem(storageKey, '1')
    setTimeout(() => {
      if (!mountedRef.current) return
      setVisible(false)
      action()
    }, 400)
  }

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-400 ${animateOut ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="absolute inset-0 bg-[#060a14]/80 backdrop-blur-sm" />

      <div className="relative mx-6 max-w-xl text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
          Digital Footprint · Interactive Demo
        </p>

        <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-[-0.02em] text-white sm:text-4xl">
          {product.shortName}
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          An interactive experience built by Digital Footprint.
          No signup, no real data.
        </p>

        <div className="mt-2 flex items-center justify-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <i className="ri-time-line w-3 h-3 flex items-center justify-center" />
            2–5 minutes
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <i className="ri-database-2-line w-3 h-3 flex items-center justify-center" />
            Fictional demo data
          </span>
          <span>·</span>
          <span>{product.statusLabel}</span>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => handleAction(onStartTour)}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 whitespace-nowrap cursor-pointer"
          >
            <i className="ri-play-fill text-base w-4 h-4 flex items-center justify-center" />
            Guided Experience
          </button>
          <button
            type="button"
            onClick={() => handleAction(onExploreFreely)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08] whitespace-nowrap cursor-pointer"
          >
            Explore Freely
            <i className="ri-arrow-right-line w-4 h-4 flex items-center justify-center" />
          </button>
        </div>

        {extraAction && (
          <button
            type="button"
            onClick={() => handleAction(extraAction.action)}
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-300 cursor-pointer"
          >
            <i className={`${extraAction.icon} text-base w-4 h-4 flex items-center justify-center`} />
            {extraAction.label}
          </button>
        )}
      </div>
    </div>
  )
}