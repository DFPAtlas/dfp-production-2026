'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import EcosystemVisual from '@/components/EcosystemVisual';

const capabilityChips = [
  'SaaS Platforms',
  'AI Agents',
  'Business Automation',
  'Operational Portals',
  'Data & Infrastructure',
];

interface Particle {
  id: number;
  width: number;
  height: number;
  left: number;
  top: number;
  color: string;
  opacity: number;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    width: 1 + Math.random() * 2,
    height: 1 + Math.random() * 2,
    left: Math.random() * 100,
    top: Math.random() * 100,
    color: i % 4 === 0 ? '#06B6D4' : i % 4 === 1 ? '#94A3B8' : i % 4 === 2 ? '#A855F7' : '#475569',
    opacity: 0.08 + Math.random() * 0.2,
    duration: 8 + Math.random() * 10,
    delay: Math.random() * 5,
    driftX: (Math.random() - 0.5) * 30,
    driftY: (Math.random() - 0.5) * 30,
  }));
}

export default function HeroSection() {
  const [phase, setPhase] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
  const [isTouch, setIsTouch] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    const timers = [80, 300, 550, 800, 1050, 1300, 1600].map((delay, i) =>
      setTimeout(() => setPhase(i + 1), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    setParticles(generateParticles(24));
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isTouch || reducedMotion) return;
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCursorPos({ x, y });
  }, [isTouch, reducedMotion]);

  return (
    <section
      id="hero"
      ref={heroRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex items-center pt-28 pb-16 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #060F1E 0%, #0A1628 30%, #0D1F3C 60%, #0F2347 100%)' }}
      aria-label="Homepage hero"
    >
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(6,182,212,0.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {!isTouch && !reducedMotion && (
        <div
          className="absolute inset-0 transition-opacity duration-1000"
          style={{
            background: `radial-gradient(ellipse 700px 500px at ${cursorPos.x}% ${cursorPos.y}%, rgba(6,182,212,0.04) 0%, transparent 60%)`,
            opacity: phase >= 1 ? 1 : 0,
          }}
        />
      )}

      <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full -translate-y-1/2 translate-x-1/4"
        style={{
          background: 'radial-gradient(circle, rgba(6,182,212,0.05) 0%, rgba(6,182,212,0.015) 35%, transparent 65%)',
          opacity: phase >= 1 ? 1 : 0,
          transition: 'opacity 1.2s ease',
        }}
      />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full translate-y-1/3 -translate-x-1/4"
        style={{
          background: 'radial-gradient(circle, rgba(6,182,212,0.03) 0%, transparent 60%)',
          opacity: phase >= 1 ? 1 : 0,
          transition: 'opacity 1.2s ease 0.3s',
        }}
      />

      {!reducedMotion && (
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full"
              style={{
                width: `${p.width}px`,
                height: `${p.height}px`,
                left: `${p.left}%`,
                top: `${p.top}%`,
                backgroundColor: p.color,
                opacity: p.opacity,
                animation: phase >= 2 ? `heroDrift ${p.duration}s ease-in-out infinite ${p.delay}s` : 'none',
                '--drift-x': `${p.driftX}px`,
                '--drift-y': `${p.driftY}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="max-w-xl">


            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.06] mb-6 text-white"
              style={{
                opacity: phase >= 2 ? 1 : 0,
                transform: phase >= 2 ? 'translateY(0)' : 'translateY(16px)',
                transition: 'all 0.6s ease 0.15s',
              }}
            >
              We turn ambitious ideas into{' '}
              <span
                className="bg-gradient-to-r from-[#06B6D4] via-[#22D3EE] to-[#06B6D4] bg-clip-text text-transparent animate-gradient-hero"
                style={{ backgroundSize: '200% 100%' }}
              >
                complete digital companies
              </span>
            </h1>

            <p
              className="text-base sm:text-lg text-slate-400 mb-10 leading-relaxed max-w-lg"
              style={{
                opacity: phase >= 3 ? 1 : 0,
                transform: phase >= 3 ? 'translateY(0)' : 'translateY(12px)',
                transition: 'all 0.6s ease 0.3s',
              }}
            >
              From customer-facing websites and SaaS platforms to AI agents, secure databases,
              staff systems, automation and infrastructure &mdash; Digital Footprint builds the
              connected technology required to launch and operate modern businesses.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-3 mb-10"
              style={{
                opacity: phase >= 4 ? 1 : 0,
                transform: phase >= 4 ? 'translateY(0)' : 'translateY(12px)',
                transition: 'all 0.6s ease 0.45s',
              }}
            >
              <Link
                href="/contact"
                className="group relative inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-sm text-white whitespace-nowrap cursor-pointer transition-all duration-300 bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] shadow-lg shadow-[#F97316]/15 hover:shadow-xl hover:shadow-[#F97316]/30 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2 focus:ring-offset-[#060F1E]"
              >
                <span className="relative z-10">Discuss Your Project</span>
                <i className="ri-arrow-right-line w-4 h-4 flex items-center justify-center relative z-10 group-hover:translate-x-0.5 transition-transform duration-200" />
                {!reducedMotion && (
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                )}
              </Link>
              <Link
                href="/case-studies"
                className="group inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-sm text-slate-300 whitespace-nowrap cursor-pointer transition-all duration-300 border border-white/[0.12] hover:border-white/[0.3] hover:text-white hover:bg-white/[0.04] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-[#060F1E]"
              >
                Explore Our Work
                <i className="ri-arrow-right-line w-4 h-4 flex items-center justify-center group-hover:translate-x-0.5 transition-transform duration-200" />
              </Link>
            </div>

            <div
              className="mb-6"
              style={{
                opacity: phase >= 5 ? 1 : 0,
                transform: phase >= 5 ? 'translateY(0)' : 'translateY(8px)',
                transition: 'all 0.5s ease 0.6s',
              }}
            >
              <p className="text-sm text-slate-500 font-medium tracking-wide">
                Conception. Development. Deployment. One connected technology partner.
              </p>
            </div>

            <div
              className="flex flex-wrap gap-2"
              style={{
                opacity: phase >= 6 ? 1 : 0,
                transform: phase >= 6 ? 'translateY(0)' : 'translateY(8px)',
                transition: 'all 0.5s ease 0.75s',
              }}
            >
              {capabilityChips.map((chip, i) => (
                <span
                  key={chip}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 border border-white/[0.06] bg-white/[0.02] cursor-default whitespace-nowrap hover:border-[#F97316]/30 hover:text-[#F97316] transition-all duration-300"
                  style={{ transitionDelay: `${0.78 + i * 0.06}s` }}
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>

          <div
            style={{
              opacity: phase >= 1 ? 1 : 0,
              transform: phase >= 1 ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.8s ease 0.08s',
            }}
          >
            <EcosystemVisual cursorPos={cursorPos} isTouch={isTouch} reducedMotion={reducedMotion} />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes heroDrift {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.08; }
          25% { transform: translate(var(--drift-x), calc(var(--drift-y) * 0.5)) scale(1.2); opacity: 0.18; }
          50% { transform: translate(calc(var(--drift-x) * 0.5), var(--drift-y)) scale(1); opacity: 0.08; }
          75% { transform: translate(calc(var(--drift-x) * -0.3), calc(var(--drift-y) * -0.3)) scale(1.15); opacity: 0.14; }
        }
        @keyframes gradient-shift-hero {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-hero {
          animation: gradient-shift-hero 5s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-gradient-hero { animation: none; }
        }
      `}</style>
    </section>
  );
}