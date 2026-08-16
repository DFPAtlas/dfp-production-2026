'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from '@/components/motion';
import { employmentTypeConfig } from '@/lib/cms-definitions';
import type { CareersVacancy } from '@/hooks/useCmsData';

export default function EarlyCareersPage() {
  const [earlyVacancies, setEarlyVacancies] = useState<CareersVacancy[]>([]);
  const [loading, setLoading] = useState(true);

  useState(() => {
    let cancelled = false;
    supabase.from('careers_vacancies').select('*')
      .eq('vacancy_status', 'Open')
      .eq('public_visibility', 'Public')
      .in('employment_type', ['Graduate role', 'Internship or placement', 'Apprenticeship'])
      .order('sort_order')
      .then(({ data }) => {
        if (cancelled) return;
        setEarlyVacancies((data || []) as CareersVacancy[]);
        setLoading(false);
      });
    return () => { cancelled = true; };
  });

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        <section className="relative pt-32 pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A1628] via-[#0F1D32] to-white pointer-events-none" />
          <div className="relative max-w-4xl mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Link href="/careers" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-4 cursor-pointer whitespace-nowrap">
                <i className="ri-arrow-left-line w-4 h-4 flex items-center justify-center" />
                Back to Careers
              </Link>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
                Early Careers at Digital Footprint
              </h1>
              <p className="text-lg text-slate-300 max-w-2xl mb-2">
                Launch your career in technology with a company that invests in your growth. Whether you are a recent graduate, looking for an internship, or interested in an apprenticeship, we offer structured development and real project experience.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="relative -mt-10 pb-16">
          <div className="max-w-4xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              {[
                { icon: 'ri-graduation-cap-line', title: 'Graduate Roles', desc: 'Structured programmes for recent graduates with mentorship, rotations, and clear progression.', bg: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
                { icon: 'ri-book-open-line', title: 'Apprenticeships', desc: 'Earn while you learn with a blend of on-the-job training and formal qualifications.', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
                { icon: 'ri-calendar-check-line', title: 'Internships', desc: 'Fixed-term placements giving you hands-on experience across real products and teams.', bg: 'bg-purple-50', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
              ].map(item => (
                <div key={item.title} className={`${item.bg} border border-slate-200 rounded-2xl p-5`}>
                  <div className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center mb-3`}>
                    <i className={`${item.icon} w-5 h-5 ${item.iconColor} flex items-center justify-center`} />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1.5">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1,2].map(i => (
                  <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 animate-pulse">
                    <div className="h-5 bg-slate-200 rounded w-1/3 mb-3" />
                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : earlyVacancies.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-2xl p-8">
                <i className="ri-calendar-todo-line w-12 h-12 text-slate-300 mx-auto mb-4 flex items-center justify-center" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">No Current Early-Career Opportunities</h2>
                <p className="text-slate-500 max-w-md mx-auto mb-6">
                  We do not have any graduate, internship, or apprenticeship roles open right now. Opportunities are posted as they become available — check back soon.
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <Link href="/careers" className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap">
                    All Careers
                  </Link>
                  <Link href="/contact" className="px-5 py-2.5 rounded-xl bg-[#06B6D4] text-white font-medium text-sm hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap">
                    Register Interest
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {earlyVacancies.map((v, i) => {
                  const et = employmentTypeConfig[v.employment_type];
                  return (
                    <motion.div key={v.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                      <Link
                        href={`/careers/${v.slug}`}
                        className="block bg-white border border-slate-200 rounded-2xl p-5 hover:border-[#06B6D4]/30 hover:shadow-lg hover:shadow-[#06B6D4]/5 transition-all duration-200 cursor-pointer group"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#06B6D4] transition-colors mb-1">
                              {v.title}
                            </h3>
                            <p className="text-sm text-slate-500 line-clamp-2 mb-2">{v.summary}</p>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              {et && (
                                <span className="flex items-center gap-1">
                                  <i className={`${et.icon} w-3.5 h-3.5 flex items-center justify-center text-slate-400`} />
                                  {et.label}
                                </span>
                              )}
                              {v.department && <span>{v.department}</span>}
                              {v.location_text && <span className="text-slate-400">{v.location_text}</span>}
                            </div>
                          </div>
                          <span className="w-8 h-8 rounded-full bg-[#06B6D4]/10 text-[#06B6D4] flex items-center justify-center group-hover:bg-[#06B6D4] group-hover:text-white transition-all shrink-0">
                            <i className="ri-arrow-right-line w-4 h-4 flex items-center justify-center" />
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="py-16 bg-slate-50">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-3">What to Expect</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              {[
                { icon: 'ri-user-star-line', title: 'Dedicated Mentor', desc: 'A senior team member assigned to guide your development from day one.' },
                { icon: 'ri-projector-line', title: 'Real Projects', desc: 'Contribute to live products used by real businesses — no busy work.' },
                { icon: 'ri-book-read-line', title: 'Learning Budget', desc: 'Dedicated time and budget for courses, conferences, and certifications.' },
                { icon: 'ri-group-line', title: 'Supportive Team', desc: 'Work alongside experienced engineers who want to help you grow.' },
              ].map(item => (
                <div key={item.title} className="bg-white border border-slate-200 rounded-2xl p-5 text-center">
                  <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center mx-auto mb-3">
                    <i className={`${item.icon} w-5 h-5 text-[#06B6D4] flex items-center justify-center`} />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1.5 text-sm">{item.title}</h3>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}