'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { pricingCategories, getPlanCtaHref, getPlanIcon } from './pricing-data';

export default function PricingTabs() {
  const [activeCategory, setActiveCategory] = useState('websites');
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');
    const valid = pricingCategories.find((c) => c.id === cat);
    if (valid) setActiveCategory(cat!);
  }, []);

  const handleTabChange = useCallback((category: string) => {
    setActiveCategory(category);
    const url = new URL(window.location.href);
    url.searchParams.set('category', category);
    window.history.replaceState({}, '', url.toString());
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      const ids = pricingCategories.map((c) => c.id);
      let nextIndex = index;
      if (e.key === 'ArrowRight') {
        nextIndex = (index + 1) % ids.length;
      } else if (e.key === 'ArrowLeft') {
        nextIndex = (index - 1 + ids.length) % ids.length;
      } else if (e.key === 'Home') {
        nextIndex = 0;
      } else if (e.key === 'End') {
        nextIndex = ids.length - 1;
      } else {
        return;
      }
      e.preventDefault();
      const nextId = ids[nextIndex];
      handleTabChange(nextId);
      tabRefs.current[nextIndex]?.focus();
    },
    [handleTabChange]
  );

  const activeData = pricingCategories.find((c) => c.id === activeCategory)!;
  const transitionClass = isReducedMotion ? '' : 'transition-opacity duration-200';

  return (
    <section className="relative z-10 px-6 pb-10">
      <div className="max-w-7xl mx-auto">
        <div
          className="flex gap-2 overflow-x-auto pb-4 mb-10 scrollbar-thin justify-start md:justify-center -mt-10"
          role="tablist"
          aria-label="Pricing categories"
        >
          {pricingCategories.map((cat, i) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${cat.id}`}
                id={`tab-${cat.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => handleTabChange(cat.id)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                className={`flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-full text-sm font-medium whitespace-nowrap cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38E8C6]/50 border ${
                  isActive
                    ? 'border-[#38E8C6] text-[#38E8C6] bg-[rgba(56,232,198,0.08)]'
                    : 'border-[rgba(148,163,184,0.25)] text-[#AAB4C3] bg-[rgba(15,23,42,0.5)] hover:border-[rgba(148,163,184,0.4)] hover:text-[#F5F7FA]'
                }`}
              >
                <i className={`${cat.icon} w-4 h-4 flex items-center justify-center`} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {pricingCategories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <div
              key={cat.id}
              role="tabpanel"
              id={`panel-${cat.id}`}
              aria-labelledby={`tab-${cat.id}`}
              hidden={!isActive}
              className={`${transitionClass} ${isActive ? 'opacity-100' : 'opacity-0'}`}
            >
              {isActive && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
                    {cat.plans.map((plan) => (
                      <div
                        key={plan.id}
                        className={`relative flex flex-col rounded-2xl border p-6 md:p-8 backdrop-blur-sm ${
                          plan.featured
                            ? 'border-[#38E8C6] bg-[rgba(15,23,42,0.85)] md:-translate-y-2 shadow-[0_0_40px_rgba(56,232,198,0.08)]'
                            : 'border-[rgba(148,163,184,0.25)] bg-[rgba(15,23,42,0.78)]'
                        }`}
                      >
                        {plan.badge && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#38E8C6] text-[#0B0F14] text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                            {plan.badge}
                          </div>
                        )}

                        <div className="mb-5">
                          <div className="w-10 h-10 rounded-xl bg-[rgba(139,108,255,0.1)] flex items-center justify-center mb-4">
                            <i
                              className={`${getPlanIcon(plan.id)} text-[#8B6CFF] w-5 h-5 flex items-center justify-center`}
                            />
                          </div>
                          <h3 className="text-xl md:text-2xl font-bold text-[#F5F7FA] mb-3">
                            {plan.name}
                          </h3>
                          <div className="flex items-baseline gap-2 mb-1">
                            {plan.pricePrefix && (
                              <span className="text-sm text-[#AAB4C3]">{plan.pricePrefix}</span>
                            )}
                            <span className="text-3xl md:text-4xl font-bold text-[#F5F7FA]">
                              {plan.price}
                            </span>
                          </div>
                          {plan.supportPrice && (
                            <p className="text-xs text-[#AAB4C3] mb-2">{plan.supportPrice}</p>
                          )}
                          <p className="text-sm text-[#AAB4C3]">{plan.description}</p>
                        </div>

                        <ul className="space-y-3 mb-8 flex-1">
                          {plan.features.map((f) => (
                            <li key={f} className="flex items-start gap-3 text-sm text-[#F5F7FA]">
                              <span className="w-5 h-5 rounded-full bg-[rgba(56,232,198,0.12)] flex items-center justify-center shrink-0 mt-0.5">
                                <i className="ri-check-line text-[#38E8C6] w-3.5 h-3.5 flex items-center justify-center" />
                              </span>
                              {f}
                            </li>
                          ))}
                        </ul>

                        <Link
                          href={getPlanCtaHref(plan)}
                          className={`group inline-flex items-center justify-center gap-2 w-full px-5 py-3.5 min-h-[48px] rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38E8C6]/50 active:scale-[0.98] ${
                            plan.featured
                              ? 'bg-[#38E8C6] text-[#0B0F14] shadow-[0_0_20px_rgba(56,232,198,0.25)] hover:shadow-[0_0_32px_rgba(56,232,198,0.4)] hover:-translate-y-0.5'
                              : 'border border-[rgba(148,163,184,0.25)] text-[#F5F7FA] bg-[rgba(15,23,42,0.4)] hover:border-[#38E8C6]/40 hover:text-[#38E8C6] hover:bg-[rgba(56,232,198,0.08)] hover:shadow-[0_0_20px_rgba(56,232,198,0.1)] hover:-translate-y-0.5'
                          }`}
                        >
                          {plan.ctaLabel}
                          <i className="ri-arrow-right-line w-4 h-4 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                    ))}
                  </div>
                  {cat.note && (
                    <p className="text-center mt-8 text-[#AAB4C3] text-sm">{cat.note}</p>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}