'use client';

import { motion } from '@/components/motion';
import Link from 'next/link';

const audiences = [
  {
    title: 'Independent Businesses',
    copy: 'Websites and connected systems for trades, dealerships, property companies, security providers, wedding suppliers and professional services.',
    cta: 'Solutions for businesses',
    href: '/who-we-help#independent-businesses',
    icon: 'ri-store-2-line',
    color: '#06B6D4',
  },
  {
    title: 'Founders & Start-ups',
    copy: 'Turn a strong idea into a credible brand, customer journey, working MVP or launch-ready SaaS platform.',
    cta: 'Bring your idea to life',
    href: '/who-we-help#founders',
    icon: 'ri-rocket-line',
    color: '#A855F7',
  },
  {
    title: 'Growing Companies',
    copy: 'Replace spreadsheets, repeated admin and disconnected software with portals, automation and bespoke business systems.',
    cta: 'Transform your operations',
    href: '/who-we-help#growing-companies',
    icon: 'ri-line-chart-line',
    color: '#F97316',
  },
  {
    title: 'Agency Partners',
    copy: 'Reliable white-label website, software and automation delivery for agencies, designers and business consultants.',
    cta: 'Become a partner',
    href: '/who-we-help#agency-partners',
    icon: 'ri-briefcase-4-line',
    color: '#10B981',
  },
];

export default function WhoWeHelpSection() {
  return (
    <section
      id="who-we-help"
      className="py-24 px-6 bg-[#0A1628] relative overflow-hidden"
      style={{ scrollMarginTop: '5rem' }}
      aria-label="Who we help"
    >
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(circle at 50% 0%, rgba(6,182,212,0.04) 0%, transparent 60%)',
      }} />
      <div className="absolute inset-0 opacity-[0.01]" style={{
        backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.5) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-[#06B6D4] text-xs sm:text-sm uppercase tracking-[0.14em] font-semibold mb-4">
            Who we help
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Start with your business, not the technology.
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Tell us where you are and what is getting in the way. We will shape the right digital route around your goals, team and budget.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {audiences.map((audience, i) => (
            <motion.div
              key={audience.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="group relative bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 hover:border-white/[0.15] hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${audience.color}15` }}
              >
                <i className={`${audience.icon} text-xl w-6 h-6 flex items-center justify-center`} style={{ color: audience.color }} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{audience.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-5">{audience.copy}</p>
              <Link
                href={audience.href}
                className="inline-flex items-center gap-2 text-sm font-semibold transition-colors duration-200 cursor-pointer whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#06B6D4] rounded-lg px-2 py-1 -ml-2"
                style={{ color: audience.color }}
              >
                {audience.cta}
                <i className="ri-arrow-right-line w-4 h-4 flex items-center justify-center group-hover:translate-x-0.5 transition-transform duration-200" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}