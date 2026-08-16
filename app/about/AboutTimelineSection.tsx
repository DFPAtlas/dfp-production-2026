'use client';

import { motion } from '@/components/motion';

const steps = [
  { year: '2015', title: 'The Beginning', desc: 'Digital Footprint was founded with a simple belief: every business deserves technology that works as hard as they do. Starting as a one-person consultancy in Hertfordshire, we began helping local businesses get online with websites and basic automation.', icon: 'ri-plant-line' },
  { year: '2017', title: 'First Major Platform', desc: 'Completed our first enterprise client platform — a custom CRM and booking system for a national security company. This project validated our approach: work with the same dedicated lead from discovery through to delivery.', icon: 'ri-code-box-line' },
  { year: '2019', title: 'AI & Automation Division', desc: 'Expanded into AI-powered solutions with the launch of the automation division, building intelligent systems for clients across construction, security and property industries.', icon: 'ri-robot-line' },
  { year: '2021', title: 'Product Ecosystem Launch', desc: 'Launched QuickGuard and GuardianHub — our first software products. Moved from pure consultancy to a hybrid model combining bespoke development with supported SaaS platforms.', icon: 'ri-stack-line' },
  { year: '2023', title: 'Expanded Product Suite', desc: 'Released Synqoro for AI and automation, followed by Lethub for property and lettings management. The Digital Footprint ecosystem was born.', icon: 'ri-apps-2-line' },
  { year: '2025', title: 'Today & Beyond', desc: 'Now supporting businesses across the UK with technology, AI, automation and digital transformation. Our team has grown, but the core promise remains: One Contact. One Relationship. One Vision.', icon: 'ri-arrow-right-up-line' },
];

export default function AboutTimelineSection() {
  return (
    <section className="py-20 px-6 section-dark-alt relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(6,182,212,0.04),transparent_70%)]" />
      <div className="relative z-10 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] text-sm font-medium mb-4">
            <i className="ri-history-line w-4 h-4 flex items-center justify-center" />
            Our Journey
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">A Decade of Digital Transformation</h2>
          <p className="text-slate-500 max-w-2xl mx-auto">From a single consultant to a technology group powering businesses across the UK.</p>
        </motion.div>

        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-[#06B6D4]/30 via-[#06B6D4]/10 to-transparent hidden md:block" />

          <div className="space-y-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.year}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="flex gap-6 items-start group relative"
              >
                <div className="hidden md:flex flex-col items-center shrink-0">
                  <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center group-hover:border-[#06B6D4] group-hover:bg-[#06B6D4]/5 transition-all duration-300 relative z-10">
                    <i className={`${step.icon} text-2xl text-[#06B6D4] w-6 h-6 flex items-center justify-center`} />
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-6 flex-1 group-hover:border-slate-200">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-bold text-[#06B6D4] px-3 py-1 rounded-full bg-[#06B6D4]/10">
                      {step.year}
                    </span>
                    <h4 className="text-lg font-bold text-slate-800">{step.title}</h4>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}