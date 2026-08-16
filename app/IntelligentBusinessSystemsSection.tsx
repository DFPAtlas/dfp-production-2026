'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from '@/components/motion';

const layers = [
  { num: 1, title: 'Public Website', desc: 'Customer-facing websites and SaaS interfaces built for performance, accessibility and conversion.', icon: 'ri-window-line', color: '#06B6D4' },
  { num: 2, title: 'Customer Experience', desc: 'Secure accounts, dashboards, messaging, document sharing and self-service portals.', icon: 'ri-user-star-line', color: '#22D3EE' },
  { num: 3, title: 'Staff & Contractor Portals', desc: 'Operational tools, task management, rotas, compliance, and internal workflows.', icon: 'ri-team-line', color: '#A855F7' },
  { num: 4, title: 'Administrative Control', desc: 'Central admin systems for user management, content, reporting and business oversight.', icon: 'ri-dashboard-3-line', color: '#F97316' },
  { num: 5, title: 'Payments & Subscriptions', desc: 'Integrated billing, recurring payments, invoicing and financial dashboards.', icon: 'ri-bank-card-line', color: '#10B981' },
  { num: 6, title: 'Database & Security', desc: 'Secure data storage, role-based access, encryption and compliance infrastructure.', icon: 'ri-shield-keyhole-line', color: '#EF4444' },
  { num: 7, title: 'AI Agents & Automation', desc: 'Intelligent workflows, automated processes and AI-powered business assistance.', icon: 'ri-robot-line', color: '#EC4899' },
  { num: 8, title: 'Cloud & Local Infrastructure', desc: 'Scalable cloud deployment and on-premise server systems for complete control.', icon: 'ri-server-line', color: '#3B82F6' },
  { num: 9, title: 'Monitoring & Support', desc: 'Continuous system monitoring, incident response, updates and technical support.', icon: 'ri-heart-pulse-line', color: '#D97706' },
];

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

