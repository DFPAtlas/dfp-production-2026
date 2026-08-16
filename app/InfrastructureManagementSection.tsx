'use client';

import { useState, useEffect } from 'react';
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

const panels = [
  { label: 'Platform Health', value: 'All Systems Operational', icon: 'ri-heart-pulse-line', color: '#10B981', status: 'active' },
  { label: 'Deployments', value: 'Multiple Active Builds', icon: 'ri-rocket-line', color: '#06B6D4', status: 'active' },
  { label: 'Automation', value: 'Workflows Running', icon: 'ri-flow-chart', color: '#A855F7', status: 'processing' },
  { label: 'AI Agents', value: 'Agents Active', icon: 'ri-robot-line', color: '#EC4899', status: 'processing' },
  { label: 'Support', value: 'Monitoring', icon: 'ri-headphone-line', color: '#F97316', status: 'active' },
  { label: 'Payments', value: 'No Alerts', icon: 'ri-bank-card-line', color: '#10B981', status: 'active' },
  { label: 'Database', value: 'Normal Operations', icon: 'ri-database-2-line', color: '#3B82F6', status: 'active' },
  { label: 'UAT Testing', value: 'Tests In Progress', icon: 'ri-test-tube-line', color: '#D97706', status: 'processing' },
  { label: 'Security', value: 'Protected', icon: 'ri-shield-check-line', color: '#10B981', status: 'active' },
  { label: 'App Errors', value: 'None Critical', icon: 'ri-bug-line', color: '#EF4444', status: 'idle' },
  { label: 'Incidents', value: 'None Active', icon: 'ri-error-warning-line', color: '#EF4444', status: 'idle' },
  { label: 'Project Activity', value: '6 Active Builds', icon: 'ri-git-pull-request-line', color: '#06B6D4', status: 'processing' },
];

export default function InfrastructureManagementSection() {
  const [activeGroup, setActiveGroup] = useState<number | null>(null);
  const [deployProgress, setDeployProgress] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setDeployProgress(78);
      return;
    }

    const timer = setTimeout(() => {
      setHasAnimated(true);
      let progress = 0;
      const interval = setInterval(() => {
        progress += 1;
        setDeployProgress(Math.min(progress, 78));
        if (progress >= 78) clearInterval(interval);
      }, 30);
      return () => clearInterval(interval);
    }, 800);
    return () => clearTimeout(timer);
  }, [hasAnimated]);

  return (
    <section id="infrastructure-management" className="py-24 px-6 bg-[#060F1E] relative overflow-hidden">
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
            Infrastructure and Ongoing Management
          </h2>
          <h3 className="text-2xl md:text-4xl font-bold text-[#06B6D4] tracking-tight mb-6">
            Cloud, local infrastructure, monitoring and support
          </h3>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Digital Footprint selects technology around the requirements of the project.
            Systems may use cloud services, local servers or a hybrid combination depending
            on security, performance, control and commercial needs.
          </p>
        </motion.div>

        <div className="relative max-w-5xl mx-auto mb-16">
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
            className="text-center mt-8"
          >
            <p className="text-xs text-slate-600">
              Technologies we build with — not an exhaustive list of official partnerships
            </p>
          </motion.div>
        </div>

        <div className="border-t border-white/[0.06] pt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h3 className="text-2xl md:text-3xl font-bold text-[#10B981] tracking-tight mb-4">
              Technology does not stop at launch
            </h3>
            <p className="text-slate-400 max-w-2xl mx-auto text-base leading-relaxed">
              Digital Footprint is developing a central command environment for monitoring its
              platforms, AI agents, automations, support activity, deployments and system health
              — keeping every system healthy, secure and evolving.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-status-dot" />
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Command Centre</span>
                  </div>
                  <span className="text-[10px] text-slate-600">Demonstration Interface</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {panels.map((panel, i) => (
                    <motion.div
                      key={panel.label}
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.025 }}
                      className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 hover:border-white/[0.1] transition-all duration-300"
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          panel.status === 'active' ? 'bg-emerald-400' :
                          panel.status === 'processing' ? 'bg-sky-400 animate-status-dot' :
                          'bg-slate-600'
                        }`} />
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider font-medium">{panel.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <i className={`${panel.icon} w-3.5 h-3.5 flex items-center justify-center`} style={{ color: panel.color, opacity: 0.6 }} />
                        <p className="text-xs font-semibold text-slate-300 leading-tight">{panel.value}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {deployProgress > 0 && (
                  <div className="mt-5 pt-5 border-t border-white/[0.05]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Deployment Progress</span>
                      <span className="text-[10px] font-semibold text-[#06B6D4]">{deployProgress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${deployProgress}%`,
                          background: 'linear-gradient(to right, #06B6D4, #10B981)',
                          boxShadow: '0 0 8px rgba(6,182,212,0.3)',
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-5 pt-5 border-t border-white/[0.05]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">System connections</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['QuickGuard', 'GuardianHub', 'LetHub', 'FisheryHub', 'Corevia AI', 'DataHarbour'].map((platform) => (
                      <span
                        key={platform}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-medium text-slate-400 bg-white/[0.02] border border-white/[0.04] flex items-center gap-1.5"
                      >
                        <span className="w-1 h-1 rounded-full bg-emerald-400" />
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6">
              <div className="flex items-center gap-2 mb-5">
                <i className="ri-time-line w-4 h-4 flex items-center justify-center text-[#06B6D4]" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Recent Activity</span>
              </div>

              <div className="space-y-0">
                {[
                  { text: 'QuickGuard deployment updated', color: '#F97316', time: '10:42' },
                  { text: 'GuardianHub build completed', color: '#10B981', time: '09:15' },
                  { text: 'AI workflow optimisation ran', color: '#EC4899', time: '08:30' },
                  { text: 'Database backup completed', color: '#3B82F6', time: '07:00' },
                  { text: 'LetHub platform build deployed', color: '#2563EB', time: 'Yesterday' },
                  { text: 'Security scan passed — no issues', color: '#10B981', time: 'Yesterday' },
                ].map((event, i) => (
                  <div key={i} className="relative pl-5 pb-4 last:pb-0">
                    <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: event.color }} />
                    {i < 5 && <div className="absolute left-[3px] top-3.5 bottom-0 w-px bg-white/[0.03]" />}
                    <p className="text-xs text-slate-400 leading-relaxed">{event.text}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">{event.time}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-5 border-t border-white/[0.05]">
                <div className="flex items-center gap-2 mb-3">
                  <i className="ri-shield-check-line w-4 h-4 flex items-center justify-center text-[#10B981]/50" />
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Service Health</span>
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'Cloud Infrastructure', pct: 'Operational' },
                    { name: 'Database Systems', pct: 'Operational' },
                    { name: 'Automation Engine', pct: 'Operational' },
                    { name: 'AI Agents', pct: 'Operational' },
                  ].map((svc) => (
                    <div key={svc.name} className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">{svc.name}</span>
                      <span className="text-[10px] font-medium text-emerald-400">{svc.pct}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes status-dot-anim {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .animate-status-dot {
          animation: status-dot-anim 2s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}