'use client';

import { useState } from 'react';
import { motion } from '@/components/motion';

const techGroups = [
  {
    title: 'AI & Models',
    icon: 'ri-brain-line',
    color: '#EC4899',
    items: ['OpenAI', 'Anthropic', 'Mistral', 'Ollama', 'Qwen', 'DeepSeek'],
    reason: 'Selected based on project requirements, privacy needs and capability fit.',
  },
  {
    title: 'Application Development',
    icon: 'ri-code-s-slash-line',
    color: '#06B6D4',
    items: ['Next.js', 'React', 'TypeScript', 'Node.js', 'Tailwind CSS', 'GitHub'],
    reason: 'Modern, performant frameworks for building scalable applications.',
  },
  {
    title: 'Data & Backend',
    icon: 'ri-database-2-line',
    color: '#A855F7',
    items: ['Supabase', 'PostgreSQL', 'Edge Functions', 'Realtime Systems', 'Secure Authentication', 'Role-Based Access'],
    reason: 'Secure, scalable data infrastructure with fine-grained access control.',
  },
  {
    title: 'Automation & Comms',
    icon: 'ri-flow-chart',
    color: '#F97316',
    items: ['n8n', 'Twilio', 'WhatsApp', 'Email Systems', 'PBX Integrations', 'Webhooks', 'Scheduled Workflows'],
    reason: 'Connected messaging and automated workflows across communication channels.',
  },
  {
    title: 'Cloud & Infrastructure',
    icon: 'ri-cloud-line',
    color: '#10B981',
    items: ['Cloudflare', 'Vercel', 'AWS', 'Microsoft', 'Google Cloud', 'Docker', 'Linux', 'Proxmox', 'Local Servers', 'Hybrid Systems'],
    reason: 'Cloud, local and hybrid deployment based on security, performance and control requirements.',
  },
];

export default function TechInfrastructureSection() {
  const [activeGroup, setActiveGroup] = useState<number | null>(null);

  return (
    <section id="technology" className="py-24 px-6 bg-[#060F1E] relative overflow-hidden">
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(circle at 20% 50%, rgba(6,182,212,0.03) 0%, transparent 50%), radial-gradient(circle at 80% 30%, rgba(168,85,247,0.02) 0%, transparent 50%)',
      }} />

      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Built across modern cloud,
          </h2>
          <h3 className="text-2xl md:text-4xl font-bold text-[#06B6D4] tracking-tight mb-6">
            AI and local infrastructure
          </h3>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Digital Footprint selects technology around the requirements of the project.
            Systems may use cloud services, local servers or a hybrid combination depending
            on security, performance, control and commercial needs.
          </p>
        </motion.div>

        <div className="relative max-w-5xl mx-auto">
          <div className="relative mb-4">
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 160" preserveAspectRatio="none" aria-hidden="true">
              <line x1="100" y1="80" x2="700" y2="80" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              {techGroups.map((_, i) => {
                const x = 160 + i * 110;
                return (
                  <line key={i} x1={x} y1="40" x2={x} y2="80" stroke={activeGroup === i ? techGroups[i].color + '30' : 'rgba(255,255,255,0.02)'} strokeWidth="1" />
                );
              })}
            </svg>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative">
              {techGroups.map((group, i) => (
                <motion.div
                  key={group.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  onMouseEnter={() => setActiveGroup(i)}
                  onMouseLeave={() => setActiveGroup(null)}
                  onFocus={() => setActiveGroup(i)}
                  onBlur={() => setActiveGroup(null)}
                  tabIndex={0}
                  className={`group rounded-2xl border p-5 transition-all duration-400 cursor-default focus:outline-none focus:ring-2 focus:ring-[#06B6D4] ${
                    activeGroup === i
                      ? 'border-white/[0.15] bg-white/[0.03] -translate-y-1 shadow-xl shadow-black/20'
                      : 'border-white/[0.04] bg-white/[0.01] hover:border-white/[0.1] hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-4">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform duration-400"
                      style={{
                        backgroundColor: activeGroup === i ? `${group.color}20` : `${group.color}12`,
                        transform: activeGroup === i ? 'scale(1.08)' : 'scale(1)',
                      }}
                    >
                      <i className={`${group.icon} text-base w-5 h-5 flex items-center justify-center`} style={{ color: group.color }} />
                    </div>
                    <h4 className="text-sm font-bold text-white">{group.title}</h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map((item) => (
                      <span
                        key={item}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-medium border transition-colors whitespace-nowrap ${
                          activeGroup === i
                            ? 'text-slate-200 border-white/[0.12] bg-white/[0.04]'
                            : 'text-slate-400 border-white/[0.04] bg-white/[0.01] hover:text-white hover:border-white/[0.08]'
                        }`}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  <div
                    className={`overflow-hidden transition-all duration-400 ${
                      activeGroup === i ? 'max-h-20 opacity-100 mt-3 pt-3 border-t border-white/[0.06]' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="text-[10px] text-slate-500 leading-relaxed">{group.reason}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <p className="text-xs text-slate-600">
              Technologies we build with &mdash; not an exhaustive list of official partnerships
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}