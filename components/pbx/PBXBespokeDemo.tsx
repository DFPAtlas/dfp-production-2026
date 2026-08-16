'use client';

import { motion } from '@/components/motion';
import { PhoneCall, GitBranch, Workflow, BarChart3, ArrowRight, MessageSquare, Palette, Building2, BadgeCheck } from 'lucide-react';

interface PBXBespokeDemoProps {
  onRequestDemo: () => void;
}

const supportingPoints = [
  { icon: Palette, text: 'Built around your business workflow' },
  { icon: GitBranch, text: 'Custom call routing and opening hours' },
  { icon: MessageSquare, text: 'AI receptionist and voicemail summaries' },
  { icon: PhoneCall, text: 'Twilio voice/SMS integration' },
  { icon: Workflow, text: 'n8n automation for follow-ups, tickets, alerts, and CRM updates' },
  { icon: BarChart3, text: 'Custom dashboards and reports' },
  { icon: Building2, text: 'Scalable from a small team to multi-site operations' },
  { icon: BadgeCheck, text: 'Designed, tested, and deployed by Digital-Footprint' },
];

const featureCards = [
  {
    icon: PhoneCall,
    title: 'Your Calls',
    desc: 'Inbound routing, IVR menus, ring groups, call recording, voicemail — configured to match how your team answers the phone.',
    color: '#06B6D4',
  },
  {
    icon: GitBranch,
    title: 'Your Rules',
    desc: 'Opening hours, holiday overrides, emergency routing, after-hours behaviour — your business calendar, not someone else\'s template.',
    color: '#10B981',
  },
  {
    icon: Workflow,
    title: 'Your Automations',
    desc: 'n8n workflows that trigger exactly what you need — missed call alerts, ticket creation, CRM sync, SMS follow-ups.',
    color: '#8B5CF6',
  },
  {
    icon: BarChart3,
    title: 'Your Reports',
    desc: 'Call logs, AI summaries, lead scores, usage dashboards — built for the metrics that matter to your business.',
    color: '#F59E0B',
  },
];

export default function PBXBespokeDemo({ onRequestDemo }: PBXBespokeDemoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden bg-gradient-to-br from-[#1E293B] via-[#1E293B] to-[#0F172A] rounded-xl border border-[rgba(255,255,255,0.08)]"
    >
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#06B6D4]/3 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#8B5CF6]/3 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

      <div className="relative p-5 lg:p-7">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/15 text-[#06B6D4] text-[10px] font-semibold uppercase tracking-wider mb-3">
              <Palette className="w-3 h-3" />
              Bespoke PBX Systems
            </div>

            <h2 className="text-xl lg:text-2xl font-bold text-white mb-3 leading-tight">
              Not Just Another<br />One-Size-Fits-All PBX
            </h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-5 max-w-lg">
              Most PBX platforms are built for thousands of different businesses, which means you often have to work around the system. Digital-Footprint takes a different approach. We can build a bespoke cloud PBX and AI call-handling system around the way your business actually works — your team, your call flow, your customers, your opening hours, your automations, and your reporting needs.
            </p>

            <ul className="space-y-3 mb-6">
              {supportingPoints.map((point, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  className="flex items-start gap-2.5"
                >
                  <div className="w-5 h-5 rounded-md bg-[#06B6D4]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <point.icon className="w-3 h-3 text-[#06B6D4]" />
                  </div>
                  <span className="text-sm text-slate-300">{point.text}</span>
                </motion.li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={onRequestDemo}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-[#06B6D4] to-[#0891B2] hover:from-[#0891B2] hover:to-[#0E7490] transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-[#06B6D4]/10"
              >
                Request a Bespoke PBX Demo
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onRequestDemo}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-300 border border-[rgba(255,255,255,0.12)] hover:border-[#06B6D4]/30 hover:text-white transition-all cursor-pointer whitespace-nowrap"
              >
                Talk to Digital-Footprint
              </button>
              <button
                onClick={onRequestDemo}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-[#F59E0B] border border-[#F59E0B]/20 hover:bg-[#F59E0B]/5 transition-all cursor-pointer whitespace-nowrap"
              >
                Register Interest
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 content-start">
            {featureCards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 hover:border-[rgba(255,255,255,0.12)] hover:bg-white/[0.05] transition-all cursor-default"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                  style={{ backgroundColor: card.color + '18' }}
                >
                  <card.icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
                <h4 className="text-sm font-semibold text-white mb-1.5">{card.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-[rgba(255,255,255,0.05)] text-center">
          <p className="text-[10px] text-slate-500">
            This page is a live concept/demo view. Features shown may be customised, added, removed, or changed to match each client&apos;s requirements.
          </p>
        </div>
      </div>
    </motion.div>
  );
}