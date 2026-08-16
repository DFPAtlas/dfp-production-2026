'use client'

import { useState } from 'react'
import type { ProductConfig } from './types'

interface DemoEnvironmentNoticeProps {
  product: ProductConfig
}

export default function DemoEnvironmentNotice({ product }: DemoEnvironmentNoticeProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-300 cursor-pointer"
        aria-label="Demo environment information"
      >
        <i className="ri-information-line text-xs w-3 h-3 flex items-center justify-center" />
        Demo Data
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 mb-2 z-50 w-72 rounded-xl border border-white/[0.1] bg-[#0f1729] p-4 shadow-2xl shadow-black/40">
            <p className="text-[11px] leading-relaxed text-slate-300">
              This interactive experience uses fictional companies, people, projects and activity. Actions remain inside the demo and do not affect production systems.
            </p>
            {product.demoNoticeExtras.length > 0 && (
              <ul className="mt-2 space-y-1">
                {product.demoNoticeExtras.map((extra, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[10px] text-slate-400">
                    <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-slate-600" />
                    {extra}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}