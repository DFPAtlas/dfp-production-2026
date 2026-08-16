'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from '@/components/motion';

const workflows = [
  {
    id: 1,
    title: 'Lead Discovery',
    nodes: [
      { label: 'New lead discovered', icon: 'ri-radar-line', type: 'discovery' },
      { label: 'Company verified', icon: 'ri-check-double-line', type: 'process' },
      { label: 'Contact information collected', icon: 'ri-contacts-line', type: 'process' },
      { label: 'Opportunity classified', icon: 'ri-folders-line', type: 'ai' },
      { label: 'Lead scored', icon: 'ri-bar-chart-line', type: 'ai' },
      { label: 'Database updated', icon: 'ri-database-2-line', type: 'process' },
      { label: 'Staff notified', icon: 'ri-notification-3-line', type: 'human' },
    ],
  },
  {
    id: 2,
    title: 'Customer Support',
    nodes: [
      { label: 'Customer request received', icon: 'ri-mail-line', type: 'discovery' },
      { label: 'Request classified', icon: 'ri-robot-line', type: 'ai' },
      { label: 'Account information checked', icon: 'ri-user-search-line', type: 'process' },
      { label: 'Priority assessed', icon: 'ri-flag-line', type: 'ai' },
      { label: 'Task created', icon: 'ri-task-line', type: 'process' },
      { label: 'Correct team notified', icon: 'ri-team-line', type: 'human' },
      { label: 'Progress recorded', icon: 'ri-timer-line', type: 'process' },
    ],
  },
  {
    id: 3,
    title: 'Job Matching',
    nodes: [
      { label: 'Job created', icon: 'ri-briefcase-line', type: 'discovery' },
      { label: 'Requirements checked', icon: 'ri-file-list-3-line', type: 'process' },
      { label: 'Suitable workers identified', icon: 'ri-user-search-line', type: 'ai' },
      { label: 'Availability compared', icon: 'ri-calendar-check-line', type: 'process' },
      { label: 'Compliance checked', icon: 'ri-shield-check-line', type: 'process' },
      { label: 'Client presented with options', icon: 'ri-list-check', type: 'human' },
      { label: 'Human selection confirmed', icon: 'ri-user-star-line', type: 'human' },
    ],
  },
  {
    id: 4,
    title: 'Document Processing',
    nodes: [
      { label: 'Document uploaded', icon: 'ri-upload-cloud-line', type: 'discovery' },
      { label: 'Document type identified', icon: 'ri-folders-line', type: 'ai' },
      { label: 'Important information extracted', icon: 'ri-file-text-line', type: 'ai' },
      { label: 'Data checked', icon: 'ri-check-double-line', type: 'process' },
      { label: 'Dashboard updated', icon: 'ri-dashboard-line', type: 'process' },
      { label: 'Human review where required', icon: 'ri-user-star-line', type: 'human' },
    ],
  },
  {
    id: 5,
    title: 'Platform Monitoring',
    nodes: [
      { label: 'System event detected', icon: 'ri-scan-line', type: 'discovery' },
      { label: 'Severity classified', icon: 'ri-robot-line', type: 'ai' },
      { label: 'Related service checked', icon: 'ri-git-branch-line', type: 'process' },
      { label: 'Incident recorded', icon: 'ri-error-warning-line', type: 'process' },
      { label: 'Responsible person notified', icon: 'ri-notification-3-line', type: 'human' },
      { label: 'Resolution tracked', icon: 'ri-record-circle-line', type: 'process' },
    ],
  },
];

const typeColors: Record<string, string> = {
  discovery: '#06B6D4',
  process: '#A855F7',
  ai: '#EC4899',
  human: '#10B981',
};

const typeLabels: Record<string, string> = {
  discovery: 'Trigger',
  process: 'Process',
  ai: 'AI',
  human: 'Human',
};

