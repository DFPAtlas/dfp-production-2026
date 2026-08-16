'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from '@/components/motion';
import { employmentTypeConfig, workLocationTypeConfig } from '@/lib/cms-definitions';
import type { CareersVacancy } from '@/hooks/useCmsData';
import JsonLdScript from '@/components/JsonLdScript';

export default function CareersVacancyDetail({ slug }: { slug: string }) {
  const [vacancy, setVacancy] = useState<CareersVacancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useState(() => {
    let cancelled = false;
    supabase.from('careers_vacancies').select('*').eq('slug', slug).maybeSingle().then(({ data, error }) => {
      if (cancelled) return;
      if (error || !data) { setNotFound(true); setLoading(false); return; }
      setVacancy(data as CareersVacancy);
      setLoading(false);
    });
    return () => { cancelled = true; };
  });

  const formatSalary = (v: CareersVacancy) => {
    if (v.salary_visibility === 'not_shown' || (!v.salary_min && !v.salary_max)) return null;
    const currency = v.currency === 'GBP' ? '£' : v.currency || '£';
    const period = v.salary_period === 'year' ? '/year' : v.salary_period === 'month' ? '/month' : v.salary_period === 'day' ? '/day' : '';
    if (v.salary_min && v.salary_max) return `${currency}${v.salary_min.toLocaleString()} — ${currency}${v.salary_max.toLocaleString()}${period}`;
    if (v.salary_min) return `From ${currency}${v.salary_min.toLocaleString()}${period}`;
    if (v.salary_max) return `Up to ${currency}${v.salary_max.toLocaleString()}${period}`;
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="pt-32 pb-20">
          <div className="max-w-3xl mx-auto px-6">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-slate-100 rounded w-2/3" />
              <div className="h-5 bg-slate-100 rounded w-1/2" />
              <div className="h-4 bg-slate-100 rounded w-full" />
              <div className="h-4 bg-slate-100 rounded w-5/6" />
              <div className="h-4 bg-slate-100 rounded w-4/6" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !vacancy) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="pt-32 pb-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <i className="ri-file-unknow-line w-16 h-16 text-slate-300 mx-auto mb-4 flex items-center justify-center" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Vacancy Not Found</h1>
            <p className="text-slate-500 mb-6">This role may have been filled, closed, or removed.</p>
            <Link href="/careers" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#06B6D4] text-white font-semibold text-sm hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap">
              <i className="ri-arrow-left-line w-4 h-4 flex items-center justify-center" />
              View All Careers
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const et = employmentTypeConfig[vacancy.employment_type];
  const wl = workLocationTypeConfig[vacancy.work_location_type];
  const salary = formatSalary(vacancy);
  const responsibilities = (vacancy.responsibilities || []) as { item: string }[];
  const essentialReqs = (vacancy.essential_requirements || []) as { item: string }[];
  const desirableReqs = (vacancy.desirable_requirements || []) as { item: string }[];
  const benefits = (vacancy.benefits || []) as { item: string }[];
  const isOpen = vacancy.vacancy_status === 'Open' && vacancy.public_visibility === 'Public';

  const jobPostingSchema = isOpen ? {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: vacancy.title,
    description: vacancy.summary || '',
    datePosted: vacancy.created_at,
    validThrough: vacancy.closing_date || undefined,
    employmentType: vacancy.employment_type?.replace(/ /g, '_').toUpperCase(),
    hiringOrganization: {
      '@type': 'Organization',
      name: 'Digital Footprint',
      sameAs: 'https://digital-footprint.uk',
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: vacancy.location_text || 'Hertfordshire',
        addressCountry: 'UK',
      },
    },
    ...(vacancy.salary_visibility !== 'not_shown' && vacancy.salary_min ? {
      baseSalary: {
        '@type': 'MonetaryAmount',
        currency: vacancy.currency || 'GBP',
        value: {
          '@type': 'QuantitativeValue',
          minValue: vacancy.salary_min,
          maxValue: vacancy.salary_max || vacancy.salary_min,
          unitText: vacancy.salary_period === 'year' ? 'YEAR' : vacancy.salary_period === 'month' ? 'MONTH' : 'DAY',
        },
      },
    } : {}),
  } : null;

  return (
    <div className="min-h-screen bg-white">
      {jobPostingSchema && <JsonLdScript schemas={jobPostingSchema as Record<string, unknown>} />}
      <Header />

      <main>
        <section className="relative pt-32 pb-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A1628] via-[#0F1D32] to-white pointer-events-none" />
          <div className="relative max-w-3xl mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Link href="/careers" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-6 cursor-pointer whitespace-nowrap">
                <i className="ri-arrow-left-line w-4 h-4 flex items-center justify-center" />
                Back to Careers
              </Link>

              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                  {vacancy.title}
                </h1>
                {!isOpen && (
                  <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-medium whitespace-nowrap">
                    Closed
                  </span>
                )}
              </div>

              {vacancy.reference && (
                <p className="text-xs text-slate-500 font-mono mb-4">{vacancy.reference}</p>
              )}

              <div className="flex items-center gap-4 flex-wrap text-sm text-slate-300 mb-6">
                {et && (
                  <span className="flex items-center gap-1.5">
                    <i className={`${et.icon} w-4 h-4 flex items-center justify-center text-[#67E8F9]`} />
                    {et.label}
                  </span>
                )}
                {wl && (
                  <span className="flex items-center gap-1.5">
                    <i className={`${wl.icon} w-4 h-4 flex items-center justify-center text-[#67E8F9]`} />
                    {wl.label}
                  </span>
                )}
                {vacancy.department && (
                  <span className="flex items-center gap-1.5">
                    <i className="ri-building-4-line w-4 h-4 flex items-center justify-center text-[#67E8F9]" />
                    {vacancy.department}
                  </span>
                )}
              </div>

              {salary && (
                <p className="text-lg font-semibold text-white mb-2">{salary}</p>
              )}

              {vacancy.location_text && (
                <p className="text-sm text-slate-400">{vacancy.location_text}</p>
              )}

              {vacancy.closing_date && isOpen && (
                <p className="text-sm text-amber-400 mt-3">
                  Applications close {new Date(vacancy.closing_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </motion.div>
          </div>
        </section>

        <section className="relative -mt-6 pb-20">
          <div className="max-w-3xl mx-auto px-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-8">

              {vacancy.summary && (
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-3">About the Role</h2>
                  <p className="text-slate-600 leading-relaxed">{vacancy.summary}</p>
                </div>
              )}

              {responsibilities.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-3">What You Will Do</h2>
                  <ul className="space-y-2">
                    {responsibilities.map((r, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-600">
                        <i className="ri-check-line w-5 h-5 text-[#06B6D4] flex items-center justify-center mt-0.5 shrink-0" />
                        <span className="text-sm">{r.item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {essentialReqs.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-3">Essential Requirements</h2>
                  <ul className="space-y-2">
                    {essentialReqs.map((r, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-600">
                        <i className="ri-checkbox-circle-line w-5 h-5 text-emerald-500 flex items-center justify-center mt-0.5 shrink-0" />
                        <span className="text-sm">{r.item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {desirableReqs.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-3">Desirable</h2>
                  <ul className="space-y-2">
                    {desirableReqs.map((r, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-500">
                        <i className="ri-add-circle-line w-5 h-5 text-slate-400 flex items-center justify-center mt-0.5 shrink-0" />
                        <span className="text-sm">{r.item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {benefits.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-3">Benefits</h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {benefits.map((b, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                        <i className="ri-star-line w-4 h-4 text-[#06B6D4] flex items-center justify-center shrink-0" />
                        {b.item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {vacancy.expected_start_information && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">Expected Start</h3>
                  <p className="text-sm text-slate-600">{vacancy.expected_start_information}</p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200">
                <h2 className="text-lg font-bold text-slate-900 mb-3">Accessibility and Adjustments</h2>
                <p className="text-sm text-slate-600 mb-3">
                  We are committed to making our recruitment process accessible. If you need reasonable adjustments at any stage, please let us know in your application or contact us directly. We will work with you to ensure you can participate fully.
                </p>
                <p className="text-sm text-slate-500">
                  Your adjustment request is treated confidentially and only shared with those who need to know to make the necessary arrangements.
                </p>
              </div>

              <div className="pt-2">
                {isOpen ? (
                  <Link
                    href={`/careers/apply/${vacancy.slug}`}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#06B6D4] text-white font-semibold text-sm hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap shadow-lg shadow-[#06B6D4]/20"
                  >
                    Apply for This Role
                    <i className="ri-arrow-right-line w-4 h-4 flex items-center justify-center" />
                  </Link>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm text-amber-700">
                      This vacancy is no longer accepting applications. It may have been filled or closed. Browse other open roles or get in touch for general enquiries.
                    </p>
                    <Link
                      href="/careers"
                      className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-amber-700 hover:text-amber-800 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-arrow-left-line w-4 h-4 flex items-center justify-center" />
                      View Open Roles
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 bg-slate-50 border-t border-slate-200">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Privacy Notice</h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-3">
              Your application data will be processed by Digital Footprint for the purpose of this recruitment process. We retain application data for up to 12 months after the role is filled, unless you consent to us keeping your details for future opportunities.
            </p>
            <p className="text-sm text-slate-500 leading-relaxed">
              You may withdraw your application at any time by visiting our{' '}
              <Link href="/careers/withdraw" className="text-[#06B6D4] hover:text-[#0891B2] transition-colors cursor-pointer">withdrawal page</Link> or contacting us. For full details, please read our{' '}
              <Link href="/privacy" className="text-[#06B6D4] hover:text-[#0891B2] transition-colors cursor-pointer">privacy policy</Link>.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}