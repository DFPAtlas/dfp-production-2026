'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from '@/components/motion';
import { employmentTypeConfig, workLocationTypeConfig } from '@/lib/cms-definitions';
import type { CareersVacancy } from '@/hooks/useCmsData';

export default function CareersPage() {
  const [vacancies, setVacancies] = useState<CareersVacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useState(() => {
    let cancelled = false;
    supabase.from('careers_vacancies').select('*').order('sort_order').then(({ data }) => {
      if (cancelled) return;
      setVacancies((data || []) as CareersVacancy[]);
      setLoading(false);
    });
    return () => { cancelled = true; };
  });

  const openVacancies = vacancies.filter(v => v.vacancy_status === 'Open' && v.public_visibility === 'Public');

  const filteredVacancies = openVacancies.filter(v => {
    const matchDept = departmentFilter === 'all' || v.department === departmentFilter;
    const matchType = typeFilter === 'all' || v.employment_type === typeFilter;
    return matchDept && matchType;
  });

  const departments = [...new Set(openVacancies.map(v => v.department).filter(Boolean))] as string[];
  const types = [...new Set(openVacancies.map(v => v.employment_type))];

  const hiringSteps = [
    { step: '01', title: 'Apply', desc: 'Submit your CV and cover note through our application form. We review every application.' },
    { step: '02', title: 'Initial Screening', desc: 'Our team reviews applications against role requirements. We aim to respond within two weeks.' },
    { step: '03', title: 'First Conversation', desc: 'A video or phone call to discuss your experience, the role, and answer your questions.' },
    { step: '04', title: 'Technical or Skills Assessment', desc: 'A practical exercise relevant to the role. No trick questions — we want to see how you think.' },
    { step: '05', title: 'Team Interview', desc: 'Meet the people you would work with. Culture, collaboration, and a deeper dive into your experience.' },
    { step: '06', title: 'Offer and Onboarding', desc: 'If it is a mutual fit, we will make an offer and support you through a structured onboarding.' },
  ];

  const formatSalary = (v: CareersVacancy) => {
    if (v.salary_visibility === 'not_shown' || (!v.salary_min && !v.salary_max)) return null;
    const currency = v.currency === 'GBP' ? '£' : v.currency || '£';
    const period = v.salary_period === 'year' ? '/year' : v.salary_period === 'month' ? '/month' : v.salary_period === 'day' ? '/day' : '';
    if (v.salary_min && v.salary_max) return `${currency}${v.salary_min.toLocaleString()} — ${currency}${v.salary_max.toLocaleString()}${period}`;
    if (v.salary_min) return `From ${currency}${v.salary_min.toLocaleString()}${period}`;
    if (v.salary_max) return `Up to ${currency}${v.salary_max.toLocaleString()}${period}`;
    return null;
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A1628] via-[#0F1D32] to-white pointer-events-none" />
          <div className="relative max-w-5xl mx-auto px-6 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                Build the Future with Digital Footprint
              </h1>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-6">
                We are a technology venture studio turning ambitious ideas into complete digital companies. Join a team building real products used by real businesses every day.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <span className="px-4 py-1.5 rounded-full bg-white/10 text-sm text-white/80">
                  <i className="ri-map-pin-line w-3.5 h-3.5 inline-flex items-center justify-center mr-1.5" />
                  Hertfordshire, UK
                </span>
                <span className="px-4 py-1.5 rounded-full bg-white/10 text-sm text-white/80">
                  <i className="ri-building-line w-3.5 h-3.5 inline-flex items-center justify-center mr-1.5" />
                  Hybrid & Remote
                </span>
                <span className="px-4 py-1.5 rounded-full bg-white/10 text-sm text-white/80">
                  <i className="ri-team-line w-3.5 h-3.5 inline-flex items-center justify-center mr-1.5" />
                  {openVacancies.length} open {openVacancies.length === 1 ? 'role' : 'roles'}
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="relative -mt-10 pb-16">
          <div className="max-w-5xl mx-auto px-6">
            {loading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 animate-pulse">
                    <div className="h-5 bg-slate-200 rounded w-1/3 mb-3" />
                    <div className="h-4 bg-slate-200 rounded w-2/3 mb-2" />
                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : openVacancies.length === 0 ? (
              <div className="text-center py-16">
                <i className="ri-briefcase-line w-12 h-12 text-slate-300 mx-auto mb-4 flex items-center justify-center" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">No Open Vacancies Right Now</h2>
                <p className="text-slate-500 max-w-md mx-auto">
                  We do not have any open positions at the moment. Check back soon or explore other ways to work with us.
                </p>
                <div className="flex items-center justify-center gap-3 mt-6">
                  <Link href="/partners" className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer">
                    Partner Opportunities
                  </Link>
                  <Link href="/uat-testing" className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer">
                    UAT Testing
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6 flex-wrap">
                  <div className="relative">
                    <select
                      value={departmentFilter}
                      onChange={e => setDepartmentFilter(e.target.value)}
                      className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 cursor-pointer pr-10 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40"
                    >
                      <option value="all">All Departments</option>
                      {departments.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 flex items-center justify-center pointer-events-none" />
                  </div>
                  <div className="relative">
                    <select
                      value={typeFilter}
                      onChange={e => setTypeFilter(e.target.value)}
                      className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 cursor-pointer pr-10 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40"
                    >
                      <option value="all">All Types</option>
                      {types.map(t => (
                        <option key={t} value={t}>{employmentTypeConfig[t]?.label || t}</option>
                      ))}
                    </select>
                    <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 flex items-center justify-center pointer-events-none" />
                  </div>
                  <span className="text-sm text-slate-400 ml-auto">
                    {filteredVacancies.length} {filteredVacancies.length === 1 ? 'role' : 'roles'} found
                  </span>
                </div>

                {filteredVacancies.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500">No roles match your filters. Try adjusting your selection.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredVacancies.map((v, i) => {
                      const et = employmentTypeConfig[v.employment_type];
                      const wl = workLocationTypeConfig[v.work_location_type];
                      const salary = formatSalary(v);
                      return (
                        <motion.div
                          key={v.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06, duration: 0.4 }}
                        >
                          <Link
                            href={`/careers/${v.slug}`}
                            className="block bg-white border border-slate-200 rounded-2xl p-5 hover:border-[#06B6D4]/30 hover:shadow-lg hover:shadow-[#06B6D4]/5 transition-all duration-200 cursor-pointer group"
                          >
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#06B6D4] transition-colors">
                                    {v.title}
                                  </h3>
                                  {v.is_featured && (
                                    <span className="px-2 py-0.5 rounded-full bg-[#06B6D4]/10 text-[#06B6D4] text-[10px] font-medium whitespace-nowrap">
                                      Featured
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-slate-500 line-clamp-2 mb-3">{v.summary}</p>
                                <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500">
                                  {et && (
                                    <span className="flex items-center gap-1">
                                      <i className={`${et.icon} w-3.5 h-3.5 flex items-center justify-center text-slate-400`} />
                                      {et.label}
                                    </span>
                                  )}
                                  {wl && (
                                    <span className="flex items-center gap-1">
                                      <i className={`${wl.icon} w-3.5 h-3.5 flex items-center justify-center text-slate-400`} />
                                      {wl.label}
                                    </span>
                                  )}
                                  {v.department && (
                                    <span className="flex items-center gap-1">
                                      <i className="ri-building-4-line w-3.5 h-3.5 flex items-center justify-center text-slate-400" />
                                      {v.department}
                                    </span>
                                  )}
                                  {salary && (
                                    <span className="font-medium text-slate-700">{salary}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {v.closing_date && (
                                  <span className="text-xs text-slate-400 whitespace-nowrap">
                                    Closes {new Date(v.closing_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                )}
                                <span className="w-8 h-8 rounded-full bg-[#06B6D4]/10 text-[#06B6D4] flex items-center justify-center group-hover:bg-[#06B6D4] group-hover:text-white transition-all">
                                  <i className="ri-arrow-right-line w-4 h-4 flex items-center justify-center" />
                                </span>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <section className="py-16 bg-slate-50">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-3">How We Hire</h2>
              <p className="text-slate-500 max-w-xl mx-auto">
                Our process is designed to be thorough but human. No automated rejections — a real person reviews every application.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {hiringSteps.map((step, i) => (
                <div key={step.step} className="bg-white border border-slate-200 rounded-2xl p-5 relative">
                  <span className="text-xs font-bold text-[#06B6D4] mb-2 block">{step.step}</span>
                  <h3 className="font-bold text-slate-900 mb-1.5">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                  {i < hiringSteps.length - 1 && (
                    <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 text-slate-300">
                      <i className="ri-arrow-right-s-line w-5 h-5 flex items-center justify-center" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                    <i className="ri-user-shared-line w-5 h-5 text-amber-600 flex items-center justify-center" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Freelancer or Contractor?</h3>
                    <p className="text-sm text-slate-500">Project-based opportunities</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  If you are looking for freelance, contract, or project-based work rather than a permanent employed role, our Freelancer Network is the right place to start.
                </p>
                <Link
                  href="/partners"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#06B6D4] hover:text-[#0891B2] transition-colors cursor-pointer whitespace-nowrap"
                >
                  Explore Freelancer Opportunities
                  <i className="ri-arrow-right-line w-4 h-4 flex items-center justify-center" />
                </Link>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                    <i className="ri-test-tube-line w-5 h-5 text-purple-600 flex items-center justify-center" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Interested in UAT Testing?</h3>
                    <p className="text-sm text-slate-500">Paid product testing opportunities</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  We regularly recruit testers to evaluate our products before launch. Paid per session, flexible scheduling, and no prior testing experience required.
                </p>
                <Link
                  href="/uat-testing"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#06B6D4] hover:text-[#0891B2] transition-colors cursor-pointer whitespace-nowrap"
                >
                  Learn About UAT Testing
                  <i className="ri-arrow-right-line w-4 h-4 flex items-center justify-center" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-[#0A1628] text-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-2xl font-bold mb-3">Equal Opportunity and Privacy</h2>
            <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Digital Footprint is an equal opportunity employer. We do not discriminate based on age, disability, gender reassignment, marriage and civil partnership, pregnancy and maternity, race, religion or belief, sex, or sexual orientation. We welcome applications from all backgrounds.
            </p>
            <p className="text-sm text-slate-400 max-w-2xl mx-auto mt-3 leading-relaxed">
              Your application data is processed in accordance with our privacy policy and retained only as long as necessary for the recruitment process. We do not share your information with third parties without your consent. You may request access, correction, or deletion of your data at any time by contacting us.
            </p>
            <div className="flex items-center justify-center gap-4 mt-6">
              <Link href="/privacy" className="text-sm text-[#06B6D4] hover:text-[#67E8F9] transition-colors whitespace-nowrap cursor-pointer">
                Privacy Policy
              </Link>
              <Link href="/careers/withdraw" className="text-sm text-[#06B6D4] hover:text-[#67E8F9] transition-colors whitespace-nowrap cursor-pointer">
                Withdraw Application
              </Link>
              <Link href="/contact" className="text-sm text-[#06B6D4] hover:text-[#67E8F9] transition-colors whitespace-nowrap cursor-pointer">
                Contact Us
              </Link>
            </div>
          </div>
        </section>

        <section className="py-12 bg-white border-t border-slate-100">
          <div className="max-w-3xl mx-auto px-6">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
              <h3 className="font-bold text-slate-900 mb-2">Do not see a role that fits?</h3>
              <p className="text-sm text-slate-500 mb-4">
                We are always interested in connecting with talented people. Send us a general enquiry and we will keep your details on file for future opportunities.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#06B6D4] text-white text-sm font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap"
              >
                Get in Touch
                <i className="ri-arrow-right-line w-4 h-4 flex items-center justify-center" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}