'use client';

import { useState, useEffect } from 'react';
import { motion } from '@/components/motion';

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

export default function CommandCentreSection() {
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
    <section id="command-centre" className="py-24 px-6 bg-[#0A1628] relative overflow-hidden">
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle, rgba(6,182,212,0.02) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />

      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Technology does not stop
          </h2>
          <h3 className="text-2xl md:text-4xl font-bold text-[#06B6D4] tracking-tight mb-6">
            at launch
          </h3>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Digital Footprint is developing a central command environment for monitoring its
            platforms, AI agents, automations, support activity, deployments and system health
            &mdash; keeping every system healthy, secure and evolving.
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
    </section>
  );
}