'use client';

import { motion } from '@/components/motion';
import Link from 'next/link';

export default function CTASection() {
  return (
    <section className="py-24 px-6 bg-[#0A1628] relative overflow-hidden">
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(circle at 50% 50%, rgba(6,182,212,0.06) 0%, transparent 60%)',
      }} />

      <div className="absolute inset-0 opacity-[0.01]" style={{
        backgroundImage: 'radial-gradient(circle, rgba(6,182,212,0.5) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-px bg-gradient-to-r from-transparent via-[#06B6D4]/20 to-transparent" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6">
            Your idea may be bigger
          </h2>
          <h3 className="text-2xl md:text-4xl font-bold text-[#F97316] tracking-tight mb-8">
            than a website.
          </h3>

          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Bring Digital Footprint an original concept, an existing process that needs modernising
            or a business that has outgrown its current systems. We will help define what should be
            built and create a practical route from the first idea to a working operation.
          </p>

          <div className="mb-14">
            <Link
              href="/contact"
              className="group relative inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-semibold text-white overflow-hidden whitespace-nowrap cursor-pointer transition-all duration-300 bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] hover:-translate-y-0.5 shadow-lg shadow-[#F97316]/15 hover:shadow-xl hover:shadow-[#F97316]/25 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2 focus:ring-offset-[#0A1628]"
            >
              <span className="relative z-10">Start a Conversation</span>
              <i className="ri-arrow-right-line w-5 h-5 flex items-center justify-center relative z-10 group-hover:translate-x-0.5 transition-transform duration-200" />
              <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: 'ri-chat-3-line', text: 'No-pressure initial conversation' },
              { icon: 'ri-guide-line', text: 'Plain-English technical guidance' },
              { icon: 'ri-compass-3-line', text: 'Structured project discovery' },
              { icon: 'ri-user-star-line', text: 'One connected project relationship' },
            ].map((item, i) => (
              <motion.div
                key={item.text}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.05] bg-white/[0.01] hover:border-white/[0.1] transition-all duration-300 hover:-translate-y-0.5"
              >
                <i className={`${item.icon} w-5 h-5 flex items-center justify-center text-[#06B6D4]/50`} />
                <span className="text-xs text-slate-400 text-left leading-tight">{item.text}</span>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 pt-10 border-t border-white/[0.04]">
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-[#06B6D4]/40" />
                Conception
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-[#A855F7]/40" />
                Development
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-[#F97316]/40" />
                Deployment
              </span>
              <span className="text-slate-600">One connected technology partner</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}