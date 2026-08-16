'use client'

import type { ProductConfig } from './types'

interface DemoStatusBadgeProps {
  product: ProductConfig
  className?: string
}

export default function DemoStatusBadge({ product, className = '' }: DemoStatusBadgeProps) {
  return (
    <span className="relative group inline-flex">
      <span className={`rounded ${product.accentBg} px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${product.accentText} ${className}`}>
        {product.statusLabel}
      </span>
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-50">
        <span className="block w-56 rounded-lg border border-white/[0.1] bg-[#0f1729] px-3 py-2 text-[10px] leading-relaxed text-slate-300 shadow-xl shadow-black/40 whitespace-normal text-center">
          {product.statusDescription}
        </span>
      </span>
    </span>
  )
}