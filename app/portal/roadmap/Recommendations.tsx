'use client';

import { motion } from '@/components/motion';
import {
  TrendingUp,
  Zap,
  Shield,
  BarChart3,
  Globe,
  Search,
  Bot,
  Cloud,
  Workflow,
  Users,
  FileCheck,
  Mail,
  CalendarCheck,
  MessageSquare,
  RefreshCw,
  Database,
  BrainCircuit,
} from 'lucide-react';

interface Recommendation {
  icon: React.ReactNode;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedBenefit: string;
  estimatedCost: string;
  timeframe: string;
}

interface AIOpportunity {
  icon: React.ReactNode;
  title: string;
  description: string;
  timeSaving: string;
  benefit: string;
}

const recommendations: Recommendation[] = [
  {
    icon: <Globe className="w-5 h-5" />,
    title: 'Website Performance Optimisation',
    description: 'Improve Core Web Vitals, page load speed and mobile responsiveness to boost SEO rankings and user experience.',
    priority: 'high',
    estimatedBenefit: '25-40% increase in conversion',
    estimatedCost: '£1,500 - £3,000',
    timeframe: 'Next 30 days',
  },
  {
    icon: <Search className="w-5 h-5" />,
    title: 'Advanced SEO Enhancement',
    description: 'Comprehensive technical SEO audit, content strategy refresh and local SEO optimisation to capture more organic traffic.',
    priority: 'high',
    estimatedBenefit: '60-120% increase in organic traffic',
    estimatedCost: '£800 - £2,000 /month',
    timeframe: 'Next 30-60 days',
  },
  {
    icon: <Cloud className="w-5 h-5" />,
    title: 'Cloud Backup Solutions',
    description: 'Implement automated cloud backup with disaster recovery planning to protect business-critical data and ensure continuity.',
    priority: 'medium',
    estimatedBenefit: 'Zero data loss risk',
    estimatedCost: '£200 - £600 /month',
    timeframe: 'Next 60 days',
  },
  {
    icon: <Bot className="w-5 h-5" />,
    title: 'AI Customer Assistant',
    description: 'Deploy an intelligent chatbot to handle FAQs, qualify leads 24/7 and reduce support workload by up to 70%.',
    priority: 'high',
    estimatedBenefit: '70% reduction in support tickets',
    estimatedCost: '£500 - £1,500 /month',
    timeframe: 'Next 30-60 days',
  },
  {
    icon: <Workflow className="w-5 h-5" />,
    title: 'Business Process Automation',
    description: 'Identify and automate repetitive tasks across departments to reduce manual work and eliminate human error.',
    priority: 'medium',
    estimatedBenefit: '15-25 hours saved per week',
    estimatedCost: '£2,000 - £8,000',
    timeframe: 'Next 60-90 days',
  },
  {
    icon: <Database className="w-5 h-5" />,
    title: 'CRM Integration & Migration',
    description: 'Centralise customer data with a tailored CRM solution, including migration, training and workflow setup.',
    priority: 'medium',
    estimatedBenefit: '35% faster sales cycle',
    estimatedCost: '£3,000 - £10,000',
    timeframe: 'Next 60-90 days',
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Custom Reporting Dashboards',
    description: 'Build real-time business intelligence dashboards connecting all your data sources for instant decision-making insights.',
    priority: 'low',
    estimatedBenefit: 'Faster data-driven decisions',
    estimatedCost: '£2,000 - £6,000',
    timeframe: 'Next 90 days',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Cyber Security Review',
    description: 'Full security audit including penetration testing, vulnerability assessment and compliance gap analysis with remediation plan.',
    priority: 'high',
    estimatedBenefit: 'Eliminate 95% of vulnerabilities',
    estimatedCost: '£1,500 - £4,000',
    timeframe: 'Next 30 days',
  },
];

