'use client';

import { motion } from '@/components/motion';

const values = [
  { icon: 'ri-user-heart-line', title: 'One Contact Always', desc: 'Every client works with the same dedicated project lead from first enquiry through delivery and ongoing support. No handovers, no repetition, no confusion.' },
  { icon: 'ri-lightbulb-flash-line', title: 'Innovation Without Compromise', desc: 'We push boundaries with AI, automation and modern engineering — but never at the expense of reliability. Technology must serve your business, not the other way around.' },
  { icon: 'ri-shake-hands-line', title: 'Genuine Partnership', desc: 'We embed ourselves in your success. Our team learns your industry, understands your challenges and proactively suggests improvements based on deep domain knowledge.' },
  { icon: 'ri-shield-check-line', title: 'Trust Through Delivery', desc: 'Promises mean nothing without execution. Every commitment is tracked, every milestone is measured. We hold ourselves accountable to the outcomes we agree upon.' },
  { icon: 'ri-focus-3-line', title: 'Simplicity Over Complexity', desc: 'The best technology is the kind you forget is there. We design systems that are intuitive, streamlined and actually pleasant to use — regardless of how complex the underlying engineering is.' },
  { icon: 'ri-arrow-up-circle-line', title: 'Continuous Improvement', desc: 'Launch is not the finish line. We continuously monitor, optimise and evolve every system we build. Your technology grows as your business grows.' },
];

export default function AboutValuesSection() {
  return (
    <section className="py-20 px-6 section-dark relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#06B6D4]/20 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(6,182,212,0.04),transparent_70%)]" />
      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] text-sm font-medium mb-4">
            <i className="ri-heart-line w-4 h-4 flex items-center justify-center" />
            What Drives Us
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">The Principles Behind Everything We Build</h2>
          <p className="text-slate-500 max-w-2xl mx-auto">Six core values that shape every project, every decision and every client relationship.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
              className="glass-card rounded-2xl p-6 group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center mb-4 group-hover:bg-[#06B6D4] transition-colors duration-300">
                <i className={`${value.icon} text-xl text-[#06B6D4] group-hover:text-white transition-colors duration-300 w-6 h-6 flex items-center justify-center`} />
              </div>
              <h4 className="font-bold text-slate-800 mb-2">{value.title}</h4>
              <p className="text-sm text-slate-500 leading-relaxed">{value.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}