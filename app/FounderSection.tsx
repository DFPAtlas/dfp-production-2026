'use client';

import { motion } from '@/components/motion';
import Link from 'next/link';

export default function FounderSection() {
  return (
    <section className="py-24 px-6 bg-[#0A1628] relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.01]" style={{
        backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.4) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
              One project lead who
            </h2>
            <h3 className="text-2xl md:text-4xl font-bold text-[#06B6D4] tracking-tight mb-8">
              understands the complete vision
            </h3>

            <p className="text-slate-400 text-lg leading-relaxed mb-6">
              From the first conversation through design, development, testing, deployment and
              long-term improvement, the original idea remains connected to every decision.
              Clients should not have to repeatedly explain their business to disconnected
              departments and suppliers.
            </p>

            <p className="text-slate-400 text-base leading-relaxed mb-10">
              Digital Footprint maintains one connected view of the project while coordinating
              the different systems, specialists and technologies required to build it.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-10">
              {[
                { label: 'The client', color: '#06B6D4' },
                { label: 'Business planning', color: '#06B6D4' },
                { label: 'Product design', color: '#A855F7' },
                { label: 'UI and UX', color: '#A855F7' },
                { label: 'Software development', color: '#A855F7' },
                { label: 'Databases', color: '#F97316' },
                { label: 'AI systems', color: '#EC4899' },
                { label: 'Automation', color: '#EC4899' },
                { label: 'Infrastructure', color: '#10B981' },
                { label: 'Testing', color: '#10B981' },
                { label: 'Operations', color: '#10B981' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all duration-300 hover:border-white/[0.12] hover:-translate-y-0.5"
                  style={{
                    backgroundColor: `${item.color}08`,
                    borderColor: `${item.color}12`,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium text-slate-300">{item.label}</span>
                </div>
              ))}
            </div>

            <Link
              href="/about"
              className="group relative inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-sm text-white overflow-hidden whitespace-nowrap cursor-pointer transition-all duration-300 bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] hover:-translate-y-0.5 shadow-lg shadow-[#F97316]/15 hover:shadow-xl hover:shadow-[#F97316]/25 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2 focus:ring-offset-[#0A1628]"
            >
              <span className="relative z-10">Meet Digital Footprint</span>
              <i className="ri-arrow-right-line w-4 h-4 flex items-center justify-center relative z-10 group-hover:translate-x-0.5 transition-transform duration-200" />
              <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/8 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] p-8">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#06B6D4]/0 via-[#06B6D4]/40 to-[#06B6D4]/0" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/20 flex items-center justify-center">
                    <span className="text-xl font-bold text-[#06B6D4]">M</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">Martin Hewett</p>
                    <p className="text-sm text-slate-400">Founder & Technology Lead</p>
                  </div>
                </div>

                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Acting as the conductor and technology translator, Martin ensures every
                  component of your digital business — from the customer interface to the
                  database architecture to the AI workflows — remains connected and purposeful.
                  Clients work with one person who understands the complete technical picture.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Discovery to Delivery', icon: 'ri-road-map-line' },
                    { label: 'Single Point of Contact', icon: 'ri-user-star-line' },
                    { label: 'Technical Translation', icon: 'ri-translate' },
                    { label: 'Complete Oversight', icon: 'ri-eye-line' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors duration-200"
                    >
                      <i className={`${item.icon} w-4 h-4 flex items-center justify-center text-[#06B6D4]/50`} />
                      <span className="text-xs text-slate-400 font-medium">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full opacity-8" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.4) 0%, transparent 70%)' }} />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}