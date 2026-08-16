'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { allDemos } from '../lib/data';

const navItems = [
  { label: 'Featured', href: '#featured-experience' },
  { label: 'Experiences', href: '#experience-library' },
  { label: 'Filter', href: '#need-selector' },
  { label: 'Build Yours', href: '#build-your-system' },
];

export default function StickyExperienceNav() {
  const [visible, setVisible] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    const onScroll = () => {
      if (!mountedRef.current) return;
      const hero = document.getElementById('featured-experience');
      if (!hero) { setVisible(false); return; }
      const rect = hero.getBoundingClientRect();
      setVisible(rect.top < -60);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      mountedRef.current = false;
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  if (!visible) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 hidden lg:block border-b border-white/[0.06] bg-[#050914]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[52px] max-w-7xl items-center justify-between px-8">
        <div className="flex items-center gap-1">
          <span className="mr-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Experiences</span>
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-white/[0.04] hover:text-slate-200"
            >
              {item.label}
            </a>
          ))}
          <div className="relative group ml-1">
            <button className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-white/[0.04] hover:text-slate-200 cursor-pointer">
              More
              <i className="ri-arrow-down-s-line ml-1" />
            </button>
            <div className="absolute left-0 top-full mt-1 hidden group-hover:block rounded-xl border border-white/[0.08] bg-[#0c1625]/95 backdrop-blur-xl p-2 shadow-2xl shadow-black/40">
              {allDemos.slice(3).map((d) => (
                <Link
                  key={d.id}
                  href={d.href}
                  prefetch={false}
                  className="block whitespace-nowrap rounded-lg px-3 py-2 text-xs text-slate-400 hover:bg-white/[0.04] hover:text-white transition"
                >
                  {d.shortTitle}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <Link
          href="/contact"
          prefetch={false}
          className="whitespace-nowrap rounded-lg bg-white px-4 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-slate-100"
        >
          Build Mine
        </Link>
      </div>
    </nav>
  );
}