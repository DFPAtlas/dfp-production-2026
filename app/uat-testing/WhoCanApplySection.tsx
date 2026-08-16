'use client';

import { motion, useInView } from '@/components/motion';
import { useRef } from 'react';

const requirements = [
  { icon: 'ri-map-pin-line', text: 'UK-based testers preferred' },
  { icon: 'ri-user-3-line', text: 'Must be 18 or over' },
  { icon: 'ri-computer-line', text: 'Basic phone and computer skills' },
  { icon: 'ri-device-line', text: 'Access to Android, iPhone, Windows, Mac, tablet, or multiple browsers is useful' },
  { icon: 'ri-briefcase-line', text: 'Industry experience in security, property, hospitality, admin, trades, small business, or customer service is useful but not required' },
];

export default function WhoCanApplySection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="py-24 bg-[#F8FAFC]" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] text-xs font-semibold mb-4">
            Eligibility
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">Who Can Apply</h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            We are looking for detail-oriented people who enjoy exploring software and giving honest feedback.
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          <div className="glass-card rounded-2xl p-8">
            <ul className="space-y-5">
              {requirements.map((req, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.1 + i * 0.08, duration: 0.5 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <i className={`${req.icon} text-[#06B6D4] w-4 h-4 flex items-center justify-center`} />
                  </div>
                  <span className="text-slate-600 text-base pt-1.5">{req.text}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}