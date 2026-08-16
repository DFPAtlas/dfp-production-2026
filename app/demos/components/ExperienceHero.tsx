'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useReducedMotion } from './useReducedMotion';

function SoftwareWall() {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const fragments = [
    {
      top: '5%', left: '5%', width: '55%', height: '42%', z: 1, delay: 0,
      title: 'Northstar OS',
      preview: (
        <div className="space-y-1.5 p-2">
          <div className="grid grid-cols-3 gap-1">
            {[['Revenue', '£24.8M', '+18.8%'], ['EBITDA', '£6.2M', '+14.3%'], ['Cash', '£11.7M', '+7.2%']].map(([l, v, t]) => (
              <div key={l} className="rounded border border-white/[0.05] bg-white/[0.02] p-1.5">
                <p className="text-[7px] text-slate-500">{l}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-white">{v}</p>
                <p className="text-[7px] text-emerald-300">{t}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-[1.2fr_0.8fr] gap-1">
            <div className="rounded border border-white/[0.05] bg-white/[0.02] p-1.5">
              <p className="text-[7px] text-slate-500">Business Pulse</p>
              <div className="mt-1 space-y-1">
                {[['Financial', 'Healthy'], ['Demand', 'Strong'], ['Delivery', 'At Risk'], ['People', 'Healthy']].map(([n, s]) => (
                  <div key={n} className="flex items-center justify-between"><span className="text-[6px] text-slate-400">{n}</span><span className={`text-[6px] ${s === 'At Risk' ? 'text-orange-300' : 'text-emerald-300'}`}>{s}</span></div>
                ))}
              </div>
            </div>
            <div className="rounded border border-white/[0.05] bg-white/[0.02] p-1.5">
              <p className="text-[7px] text-slate-500">Attention</p>
              <div className="mt-1 space-y-1">
                {[['Project Orion late', 'High'], ['Resource conflict', 'Med'], ['Supplier overdue', 'Med']].map(([a, l]) => (
                  <div key={a} className="flex items-center gap-1"><span className={`h-1 w-1 rounded-full ${l === 'High' ? 'bg-orange-300' : 'bg-amber-300'}`} /><span className="text-[6px] text-slate-400">{a}</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      top: '8%', right: '5%', width: '40%', height: '28%', z: 2, delay: 150,
      title: 'AI Sales',
      preview: (
        <div className="space-y-1.5 p-2">
          <div className="flex items-center justify-between rounded border border-orange-300/15 bg-orange-300/[0.04] p-1.5">
            <div className="flex items-center gap-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-orange-300/10"><i className="ri-sparkling-fill text-orange-200 text-[10px]" /></div>
              <div><p className="text-[7px] font-medium text-white">New website enquiry</p><p className="text-[6px] text-slate-400">AI qualifying...</p></div>
            </div>
            <span className="rounded-full bg-emerald-300/10 px-1 py-0.5 text-[6px] text-emerald-200">92/100</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {['New lead', 'Qualified', 'Proposal'].map((s, i) => (
              <div key={s} className="rounded border border-white/[0.05] bg-white/[0.02] p-1.5">
                <p className="text-[6px] text-slate-500">{s}</p>
                <div className={`mt-0.5 rounded border p-1 ${i === 1 ? 'border-orange-300/30 bg-orange-300/[0.06]' : 'border-white/10 bg-slate-900/40'}`}><p className="text-[6px] font-medium text-white">Horizon Fitness</p></div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      bottom: '25%', left: '2%', width: '32%', height: '26%', z: 0, delay: 250,
      title: 'Customer Portal',
      preview: (
        <div className="space-y-1.5 p-2">
          <div className="flex items-center justify-between">
            <div><p className="text-[7px] font-medium text-white">Platform build</p><p className="text-[6px] text-slate-500">Phase 3 of 5</p></div>
            <span className="rounded-full bg-violet-300/10 px-1.5 py-0.5 text-[6px] text-violet-200">68%</span>
          </div>
          <div className="h-0.5 rounded-full bg-slate-800"><div className="h-0.5 w-[68%] rounded-full bg-violet-300" /></div>
          <div className="space-y-1">
            {[['ri-file-check-line', '2 files ready'], ['ri-message-2-line', '3 new messages'], ['ri-wallet-line', 'Payment 14 Aug']].map(([icon, label]) => (
              <div key={label} className="flex items-center gap-1.5 rounded border border-white/[0.05] bg-white/[0.02] px-1.5 py-1 text-[6px] text-slate-400">
                <i className={`${icon} text-violet-200 text-[9px]`} />{label}
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      bottom: '30%', right: '3%', width: '38%', height: '35%', z: 1, delay: 350,
      title: 'QuickGuard',
      preview: (
        <div className="space-y-1.5 p-2">
          <div className="flex items-center justify-between rounded border border-emerald-300/15 bg-emerald-300/[0.04] p-1.5">
            <div><p className="text-[7px] font-medium text-white">Riverside Conference Centre</p><p className="text-[6px] text-slate-400">Event Security · Sat 18:00</p></div>
            <span className="rounded-full bg-emerald-300/10 px-1.5 py-0.5 text-[6px] text-emerald-200">Matching</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {[['Guards', '6', 'Available'], ['Distance', '£28/h', 'Demo rate'], ['Match', '4.9', 'Rating']].map(([l, v, t]) => (
              <div key={l} className="rounded border border-white/[0.05] bg-white/[0.02] p-1.5">
                <p className="text-[6px] text-slate-500">{l}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-white">{v}</p>
                <p className="text-[6px] text-emerald-300">{t}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded border border-white/[0.05] bg-white/[0.02] p-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-300/10 text-[8px] text-emerald-200 font-semibold">MR</div>
            <div><p className="text-[7px] font-medium text-white">Marcus Reed</p><p className="text-[6px] text-slate-400">Door Supervisor · 2.8 miles</p></div>
            <span className="ml-auto rounded-full bg-emerald-300/10 px-1 py-0.5 text-[6px] text-emerald-200">Verified</span>
          </div>
        </div>
      ),
    },
    {
      top: '55%', left: '38%', width: '28%', height: '22%', z: 0, delay: 450,
      title: 'GuardianHub',
      preview: (
        <div className="space-y-1.5 p-2">
          <div className="grid grid-cols-3 gap-1">
            {[['Sites', '24', 'Active'], ['Guards', '18', 'On duty'], ['Incidents', '2', 'Resolved']].map(([l, v, t]) => (
              <div key={l} className="rounded border border-white/[0.05] bg-white/[0.02] p-1.5">
                <p className="text-[6px] text-slate-500">{l}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-white">{v}</p>
                <p className="text-[6px] text-cyan-300">{t}</p>
              </div>
            ))}
          </div>
          <div className="rounded border border-white/[0.05] bg-white/[0.02] p-1.5">
            <p className="text-[7px] text-slate-500">Live Patrol Map</p>
            <div className="mt-1 h-10 rounded bg-slate-800/50 relative overflow-hidden">
              {[20, 35, 55, 70, 85].map((left, i) => (
                <div key={i} className="absolute top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-cyan-300/70" style={{ left: `${left}%` }} />
              ))}
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="relative h-full w-full">
      {fragments.map((f, i) => (
        <div
          key={f.title}
          className={`absolute rounded-xl border border-white/[0.07] bg-[#0a1424]/90 backdrop-blur-sm shadow-xl shadow-black/30 transition-all duration-1000`}
          style={{
            top: f.top, left: f.left, right: f.right, bottom: f.bottom,
            width: f.width, height: f.height,
            zIndex: f.z,
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)',
            transitionDelay: reduced ? '0ms' : `${f.delay}ms`,
          }}
        >
          <div className="flex items-center gap-1 border-b border-white/[0.05] px-2.5 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-red-300/50" />
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300/50" />
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300/50" />
            <span className="ml-1.5 text-[8px] text-slate-500">{f.title}</span>
          </div>
          {f.preview}
        </div>
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_45%_40%,rgba(34,211,238,0.06),transparent_55%)]" />
    </div>
  );
}

export default function ExperienceHero() {
  const [mounted, setMounted] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), reduced ? 0 : 80);
    return () => clearTimeout(t);
  }, [reduced]);

  return (
    <section className="relative flex min-h-screen flex-col justify-center overflow-hidden px-6 pb-12 pt-28 sm:px-8 lg:px-12">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(34,211,238,0.10),transparent_40%),radial-gradient(circle_at_72%_20%,rgba(251,146,60,0.06),transparent_35%),radial-gradient(circle_at_50%_70%,rgba(139,92,246,0.04),transparent_40%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.013)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.013)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:linear-gradient(to_bottom,black_30%,transparent_80%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div>
            <div
              className={`mb-8 inline-flex items-center gap-2.5 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200 transition-all duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
              style={{ transitionDelay: reduced ? '0ms' : '0ms' }}
            >
              <i className="ri-sparkling-line text-sm" />
              Digital Footprint — Experience Centre
            </div>

            <h1
              className={`max-w-xl text-[4rem] font-semibold leading-[0.96] tracking-[-0.04em] text-white transition-all duration-1000 sm:text-[5rem] lg:text-[5.5rem] ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
              style={{ transitionDelay: reduced ? '0ms' : '100ms' }}
            >
              Don&apos;t just look at our work.
              <br />
              <span className="bg-gradient-to-r from-cyan-200 via-white to-cyan-100 bg-clip-text text-transparent">
                Step inside it.
              </span>
            </h1>

            <p
              className={`mt-8 max-w-lg text-lg leading-8 text-slate-400 transition-all duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
              style={{ transitionDelay: reduced ? '0ms' : '250ms' }}
            >
              Explore interactive software experiences showing how Digital Footprint can run operations, automate sales, improve customer service and build complete digital platforms.
            </p>

            <div
              className={`mt-10 flex flex-col gap-3 sm:flex-row transition-all duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
              style={{ transitionDelay: reduced ? '0ms' : '380ms' }}
            >
              <a
                href="#featured-experience"
                className="group inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-xl bg-cyan-300 px-7 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 cursor-pointer"
              >
                Explore Experiences
                <i className="ri-arrow-down-line transition group-hover:translate-y-0.5" />
              </a>
              <Link
                href="/contact"
                prefetch={false}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/15 bg-white/[0.04] px-7 py-4 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/[0.08]"
              >
                Build Something For My Business
              </Link>
            </div>

            <div
              className={`mt-12 flex flex-wrap items-center gap-6 text-xs font-medium tracking-wide text-slate-500 transition-all duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
              style={{ transitionDelay: reduced ? '0ms' : '500ms' }}
            >
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                7 Interactive Experiences
              </span>
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                No Signup Required
              </span>
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-300" />
                Fictional Demo Data
              </span>
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-300" />
                Built by Digital Footprint
              </span>
            </div>
          </div>

          <div
            className={`relative hidden lg:block transition-all duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
            style={{ transitionDelay: reduced ? '0ms' : '280ms', minHeight: '520px' }}
          >
            <div className="absolute -inset-6 rounded-[2.5rem] bg-cyan-400/[0.04] blur-3xl" />
            <SoftwareWall />
          </div>
        </div>
      </div>
    </section>
  );
}