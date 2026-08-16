'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from '@/components/motion';
import {
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  CONSENT_CATEGORIES,
  ConsentCategory,
  ConsentState,
} from '@/lib/analytics-definitions';
import { updateAnalyticsConsent } from '@/lib/analytics';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selected, setSelected] = useState<ConsentCategory[]>(['necessary']);
  const bannerRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);
  const mountedSafeRef = useRef(true);

  useEffect(() => {
    mountedSafeRef.current = true;
    return () => { mountedSafeRef.current = false; };
  }, []);

  useEffect(() => {
    try {
      const existing = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (!existing) {
        if (mountedSafeRef.current) setVisible(true);
        return;
      }
      const parsed = JSON.parse(existing) as ConsentState;
      if (!parsed.version || parsed.version !== CONSENT_VERSION) {
        if (mountedSafeRef.current) setVisible(true);
        return;
      }
    } catch {
      if (mountedSafeRef.current) setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (visible && firstFocusRef.current) {
      setTimeout(() => firstFocusRef.current?.focus(), 100);
    }
  }, [visible, showDetails]);

  const applyConsent = useCallback((categories: ConsentCategory[]) => {
    updateAnalyticsConsent(categories);
    setVisible(false);
  }, []);

  const acceptAll = useCallback(() => {
    const all = CONSENT_CATEGORIES.map(c => c.key);
    applyConsent([...all]);
  }, [applyConsent]);

  const rejectNonEssential = useCallback(() => {
    applyConsent(['necessary']);
  }, [applyConsent]);

  const savePreferences = useCallback(() => {
    applyConsent([...selected]);
  }, [selected, applyConsent]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && visible) {
        if (showDetails) {
          setShowDetails(false);
        }
      }
      if (e.key === 'Tab' && visible && bannerRef.current) {
        const focusable = bannerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible, showDetails]);

  const toggleCategory = (key: ConsentCategory) => {
    if (key === 'necessary') return;
    setSelected(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-[9998]"
            aria-hidden="true"
          />

          <motion.div
            ref={bannerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Cookie consent"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-lg z-[9999]"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6">
              {!showDetails ? (
                <div>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/8 flex items-center justify-center shrink-0">
                      <i className="ri-shield-check-line w-5 h-5 text-[#06B6D4] flex items-center justify-center" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900 mb-1">Cookie Preferences</h2>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        We use cookies to enhance your browsing experience, analyse site traffic, and personalise content. By continuing, you agree to our use of cookies as described in our{' '}
                        <Link href="/cookie-policy" className="text-[#06B6D4] underline hover:text-[#0891B2]">Cookie Policy</Link>.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <button
                      ref={firstFocusRef}
                      onClick={acceptAll}
                      className="flex-1 px-5 py-3 rounded-xl bg-[#06B6D4] text-white text-sm font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/40"
                    >
                      Accept All
                    </button>
                    <button
                      onClick={rejectNonEssential}
                      className="flex-1 px-5 py-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-slate-300"
                    >
                      Reject Non-Essential
                    </button>
                    <button
                      onClick={() => setShowDetails(true)}
                      className="flex-1 px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-slate-300"
                    >
                      Manage Choices
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                    <Link href="/privacy" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Privacy Policy</Link>
                    <Link href="/cookie-policy" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Cookie Policy</Link>
                    <Link href="/cookie-preferences" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Manage Settings</Link>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-bold text-slate-900">Customise Cookie Settings</h2>
                    <button
                      onClick={() => setShowDetails(false)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      aria-label="Close settings"
                    >
                      <i className="ri-close-line w-5 h-5 flex items-center justify-center" />
                    </button>
                  </div>

                  <div className="space-y-4 mb-6">
                    {CONSENT_CATEGORIES.map(cat => (
                      <div key={cat.key} className="flex items-start gap-3">
                        <button
                          role="switch"
                          aria-checked={selected.includes(cat.key)}
                          aria-label={`${cat.label}: ${cat.description}`}
                          disabled={cat.required}
                          onClick={() => toggleCategory(cat.key)}
                          className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer shrink-0 mt-0.5 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/40 ${
                            cat.required ? 'bg-[#06B6D4]/30 cursor-not-allowed' :
                            selected.includes(cat.key) ? 'bg-[#06B6D4]' : 'bg-slate-300'
                          }`}
                        >
                          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                            selected.includes(cat.key) ? 'translate-x-[18px]' : 'translate-x-0.5'
                          }`} />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-slate-800">{cat.label}</span>
                            {cat.required && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium whitespace-nowrap">Required</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      onClick={savePreferences}
                      className="flex-1 px-5 py-3 rounded-xl bg-[#06B6D4] text-white text-sm font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/40"
                    >
                      Save Preferences
                    </button>
                    <button
                      onClick={() => setShowDetails(false)}
                      className="px-5 py-3 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-slate-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}