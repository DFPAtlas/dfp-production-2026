'use client';

import { motion } from '@/components/motion';
import { ArrowRight } from 'lucide-react';
import HeroLightLines from '@/components/HeroLightLines';

export default function UATHeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      <HeroLightLines />
      <div className="absolute inset-0 bg-gradient-to-br from-white via-[#F8FAFC] to-white" />
      <div className="absolute inset-0 bg-[url('https://readdy.ai/api/search-image?query=A%20modern%20digital%20testing%20laboratory%20environment%20with%20abstract%20technology%20patterns%20and%20geometric%20shapes%20in%20deep%20blue%20and%20cyan%20tones%20subtle%20grid%20overlay%20futuristic%20tech%20atmosphere%20dark%20background%20with%20glowing%20accent%20lines%20professional%20clean%20minimal&width=1440&height=900&seq=1&orientation=landscape')] bg-cover bg-center opacity-20" />

      <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse" />
            Digital Footprint TestLab
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-800 leading-tight mb-6">
            Get Paid to Test<br />
            <span className="text-gradient-cyan">Websites and Apps</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-500 leading-relaxed mb-10 max-w-xl">
            Join Digital Footprint TestLab and help test real business platforms before launch. Your feedback shapes the final product.
          </p>

          <div className="flex flex-wrap gap-4">
            <a
              href="#apply-form"
              className="group inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] rounded-xl font-semibold text-white transition-all duration-300 hover:shadow-[0_0_30px_rgba(249,115,22,0.35)] whitespace-nowrap cursor-pointer"
            >
              Apply to Become a Tester
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#what-testers-do"
              className="inline-flex items-center gap-2 px-6 py-3.5 border border-slate-200 hover:border-[#06B6D4]/40 rounded-xl font-semibold text-slate-600 hover:text-[#06B6D4] transition-all duration-300 whitespace-nowrap cursor-pointer"
            >
              Learn More
              <i className="ri-arrow-down-line w-4 h-4 flex items-center justify-center" />
            </a>
          </div>
        </motion.div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Test Projects', value: '50+' },
            { label: 'Avg. Test Pay', value: '£25–£300' },
            { label: 'Test Types', value: '12+' },
            { label: 'UK Testers', value: 'Growing' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="glass-card rounded-xl p-5 text-center"
            >
              <div className="text-2xl font-bold text-slate-800 mb-1">{stat.value}</div>
              <div className="text-xs text-slate-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}