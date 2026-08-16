'use client';

import { motion, useInView } from '@/components/motion';
import { useRef } from 'react';

const payTiers = [
  { label: 'Short Test', range: '£25 – £50', description: 'Quick 30-60 minute test of a single feature or flow', icon: 'ri-flashlight-line' },
  { label: 'Half-Day Test', range: '£75 – £100', description: '3-4 hours covering multiple features and scenarios', icon: 'ri-sun-line' },
  { label: 'Full UAT Project', range: '£150 – £300+', description: 'Comprehensive testing over several sessions with detailed reporting', icon: 'ri-calendar-check-line' },
];

export default function PayGuideSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="py-24 bg-white" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] text-xs font-semibold mb-4">
            Pay Guide
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">What You Can Earn</h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Each test project pays based on scope, time needed, and the quality of your feedback.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {payTiers.map((tier, i) => (
            <motion.div
              key={tier.label}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}
              className="glass-card rounded-2xl p-6 text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center mx-auto mb-4">
                <i className={`${tier.icon} text-[#06B6D4] text-xl w-5 h-5 flex items-center justify-center`} />
              </div>
              <div className="text-2xl font-bold text-slate-800 mb-1">{tier.range}</div>
              <div className="text-sm font-semibold text-[#06B6D4] mb-2">{tier.label}</div>
              <p className="text-sm text-slate-500">{tier.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <div className="glass-card rounded-2xl p-6 border-l-4 border-[#F59E0B]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center shrink-0 mt-0.5">
                <i className="ri-shield-star-line text-[#F59E0B] w-4 h-4 flex items-center justify-center" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-1">Serious Bug Bonuses</p>
                <p className="text-sm text-slate-500">Finding critical bugs or security issues may qualify for bonus payments on top of the standard test fee.</p>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-slate-400 mt-6">
            Actual pay depends on project size, time required, and quality of feedback.
          </p>
        </motion.div>
      </div>
    </section>
  );
}