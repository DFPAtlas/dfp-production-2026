'use client'

import { useEffect, useRef } from 'react'

interface ResetConfirmDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ResetConfirmDialog({ open, onConfirm, onCancel }: ResetConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKey)
    const el = dialogRef.current
    if (el) {
      const cancelBtn = el.querySelector<HTMLElement>('[data-cancel]')
      cancelBtn?.focus()
    }
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-label="Reset experience confirmation"
        className="relative w-full max-w-sm rounded-2xl border border-white/[0.1] bg-[#0b0f19] p-6 shadow-2xl"
      >
        <h3 className="text-sm font-semibold text-white">Reset this experience?</h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          This will restore the original fictional demo data. Your progress and any actions you have taken will be cleared.
        </p>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            data-cancel
            onClick={onCancel}
            className="rounded-xl px-4 py-2.5 text-xs font-medium text-slate-400 transition hover:bg-white/[0.04] hover:text-white cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-500 cursor-pointer"
          >
            Reset Demo
          </button>
        </div>
      </div>
    </div>
  )
}