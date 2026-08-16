'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';

const VIDEO_URL = 'https://storage.readdy-site.link/project_files/9c829bf4-c727-45a7-99f8-358e1780c66a/4f863c50-93dd-4847-9d19-9bf2f89658ff_Firefly-Create-a-cinematic-15-second-seamless-loop-background-video-for-a-premium-digital-technology.mp4';
const POSTER_URL = 'https://readdy.ai/api/search-image?query=A%20premium%20dark%20navy%20technology%20background%20with%20a%20glowing%20bright%20cyan%20digital%20footprint%20at%20centre%20abstract%20holographic%20dashboard%20panels%20and%20interface%20elements%20floating%20on%20deep%20blue-black%20space%20subtle%20circuit%20traces%20radiating%20from%20the%20footprint%20soft%20ambient%20cyan%20light%20reflections%20clean%20minimal%20futuristic%20corporate%20aesthetic%20no%20text%20high%20contrast%20dark%20moody%20atmosphere&width=1920&height=1080&seq=dfp-video-poster-v5-theme&orientation=landscape';

const PHASES = [
  { letter: 'C', word: 'Conception', desc: 'Strategy, research and planning your digital foundation', color: '#06B6D4', href: '/#how-we-work' },
  { letter: 'D', word: 'Development', desc: 'Building platforms, AI systems and cloud infrastructure', color: '#06B6D4', href: '/#how-we-work' },
  { letter: 'D', word: 'Deployment', desc: 'Launching live operations with security and scale', color: '#F97316', href: '/#how-we-work' },
  { letter: 'M', word: 'Management', desc: 'Ongoing monitoring, support and operational excellence', color: '#F97316', href: '/#infrastructure-management' },
  { letter: 'G', word: 'Growth', desc: 'Continuous improvement, expansion and optimisation', color: '#F97316', href: '/#ways-to-work' },
];

