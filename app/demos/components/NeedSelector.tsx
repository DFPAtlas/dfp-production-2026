'use client';

import { useState, useMemo, useCallback } from 'react';
import { businessNeeds, allDemos, accentMap } from '../lib/data';

const displayedNeeds = [
  { id: 'run-business', label: 'Run my business better', icon: 'ri-bar-chart-grouped-line' },
  { id: 'get-customers', label: 'Get more customers', icon: 'ri-rocket-line' },
  { id: 'improve-experience', label: 'Improve customer experience', icon: 'ri-heart-pulse-line' },
  { id: 'manage-staff', label: 'Manage staff', icon: 'ri-team-line' },
  { id: 'automate', label: 'Automate\nrepetitive work', icon: 'ri-settings-3-line' },
  { id: 'build-marketplace', label: 'Build a marketplace', icon: 'ri-stack-line' },
  { id: 'bespoke', label: 'Something bespoke', icon: 'ri-lightbulb-line', subtitle: "Let's create something\nunique for you." },
];

const floatingParticles = [
  { left: '8%', top: '12%', size: 2, opacity: 0.25, delay: 0 },
  { left: '15%', top: '22%', size: 1.5, opacity: 0.15, delay: 1.2 },
  { left: '22%', top: '8%', size: 2.5, opacity: 0.2, delay: 0.8 },
  { left: '35%', top: '18%', size: 1, opacity: 0.3, delay: 2.1 },
  { left: '45%', top: '6%', size: 2, opacity: 0.2, delay: 0.5 },
  { left: '55%', top: '20%', size: 1.5, opacity: 0.25, delay: 1.5 },
  { left: '65%', top: '10%', size: 2, opacity: 0.15, delay: 0.3 },
  { left: '72%', top: '24%', size: 1, opacity: 0.2, delay: 1.8 },
  { left: '78%', top: '14%', size: 2.5, opacity: 0.25, delay: 0.9 },
  { left: '85%', top: '8%', size: 1.5, opacity: 0.2, delay: 1.1 },
  { left: '92%', top: '20%', size: 2, opacity: 0.15, delay: 0.6 },
  { left: '12%', top: '30%', size: 1, opacity: 0.1, delay: 2.5 },
  { left: '88%', top: '28%', size: 1.5, opacity: 0.1, delay: 1.9 },
  { left: '50%', top: '32%', size: 1, opacity: 0.08, delay: 3.2 },
  { left: '28%', top: '5%', size: 1, opacity: 0.12, delay: 2.8 },
  { left: '68%', top: '30%', size: 1, opacity: 0.1, delay: 1.4 },
  { left: '5%', top: '18%', size: 1.5, opacity: 0.18, delay: 0.2 },
  { left: '95%', top: '15%', size: 2, opacity: 0.12, delay: 2.6 },
];

