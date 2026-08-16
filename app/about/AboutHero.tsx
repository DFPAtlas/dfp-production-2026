'use client';

import { motion } from '@/components/motion';
import Link from 'next/link';
import HeroLightLines from '@/components/HeroLightLines';

export default function AboutHero() {
  return (
    <section className="relative pt-32 pb-24 px-6 overflow-hidden hero-gradient">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(6,182,212,0.06),transparent_70%)]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#06B6D4]/20 to-transparent" />
      <div className="absolute top-1/3 left-0 w-[600px] h-[600px] bg-[#F97316]/[0.03] rounded-full -translate-x-1/2 -translate-y-1/2 blur-[120px]" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-[#10B981]/[0.03] rounded-full translate-x-1/2 -translate-y-1/2 blur-[120px]" />
      <HeroLightLines />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#06B6D4]/8 border border-[#06B6D4]/20 text-[#06B6D4] text-sm font-medium mb-6">
            <i className="ri-lightbulb-flash-line w-4 h-4 flex items-center justify-center" />
            The CDD Method
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight text-slate-900">
            From Concept to Launch
            <br />
            <span className="text-[#06B6D4]">The CDD Way</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-500 max-w-3xl mx-auto leading-relaxed mb-4">
            Every great digital product follows a journey. At Digital Footprint, we have refined that journey
            into a proven three-stage method: <strong className="text-slate-800">Conception</strong>,{' '}
            <strong className="text-slate-800">Development</strong>, and{' '}
            <strong className="text-slate-800">Deployment</strong>.
          </p>

          <p className="text-base text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
            CDD is not just a process — it is our philosophy. One team, one vision, one conductor guiding your
            project from the first sketch to the final launch and beyond.
          </p>

          <div className="flex items-center justify-center gap-6 mb-10">
            {[
              { letter: 'C', label: 'Conception', color: '#F97316' },
              { letter: 'D', label: 'Development', color: '#7C3AED' },
              { letter: 'D', label: 'Deployment', color: '#10B981' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-2">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
                  style={{ backgroundColor: `${item.color}20`, border: `1px solid ${item.color}40` }}
                >
                  {item.letter}
                </div>
                <span className="text-xs text-slate-500 font-medium">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white bg-[#06B6D4] hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap hover:shadow-lg hover:shadow-[#06B6D4]/20"
            >
              Start Your Project
              <i className="ri-arrow-right-line w-5 h-5 flex items-center justify-center" />
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-slate-600 border border-slate-200 hover:border-[#06B6D4] hover:text-[#06B6D4] transition-all cursor-pointer whitespace-nowrap"
            >
              Explore Services
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}