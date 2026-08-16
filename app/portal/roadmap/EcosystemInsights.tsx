'use client';

import { motion } from '@/components/motion';
import {
  Shield,
  Zap,
  Cloud,
  BrainCircuit,
  Code,
  Headphones,
  Globe,
  BarChart3,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';

const ecosystemProducts = [
  {
    name: 'QuickGuard',
    description: 'Rapid website security monitoring and threat detection for businesses that need instant protection without complexity.',
    icon: <Shield className="w-5 h-5" />,
    benefits: ['Real-time threat detection', 'Automated security patching', 'Instant alerting system'],
    color: 'from-[#2563EB] to-blue-700',
  },
  {
    name: 'GuardianHub',
    description: 'Comprehensive digital asset protection platform combining security, backup and compliance in one unified dashboard.',
    icon: <Cloud className="w-5 h-5" />,
    benefits: ['Unified security dashboard', 'Automated backups', 'Compliance tracking'],
    color: 'from-emerald-500 to-teal-600',
  },
  {
    name: 'Synqoro',
    description: 'Intelligent workflow synchronisation platform that connects your tools, automates processes and eliminates data silos.',
    icon: <Zap className="w-5 h-5" />,
    benefits: ['Cross-platform integration', 'Workflow automation', 'Real-time data sync'],
    color: 'from-violet-500 to-purple-700',
  },
  {
    name: 'Lethub',
    description: 'AI-powered lead management and customer acquisition platform designed to maximise conversion at every stage.',
    icon: <TrendingUp className="w-5 h-5" />,
    benefits: ['AI lead scoring', 'Automated nurture sequences', 'Conversion analytics'],
    color: 'from-amber-500 to-orange-600',
  },
];

const services = [
  { name: 'AI Automation', icon: <BrainCircuit className="w-5 h-5" />, desc: 'Intelligent process automation tailored to your workflows' },
  { name: 'Custom Software', icon: <Code className="w-5 h-5" />, desc: 'Bespoke applications built to solve your unique business challenges' },
  { name: 'Cloud Infrastructure', icon: <Cloud className="w-5 h-5" />, desc: 'Scalable, secure cloud architecture designed for growth' },
  { name: 'Cyber Security', icon: <Shield className="w-5 h-5" />, desc: 'End-to-end protection from threat assessment to incident response' },
  { name: 'IT Support', icon: <Headphones className="w-5 h-5" />, desc: 'Proactive managed IT support keeping your business running 24/7' },
  { name: 'Web Development', icon: <Globe className="w-5 h-5" />, desc: 'Modern, performant websites and web applications' },
];

const insights = [
  { label: 'Completed Projects', value: '4', icon: <CheckCircle className="w-5 h-5" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Time Saved (Est.)', value: '120+ hrs', icon: <ClockIcon className="w-5 h-5" />, color: 'text-[#2563EB]', bg: 'bg-[#2563EB]/10' },
  { label: 'Cost Savings (Est.)', value: '£18,500', icon: <TrendingUp className="w-5 h-5" />, color: 'text-violet-600', bg: 'bg-violet-50' },
  { label: 'Upcoming Opportunities', value: '12', icon: <BarChart3 className="w-5 h-5" />, color: 'text-amber-600', bg: 'bg-amber-50' },
];

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export default function EcosystemInsights() {
  return (
    <div className="space-y-10">
      <section>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">Digital Footprint Ecosystem</h2>
          <p className="text-sm text-slate-500 mt-1">Products and services designed to support every stage of your digital journey</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ecosystemProducts.map((product, i) => (
            <motion.div
              key={product.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow group cursor-pointer"
            >
              <div className={`bg-gradient-to-r ${product.color} p-4 text-white`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/20">
                    {product.icon}
                  </div>
                  <div>
                    <p className="font-bold text-lg">{product.name}</p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm text-slate-600 mb-3">{product.description}</p>
                <div className="space-y-1.5">
                  {product.benefits.map(b => (
                    <div key={b} className="flex items-center gap-2 text-xs text-slate-500">
                      <ChevronRight className="w-3 h-3 text-[#2563EB]" />
                      {b}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
          {services.map((service, i) => (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="bg-white border border-slate-100 rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#2563EB]/10 mx-auto mb-2 group-hover:bg-[#2563EB]/20 transition-colors">
                <span className="text-[#2563EB]">{service.icon}</span>
              </div>
              <p className="text-xs font-semibold text-slate-900 mb-1 whitespace-nowrap">{service.name}</p>
              <p className="text-[11px] text-slate-400 line-clamp-2">{service.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">Business Insights</h2>
          <p className="text-sm text-slate-500 mt-1">Your digital transformation journey by the numbers</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {insights.map((insight, i) => (
            <motion.div
              key={insight.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow text-center"
            >
              <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${insight.bg} mx-auto mb-3`}>
                <span className={insight.color}>{insight.icon}</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-1">{insight.value}</p>
              <p className="text-xs text-slate-500 font-medium">{insight.label}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-4 bg-gradient-to-r from-[#2563EB]/5 to-violet-50/50 border border-[#2563EB]/10 rounded-2xl p-5"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#2563EB]/10 flex-shrink-0">
              <BarChart3 className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-1">Recommended Actions</p>
              <ul className="space-y-1">
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-[#2563EB] mt-0.5">●</span>
                  Prioritise cyber security review — your current score indicates moderate risk
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-[#2563EB] mt-0.5">●</span>
                  Implement AI customer assistant to reduce support load and improve response times
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-[#2563EB] mt-0.5">●</span>
                  Schedule workflow automation assessment to identify quick wins
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-[#2563EB] mt-0.5">●</span>
                  Book a strategy review to discuss Phase 2-3 roadmap alignment
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}