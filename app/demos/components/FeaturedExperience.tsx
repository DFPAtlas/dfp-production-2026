'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { allDemos, accentMap } from '../lib/data';
import { useReducedMotion } from './useReducedMotion';

export default function FeaturedExperience() {
  const demo = allDemos[0];
  const a = accentMap[demo.accent];
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!mountedRef.current) return;
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => {
      mountedRef.current = false;
      obs.disconnect();
    };
  }, []);

  return (
    <section id="featured-experience" ref={ref} className="relative px-6 py-20 sm:px-8 sm:py-28 lg:px-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_45%_30%,rgba(34,211,238,0.05),transparent_55%)]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">Featured Experience</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Run your whole business
            <br />
            <span className="text-slate-400">from one clear view.</span>
          </h2>
        </div>

        <div
          className={`group grid overflow-hidden rounded-[2rem] border border-cyan-300/12 bg-[#060e1c] transition-all duration-700 lg:grid-cols-[1fr_1.1fr] ${visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
          style={{ transitionDelay: reduced ? '0ms' : '100ms' }}
        >
          <div className="flex flex-col justify-between p-8 sm:p-10 lg:p-12">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
                  Operations
                </span>
                <span className="rounded-full bg-emerald-300/10 px-2.5 py-1 text-[10px] font-medium text-emerald-200">
                  Interactive
                </span>
              </div>

              <h3 className="text-2xl font-semibold text-white sm:text-3xl">
                {demo.title}
              </h3>
              <p className="mt-3 text-base leading-7 text-slate-400">
                {demo.description}
              </p>

              <div className="mt-8 grid grid-cols-5 gap-2">
                {demo.features.map((f) => (
                  <div key={f} className="flex flex-col items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-4 text-center">
                    <span className="text-[9px] font-medium text-slate-300">{f}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-xl border border-cyan-300/10 bg-cyan-300/[0.03] p-5">
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">Key Outcomes</p>
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
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={demo.href}
                prefetch={false}
                className="group/link inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-cyan-300 px-7 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
              >
                <i className="ri-play-fill" />
                Enter Command Centre
              </Link>
              <Link
                href={demo.href}
                prefetch={false}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/15 bg-white/[0.04] px-7 py-4 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/[0.08]"
              >
                90-second guided experience
              </Link>
            </div>
          </div>

          <div className="relative hidden lg:flex items-center justify-center bg-[#040b18]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.06),transparent_70%)]" />
            <div className="relative w-[90%] overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0a1628] shadow-2xl shadow-black/40">
              <div className="flex items-center gap-1.5 border-b border-white/[0.05] px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-red-300/50" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300/50" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/50" />
                <span className="ml-3 text-[10px] text-slate-500">Northstar OS — Command Centre</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {[['Revenue YTD', '£24.8M', '+18.8%'], ['EBITDA', '£6.2M', '+14.3%'], ['Cash Position', '£11.7M', '+7.2%']].map(([l, v, t]) => (
                    <div key={l} className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
                      <p className="text-[9px] uppercase tracking-wider text-slate-500">{l}</p>
                      <p className="mt-1 text-lg font-semibold text-white">{v}</p>
                      <p className="text-[9px] text-emerald-300">{t}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-[1.4fr_0.6fr] gap-2">
                  <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
                    <p className="text-[9px] uppercase tracking-wider text-slate-500">Business Pulse</p>
                    <div className="mt-2 space-y-2">
                      {[['Financial Health', 'Healthy'], ['Customer Demand', 'Strong'], ['Operational Delivery', 'At Risk'], ['People & Culture', 'Healthy']].map(([n, s]) => (
                        <div key={n} className="flex items-center justify-between">
                          <span className="text-[9px] text-slate-400">{n}</span>
                          <span className={`text-[9px] font-medium ${s === 'At Risk' ? 'text-orange-300' : 'text-emerald-300'}`}>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
                    <p className="text-[9px] uppercase tracking-wider text-slate-500">Attention</p>
                    <div className="mt-2 space-y-1.5">
                      {[['Project Orion behind schedule', 'High'], ['Resource conflict in Engineering', 'Medium'], ['Supplier payment overdue', 'Medium']].map(([a, l]) => (
                        <div key={a} className="flex items-center gap-1.5">
                          <span className={`h-1 w-1 rounded-full ${l === 'High' ? 'bg-orange-300' : 'bg-amber-300'}`} />
                          <span className="text-[9px] text-slate-400">{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
                  <p className="text-[9px] uppercase tracking-wider text-slate-500">Project Health</p>
                  <div className="mt-2 space-y-2">
                    {[['Client portal redesign', 78], ['Automation build Phase 2', 64], ['Website platform launch', 91]].map(([n, w]) => (
                      <div key={n}>
                        <div className="mb-1 flex justify-between text-[9px]"><span className="text-slate-400">{n}</span><span className="text-slate-500">{w}%</span></div>
                        <div className="h-1.5 rounded-full bg-slate-800">
                          <div className={`h-1.5 rounded-full transition-all duration-1000 ${w < 70 ? 'bg-orange-300' : 'bg-cyan-300'}`} style={{ width: `${w}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}