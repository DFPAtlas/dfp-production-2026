'use client';

import { useState } from 'react';
import Link from 'next/link';
import { systemModules } from '../lib/data';

const colorMap: Record<string, { dot: string; border: string; bg: string; text: string }> = {
  cyan: { dot: 'bg-cyan-300', border: 'border-cyan-300/40', bg: 'bg-cyan-300/[0.08]', text: 'text-cyan-200' },
  orange: { dot: 'bg-orange-300', border: 'border-orange-300/40', bg: 'bg-orange-300/[0.08]', text: 'text-orange-200' },
  violet: { dot: 'bg-violet-300', border: 'border-violet-300/40', bg: 'bg-violet-300/[0.08]', text: 'text-violet-200' },
  amber: { dot: 'bg-amber-300', border: 'border-amber-300/40', bg: 'bg-amber-300/[0.08]', text: 'text-amber-200' },
  emerald: { dot: 'bg-emerald-300', border: 'border-emerald-300/40', bg: 'bg-emerald-300/[0.08]', text: 'text-emerald-200' },
  rose: { dot: 'bg-rose-300', border: 'border-rose-300/40', bg: 'bg-rose-300/[0.08]', text: 'text-rose-200' },
};

export default function BuildYourSystem() {
  const [selected, setSelected] = useState<string[]>(['command', 'portal', 'payments']);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  return (
    <section className="relative px-6 py-20 sm:px-8 sm:py-28 lg:px-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,rgba(251,146,60,0.04),transparent_55%)]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-200">Build Your Own System</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Your business won&apos;t look exactly like these.
              <br />
              <span className="text-slate-400">Your software shouldn&apos;t either.</span>
            </h2>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">
              We can take ideas from several experiences and build one system around the way your company actually works.
              Select the modules you need and see how they connect.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-2.5">
              {systemModules.map((mod) => {
                const c = colorMap[mod.color];
                const isActive = selected.includes(mod.id);
                return (
                  <button
                    key={mod.id}
                    onClick={() => toggle(mod.id)}
                    className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left transition-all duration-300 cursor-pointer ${
                      isActive
                        ? `${c.border} ${c.bg}`
                        : 'border-white/[0.06] bg-white/[0.01] hover:border-white/10'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${isActive ? c.dot : 'bg-slate-600'}`} />
                    <span className={`text-xs font-medium ${isActive ? c.text : 'text-slate-400'}`}>
                      {mod.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <Link
              href="/contact"
              prefetch={false}
              className="mt-8 inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-white px-7 py-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              Design My System
              <i className="ri-arrow-right-line" />
            </Link>
          </div>

          <div className="relative hidden lg:flex flex-col items-center">
            <div className="absolute -inset-8 rounded-[3rem] bg-orange-400/[0.04] blur-3xl" />

            <div className="relative w-full">
              <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                {systemModules.filter((m) => selected.includes(m.id)).map((mod) => {
                  const c = colorMap[mod.color];
                  return (
                    <div key={mod.id} className={`flex items-center gap-1.5 rounded-lg border ${c.border} ${c.bg} px-3 py-1.5`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                      <span className={`text-[10px] font-medium ${c.text}`}>{mod.label}</span>
                    </div>
                  );
                })}
              </div>

              {selected.length > 0 && (
                <svg className="w-full h-28" viewBox={`0 0 ${Math.max(selected.length * 120, 200)} 112`} xmlns="http://www.w3.org/2000/svg">
                  {selected.map((id, i) => {
                    const x = 40 + i * 80;
                    const mod = systemModules.find((m) => m.id === id);
                    const c = colorMap[mod?.color || 'cyan'];
                    return (
                      <g key={id}>
                        {i < selected.length - 1 && (
                          <line
                            x1={x + 24} y1={24} x2={x + 80 + 10} y2={24}
                            stroke="currentColor"
                            className="text-white/10"
                            strokeWidth="1"
                            strokeDasharray="4 3"
                          />
                        )}
                        <circle cx={x + 12} cy={24} r="14" className={c.border} fill="none" stroke="currentColor" strokeWidth="1" />
                        <circle cx={x + 12} cy={24} r="4" className={c.dot} />
                      </g>
                    );
                  })}
                </svg>
              )}

              <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Your Business System</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {selected.length === 0 ? 'Select modules above' : `${selected.length} module${selected.length > 1 ? 's' : ''} connected`}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {selected.length > 0 ? 'One integrated platform, designed around you.' : 'Build the system your business needs.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}