export default function IntelligentBusinessSystemsSection() {
  const [activeLayer, setActiveLayer] = useState(0);
  const [dataPulsePos, setDataPulsePos] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const latestProgress = useRef(0);

  const [activeWorkflow, setActiveWorkflow] = useState(0);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);
  const playInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoPlayTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const currentNodes = workflows[activeWorkflow].nodes;

  const flush = useCallback(() => {
    rafRef.current = null;
    if (!mountedRef.current) return;
    const progress = latestProgress.current;
    const layer = Math.floor(progress * layers.length);
    setActiveLayer(Math.min(layer, layers.length - 1));
    setDataPulsePos(Math.min(progress, 1));
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setActiveLayer(layers.length - 1);
      setDataPulsePos(1);
      return;
    }

    const el = sectionRef.current;
    if (!el) return;

    const handleScroll = () => {
      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const progress = Math.min(1, Math.max(0, (windowHeight * 0.75 - rect.top) / (rect.height * 0.55)));
      latestProgress.current = progress;
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(flush);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [flush]);

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
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

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
    <section ref={sectionRef} id="intelligent-business-systems" className="py-24 px-6 bg-[#0A1628] relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{
          backgroundImage: 'url("https://readdy.ai/api/search-image?query=A%20sophisticated%20dark%20digital%20technology%20background%20with%20subtle%20glowing%20circuit%20board%20patterns%20and%20flowing%20data%20streams%20in%20deep%20navy%20blue%20and%20teal%20tones%2C%20featuring%20abstract%20geometric%20network%20nodes%20connected%20by%20thin%20luminous%20lines%2C%20soft%20gradient%20light%20beams%20crossing%20diagonally%2C%20minimal%20and%20clean%20aesthetic%20suitable%20for%20a%20business%20technology%20section%20overlay%2C%20dark%20atmospheric%20depth%20with%20very%20subtle%20particle%20effects%2C%20modern%20enterprise%20tech%20feel%2C%20dark%20background%20blending%20seamlessly%20with%20navy%20blue%20tones&width=1440&height=900&seq=ibs-digital-bg-v2&orientation=landscape")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.18,
        }} />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, rgba(6,182,212,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Intelligent Business Systems
          </h2>
          <h3 className="text-2xl md:text-4xl font-bold text-[#06B6D4] tracking-tight mb-6">
            SaaS, portals, AI agents and workflow automation
          </h3>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
            A modern company needs more than a public homepage. It needs customer accounts,
            operational dashboards, secure databases, payment systems, staff tools, AI assistance,
            automation and reporting. Digital Footprint brings these elements together
            as one connected platform.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto relative mb-20">
          <div
            className="absolute left-[18px] top-0 bottom-0 w-px z-0"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          />

          <div
            className="absolute left-[16px] w-[5px] h-[5px] rounded-full z-10"
            style={{
              transform: `translateY(calc(${dataPulsePos * 100}% - 2.5px))`,
              top: 0,
              backgroundColor: layers.length > 0 && activeLayer < layers.length ? (layers[Math.min(activeLayer, layers.length - 1)]?.color ?? '#06B6D4') : '#06B6D4',
              boxShadow: `0 0 12px ${(layers.length > 0 && activeLayer < layers.length ? (layers[Math.min(activeLayer, layers.length - 1)]?.color ?? '#06B6D4') : '#06B6D4')}80`,
              opacity: dataPulsePos > 0 ? 1 : 0,
              transition: 'background-color 400ms ease, box-shadow 400ms ease, opacity 400ms ease',
            }}
          />

          {layers.map((layer, i) => (
            <div
              key={layer.num}
              className={`relative flex items-start gap-5 py-5 transition-all duration-600 ${
                i <= activeLayer ? 'opacity-100' : 'opacity-25'
              }`}
              style={{ transitionDelay: `${i * 0.04}s` }}
            >
              <div className="flex flex-col items-center shrink-0 z-10">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                    i <= activeLayer
                      ? 'text-white'
                      : 'text-slate-500 bg-slate-800/50 border border-slate-700/30'
                  }`}
                  style={{
                    backgroundColor: i <= activeLayer ? layer.color : undefined,
                    boxShadow: i <= activeLayer ? `0 0 14px ${layer.color}35` : undefined,
                    transform: i === activeLayer ? 'scale(1.12)' : 'scale(1)',
                  }}
                >
                  {layer.num}
                </div>
                {i < layers.length - 1 && (
                  <div
                    className={`w-px flex-1 min-h-[20px] mt-1 transition-all duration-600`}
                    style={{
                      opacity: i < activeLayer ? 1 : 0.15,
                      background: i < activeLayer
                        ? `linear-gradient(to bottom, ${layers[i].color}, ${layers[i + 1].color})`
                        : 'rgba(255,255,255,0.06)',
                    }}
                  />
                )}
              </div>

              <div className="flex-1 pb-2">
                <h4
                  className="font-semibold text-base mb-1 transition-all duration-400"
                  style={{ color: i <= activeLayer ? layer.color : '#475569' }}
                >
                  {layer.title}
                </h4>
                <p className={`text-sm leading-relaxed transition-all duration-400 ${
                  i <= activeLayer ? 'text-slate-400' : 'text-slate-700'
                }`}>
                  {layer.desc}
                </p>
              </div>

              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all duration-500 ${
                  i <= activeLayer ? 'opacity-100 scale-100' : 'opacity-25 scale-90'
                }`}
                style={{ backgroundColor: i <= activeLayer ? `${layer.color}12` : 'rgba(255,255,255,0.01)' }}
              >
                <i
                  className={`${layer.icon} text-lg w-5 h-5 flex items-center justify-center`}
                  style={{ color: i <= activeLayer ? layer.color : '#475569' }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/[0.06] pt-16 mt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h3 className="text-2xl md:text-3xl font-bold text-[#EC4899] tracking-tight mb-4">
              AI that works inside the business
            </h3>
            <p className="text-slate-400 max-w-2xl mx-auto text-base leading-relaxed">
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
                className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:ring-offset-2 focus:ring-offset-[#0A1628] ${
                  activeWorkflow === i
                    ? 'bg-[#EC4899] text-white shadow-lg shadow-[#EC4899]/20'
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
                                animation: 'flowPulseIBS 1.5s ease-in-out infinite',
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
                onClick={resetWorkflow}
                className="w-9 h-9 rounded-lg flex items-center justify-center border border-white/[0.08] text-slate-500 hover:text-white hover:border-white/[0.2] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06B6D4]"
                aria-label="Restart workflow"
              >
                <i className="ri-restart-line w-4 h-4 flex items-center justify-center" />
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
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-[#EC4899]/20 text-[#EC4899] hover:bg-[#EC4899]/10 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#EC4899]"
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
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-[10px] text-slate-600">
              {Object.entries(typeLabels).map(([key, label]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: typeColors[key] }} />
                  <span>{label}</span>
                  {key === 'human' && <span className="text-[#10B981]">— keeps humans in control</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes flowPulseIBS {
          0%, 100% { opacity: 0.1; transform: translateX(-100%); }
          50% { opacity: 0.8; transform: translateX(100%); }
        }
      `}</style>
    </section>
  );
}