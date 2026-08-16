'use client';

import { motion, useInView } from '@/components/motion';
import { useRef } from 'react';

const testerTasks = [
  { icon: 'ri-file-list-3-line', title: 'Follow Test Checklists', description: 'Work through structured test scenarios covering every feature of the platform' },
  { icon: 'ri-global-line', title: 'Test Websites & Dashboards', description: 'Navigate through web apps, admin panels, and customer dashboards' },
  { icon: 'ri-smartphone-line', title: 'Test Mobile Flows', description: 'Run through mobile-optimised journeys and responsive layouts' },
  { icon: 'ri-bank-card-line', title: 'Test Payment Flows', description: 'Verify checkout processes, payment gateways, and transaction handling' },
  { icon: 'ri-lock-line', title: 'Test Login Systems', description: 'Check authentication flows, password resets, and account security' },
  { icon: 'ri-bug-line', title: 'Report Bugs & Broken Links', description: 'Flag issues, errors, and anything that does not work as expected' },
  { icon: 'ri-chat-3-line', title: 'Give Usability Feedback', description: 'Share honest thoughts on layout, navigation, and overall user experience' },
  { icon: 'ri-device-line', title: 'Test Across Devices', description: 'Test on mobile, tablet, and desktop to catch cross-device issues' },
  { icon: 'ri-camera-line', title: 'Submit Screenshots', description: 'Capture and annotate screenshots to clearly show what needs attention' },
];

export default function WhatTestersDoSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="what-testers-do" className="py-24 bg-white" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] text-xs font-semibold mb-4">
            The Role
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">What Testers Do</h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            As a UAT tester, you will work through real platforms before they go live. No experience needed, just attention to detail.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testerTasks.map((task, i) => (
            <motion.div
              key={task.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.5 }}
              className="glass-card rounded-2xl p-6 group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center mb-4 group-hover:bg-[#06B6D4]/20 transition-colors">
                <i className={`${task.icon} text-[#06B6D4] text-lg w-5 h-5 flex items-center justify-center`} />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">{task.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{task.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}