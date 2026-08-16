'use client';

import { motion } from '@/components/motion';
import Link from 'next/link';

const supportItems = [
  { icon: 'ri-global-line', title: 'Website Management', desc: 'Regular updates, content changes, security patches, and performance optimisation to keep your site running smoothly.' },
  { icon: 'ri-radar-line', title: 'System Monitoring', desc: '24/7 monitoring of your servers, databases, and applications with instant alerts if anything needs attention.' },
  { icon: 'ri-refresh-line', title: 'Updates & Maintenance', desc: 'Framework updates, dependency patches, and proactive maintenance to prevent issues before they happen.' },
  { icon: 'ri-share-line', title: 'Social Media Management', desc: 'Content creation, scheduling, community management, and social strategy to keep your brand visible and engaged.' },
  { icon: 'ri-file-edit-line', title: 'Content Updates', desc: 'Blog posts, landing pages, product descriptions, and copywriting to keep your platform fresh and relevant.' },
  { icon: 'ri-bug-line', title: 'Bug Fixes', desc: 'Fast response to any issues that arise, with clear communication and quick resolution from the same team that built your system.' },
  { icon: 'ri-add-circle-line', title: 'New Feature Development', desc: 'As your business grows, we build new features and modules that expand what your platform can do.' },
  { icon: 'ri-brain-line', title: 'AI Agent Improvements', desc: 'Continuous training and refinement of your AI agents so they get smarter and more capable over time.' },
  { icon: 'ri-cloud-line', title: 'Cloud & Infrastructure Support', desc: 'Ongoing management of your cloud environment, scaling resources, and keeping costs optimised.' },
];

export default function OngoingGrowthSection() {
  return (
    <section className="py-24 px-6 section-dark relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#06B6D4]/20 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(6,182,212,0.03),transparent_70%)]" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#06B6D4]/8 border border-[#06B6D4]/20 text-[#06B6D4] text-sm font-medium mb-4">
            <i className="ri-arrow-up-circle-line w-4 h-4 flex items-center justify-center" />
            Beyond Launch
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-3">
            Ongoing Growth
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-base leading-relaxed">
            Launch is not the finish line — it is the starting point. Digital Footprint stays with you
            to support, maintain, and grow your platform for as long as you need us.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {supportItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="glass-card rounded-2xl p-6 group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/8 flex items-center justify-center mb-4 group-hover:bg-[#06B6D4] transition-colors duration-300">
                <i className={`${item.icon} text-lg text-[#06B6D4] group-hover:text-white transition-colors duration-300 w-5 h-5 flex items-center justify-center`} />
              </div>
              <h4 className="font-bold text-slate-800 mb-2">{item.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-3xl p-10 text-center border border-slate-200 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#06B6D4]/[0.03] rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#7C3AED]/[0.03] rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#06B6D4]/8 border border-[#06B6D4]/20 text-[#06B6D4] text-sm font-medium mb-6">
              <i className="ri-chat-smile-2-line w-4 h-4 flex items-center justify-center" />
              Let&apos;s Talk
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
              Ready to Start Your CDD Journey?
            </h3>
            <p className="text-slate-500 mb-8 max-w-xl mx-auto leading-relaxed">
              Whether you have a clear vision or just the seed of an idea, let&apos;s talk.
              Book a free consultation and we will walk you through how the CDD method can bring
              your project to life.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white bg-[#06B6D4] hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap hover:shadow-lg hover:shadow-[#06B6D4]/20"
              >
                Book Free Consultation
                <i className="ri-arrow-right-line w-5 h-5 flex items-center justify-center" />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-slate-600 border border-slate-200 hover:border-[#06B6D4] hover:text-[#06B6D4] transition-all cursor-pointer whitespace-nowrap"
              >
                Explore Services
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}