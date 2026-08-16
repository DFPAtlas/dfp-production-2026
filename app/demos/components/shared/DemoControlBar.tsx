'use client'

import Link from 'next/link'
import type { DemoControlBarProps } from './types'

export default function DemoControlBar({
  product,
  onStartTour,
  onReset,
  onBuildCTA,
  tourActive,
  onToggleSidebar,
  onSwitchExperience,
  extraLeftContent,
  extraRightContent,
}: DemoControlBarProps) {
  return (
    <header className={`flex h-14 shrink-0 items-center border-b ${product.borderColor} ${product.bgHeader} px-4 backdrop-blur-sm`}>
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className={`rounded p-1.5 ${product.textMuted} transition ${product.buttonHoverBg} ${product.textPrimary} lg:hidden`}
            aria-label="Toggle sidebar"
          >
            <i className="ri-menu-line text-base w-4 h-4 flex items-center justify-center" />
          </button>
        )}

        <Link
          href="/demos"
          className={`inline-flex items-center gap-1 text-[11px] font-medium ${product.textMuted} transition hover:${product.textSecondary}`}
        >
          <i className="ri-arrow-left-s-line text-sm w-4 h-4 flex items-center justify-center" />
          <span className="hidden sm:inline">Experiences</span>
        </Link>

        <span className={`hidden h-4 w-px ${product.borderColor} sm:block`} />

        <span className={`text-[11px] font-semibold ${product.textPrimary}`}>Digital Footprint</span>

        <span className={`hidden h-4 w-px ${product.borderColor} sm:block`} />

        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-semibold ${product.textPrimary}`}>
            {product.shortName}
          </span>
          <span className={`rounded ${product.accentBg} px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${product.accentText}`}>
            {product.statusLabel}
          </span>
        </div>

        {extraLeftContent}
      </div>

      <div className="hidden items-center gap-2 md:flex flex-1 justify-center">
        <span className={`text-[11px] font-medium ${product.textSecondary}`}>{product.workspaceOrg}</span>
        <span className={`inline-flex items-center gap-1.5 rounded-full border ${product.accentBorder} ${product.accentBg} px-2 py-0.5 text-[10px] font-medium ${product.accentText}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          Demo environment
        </span>
        {extraRightContent}
      </div>

      <div className="flex items-center gap-1 ml-auto">
        <button
          type="button"
          onClick={onStartTour}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium ${product.textMuted} transition ${product.buttonHoverBg} hover:${product.textPrimary} whitespace-nowrap cursor-pointer`}
        >
          <i className="ri-compass-3-line text-sm w-4 h-4 flex items-center justify-center" />
          <span className="hidden sm:inline">
            {tourActive ? 'Restart Tour' : 'Guided Experience'}
          </span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium ${product.textMuted} transition ${product.buttonHoverBg} hover:${product.textPrimary} whitespace-nowrap cursor-pointer`}
        >
          <i className="ri-refresh-line text-sm w-4 h-4 flex items-center justify-center" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        {onSwitchExperience && (
          <button
            type="button"
            onClick={onSwitchExperience}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium ${product.textMuted} transition ${product.buttonHoverBg} hover:${product.textPrimary} whitespace-nowrap cursor-pointer`}
          >
            <i className="ri-stack-line text-sm w-4 h-4 flex items-center justify-center" />
            <span className="hidden sm:inline">Switch</span>
          </button>
        )}

        <button
          type="button"
          onClick={onBuildCTA}
          className={`ml-1 inline-flex items-center gap-1.5 rounded-lg ${product.ctaBg} px-3 py-1.5 text-[11px] font-semibold ${product.ctaTextColor} transition ${product.ctaHoverBg} whitespace-nowrap cursor-pointer`}
        >
          <i className={`ri-sparkling-line text-sm ${product.iconColor} w-4 h-4 flex items-center justify-center`} />
          <span className="hidden sm:inline">{product.ctaText}</span>
          <span className="sm:hidden">Build</span>
        </button>
      </div>
    </header>
  )
}