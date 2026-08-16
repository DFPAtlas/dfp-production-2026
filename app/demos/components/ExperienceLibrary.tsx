'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { allDemos, accentMap, categoryFilterLabels } from '../lib/data';
import type { Demo } from '../lib/data';
import { useReducedMotion } from './useReducedMotion';

function DemoCard({ demo, index, openPreview }: { demo: Demo; index: number; openPreview: (d: Demo) => void }) {
  const a = accentMap[demo.accent];
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotion();
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
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => {
      mountedRef.current = false;
      obs.disconnect();
    };
  }, []);

  const statusColors: Record<string, string> = {
    'Interactive': 'bg-emerald-300/10 text-emerald-200',
    'Guided Experience': 'bg-cyan-300/10 text-cyan-200',
    'Product Preview': 'bg-amber-300/10 text-amber-200',
  };

  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden rounded-2xl border ${a.cardBorder} bg-[#060e1c] transition-all duration-700 hover:border-white/20 hover:bg-[#08101e] ${a.cardHover} ${visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
      style={{ transitionDelay: reduced ? '0ms' : `${index * 80}ms` }}
    >
      <div className={`absolute -inset-1 rounded-2xl bg-gradient-to-br ${a.glow} opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-60`} />

      <div className="relative flex h-full flex-col p-6 sm:p-7">
        <div className="mb-5 flex items-center justify-between">
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${a.badge}`}>
            {demo.category}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${statusColors[demo.status] || 'bg-slate-300/10 text-slate-300'}`}>
            {demo.status}
          </span>
        </div>

        <div className="flex items-start gap-3 mb-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${a.icon}`}>
            <i className={`${
              demo.category === 'Operations' ? 'ri-dashboard-line' :
              demo.category === 'AI & Sales' ? 'ri-brain-line' :
              demo.category === 'Customer Experience' ? 'ri-customer-service-line' :
              demo.category === 'Marketplaces' ? 'ri-store-2-line' :
              demo.category === 'Property' ? 'ri-building-line' :
              'ri-calendar-event-line'
            } text-base`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{demo.title}</h3>
          </div>
        </div>

        <h4 className="text-xl font-semibold text-white leading-tight">
          {demo.headline}
        </h4>
        <p className="mt-2.5 text-sm leading-6 text-slate-400 flex-1">
          {demo.description}
        </p>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {demo.features.slice(0, 4).map((f) => (
            <span key={f} className="rounded-full border border-white/[0.07] bg-white/[0.02] px-2.5 py-1 text-[10px] text-slate-400">
              {f}
            </span>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Link
            href={demo.href}
            prefetch={false}
            className={`group/link inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-semibold transition ${a.button} ${a.buttonHover}`}
          >
            {demo.category === 'Operations' ? 'Run the Business' :
             demo.category === 'AI & Sales' ? 'Run the Sales Engine' :
             demo.category === 'Customer Experience' ? 'Enter the Portal' :
             demo.category === 'Marketplaces' ? 'Explore QuickGuard' :
             demo.category === 'Property' ? 'Explore LetHub' :
             'Explore Synqoro'}
            <i className="ri-arrow-right-line transition group-hover/link:translate-x-0.5" />
          </Link>

          {demo.flagship && (
            <button
              onClick={() => openPreview(demo)}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-white/15 hover:bg-white/[0.05] cursor-pointer"
            >
              <i className="ri-eye-line" />
              Preview
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ExperienceLibrary({ openPreview }: { openPreview: (d: Demo) => void }) {
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = activeFilter === 'All'
    ? allDemos
    : allDemos.filter((d) => d.category === activeFilter);

  return (
    <section className="relative px-6 py-20 sm:px-8 sm:py-28 lg:px-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(139,92,246,0.03),transparent_50%)]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-200">Choose Your Experience</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Every experience shows a different part of what we build.
          </h2>
        </div>

        <div className="mb-10 flex flex-wrap gap-2">
          {categoryFilterLabels.map((cat) => {
            const isActive = activeFilter === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveFilter(cat.key)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-950'
                    : 'border border-white/[0.08] bg-white/[0.02] text-slate-400 hover:border-white/15 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((demo, i) => (
            <DemoCard key={demo.id} demo={demo} index={i} openPreview={openPreview} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-16 text-center">
            <p className="text-slate-400">No experiences match this category.</p>
            <button onClick={() => setActiveFilter('All')} className="mt-3 text-sm font-medium text-cyan-200 hover:text-cyan-100 cursor-pointer">
              Show all experiences
            </button>
          </div>
        )}
      </div>
    </section>
  );
}