export default function NeedSelector() {
  const [selected, setSelected] = useState<string | null>(null);

  const needData = useMemo(() => {
    if (!selected) return null;
    return businessNeeds.find((n) => n.id === selected);
  }, [selected]);

  const recommendedDemos = useMemo(() => {
    if (!needData?.recommendations) return [];
    return allDemos.filter((d) => needData.recommendations!.includes(d.id));
  }, [needData]);

  const handleNav = useCallback((href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.assign(href);
  }, []);

  return (
    <section
      id="need-selector"
      className="relative overflow-hidden px-5 py-20 sm:px-8 sm:py-28 lg:px-12"
      style={{ background: '#0B0F19' }}
    >
      {/* Dot texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Soft radial glow behind heading */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[1100px] -translate-x-1/2"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(56,189,248,0.06), transparent 70%)',
        }}
      />

      {/* Floating particles behind heading */}
      {floatingParticles.map((p, i) => (
        <div
          key={i}
          className="pointer-events-none absolute rounded-full"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            background: '#7dd3fc',
            animation: `floatParticle 4s ease-in-out ${p.delay}s infinite alternate`,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes floatParticle {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-8px); }
        }
      `}</style>

      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-14 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">
            Not Sure Which Demo To Try?
          </p>
          <h2
            className="mt-4 text-[2.4rem] font-normal leading-tight tracking-tight text-white sm:text-[3.2rem]"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            What would you like to improve?
          </h2>
        </div>

        {/* Card Grid: 3 top, 4 bottom */}
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-3 sm:grid-cols-3">
            {displayedNeeds.slice(0, 3).map((need) => {
              const isActive = selected === need.id;
              return (
                <button
                  key={need.id}
                  onClick={() => setSelected(isActive ? null : need.id)}
                  className={`group flex flex-col items-center gap-5 rounded-xl border text-center transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'border-sky-400/30 bg-[#0F1623] shadow-[0_0_40px_rgba(56,189,248,0.08),inset_0_1px_0_rgba(56,189,248,0.1)]'
                      : 'border-white/[0.08] bg-[#0D111A] hover:border-white/[0.14] hover:bg-[#101520]'
                  }`}
                  style={{ padding: '2rem 1.5rem 2.25rem' }}
                >
                  <i
                    className={`${need.icon} text-[2.25rem] leading-none transition-all duration-300 ${
                      isActive
                        ? 'text-sky-300 drop-shadow-[0_0_12px_rgba(125,211,252,0.35)]'
                        : 'text-sky-400/60 group-hover:text-sky-300/80'
                    }`}
                  />
                  <span className="whitespace-pre-line text-[15px] font-medium leading-snug text-slate-300">
                    {need.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            {displayedNeeds.slice(3).map((need) => {
              const isActive = selected === need.id;
              return (
                <button
                  key={need.id}
                  onClick={() => setSelected(isActive ? null : need.id)}
                  className={`group flex flex-col items-center gap-5 rounded-xl border text-center transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'border-sky-400/30 bg-[#0F1623] shadow-[0_0_40px_rgba(56,189,248,0.08),inset_0_1px_0_rgba(56,189,248,0.1)]'
                      : 'border-white/[0.08] bg-[#0D111A] hover:border-white/[0.14] hover:bg-[#101520]'
                  }`}
                  style={{ padding: '2rem 1.25rem 2.25rem' }}
                >
                  <i
                    className={`${need.icon} text-[2.25rem] leading-none transition-all duration-300 ${
                      isActive
                        ? 'text-sky-300 drop-shadow-[0_0_12px_rgba(125,211,252,0.35)]'
                        : 'text-sky-400/60 group-hover:text-sky-300/80'
                    }`}
                  />
                  <div>
                    <span className="whitespace-pre-line text-[15px] font-medium leading-snug text-slate-300">
                      {need.label}
                    </span>
                    {'subtitle' in need && (
                      <p className="mt-1.5 whitespace-pre-line text-[11px] leading-relaxed text-slate-500">
                        {need.subtitle}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recommendations panel */}
        {selected && recommendedDemos.length > 0 && (
          <div className="mx-auto mt-10 max-w-5xl overflow-hidden rounded-2xl border border-sky-400/15 bg-[#0C1220] backdrop-blur-sm">
            {/* Panel header */}
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-6 py-4 sm:px-8">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-400/10">
                <i className="ri-sparkling-line text-sm text-sky-300" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">
                Recommended Experiences
              </p>
              <span className="ml-auto text-[11px] text-slate-500">
                {recommendedDemos.length} demo{recommendedDemos.length > 1 ? 's' : ''} match your goal
              </span>
            </div>

            <div className="p-6 sm:p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                {recommendedDemos.map((demo) => {
                  const a = accentMap[demo.accent];
                  return (
                    <div
                      key={demo.id}
                      className={`group relative overflow-hidden rounded-xl border ${a.cardBorder} ${a.previewBg} ${a.cardHover} transition-all duration-300`}
                    >
                      {/* Top accent bar */}
                      <div className={`h-[3px] w-full ${a.bar} opacity-60`} />

                      <div className="p-5">
                        {/* Header row */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${a.badge}`}>
                              {demo.badge}
                            </span>
                            {demo.flagship && (
                              <span className="inline-flex items-center gap-1 rounded-md border border-amber-300/20 bg-amber-300/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
                                <i className="ri-star-fill text-[9px]" />
                                Flagship
                              </span>
                            )}
                          </div>
                          <span className="shrink-0 text-[11px] text-slate-500">
                            {demo.duration}
                          </span>
                        </div>

                        {/* Title & description */}
                        <h4 className="mt-3 text-[15px] font-semibold text-white">
                          {demo.title}
                        </h4>
                        <p className="mt-1 text-[13px] leading-relaxed text-slate-400">
                          {demo.description}
                        </p>

                        {/* Teaser stats */}
                        {demo.teaserStats.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-3">
                            {demo.teaserStats.map((stat, idx) => (
                              <div
                                key={idx}
                                className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2"
                              >
                                <p className="text-[11px] text-slate-500">{stat.label}</p>
                                <p className="mt-0.5 text-[13px] font-semibold text-white">
                                  {stat.value}
                                </p>
                                {stat.trend && (
                                  <p className="mt-0.5 text-[10px] text-slate-500">{stat.trend}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Features */}
                        <div className="mt-4 flex flex-wrap gap-2">
                          {demo.features.slice(0, 4).map((feat, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-400"
                            >
                              <i className="ri-check-line text-[10px] text-slate-500" />
                              {feat}
                            </span>
                          ))}
                        </div>

                        {/* CTA */}
                        <div className="mt-5 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500">
                            {demo.status}
                          </span>
                          <a
                            href={demo.href}
                            onClick={handleNav(demo.href)}
                            className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition cursor-pointer ${a.button} ${a.buttonHover}`}
                          >
                            Launch Demo
                            <i className="ri-arrow-right-line" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Bespoke empty state */}
        {selected && needData && needData.recommendations.length === 0 && (
          <div className="mx-auto mt-10 max-w-5xl overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0C1220]">
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-6 py-4 sm:px-8">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-400/10">
                <i className="ri-lightbulb-line text-sm text-amber-300" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                Bespoke Solution
              </p>
            </div>
            <div className="p-6 text-center sm:p-8">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-300/10">
                <i className="ri-lightbulb-line text-2xl text-amber-200" />
              </div>
              <p className="text-lg font-medium text-white">
                We design around your unique process.
              </p>
              <p className="mt-2 max-w-md mx-auto text-sm leading-relaxed text-slate-400">
                Every business is different. Let&apos;s talk through what you need and design something that fits exactly — no off-the-shelf compromises.
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                {['Custom Workflows', 'AI Agents', 'Integrations', 'White-Label', 'Marketplaces'].map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] text-slate-400">
                    <i className="ri-check-line text-[10px] text-slate-500" />
                    {tag}
                  </span>
                ))}
              </div>
              <a
                href="/contact"
                onClick={handleNav('/contact')}
                className="mt-6 inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 cursor-pointer"
              >
                Tell Us What You&apos;re Building
                <i className="ri-arrow-right-line" />
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}