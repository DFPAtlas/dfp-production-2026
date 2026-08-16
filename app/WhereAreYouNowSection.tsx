'use client';

import { motion } from '@/components/motion';
import Link from 'next/link';

const startingPoints = [
  {
    label: 'I need a new website',
    value: 'website',
    icon: 'ri-global-fill',
    color: '#06B6D4',
    bg: 'from-[#06B6D4]/10 to-[#0891B2]/5',
    border: '#06B6D4',
    service: 'Website Development',
    serviceIcon: 'ri-code-s-slash-line',
    detail: 'Brand-new site, designed and built from scratch',
  },
  {
    label: 'My current website needs improving',
    value: 'website-improvement',
    icon: 'ri-tools-fill',
    color: '#8B5CF6',
    bg: 'from-[#8B5CF6]/10 to-[#7C3AED]/5',
    border: '#8B5CF6',
    service: 'Website Improvement',
    serviceIcon: 'ri-magic-fill',
    detail: 'Redesign, performance or content improvements',
  },
  {
    label: 'I need more enquiries',
    value: 'lead-generation',
    icon: 'ri-user-search-fill',
    color: '#F97316',
    bg: 'from-[#F97316]/10 to-[#EA580C]/5',
    border: '#F97316',
    service: 'Lead Generation',
    serviceIcon: 'ri-bar-chart-fill',
    detail: 'Systems and content that convert visitors into leads',
  },
  {
    label: 'I want to automate my business',
    value: 'automation',
    icon: 'ri-robot-fill',
    color: '#10B981',
    bg: 'from-[#10B981]/10 to-[#059669]/5',
    border: '#10B981',
    service: 'AI & Automation',
    serviceIcon: 'ri-flow-chart',
    detail: 'AI agents, workflows and connected systems',
  },
  {
    label: 'I need a client or staff portal',
    value: 'portal',
    icon: 'ri-layout-fill',
    color: '#EC4899',
    bg: 'from-[#EC4899]/10 to-[#DB2777]/5',
    border: '#EC4899',
    service: 'Business Portals',
    serviceIcon: 'ri-dashboard-fill',
    detail: 'Private logins, dashboards and internal tools',
  },
  {
    label: 'I have a software or SaaS idea',
    value: 'saas',
    icon: 'ri-stack-fill',
    color: '#3B82F6',
    bg: 'from-[#3B82F6]/10 to-[#2563EB]/5',
    border: '#3B82F6',
    service: 'SaaS Development',
    serviceIcon: 'ri-code-box-fill',
    detail: 'Full product build from concept to live platform',
  },
];

const discoveryCard = {
  label: "I'm not sure what I need",
  value: 'discovery',
  icon: 'ri-compass-discover-fill',
  color: '#6366F1',
  service: 'Free Discovery Conversation',
  detail: "No brief needed — we'll help you work out the right approach for your business.",
};

