'use client';

import { useState } from 'react';
import { motion } from '@/components/motion';
import Link from 'next/link';

const engagementPaths = [
  {
    id: 'build',
    title: 'Build a New Digital Business',
    subtitle: 'For founders and organisations creating something new',
    icon: 'ri-rocket-line',
    color: '#06B6D4',
    whoFor: 'Founders and organisations creating SaaS platforms, marketplaces, membership systems, technology-enabled services, new digital companies or hardware-connected platforms.',
    requirements: 'Concept shaping, user journeys, commercial structure, public website, customer accounts, operational platform, payment systems and administrative dashboards.',
    firstStep: 'Initial discovery conversation to explore the concept, market potential and technical architecture.',
  },
  {
    id: 'modernise',
    title: 'Modernise an Existing Company',
    subtitle: 'For businesses replacing manual, disconnected systems',
    icon: 'ri-refresh-line',
    color: '#A855F7',
    whoFor: 'Companies currently using spreadsheets, paper processes, disconnected software, manual reporting, separate customer databases or repetitive administrative work.',
    requirements: 'Operational review, connected database design, staff portals, automated workflows, integrated reporting and customer-facing systems.',
    firstStep: 'Operational review to map current processes and identify where connected systems can make the most impact.',
  },
  {
    id: 'ai',
    title: 'Add AI and Automation',
    subtitle: 'For businesses adding intelligent workflows',
    icon: 'ri-robot-line',
    color: '#EC4899',
    whoFor: 'Businesses with working systems that need AI assistants, lead agents, document processing, support automation, workflow automation, monitoring, research tools or internal company knowledge systems.',
    requirements: 'Workflow audit, AI agent design, document intelligence, automated communications, intelligent notifications and human-approval checkpoints.',
    firstStep: 'Workflow audit to identify the highest-impact opportunities for AI and automation within current operations.',
  },
  {
    id: 'manage',
    title: 'Ongoing Platform Management',
    subtitle: 'For companies requiring continued support and growth',
    icon: 'ri-settings-3-line',
    color: '#10B981',
    whoFor: 'Businesses requiring system monitoring, continued development, user support, security oversight, platform improvements, AI agent management, infrastructure maintenance or operational dashboards.',
    requirements: 'System monitoring, incident response, security patching, feature development, performance optimisation, user support and long-term roadmap planning.',
    firstStep: 'Platform assessment to understand current systems, monitoring requirements and growth objectives.',
  },
];

export default function WaysToWorkSection() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section id="ways-to-work" className="py-24 px-6 bg-[#060F1E] relative overflow-hidden">
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(circle at 50% 0%, rgba(6,182,212,0.04) 0%, transparent 60%)',
      }} />

      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Different starting points.
          </h2>
          <h3 className="text-2xl md:text-4xl font-bold text-[#06B6D4] tracking-tight">
            One connected build process.
          </h3>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {engagementPaths.map((path, i) => {
            const isExpanded = expandedId === path.id;
            return (
              <motion.div
                key={path.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className={`group relative rounded-2xl border transition-all duration-500 cursor-pointer focus-within:ring-2 focus-within:ring-[#06B6D4] ${
                  isExpanded
                    ? 'border-white/[0.15] bg-white/[0.03] shadow-lg'
                    : 'border-white/[0.04] bg-white/[0.01] hover:border-white/[0.1] hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20'
                }`}
                onClick={() => setExpandedId(isExpanded ? null : path.id)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setExpandedId(isExpanded ? null : path.id);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-expanded={isExpanded}
                aria-label={`${path.title}. ${path.subtitle}. Click to ${isExpanded ? 'collapse' : 'expand'} details.`}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl transition-all duration-500"
                  style={{ background: isExpanded ? path.color : 'transparent' }}
                />

                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-400 group-hover:scale-105"
                      style={{ backgroundColor: isExpanded ? `${path.color}18` : `${path.color}10` }}
                    >
                      <i className={`${path.icon} text-xl w-6 h-6 flex items-center justify-center`} style={{ color: path.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-bold text-white mb-1">{path.title}</h4>
                      <p className="text-sm text-slate-400">{path.subtitle}</p>
                    </div>
                    <i
                      className={`ri-arrow-down-s-line text-lg w-5 h-5 flex items-center justify-center transition-all duration-300 shrink-0 ${
                        isExpanded ? 'rotate-180 text-[#06B6D4]' : 'text-slate-600'
                      }`}
                    />
                  </div>

                  <div
                    className={`overflow-hidden transition-all duration-500 ${
                      isExpanded ? 'max-h-[500px] opacity-100 mt-5' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="pt-5 border-t border-white/[0.06] space-y-4">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Who it is for</span>
                        <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{path.whoFor}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Common requirements</span>
                        <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{path.requirements}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Expected first step</span>
                        <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{path.firstStep}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link
            href="/contact"
            className="group relative inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-sm text-white overflow-hidden whitespace-nowrap cursor-pointer transition-all duration-300 bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] hover:-translate-y-0.5 shadow-lg shadow-[#F97316]/15 hover:shadow-xl hover:shadow-[#F97316]/25 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2 focus:ring-offset-[#060F1E]"
          >
            <span className="relative z-10">Discuss the Right Approach for Your Business</span>
            <i className="ri-arrow-right-line w-4 h-4 flex items-center justify-center relative z-10 group-hover:translate-x-0.5 transition-transform duration-200" />
            <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}