'use client';

import { motion } from '@/components/motion';
import {
  Globe,
  Zap,
  Shield,
  Cloud,
  Workflow,
  BrainCircuit,
  TrendingUp,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

const maturityCategories = [
  { key: 'website', label: 'Website', icon: <Globe className="w-5 h-5" />, score: 72, recommendation: 'Excellent foundation. Consider advanced performance optimisation and accessibility improvements.' },
  { key: 'automation', label: 'Automation', icon: <Zap className="w-5 h-5" />, score: 45, recommendation: 'Significant opportunity. Implement workflow automation across key business processes.' },
  { key: 'security', label: 'Cyber Security', icon: <Shield className="w-5 h-5" />, score: 58, recommendation: 'Moderate posture. Schedule a full security audit and implement multi-factor authentication.' },
  { key: 'cloud', label: 'Cloud Infrastructure', icon: <Cloud className="w-5 h-5" />, score: 65, recommendation: 'Solid setup. Explore auto-scaling and disaster recovery improvements.' },
  { key: 'processes', label: 'Business Processes', icon: <Workflow className="w-5 h-5" />, score: 50, recommendation: 'Room to grow. Map and streamline core workflows with digital transformation.' },
  { key: 'ai', label: 'AI Adoption', icon: <BrainCircuit className="w-5 h-5" />, score: 30, recommendation: 'Early stage. Huge potential for AI-powered customer support, analytics and automation.' },
];

const overallScore = Math.round(maturityCategories.reduce((sum, c) => sum + c.score, 0) / maturityCategories.length);

const strategicPhases = [
  {
    phase: 'Phase 1 — Foundation',
    timeframe: 'Now — Month 2',
    objectives: [
      'Complete current website project',
      'Implement core security measures',
      'Set up cloud backup & monitoring',
      'Establish performance baseline',
    ],
    projects: ['Website Launch', 'SSL & Security Hardening', 'Cloud Backup Setup', 'Google Analytics 4 Migration'],
    estimatedROI: 'Immediate stability gains',
    benefits: 'Secure, performant digital foundation ready for growth',
    color: 'bg-[#2563EB]',
    lightColor: 'bg-[#2563EB]/5',
    textColor: 'text-[#2563EB]',
    borderColor: 'border-[#2563EB]/20',
  },
  {
    phase: 'Phase 2 — Optimisation',
    timeframe: 'Month 2 — 4',
    objectives: [
      'Advanced SEO implementation',
      'Website performance optimisation',
      'Conversion rate optimisation',
      'Content strategy deployment',
    ],
    projects: ['Technical SEO Audit', 'CRO Implementation', 'Content Marketing Setup', 'Social Media Integration'],
    estimatedROI: '25-40% traffic increase',
    benefits: 'Higher visibility, better conversion rates, stronger brand presence',
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    borderColor: 'border-emerald-200',
  },
  {
    phase: 'Phase 3 — Automation',
    timeframe: 'Month 4 — 8',
    objectives: [
      'Workflow automation deployment',
      'CRM integration & migration',
      'Email marketing automation',
      'Document automation setup',
    ],
    projects: ['Business Process Automation', 'CRM Migration', 'Email Automation', 'Document Generation System'],
    estimatedROI: '15-25 hours saved per week',
    benefits: 'Streamlined operations, reduced manual work, faster turnaround times',
    color: 'bg-amber-500',
    lightColor: 'bg-amber-50',
    textColor: 'text-amber-600',
    borderColor: 'border-amber-200',
  },
  {
    phase: 'Phase 4 — Growth',
    timeframe: 'Month 8 — 14',
    objectives: [
      'AI customer support deployment',
      'Advanced analytics & reporting',
      'Multi-channel marketing automation',
      'Custom software development',
    ],
    projects: ['AI Chatbot Deployment', 'BI Dashboard Setup', 'Multi-Channel Campaigns', 'Bespoke Software Solution'],
    estimatedROI: '50-100% revenue growth potential',
    benefits: 'Scalable operations, data-driven decisions, personalised customer experiences',
    color: 'bg-violet-500',
    lightColor: 'bg-violet-50',
    textColor: 'text-violet-600',
    borderColor: 'border-violet-200',
  },
  {
    phase: 'Phase 5 — Scale',
    timeframe: 'Month 14 — 24',
    objectives: [
      'Full AI integration across business',
      'Predictive analytics & forecasting',
      'International expansion support',
      'Enterprise-grade infrastructure',
    ],
    projects: ['Enterprise AI Suite', 'Predictive Analytics Platform', 'Global CDN & Infrastructure', '24/7 Managed Support'],
    estimatedROI: '2-5x business growth',
    benefits: 'Market leadership, innovation culture, sustainable competitive advantage',
    color: 'bg-rose-500',
    lightColor: 'bg-rose-50',
    textColor: 'text-rose-600',
    borderColor: 'border-rose-200',
  },
];

function ScoreRing({ score, size = 'lg' }: { score: number; size?: 'lg' | 'sm' }) {
  const radius = size === 'lg' ? 56 : 28;
  const stroke = size === 'lg' ? 8 : 5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const dims = size === 'lg' ? 140 : 70;

  const getColor = (s: number) => {
    if (s >= 70) return '#10B981';
    if (s >= 50) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div className="relative" style={{ width: dims, height: dims }}>
      <svg className="transform -rotate-90" width={dims} height={dims} viewBox={`0 0 ${dims} ${dims}`}>
        <circle
          cx={dims / 2}
          cy={dims / 2}
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={stroke}
        />
        <circle
          cx={dims / 2}
          cy={dims / 2}
          r={radius}
          fill="none"
          stroke={getColor(score)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-bold text-slate-900 ${size === 'lg' ? 'text-2xl' : 'text-sm'}`}>{score}</span>
      </div>
    </div>
  );
}

export default function MaturityRoadmap() {
  return (
    <div className="space-y-10">
      <section>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">Digital Maturity Score</h2>
          <p className="text-sm text-slate-500 mt-1">A comprehensive assessment of your current digital capabilities across six key dimensions</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex flex-col items-center">
              <ScoreRing score={overallScore} />
              <p className="text-sm font-semibold text-slate-700 mt-3">Overall Score</p>
              <p className="text-xs text-slate-400">Out of 100</p>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {maturityCategories.map((cat, i) => (
                <motion.div
                  key={cat.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <ScoreRing score={cat.score} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-slate-600">{cat.icon}</span>
                      <p className="text-sm font-semibold text-slate-900">{cat.label}</p>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{cat.recommendation}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">Strategic Roadmap</h2>
          <p className="text-sm text-slate-500 mt-1">Your five-phase technology journey — from foundation to market leadership</p>
        </div>

        <div className="relative">
          <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-slate-200 lg:left-1/2 lg:-translate-x-px" />

          <div className="space-y-6">
            {strategicPhases.map((phase, i) => {
              const isLeft = i % 2 === 0;
              return (
                <motion.div
                  key={phase.phase}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`relative flex flex-col lg:flex-row items-start gap-6 ${isLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
                >
                  <div className={`absolute left-0 lg:left-1/2 lg:-translate-x-1/2 w-10 h-10 rounded-full ${phase.lightColor} border-2 ${phase.borderColor} flex items-center justify-center z-10 shadow-sm`}>
                    <span className={`text-sm font-bold ${phase.textColor}`}>{i + 1}</span>
                  </div>

                  <div className={`ml-14 lg:ml-0 lg:w-[calc(50%-28px)] ${isLeft ? 'lg:pr-8' : 'lg:pl-8'}`}>
                    <div className={`bg-white border ${phase.borderColor} rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-2 h-2 rounded-full ${phase.color}`} />
                        <h3 className="font-bold text-slate-900">{phase.phase}</h3>
                        <span className="text-xs text-slate-400 font-medium whitespace-nowrap">{phase.timeframe}</span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Objectives</p>
                          <ul className="space-y-1">
                            {phase.objectives.map(obj => (
                              <li key={obj} className="flex items-start gap-2 text-sm text-slate-700">
                                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                {obj}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Suggested Projects</p>
                          <div className="flex flex-wrap gap-1.5">
                            {phase.projects.map(p => (
                              <span key={p} className={`px-2.5 py-1 rounded-full text-xs font-medium ${phase.lightColor} ${phase.textColor}`}>
                                {p}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1 text-slate-500">
                            <TrendingUp className="w-3.5 h-3.5" />
                            ROI: {phase.estimatedROI}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 italic">{phase.benefits}</p>
                      </div>
                    </div>
                  </div>

                  <div className="hidden lg:block lg:w-[calc(50%-28px)]" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}