export default function WhereAreYouNowSection() {
  return (
    <section
      id="where-are-you-now"
      className="py-24 px-6 bg-white relative overflow-hidden"
      style={{ scrollMarginTop: '5rem' }}
      aria-label="Where are you now"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(6,182,212,0.05),transparent_60%)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-px bg-gradient-to-r from-transparent via-[#06B6D4]/15 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-[#06B6D4] text-xs sm:text-sm uppercase tracking-[0.14em] font-semibold mb-4">
            Your starting point
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
            Where are you now?
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Choose the closest match. You do not need a technical brief &mdash; we will help you work out the next step.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
          {startingPoints.map((point, i) => (
            <motion.div
              key={point.value}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <Link
                href={`/contact?need=${point.value}&need_label=${encodeURIComponent(point.label)}`}
                className="group block rounded-2xl border border-slate-100 bg-white hover:border-slate-200 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer h-full focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ '--tw-ring-color': point.color } as React.CSSProperties}
              >
                <div className={`rounded-t-2xl bg-gradient-to-br ${point.bg} px-6 pt-6 pb-5`}>
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="icon-container w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-500"
                      style={{ backgroundColor: `${point.color}18`, border: `1.5px solid ${point.color}25`, '--accent': point.color } as React.CSSProperties}
                    >
                      <i
                          className={`${point.icon} text-2xl w-7 h-7 flex items-center justify-center icon-glow-target`}
                          style={{ color: point.color, '--accent': point.color } as React.CSSProperties}
                        />
                    </div>
                    <span
                      className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: `${point.color}12`, color: point.color }}
                    >
                      <i className={`${point.serviceIcon} text-xs w-3 h-3 flex items-center justify-center`} />
                      {point.service}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-800 leading-snug">
                    {point.label}
                  </h3>
                </div>

                <div className="px-6 py-4 flex items-center justify-between border-t border-slate-100">
                  <p className="text-xs text-slate-500 leading-relaxed flex-1 pr-3">
                    {point.detail}
                  </p>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:translate-x-0.5"
                    style={{ backgroundColor: `${point.color}10` }}
                  >
                    <i className="ri-arrow-right-line text-sm w-4 h-4 flex items-center justify-center" style={{ color: point.color }} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35 }}
        >
          <Link
            href={`/contact?need=${discoveryCard.value}&need_label=${encodeURIComponent(discoveryCard.label)}`}
            className="group block rounded-2xl border border-[#6366F1]/20 bg-gradient-to-r from-[#6366F1]/[0.04] to-[#8B5CF6]/[0.03] hover:from-[#6366F1]/[0.08] hover:to-[#8B5CF6]/[0.06] hover:-translate-y-0.5 hover:border-[#6366F1]/35 hover:shadow-lg hover:shadow-[#6366F1]/5 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:ring-offset-2 p-6"
          >
            <div className="flex items-center gap-5">
              <div
                className="icon-container w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-500"
                style={{ backgroundColor: 'rgba(99,102,241,0.12)', border: '1.5px solid rgba(99,102,241,0.2)', '--accent': '#6366F1' } as React.CSSProperties}
              >
                <i
                    className={`${discoveryCard.icon} text-2xl w-7 h-7 flex items-center justify-center icon-glow-target`}
                    style={{ color: '#6366F1', '--accent': '#6366F1' } as React.CSSProperties}
                  />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-[#6366F1]">{discoveryCard.label}</h3>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#6366F1]/10 text-[#6366F1]">
                    {discoveryCard.service}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{discoveryCard.detail}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#6366F1]/10 flex items-center justify-center flex-shrink-0 group-hover:translate-x-0.5 transition-transform duration-200">
                <i className="ri-arrow-right-line text-base w-5 h-5 flex items-center justify-center text-[#6366F1]" />
              </div>
            </div>
          </Link>
        </motion.div>
      </div>

      <style jsx>{`
        .icon-container {
          position: relative;
          transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.5s ease, border-color 0.4s ease;
        }
        .icon-container::after {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 18px;
          background: radial-gradient(circle at center, var(--accent) 0%, transparent 70%);
          opacity: 0;
          filter: blur(8px);
          transition: opacity 0.5s ease;
          z-index: -1;
        }
        a:hover .icon-container {
          transform: scale(1.08);
          box-shadow: 0 0 20px 2px color-mix(in srgb, var(--accent) 25%, transparent);
          border-color: color-mix(in srgb, var(--accent) 40%, transparent);
        }
        a:hover .icon-container::after {
          opacity: 1;
        }
        .icon-glow-target {
          filter: drop-shadow(0 0 0px var(--accent));
          transition: filter 0.5s ease, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes iconGlowPulse {
          0%, 100% { filter: drop-shadow(0 0 5px var(--accent)) drop-shadow(0 0 10px color-mix(in srgb, var(--accent) 50%, transparent)); }
          50% { filter: drop-shadow(0 0 8px var(--accent)) drop-shadow(0 0 18px color-mix(in srgb, var(--accent) 70%, transparent)); }
        }
        @keyframes iconFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        a:hover .icon-glow-target {
          animation: iconGlowPulse 1.6s ease-in-out infinite, iconFloat 2s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}