const aiOpportunities: AIOpportunity[] = [
  {
    icon: <Bot className="w-5 h-5" />,
    title: 'Automated Lead Capture & Qualification',
    description: 'AI-powered lead scoring and automated follow-up sequences that nurture prospects without manual intervention.',
    timeSaving: '10-15 hours/week',
    benefit: '35% more qualified leads',
  },
  {
    icon: <MessageSquare className="w-5 h-5" />,
    title: 'AI Customer Support',
    description: 'Intelligent support agent that resolves common queries instantly, escalates complex issues and learns from every interaction.',
    timeSaving: '20-30 hours/week',
    benefit: '70% faster first response',
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Automated Business Reporting',
    description: 'Generate weekly performance reports, financial summaries and KPI dashboards automatically — no spreadsheets needed.',
    timeSaving: '5-8 hours/week',
    benefit: 'Always-on business intelligence',
  },
  {
    icon: <CalendarCheck className="w-5 h-5" />,
    title: 'AI Appointment Scheduling',
    description: 'Smart scheduling system that coordinates across calendars, sends reminders and reduces no-shows automatically.',
    timeSaving: '3-5 hours/week',
    benefit: '60% fewer no-shows',
  },
  {
    icon: <FileCheck className="w-5 h-5" />,
    title: 'Document Automation',
    description: 'Auto-generate proposals, contracts and invoices from templates with dynamic data population and e-signature integration.',
    timeSaving: '8-12 hours/week',
    benefit: '90% faster document turnaround',
  },
  {
    icon: <Mail className="w-5 h-5" />,
    title: 'Email Automation & Personalisation',
    description: 'Behaviour-triggered email sequences with AI-personalised content that adapts to each recipient in real time.',
    timeSaving: '6-10 hours/week',
    benefit: '45% higher open rates',
  },
];

const priorityColors: Record<string, { bg: string; text: string; dot: string }> = {
  high: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  low: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
};

export default function Recommendations() {
  return (
    <div className="space-y-10">
      <section>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">Recommended Improvements</h2>
          <p className="text-sm text-slate-500 mt-1">Personalised technology recommendations based on your current setup and growth trajectory</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec, i) => {
            const pc = priorityColors[rec.priority];
            return (
              <motion.div
                key={rec.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#2563EB]/10 flex-shrink-0 group-hover:bg-[#2563EB]/20 transition-colors">
                    <span className="text-[#2563EB]">{rec.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-slate-900 text-sm">{rec.title}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${pc.bg} ${pc.text} whitespace-nowrap`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mb-3">{rec.description}</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-slate-50 rounded-lg p-2">
                        <p className="text-slate-400 mb-0.5">Benefit</p>
                        <p className="font-semibold text-slate-700">{rec.estimatedBenefit}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2">
                        <p className="text-slate-400 mb-0.5">Cost Range</p>
                        <p className="font-semibold text-slate-700">{rec.estimatedCost}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2">
                        <p className="text-slate-400 mb-0.5">Timeframe</p>
                        <p className="font-semibold text-slate-700">{rec.timeframe}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">AI & Automation Opportunities</h2>
          <p className="text-sm text-slate-500 mt-1">Work smarter, not harder — automation opportunities identified specifically for your business</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {aiOpportunities.map((opp, i) => (
            <motion.div
              key={opp.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-gradient-to-br from-[#2563EB]/5 to-violet-50/50 border border-[#2563EB]/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#2563EB]/10 mb-3 group-hover:bg-[#2563EB]/20 transition-colors">
                <span className="text-[#2563EB]">{opp.icon}</span>
              </div>
              <p className="font-semibold text-slate-900 text-sm mb-1.5">{opp.title}</p>
              <p className="text-sm text-slate-500 mb-3">{opp.description}</p>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-lg">
                  <Clock className="w-3 h-3" />
                  Saves {opp.timeSaving}
                </span>
                <span className="flex items-center gap-1 text-[#2563EB] font-semibold bg-[#2563EB]/5 px-2 py-1 rounded-lg">
                  <TrendingUp className="w-3 h-3" />
                  {opp.benefit}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Clock({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}