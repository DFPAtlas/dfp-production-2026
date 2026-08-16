'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from '@/components/motion';
import {
  CONSENT_CATEGORIES,
  ConsentCategory,
  ConsentState,
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
} from '@/lib/analytics-definitions';
import { updateAnalyticsConsent } from '@/lib/analytics';

export default function CookiePreferencesPage() {
  const [selected, setSelected] = useState<ConsentCategory[]>(['necessary']);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ConsentState;
        if (parsed.categories && Array.isArray(parsed.categories)) {
          setSelected(parsed.categories);
        }
      }
    } catch { /* no existing consent */ }
  }, []);

  const toggleCategory = (key: ConsentCategory) => {
    if (key === 'necessary') return;
    setSaved(false);
    setError('');
    setSelected(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const savePreferences = useCallback(() => {
    try {
      updateAnalyticsConsent(selected);
      window.dispatchEvent(new CustomEvent('dfp-consent-updated'));
      setSaved(true);
      setError('');
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Unable to save preferences. Please try again.');
    }
  }, [selected]);

  const withdrawAll = useCallback(() => {
    const state: ConsentState = {
      version: CONSENT_VERSION,
      categories: ['necessary'],
      updatedAt: new Date().toISOString(),
      withdrawnAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
      window.dispatchEvent(new CustomEvent('dfp-consent-updated'));
      setSelected(['necessary']);
      setSaved(true);
      setError('');
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Unable to withdraw consent. Please try again.');
    }
  }, []);

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 bg-white text-slate-800">
        <section className="py-20 px-6">
          <div className="max-w-2xl mx-auto">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors mb-6 cursor-pointer">
              <i className="ri-arrow-left-line w-4 h-4 flex items-center justify-center" />
              Back to Home
            </Link>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-slate-900">Cookie Preferences</h1>
              <p className="text-slate-500 mb-8 leading-relaxed">
                Control how Digital Footprint uses cookies and similar technologies on your device. Your choices apply to this browser only.
              </p>

              {saved && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3"
                >
                  <i className="ri-checkbox-circle-fill w-5 h-5 text-emerald-500 flex items-center justify-center" />
                  <span className="text-sm font-medium text-emerald-700">Preferences saved successfully.</span>
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3"
                >
                  <i className="ri-error-warning-fill w-5 h-5 text-red-500 flex items-center justify-center" />
                  <span className="text-sm font-medium text-red-700">{error}</span>
                </motion.div>
              )}

              <div className="space-y-5 mb-8">
                {CONSENT_CATEGORIES.map(cat => (
                  <div
                    key={cat.key}
                    className="bg-white border border-slate-200 rounded-2xl p-5"
                  >
                    <div className="flex items-start gap-4">
                      <button
                        role="switch"
                        aria-checked={selected.includes(cat.key)}
                        aria-label={`${cat.label}: ${cat.description}`}
                        disabled={cat.required}
                        onClick={() => toggleCategory(cat.key)}
                        className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 mt-0.5 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/40 ${
                          cat.required ? 'bg-[#06B6D4]/30 cursor-not-allowed' :
                          selected.includes(cat.key) ? 'bg-[#06B6D4]' : 'bg-slate-300'
                        }`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                          selected.includes(cat.key) ? 'translate-x-[22px]' : 'translate-x-0.5'
                        }`} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-800">{cat.label}</h3>
                          {cat.required && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium whitespace-nowrap">Always Active</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mt-1">{cat.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <button
                  onClick={savePreferences}
                  className="px-6 py-3 rounded-xl bg-[#06B6D4] text-white text-sm font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/40"
                >
                  Save Preferences
                </button>
                <button
                  onClick={withdrawAll}
                  className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  Withdraw All Consent
                </button>
              </div>

              <div className="border-t border-slate-200 pt-8">
                <h2 className="text-lg font-bold text-slate-800 mb-3">About Cookies</h2>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  Cookies are small text files stored on your device when you visit websites. They help websites function properly and provide useful information to website owners.
                </p>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  Strictly necessary cookies are always active because they are required for the website to function. All other categories require your consent before being used.
                </p>
                <div className="flex flex-wrap gap-4 mt-6">
                  <Link href="/privacy" className="text-sm text-[#06B6D4] hover:underline">Privacy Policy</Link>
                  <Link href="/cookie-policy" className="text-sm text-[#06B6D4] hover:underline">Cookie Policy</Link>
                  <Link href="/terms" className="text-sm text-[#06B6D4] hover:underline">Terms of Service</Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}