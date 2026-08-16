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

export default function BusinessSystemSection() {
  const [activeLayer, setActiveLayer] = useState(0);
  const [dataPulsePos, setDataPulsePos] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const latestProgress = useRef(0);
  const mountedRef = useRef(true);

  const flush = useCallback(() => {
    rafRef.current = null;
    if (!mountedRef.current) return;
    const progress = latestProgress.current;
    const layer = Math.floor(progress * layers.length);
    setActiveLayer(Math.min(layer, layers.length - 1));
    setDataPulsePos(Math.min(progress, 1));
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
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

  return (
    <section ref={sectionRef} id="business-system" className="py-24 px-6 bg-[#0A1628] relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{
          backgroundImage: 'url("https://readdy.ai/api/search-image?query=A%20sophisticated%20dark%20digital%20technology%20background%20with%20subtle%20glowing%20circuit%20board%20patterns%20and%20flowing%20data%20streams%20in%20deep%20navy%20blue%20and%20teal%20tones%2C%20featuring%20abstract%20geometric%20network%20nodes%20connected%20by%20thin%20luminous%20lines%2C%20soft%20gradient%20light%20beams%20crossing%20diagonally%2C%20minimal%20and%20clean%20aesthetic%20suitable%20for%20a%20business%20technology%20section%20overlay%2C%20dark%20atmospheric%20depth%20with%20very%20subtle%20particle%20effects%2C%20modern%20enterprise%20tech%20feel%2C%20dark%20background%20blending%20seamlessly%20with%20navy%20blue%20tones&width=1440&height=900&seq=bs-digital-bg-v1&orientation=landscape")',
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
            More than a website.
          </h2>
          <h3 className="text-2xl md:text-4xl font-bold text-[#06B6D4] tracking-tight mb-6">
            The complete system behind the business.
          </h3>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
            A modern company needs more than a public homepage. It needs customer accounts,
            operational dashboards, secure databases, payment systems, staff tools, AI assistance,
            automation, reporting and infrastructure. Digital Footprint brings these elements together
            as one connected platform.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto relative">
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

        {activeLayer >= layers.length - 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-12"
          >
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-[#06B6D4]/15 bg-[#06B6D4]/5 text-[#06B6D4] text-sm font-medium">
              <i className="ri-link w-4 h-4 flex items-center justify-center" />
              Every layer connected through one technology partner
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}