export default function VideoHeroSection() {
  const [mounted, setMounted] = useState(false);
  const [indicatorVisible, setIndicatorVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [posterFadeIn, setPosterFadeIn] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const [explainVisible, setExplainVisible] = useState(false);
  const [scrollDone, setScrollDone] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mountedRef = useRef(false);
  const mqRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    setMounted(true);

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => {
      if (mountedRef.current) setReducedMotion(e.matches);
    };
    mq.addEventListener('change', handler);

    return () => {
      mountedRef.current = false;
      mq.removeEventListener('change', handler);
    };
  }, []);

  useEffect(() => {
    mqRef.current = reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !mountedRef.current) return;

    const onLoaded = () => {
      if (!mountedRef.current) return;
      setVideoReady(true);
      if (!mqRef.current) {
        vid.play().catch(() => {});
      }
    };

    const onEnded = () => {
      if (!mountedRef.current) return;
      setVideoEnded(true);
      const posterTimer = setTimeout(() => {
        if (mountedRef.current) setPosterFadeIn(true);
      }, 50);
      return () => clearTimeout(posterTimer);
    };

    const onError = () => {
      if (!mountedRef.current) return;
      setVideoError(true);
    };

    const onTimeUpdate = () => {
      if (!mountedRef.current || !vid.duration) return;
      setVideoProgress((vid.currentTime / vid.duration) * 100);
    };

    vid.addEventListener('loadeddata', onLoaded);
    vid.addEventListener('ended', onEnded);
    vid.addEventListener('error', onError);
    vid.addEventListener('timeupdate', onTimeUpdate);

    if (vid.readyState >= 2 && mountedRef.current) {
      setVideoReady(true);
      if (!mqRef.current) {
        vid.play().catch(() => {});
      }
    }

    return () => {
      vid.removeEventListener('loadeddata', onLoaded);
      vid.removeEventListener('ended', onEnded);
      vid.removeEventListener('error', onError);
      vid.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setIndicatorVisible(window.scrollY < window.innerHeight * 0.18);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        videoRef.current?.pause();
      } else if (!videoEnded && videoRef.current && videoRef.current.readyState >= 2) {
        videoRef.current.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [videoEnded]);

  useEffect(() => {
    if (!videoEnded) return;

    const showTimer = setTimeout(() => {
      if (!mountedRef.current) return;
      setShowExplain(true);
      const fadeTimer = setTimeout(() => {
        if (mountedRef.current) setExplainVisible(true);
        const doneTimer = setTimeout(() => {
          if (mountedRef.current) setScrollDone(true);
        }, 1800);
        return () => clearTimeout(doneTimer);
      }, 150);
      return () => clearTimeout(fadeTimer);
    }, 500);

    return () => clearTimeout(showTimer);
  }, [videoEnded]);

  const handleScrollClick = () => {
    const el = document.getElementById('first-content-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const showPoster = !videoReady || videoError || videoEnded;
  const showLoadingWheel = !videoReady && !videoError && mounted;

  return (
    <section
      id="our-method"
      className="relative w-full overflow-hidden"
      style={{ minHeight: '100svh', height: '100vh', background: '#050D1C' }}
      aria-label="Digital Footprint cinematic introduction"
    >
      {showPoster && (
        <div
          className="absolute inset-0 z-[2] bg-cover bg-center"
          style={{
            backgroundImage: `url(${POSTER_URL})`,
            opacity: videoEnded ? (posterFadeIn ? 1 : 0) : 1,
            transition: videoEnded ? 'opacity 700ms ease-out' : 'none',
          }}
        />
      )}

      {showLoadingWheel && (
        <div className="absolute inset-0 z-[3] flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-5">
            <img
              src="https://storage.readdy-site.link/project_files/9c829bf4-c727-45a7-99f8-358e1780c66a/eee9f9ba-b907-488b-a1a8-f6d02534a71b_compressed_Remove-Background-Keep-Foot-Logo.webp"
              alt="Digital Footprint"
              width={48}
              height={48}
              className="object-contain rounded-lg w-12 h-12 animate-pulse"
            />
            <div
              className="w-10 h-10 rounded-full border-[3px] border-white/[0.08]"
              style={{
                borderTopColor: '#06B6D4',
                animation: reducedMotion ? 'none' : 'dfpSpin 0.8s linear infinite',
              }}
            />
            <span className="text-xs text-slate-500 font-medium tracking-wide animate-pulse">
              Loading
            </span>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full z-[1]"
        style={{
          objectFit: 'cover',
          objectPosition: 'center center',
          opacity: videoEnded ? 0 : 1,
          transition: 'opacity 600ms ease-in-out',
        }}
        poster={POSTER_URL}
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src={VIDEO_URL} type="video/mp4" />
      </video>

      <div
        className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
        style={{ height: '170px', background: 'linear-gradient(to bottom, rgba(3,10,24,0.86) 0%, transparent 100%)' }}
      />

      <div
        className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
        style={{ height: '220px', background: 'linear-gradient(to top, rgba(3,10,24,0.68) 0%, transparent 100%)' }}
      />

      <div
        className="absolute inset-0 z-[5] pointer-events-none"
        style={{ backgroundColor: 'rgba(6,15,30,0.10)' }}
      />

      {showExplain && (
        <div className="absolute inset-0 z-[8] flex items-center justify-center pointer-events-none">
          <div className="text-center px-6 w-full max-w-[680px] mx-auto">
            <p
              className="font-semibold tracking-[0.14em] uppercase text-[#06B6D4] text-xs sm:text-sm mb-8"
              style={{
                opacity: explainVisible ? 1 : 0,
                transform: explainVisible ? 'translateX(0)' : 'translateX(-24px)',
                transition: `opacity 700ms ease-out, transform 700ms ease-out`,
              }}
            >
              Our Method
            </p>

            <div className="flex flex-col gap-3">
              {PHASES.map((item, i) => (
                <Link
                  key={item.letter + item.word}
                  href={item.href}
                  className="flex items-center gap-4 sm:gap-5 text-left group cursor-pointer pointer-events-auto"
                  style={{
                    opacity: explainVisible ? 1 : 0,
                    transform: explainVisible ? 'translateX(0)' : 'translateX(-40px)',
                    transition: `opacity 650ms ease-out ${i * 200}ms, transform 650ms ease-out ${i * 200}ms`,
                  }}
                >
                  <div
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-all duration-300 group-hover:scale-110"
                    style={{ borderColor: item.color, backgroundColor: `${item.color}12` }}
                  >
                    <span className="font-bold text-base sm:text-lg" style={{ color: item.color }}>
                      {item.letter}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-white font-semibold text-sm sm:text-base mr-2 group-hover:text-white transition-colors duration-200">
                      {item.word}
                    </span>
                    <span className="text-white/40 text-xs sm:text-sm group-hover:text-white/60 transition-colors duration-200">
                      {item.desc}
                    </span>
                  </div>
                  <i className="ri-arrow-right-s-line w-4 h-4 flex items-center justify-center text-white/0 group-hover:text-white/50 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
                </Link>
              ))}
            </div>

            <div
              className="mx-auto mt-8 h-px bg-gradient-to-r from-[#06B6D4] via-[#F97316] to-[#06B6D4]"
              style={{
                width: '110px',
                opacity: explainVisible ? 0.5 : 0,
                transition: `opacity 700ms ease-out 1200ms`,
              }}
            />
          </div>
        </div>
      )}

      <div
        className={`absolute bottom-[34px] left-1/2 -translate-x-1/2 z-20 transition-opacity duration-500 ${
          indicatorVisible && mounted && scrollDone ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={handleScrollClick}
          className="flex flex-col items-center gap-1.5 cursor-pointer focus:outline-none group"
          aria-label="Scroll to Digital Footprint introduction"
        >
          <div className="w-[26px] h-[40px] rounded-full border-2 border-white/60 flex items-start justify-center pt-[8px]">
            <div
              className="w-[4px] h-[8px] rounded-full bg-[#06B6D4]"
              style={reducedMotion ? {} : {
                animation: 'dfpScrollWheel 1.8s ease-in-out infinite',
              }}
            />
          </div>
          <div style={reducedMotion ? {} : {
            animation: 'dfpChevronPulse 1.8s ease-in-out infinite',
          }}>
            <i className="ri-arrow-down-s-line w-4 h-4 flex items-center justify-center text-white/50" />
          </div>
          <div className="w-px h-5 bg-gradient-to-b from-white/20 to-transparent" />
        </button>
      </div>

      {/* Progress bar */}
      {videoReady && !videoEnded && (
        <div className="absolute bottom-0 left-0 right-0 z-30 h-[3px] bg-white/[0.06]">
          <div
            className="h-full transition-none"
            style={{
              width: `${videoProgress}%`,
              background: 'linear-gradient(90deg, #06B6D4, #F97316)',
              boxShadow: '0 0 8px rgba(6,182,212,0.6)',
            }}
          />
        </div>
      )}
    </section>
  );
}