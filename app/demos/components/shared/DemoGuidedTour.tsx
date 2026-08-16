'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { ProductConfig, TourStepData } from './types'

interface DemoGuidedTourProps {
  product: ProductConfig
  active: boolean
  step: number
  total: number
  steps: TourStepData[]
  onNext: () => void
  onBack: () => void
  onExit: () => void
  onShowMe?: () => void
}

export default function DemoGuidedTour({
  product,
  active,
  step,
  total,
  steps,
  onNext,
  onBack,
  onExit,
  onShowMe,
}: DemoGuidedTourProps) {
  const announceRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (active && announceRef.current) {
      announceRef.current.textContent = `Tour step ${step + 1} of ${total}: ${steps[step]?.title || ''}`
    }
  }, [active, step, total, steps])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!active) return
    if (e.key === 'Escape') { onExit(); return }
    if (e.key === 'ArrowRight') { if (step < total - 1) onNext(); return }
    if (e.key === 'ArrowLeft') { if (step > 0) onBack(); return }
  }, [active, step, total, onNext, onBack, onExit])

  useEffect(() => {
    if (!active) return
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [active, handleKeyDown])

  if (!active) return null

  const current = steps[step]
  const isLast = step === total - 1
  const isFirst = step === 0

  return (
    <>
      <div ref={announceRef} className="sr-only" aria-live="polite" role="status" />

      <div className="pointer-events-none fixed bottom-6 left-1/2 z-40 -translate-x-1/2 w-full max-w-md px-4">
        <div className="pointer-events-auto rounded-2xl border border-white/[0.1] bg-[#0b0f19]/95 px-5 py-4 shadow-2xl shadow-black/40 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${product.accentText}`}>
              Guided Experience
            </p>
            <button
              type="button"
              onClick={onExit}
              className="text-[10px] text-slate-500 transition hover:text-slate-300 cursor-pointer"
            >
              Exit Tour
            </button>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Step {step + 1} of {total}
          </p>

          <p className="mt-2 text-sm font-semibold text-white">
            {current.title}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            {current.instruction}
          </p>

          <div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-3">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={`h-1 rounded-full transition-all ${
                    i === step
                      ? 'w-5 bg-white'
                      : i < step
                        ? 'w-1 bg-emerald-400/50'
                        : 'w-1 bg-white/15'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-medium text-slate-400 transition hover:bg-white/[0.05] hover:text-white cursor-pointer"
                >
                  <i className="ri-arrow-left-line text-sm w-4 h-4 flex items-center justify-center" />
                  Back
                </button>
              )}

              {isLast ? (
                <button
                  type="button"
                  onClick={onExit}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-emerald-500 cursor-pointer"
                >
                  <i className="ri-check-line text-sm w-4 h-4 flex items-center justify-center" />
                  Finish
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (onShowMe) onShowMe()
                    onNext()
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-950 transition hover:bg-slate-100 cursor-pointer"
                >
                  Show Me
                  <i className="ri-arrow-right-line text-sm w-4 h-4 flex items-center justify-center" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}