export default function AIWorkflowSection() {
  const [activeWorkflow, setActiveWorkflow] = useState(0);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const playInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoPlayTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const currentNodes = workflows[activeWorkflow].nodes;

  const resetWorkflow = useCallback(() => {
    if (playInterval.current) clearInterval(playInterval.current);
    setIsPlaying(false);
    setCurrentStep(-1);
  }, []);

  const selectWorkflow = useCallback((index: number) => {
    if (playInterval.current) clearInterval(playInterval.current);
    setIsPlaying(false);
    setActiveWorkflow(index);
    setCurrentStep(-1);
  }, []);

  const stepForward = useCallback(() => {
    setCurrentStep(prev => {
      const next = prev + 1;
      if (next >= currentNodes.length) {
        setIsPlaying(false);
        if (playInterval.current) clearInterval(playInterval.current);
        return prev;
      }
      return next;
    });
  }, [currentNodes.length]);

  const stepBackward = useCallback(() => {
    setCurrentStep(prev => Math.max(-1, prev - 1));
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      if (playInterval.current) clearInterval(playInterval.current);
      setIsPlaying(false);
    } else {
      if (currentStep >= currentNodes.length - 1) setCurrentStep(-1);
      setIsPlaying(true);
    }
  }, [isPlaying, currentStep, currentNodes.length]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      playInterval.current = setInterval(() => {
        setCurrentStep(prev => {
          const next = prev + 1;
          if (next >= currentNodes.length) {
            setIsPlaying(false);
            return prev;
          }
          return next;
        });
      }, 400);
    }
    return () => {
      if (playInterval.current) clearInterval(playInterval.current);
    };
  }, [isPlaying, currentNodes.length]);

  useEffect(() => {
    if (hasAutoPlayed) return;
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
          if (!mq.matches) {
            setHasAutoPlayed(true);
            setCurrentStep(-1);
            if (autoPlayTimeout.current) clearTimeout(autoPlayTimeout.current);
            autoPlayTimeout.current = setTimeout(() => {
              if (mountedRef.current) setIsPlaying(true);
            }, 150);
          } else {
            setCurrentStep(currentNodes.length - 1);
          }
          observer.unobserve(el);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (autoPlayTimeout.current) clearTimeout(autoPlayTimeout.current);
    };
  }, [hasAutoPlayed, currentNodes.length]);

  return (
    <section ref={sectionRef} id="ai-workflows" className="py-24 px-6 bg-[#060F1E] relative overflow-hidden">
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(circle at 70% 20%, rgba(6,182,212,0.04) 0%, transparent 50%), radial-gradient(circle at 30% 80%, rgba(168,85,247,0.02) 0%, transparent 50%)',
      }} />

      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
            AI that works
          </h2>
          <h3 className="text-xl md:text-3xl font-bold text-[#06B6D4] tracking-tight mb-6">
            inside the business
          </h3>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Digital Footprint builds AI agents and automation around real company workflows.
            These systems can research, classify, organise, monitor, communicate and prepare work
            while keeping people involved in important decisions.
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-2 mb-10" role="group" aria-label="Select workflow example">
          {workflows.map((wf, i) => (
            <button
              key={wf.id}
              onClick={() => selectWorkflow(i)}
              aria-pressed={activeWorkflow === i}
              className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:ring-offset-2 focus:ring-offset-[#060F1E] ${
                activeWorkflow === i
                  ? 'bg-[#06B6D4] text-white shadow-lg shadow-[#06B6D4]/20'
                  : 'text-slate-400 border border-white/[0.06] hover:text-white hover:border-white/[0.15] bg-white/[0.02]'
              }`}
            >
              {wf.title}
            </button>
          ))}
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-0">
            {currentNodes.map((node, i) => {
              const isActive = i <= currentStep;
              const isCurrent = i === currentStep;
              return (
                <div key={i} className="flex items-center">
                  <motion.div
                    initial={{ opacity: 0.5, scale: 0.95 }}
                    animate={{
                      opacity: isActive ? 1 : 0.35,
                      scale: isCurrent ? 1.08 : isActive ? 1 : 0.95,
                    }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div
                      className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
                        node.type === 'human' && isActive ? 'ring-1 ring-[#10B981]/20' : ''
                      }`}
                      style={{
                        backgroundColor: isActive ? `${typeColors[node.type]}12` : 'rgba(255,255,255,0.02)',
                        borderColor: isActive ? `${typeColors[node.type]}30` : 'rgba(255,255,255,0.04)',
                        boxShadow: isActive ? `0 0 16px ${typeColors[node.type]}10` : 'none',
                      }}
                    >
                      <i
                        className={`${node.icon} text-lg md:text-xl w-5 h-5 md:w-6 md:h-6 flex items-center justify-center`}
                        style={{ color: isActive ? typeColors[node.type] : '#475569' }}
                      />
                    </div>
                    <span
                      className="text-[9px] font-semibold uppercase tracking-wider"
                      style={{ color: isActive ? typeColors[node.type] : '#475569' }}
                    >
                      {typeLabels[node.type]}
                    </span>
                    <span
                      className={`text-[10px] text-center max-w-[60px] md:max-w-[80px] leading-tight transition-colors ${
                        isActive ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      {node.label}
                    </span>
                  </motion.div>
                  {i < currentNodes.length - 1 && (
                    <div className="flex items-center mx-1 md:mx-0.5">
                      <div className="w-6 md:w-10 h-px bg-white/[0.04] relative overflow-hidden">
                        {isActive && (
                          <div
                            className="absolute inset-0"
                            style={{
                              background: `linear-gradient(to right, transparent, ${typeColors[node.type]}25, transparent)`,
                              animation: 'flowPulse 1.5s ease-in-out infinite',
                              animationDelay: `${i * 0.1}s`,
                            }}
                          />
                        )}
                      </div>
                      <i className={`ri-arrow-right-s-line w-3 h-3 flex items-center justify-center ${isActive ? 'text-white/20' : 'text-white/06'}`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-3 mt-10 flex-wrap">
            <button
              onClick={() => selectWorkflow(Math.max(0, activeWorkflow - 1))}
              disabled={activeWorkflow === 0}
              className="w-9 h-9 rounded-lg flex items-center justify-center border border-white/[0.08] text-slate-400 hover:text-white hover:border-white/[0.2] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#06B6D4]"
              aria-label="Previous workflow"
            >
              <i className="ri-skip-back-line w-4 h-4 flex items-center justify-center" />
            </button>
            <button
              onClick={stepBackward}
              disabled={currentStep < 0}
              className="w-9 h-9 rounded-lg flex items-center justify-center border border-white/[0.08] text-slate-400 hover:text-white hover:border-white/[0.2] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#06B6D4]"
              aria-label="Previous step"
            >
              <i className="ri-arrow-left-s-line w-5 h-5 flex items-center justify-center" />
            </button>
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-xl flex items-center justify-center border border-[#06B6D4]/20 text-[#06B6D4] hover:bg-[#06B6D4]/10 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06B6D4]"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              <i className={`${isPlaying ? 'ri-pause-line' : 'ri-play-line'} w-5 h-5 flex items-center justify-center`} />
            </button>
            <button
              onClick={stepForward}
              disabled={currentStep >= currentNodes.length - 1}
              className="w-9 h-9 rounded-lg flex items-center justify-center border border-white/[0.08] text-slate-400 hover:text-white hover:border-white/[0.2] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#06B6D4]"
              aria-label="Next step"
            >
              <i className="ri-arrow-right-s-line w-5 h-5 flex items-center justify-center" />
            </button>
            <button
              onClick={() => selectWorkflow(Math.min(workflows.length - 1, activeWorkflow + 1))}
              disabled={activeWorkflow === workflows.length - 1}
              className="w-9 h-9 rounded-lg flex items-center justify-center border border-white/[0.08] text-slate-400 hover:text-white hover:border-white/[0.2] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#06B6D4]"
              aria-label="Next workflow"
            >
              <i className="ri-skip-forward-line w-4 h-4 flex items-center justify-center" />
            </button>
            <button
              onClick={resetWorkflow}
              className="w-9 h-9 rounded-lg flex items-center justify-center border border-white/[0.08] text-slate-500 hover:text-white hover:border-white/[0.2] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06B6D4]"
              aria-label="Restart workflow"
            >
              <i className="ri-restart-line w-4 h-4 flex items-center justify-center" />
            </button>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-[10px] text-slate-600">
            {Object.entries(typeLabels).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: typeColors[key] }} />
                <span>{label}</span>
                {key === 'human' && <span className="text-[#10B981]">— keeps humans in control</span>}
              </div>
            ))}
          </div>

          {currentStep >= currentNodes.length - 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 text-center"
            >
              <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl border border-[#10B981]/20 bg-[#10B981]/5">
                <i className="ri-check-double-line w-4 h-4 flex items-center justify-center text-[#10B981]" />
                <span className="text-sm text-[#10B981] font-medium">
                  Workflow complete — human approval remains part of every critical decision point
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes flowPulse {
          0%, 100% { opacity: 0.1; transform: translateX(-100%); }
          50% { opacity: 0.8; transform: translateX(100%); }
        }
      `}</style>
    </section>
  );
}