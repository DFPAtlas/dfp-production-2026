'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from '@/components/motion';

const stages = [
  {
    letter: 'C',
    title: 'Conception',
    color: '#06B6D4',
    icon: 'ri-lightbulb-line',
    items: [
      'Initial conversation',
      'Business discovery',
      'Problem definition',
      'Market research',
      'User requirements',
      'Commercial model',
      'Brand direction',
      'User journeys',
      'Product planning',
      'Technical architecture',
    ],
  },
  {
    letter: 'D',
    title: 'Development',
    color: '#A855F7',
    icon: 'ri-code-s-slash-line',
    items: [
      'UI and UX design',
      'Public website',
      'Customer accounts',
      'Staff portals',
      'Administrative dashboards',
      'Database architecture',
      'Authentication',
      'Role-based access',
      'Payment systems',
      'AI agents',
      'Automation',
      'Integrations',
      'Testing environments',
    ],
  },
  {
    letter: 'D',
    title: 'Deployment',
    color: '#F97316',
    icon: 'ri-rocket-line',
    items: [
      'User acceptance testing',
      'Security review',
      'Production preparation',
      'Cloud deployment',
      'Local server deployment',
      'Domain configuration',
      'Staff onboarding',
      'Monitoring',
      'Support',
      'Launch improvements',
    ],
  },
  {
    letter: 'M',
    title: 'Management',
    color: '#10B981',
    icon: 'ri-settings-3-line',
    items: [
      'Platform monitoring',
      'Support tickets',
      'User administration',
      'Operational oversight',
      'System health',
      'Payment alerts',
      'Security notifications',
      'Incident response',
      'Continued maintenance',
    ],
  },
  {
    letter: 'G',
    title: 'Growth',
    color: '#EC4899',
    icon: 'ri-line-chart-line',
    items: [
      'New features',
      'Additional automation',
      'New customer types',
      'New markets',
      'Data intelligence',
      'Product expansion',
      'Performance improvements',
      'Infrastructure scaling',
    ],
  },
];

export default function CDDProcessSection() {
  const [activeStage, setActiveStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  const safeStageIndex = Math.min(Math.max(activeStage, 0), stages.length - 1);
  const currentStage = stages[safeStageIndex];

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setActiveStage(stages.length - 1);
      setProgress(1);
      return;
    }

    const el = sectionRef.current;
    if (!el) return;

    const handleScroll = () => {
      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      if (!rect.height) return;
      const sectionProgress = Math.min(1, Math.max(0, (windowHeight * 0.5 - rect.top) / (rect.height * 0.55)));
      setProgress(sectionProgress);
      setActiveStage(Math.min(Math.floor(sectionProgress * stages.length), stages.length - 1));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section ref={sectionRef} id="how-we-work" className="py-24 px-6 bg-[#0A1628] relative overflow-hidden" style={{ scrollMarginTop: '5rem' }}>
      <div className="absolute inset-0 opacity-[0.01]" style={{
        backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.5) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div id="cdd-process" className="relative z-10 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
            One connected process
          </h2>
          <h3 className="text-xl md:text-3xl font-bold text-[#06B6D4] tracking-tight">
            from idea to operation
          </h3>
        </motion.div>

        <div className="relative max-w-5xl mx-auto">
          <div className="relative mb-10">
            <div
              className="absolute top-7 left-[10%] right-[10%] h-[2px] rounded-full overflow-hidden"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.min(progress * 100, 100)}%`,
                  background: 'linear-gradient(to right, #06B6D4, #A855F7, #F97316, #10B981, #EC4899)',
                  boxShadow: '0 0 20px rgba(6,182,212,0.25)',
                }}
              />
            </div>

            <div className="flex justify-between relative">
              {stages.map((stage, i) => (
                <div
                  key={stage.letter + stage.title}
                  className="relative flex flex-col items-center"
                  style={{ width: '20%' }}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black transition-all duration-500 ${
                      i <= activeStage ? 'text-white' : 'text-slate-600'
                    }`}
                    style={{
                      backgroundColor: i <= activeStage ? `${stage.color}18` : 'rgba(255,255,255,0.02)',
                      border: `2px solid ${i <= activeStage ? stage.color + '50' : 'rgba(255,255,255,0.04)'}`,
                      boxShadow: i <= activeStage ? `0 0 24px ${stage.color}18` : 'none',
                      transform: i === activeStage ? 'scale(1.12)' : 'scale(1)',
                    }}
                  >
                    {stage.letter}
                  </div>
                  <p
                    className="mt-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors duration-500"
                    style={{ color: i <= activeStage ? stage.color : '#475569' }}
                  >
                    {stage.title}
                  </p>
                </div>
              ))}
            </div>

            <div
              className="absolute -bottom-7 left-[10%] transition-all duration-700 ease-out"
              style={{
                left: `${10 + Math.min(progress * 80, 80)}%`,
                opacity: progress > 0 ? 1 : 0,
              }}
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{
                  backgroundColor: currentStage.color,
                  boxShadow: `0 0 14px ${currentStage.color}60`,
                  transition: 'background-color 0.5s ease, box-shadow 0.5s ease',
                }}
              />
            </div>
          </div>

          <div className="relative">
            {stages.map((stage, i) => {
              const isActive = i <= activeStage;
              return (
                <motion.div
                  key={stage.letter + stage.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className={`rounded-2xl border p-6 transition-all duration-500 mb-4 last:mb-0 ${
                    isActive
                      ? 'border-white/[0.1] bg-white/[0.02]'
                      : 'border-white/[0.02] bg-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500"
                      style={{
                        backgroundColor: i <= activeStage ? `${stage.color}15` : 'rgba(255,255,255,0.02)',
                      }}
                    >
                      <i className={`${stage.icon} text-base w-5 h-5 flex items-center justify-center`} style={{ color: i <= activeStage ? stage.color : '#475569' }} />
                    </div>
                    <div>
                      <span className="text-sm font-bold uppercase tracking-wider" style={{ color: i <= activeStage ? stage.color : '#475569' }}>
                        {stage.letter} &mdash; {stage.title}
                      </span>
                    </div>
                    <div className="ml-auto">
                      <span
                        className={`w-2.5 h-2.5 rounded-full inline-block ${
                          isActive ? 'opacity-100' : 'opacity-15'
                        }`}
                        style={{
                          backgroundColor: stage.color,
                          boxShadow: isActive ? `0 0 8px ${stage.color}60` : 'none',
                        }}
                      />
                    </div>
                  </div>

                  <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 transition-opacity duration-500 ${
                    isActive ? 'opacity-100' : 'opacity-25'
                  }`}>
                    {stage.items.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-300"
                        style={{
                          backgroundColor: isActive ? `${stage.color}08` : 'transparent',
                          border: `1px solid ${isActive ? stage.color + '12' : 'rgba(255,255,255,0.02)'}`,
                          color: isActive ? 'rgb(203,213,225)' : 'rgb(100,116,139)',
                        }}
                      >
                        <span
                          className="w-1 h-1 rounded-full shrink-0"
                          style={{ backgroundColor: isActive ? stage.color + '80' : 'rgba(255,255,255,0.08)' }}
                        />
                        {item}
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {activeStage >= stages.length - 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-12"
          >
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-[#EC4899]/15 bg-[#EC4899]/5">
              <i className="ri-check-double-line w-4 h-4 flex items-center justify-center text-[#EC4899]" />
              <span className="text-sm text-[#EC4899] font-medium">
                Complete journey from concept to continuous growth
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}