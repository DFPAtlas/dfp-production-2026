'use client';

import { motion } from '@/components/motion';
import Link from 'next/link';

const routes = [
  {
    id: 'digital-launch',
    title: 'Digital Launch',
    audience: 'New and smaller businesses',
    description: 'Build the professional foundation your business needs to be found, trusted and contacted.',
    includes: [
      'Brand direction',
      'Business website',
      'Professional email',
      'Lead capture',
      'Launch support',
    ],
    cta: 'Explore Digital Launch',
    href: '/services#digital-launch',
    icon: 'ri-rocket-line',
    color: '#06B6D4',
    popular: false,
  },
  {
    id: 'digital-growth',
    title: 'Digital Growth',
    audience: 'Established businesses',
    description: 'Improve how customers reach you and how your team manages enquiries, bookings and everyday work.',
    includes: [
      'Website improvement',
      'CRM and lead flow',
      'Bookings and quotations',
      'Client portals',
      'Business automation',
    ],
    cta: 'Explore Digital Growth',
    href: '/services#digital-growth',
    icon: 'ri-line-chart-line',
    color: '#A855F7',
    popular: true,
  },
  {
    id: 'digital-transformation',
    title: 'Digital Transformation',
    audience: 'Growing companies',
    description: 'Design a connected operating system around the way your business actually works.',
    includes: [
      'Bespoke software',
      'Staff dashboards',
      'System integrations',
      'AI agents',
      'Ongoing management',
    ],
    cta: 'Explore Digital Transformation',
    href: '/services#digital-transformation',
    icon: 'ri-settings-3-line',
    color: '#F97316',
    popular: false,
  },
];

export default function ServiceRoutesSection() {
  return (
    <section
      id="service-routes"
      className="py-24 px-6 bg-[#060F1E] relative overflow-hidden"
      style={{ scrollMarginTop: '5rem' }}
      aria-label="Ways to work with DFP"
    >
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(circle at 50% 50%, rgba(6,182,212,0.04) 0%, transparent 60%)',
      }} />
      <div className="absolute inset-0 opacity-[0.01]" style={{
        backgroundImage: 'radial-gradient(circle, rgba(6,182,212,0.5) 1px, transparent 1px)',
        backgroundSize: '44px 44px',
      }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-px bg-gradient-to-r from-transparent via-[#06B6D4]/15 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-[#06B6D4] text-xs sm:text-sm uppercase tracking-[0.14em] font-semibold mb-4">
            Ways to work with DFP
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
            A clear route for every stage.
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Start with what you need today. The system can grow as your business does.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {routes.map((route, i) => (
            <motion.div
              key={route.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`group relative rounded-2xl border p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                route.popular
                  ? 'border-[#A855F7]/30 bg-[#A855F7]/[0.03] hover:border-[#A855F7]/50 shadow-lg shadow-[#A855F7]/5'
                  : 'border-white/[0.06] bg-white/[0.01] hover:border-white/[0.15]'
              }`}
            >
              {route.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#A855F7] text-white text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                  Most popular
                </div>
              )}

              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors group-hover:scale-105"
                style={{ backgroundColor: `${route.color}15` }}
              >
                <i className={`${route.icon} text-xl w-6 h-6 flex items-center justify-center`} style={{ color: route.color }} />
              </div>

              <h3 className="text-xl font-bold text-white mb-1">{route.title}</h3>
              <p className="text-xs font-medium mb-4" style={{ color: route.color }}>{route.audience}</p>
              <p className="text-sm text-slate-400 leading-relaxed mb-5">{route.description}</p>

              <ul className="space-y-2 mb-6 flex-1">
                {route.includes.map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-slate-300">
                    <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: `${route.color}60` }} />
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                href={route.href}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 cursor-pointer whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#06B6D4]"
                style={{ backgroundColor: `${route.color}20`, border: `1px solid ${route.color}30` }}
              >
                {route.cta}
                <i className="ri-arrow-right-line w-4 h-4 flex items-center justify-center group-hover:translate-x-0.5 transition-transform duration-200" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}