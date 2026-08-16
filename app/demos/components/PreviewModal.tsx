'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import type { Demo } from '../lib/data';
import { accentMap } from '../lib/data';

interface Props {
  demo: Demo | null;
  onClose: () => void;
}

export default function PreviewModal({ demo, onClose }: Props) {
  useEffect(() => {
    if (!demo) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [demo, onClose]);

  if (!demo) return null;

  const a = accentMap[demo.accent];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl rounded-2xl border border-white/[0.1] bg-[#0a1424] shadow-2xl shadow-black/50 overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <div className="flex items-center gap-3">
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${a.badge}`}>
              {demo.category}
            </span>
            <span className="text-sm font-medium text-white">{demo.title}</span>
            <span className="text-[10px] text-slate-500">• Preview</span>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white transition cursor-pointer">
            <i className="ri-close-line" />
          </button>
        </div>

        <div className="p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <h3 className="text-xl font-semibold text-white">{demo.headline}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">{demo.description}</p>

              <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">Quick Stats</p>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {demo.teaserStats.map((s) => (
                    <div key={s.label}>
                      <p className="text-[10px] text-slate-500">{s.label}</p>
                      <p className="mt-1 text-lg font-semibold text-white">{s.value}</p>
                      {s.trend && <p className="text-[10px] text-cyan-300">{s.trend}</p>}
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href={demo.href}
                prefetch={false}
                className={`mt-6 inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-6 py-3.5 text-sm font-semibold transition ${a.button} ${a.buttonHover}`}
              >
                Enter Full Experience
                <i className="ri-arrow-right-line" />
              </Link>
            </div>

            <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#060e1c]">
              <div className="flex items-center gap-1.5 border-b border-white/[0.05] px-4 py-3">
                <span className="h-2 w-2 rounded-full bg-red-300/50" />
                <span className="h-2 w-2 rounded-full bg-amber-300/50" />
                <span className="h-2 w-2 rounded-full bg-emerald-300/50" />
                <span className="ml-3 text-[10px] text-slate-500">{demo.title}</span>
              </div>
              <div className="p-4">
                {demo.previewType === 'command' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {[['Revenue', '£24.8M', '+18.8%'], ['Projects', '18', '14 live'], ['Capacity', '76%', 'Healthy']].map(([l, v, t]) => (
                        <div key={l} className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
                          <p className="text-[9px] text-slate-500">{l}</p>
                          <p className="mt-1 text-lg font-semibold text-white">{v}</p>
                          <p className="text-[9px] text-cyan-300">{t}</p>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
                      <p className="text-[9px] text-slate-500">Project Health</p>
                      <div className="mt-2 space-y-2">
                        {[['Client portal', 78], ['Automation build', 64], ['Website launch', 91]].map(([n, w]) => (
                          <div key={n}>
                            <div className="mb-1 flex justify-between text-[9px]"><span className="text-slate-400">{n}</span><span className="text-slate-500">{w}%</span></div>
                            <div className="h-1.5 rounded-full bg-slate-800">
                              <div className={`h-1.5 rounded-full ${w < 70 ? 'bg-orange-300' : 'bg-cyan-300'}`} style={{ width: `${w}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {demo.previewType === 'sales' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border border-orange-300/15 bg-orange-300/[0.04] p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-300/10"><i className="ri-sparkling-fill text-orange-200 text-sm" /></div>
                        <div><p className="text-sm font-medium text-white">Horizon Fitness enquiry</p><p className="text-xs text-slate-400">AI qualification in progress</p></div>
                      </div>
                      <span className="rounded-full bg-emerald-300/10 px-2 py-0.5 text-xs text-emerald-200">92/100</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {['New lead', 'Qualified', 'Proposal'].map((s, i) => (
                        <div key={s} className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
                          <p className="text-[9px] text-slate-500">{s}</p>
                          <div className={`mt-1.5 rounded border p-2 ${i === 1 ? 'border-orange-300/30 bg-orange-300/[0.06]' : 'border-white/10 bg-slate-900/40'}`}>
                            <p className="text-xs font-medium text-white">Horizon Fitness</p>
                            <p className="text-[9px] text-slate-500 mt-0.5">£8k–£12k</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {demo.previewType === 'portal' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div><p className="text-sm font-medium text-white">Platform build</p><p className="text-xs text-slate-500">Phase 3 of 5</p></div>
                      <span className="rounded-full bg-violet-300/10 px-2 py-0.5 text-xs text-violet-200">68%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800"><div className="h-1.5 w-[68%] rounded-full bg-violet-300" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
                        <div className="flex items-center gap-2"><i className="ri-computer-line text-violet-200" /><span className="text-xs text-slate-300">Design approval</span></div>
                        <div className="mt-2 rounded border border-white/10 bg-slate-900/70 p-2">
                          <div className="h-1 w-12 rounded-full bg-violet-300/60 mb-2" />
                          <div className="h-8 rounded bg-white/[0.05]" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        {[['ri-file-check-line', '2 files ready'], ['ri-message-2-line', '3 messages'], ['ri-wallet-line', 'Payment 14 Aug']].map(([icon, label]) => (
                          <div key={label} className="flex items-center gap-2 rounded border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-xs text-slate-400">
                            <i className={`${icon} text-violet-200`} />{label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}