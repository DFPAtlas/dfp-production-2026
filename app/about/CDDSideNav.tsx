'use client';

import { useEffect, useRef, useState } from 'react';

const SECTIONS = [
  { letter: 'C', label: 'Conception', color: '#F97316', id: 'cdd-conception' },
  { letter: 'D', label: 'Development', color: '#7C3AED', id: 'cdd-development' },
  { letter: 'D', label: 'Deployment', color: '#10B981', id: 'cdd-deployment' },
];

export default function CDDSideNav() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const rafRef = useRef(0);
  const prevActiveRef = useRef(0);
  const prevProgressRef = useRef(0);
  const prevVisibleRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;

        const founder = document.getElementById('founder-section');
        const cddStart = document.getElementById('cdd-conception');
        const cddEnd = document.getElementById('cdd-deployment');
        const footer = document.querySelector('footer');
        if (!cddStart || !cddEnd) return;

        const windowH = window.innerHeight;
        const startRect = cddStart.getBoundingClientRect();
        const endRect = cddEnd.getBoundingClientRect();

        const founderRect = founder ? founder.getBoundingClientRect() : null;
        const footerRect = footer ? footer.getBoundingClientRect() : null;

        const shouldShow = founderRect
          ? founderRect.bottom < windowH * 0.3
          : startRect.top < windowH;

        const cddFinished = endRect.bottom < windowH * 0.5;
        const footerInView = footerRect ? footerRect.top < windowH : false;
        const nextVisible = shouldShow && !cddFinished && !footerInView;

        if (nextVisible !== prevVisibleRef.current) {
          prevVisibleRef.current = nextVisible;
          setIsVisible(nextVisible);
        }

        if (!nextVisible) return;

        const totalHeight = endRect.bottom - startRect.top;
        if (totalHeight <= 0) return;

        const scrolled = windowH / 2 - startRect.top;
        const nextProgress = Math.max(0, Math.min(1, scrolled / totalHeight));

        if (Math.abs(nextProgress - prevProgressRef.current) > 0.003) {
          prevProgressRef.current = nextProgress;
          setProgress(nextProgress);
        }

        const sectionH = totalHeight / 3;
        const idx = Math.min(2, Math.floor(Math.max(0, scrolled) / sectionH));

        if (idx !== prevActiveRef.current) {
          prevActiveRef.current = idx;
          setActiveIndex(idx);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const lineH = 160;
  const fillH = progress * lineH;

  return (
    <>
      <div
        className={`hidden lg:flex fixed left-6 xl:left-10 top-1/2 -translate-y-1/2 z-40 flex-col items-center transition-all duration-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6 pointer-events-none'}`}
      >
        <div className="relative flex flex-col items-center" style={{ height: 280 }}>
          <div
            className="absolute left-1/2 -translate-x-1/2 w-0.5 rounded-full"
            style={{ height: lineH, top: 44, backgroundColor: 'rgba(148,163,184,0.12)' }}
          />
          <div
            className="absolute left-1/2 -translate-x-1/2 w-0.5 rounded-full transition-all duration-300 ease-out"
            style={{
              height: fillH,
              top: 44,
              backgroundColor: SECTIONS[activeIndex]?.color || '#06B6D4',
              boxShadow: `0 0 12px ${SECTIONS[activeIndex]?.color || '#06B6D4'}40`,
            }}
          />

          {SECTIONS.map((section, idx) => {
            const isActive = idx === activeIndex;
            const isPast = idx < activeIndex;

            return (
              <button
                key={section.id}
                onClick={() => handleClick(section.id)}
                className="relative flex flex-col items-center cursor-pointer group z-10"
                style={{ marginBottom: idx < 2 ? 32 : 0 }}
                aria-label={`Scroll to ${section.label}`}
              >
                <div
                  className="w-3 h-3 rounded-full transition-all duration-500"
                  style={{
                    backgroundColor: isActive || isPast ? section.color : 'rgba(148,163,184,0.2)',
                    boxShadow: isActive
                      ? `0 0 16px ${section.color}, 0 0 32px ${section.color}40`
                      : isPast
                        ? `0 0 8px ${section.color}60`
                        : 'none',
                    transform: isActive ? 'scale(1.4)' : 'scale(1)',
                  }}
                />

                <span
                  className="text-[3rem] xl:text-[3.5rem] font-black leading-none mt-1 transition-all duration-500"
                  style={{
                    color: isActive ? section.color : isPast ? `${section.color}60` : 'rgba(148,163,184,0.2)',
                    textShadow: isActive ? `0 0 40px ${section.color}50, 0 0 80px ${section.color}20` : 'none',
                    transform: isActive ? 'scale(1.1) translateX(2px)' : 'scale(1)',
                  }}
                >
                  {section.letter}
                </span>

                <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none hidden xl:block" style={{ color: section.color }}>
                  {section.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={`lg:hidden fixed top-[72px] left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}
      >
        <div className="relative flex items-center justify-center">
          <div className="absolute bottom-0 left-0 h-0.5 rounded-full transition-all duration-300" style={{ width: `${(progress * 100)}%`, backgroundColor: SECTIONS[activeIndex]?.color || '#06B6D4' }} />

          {SECTIONS.map((section, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={section.id}
                onClick={() => handleClick(section.id)}
                className="flex-1 flex flex-col items-center py-3 px-4 cursor-pointer transition-colors duration-300 relative"
              >
                <span
                  className="text-lg font-black transition-all duration-300"
                  style={{
                    color: isActive ? section.color : 'rgba(148,163,184,0.4)',
                    textShadow: isActive ? `0 0 20px ${section.color}60` : 'none',
                    transform: isActive ? 'scale(1.15)' : 'scale(1)',
                  }}
                >
                  {section.letter}
                </span>
                <span
                  className="text-[9px] font-semibold uppercase tracking-wider mt-0.5 transition-colors duration-300"
                  style={{ color: isActive ? section.color : 'rgba(148,163,184,0.4)' }}
                >
                  {section.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}