'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { notifyLeadSubmission } from '@/lib/submit-enquiry';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from '@/components/motion';
import type { CareersVacancy } from '@/hooks/useCmsData';

export default function CareersApplyClient({ slug }: { slug: string }) {
  const [vacancy, setVacancy] = useState<CareersVacancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState('');
  const [formValues, setFormValues] = useState({
    fullName: '',
    email: '',
    telephone: '',
    location: '',
    workEligibility: '',
    coverNote: '',
    portfolioUrl: '',
    adjustmentRequest: '',
    futureConsent: false,
    privacyConsent: false,
    website_alt: '',
  });

  useEffect(() => {
    let cancelled = false;
    supabase.from('careers_vacancies').select('*').eq('slug', slug).maybeSingle().then(({ data, error }) => {
      if (cancelled) return;
      if (error || !data) { setNotFound(true); setLoading(false); return; }
      const v = data as CareersVacancy;
      if (v.vacancy_status !== 'Open' || v.public_visibility !== 'Public') { setNotFound(true); setLoading(false); return; }
      setVacancy(v);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [slug]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === 'checkbox') {
      setFormValues(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormValues(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formValues.website_alt.trim()) {
      setFormState('success');
      return;
    }

    setFormState('submitting');
    setFormError('');

    try {
      const { data: isDuplicate, error: dupError } = await supabase.rpc('has_career_application', {
        p_vacancy_id: vacancy?.id,
        p_email: formValues.email,
      });

      if (dupError) {
        setFormError('Unable to verify your application. Please try again.');
        setFormState('error');
        return;
      }

      if (isDuplicate) {
        setFormError('It looks like you have already submitted an application for this role. If you need to update your application or withdraw, please contact us.');
        setFormState('error');
        return;
      }

      const { data: insertedApp, error: appError } = await supabase.from('career_applications').insert({
        vacancy_id: vacancy?.id,
        candidate_name: formValues.fullName,
        candidate_email: formValues.email,
        telephone: formValues.telephone || null,
        location: formValues.location || null,
        work_eligibility_response: formValues.workEligibility || null,
        cover_note: formValues.coverNote || null,
        portfolio_url: formValues.portfolioUrl || null,
        adjustment_request: formValues.adjustmentRequest || null,
        future_opportunity_consent: formValues.futureConsent,
        source: 'careers_page',
        application_status: 'submitted',
        submitted_at: new Date().toISOString(),
      }).select('id');

      if (appError) {
        setFormError(appError.message);
        setFormState('error');
        return;
      }

      if (insertedApp?.[0]?.id) {
        notifyLeadSubmission('career_applications', insertedApp[0].id);
      }

      try {
        await supabase.functions.invoke('send-email', {
          body: {
            to: formValues.email,
            subject: `Application Received: ${vacancy?.title || 'Your Application'}`,
            html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
              <h2 style="color:#0A1628;">Thank you for your application</h2>
              <p>Dear ${formValues.fullName},</p>
              <p>We have received your application for <strong>${vacancy?.title}</strong> at Digital Footprint.</p>
              <p>Our team reviews every application individually. If your experience matches what we are looking for, we will contact you within two weeks. You will hear from us either way.</p>
              <p style="color:#64748B;font-size:14px;">Your application reference details have been recorded securely. If you need to withdraw your application, please visit our <a href="https://digital-footprint.uk/careers/withdraw" style="color:#06B6D4;">withdrawal page</a>.</p>
              <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0;" />
              <p style="color:#94A3B8;font-size:12px;">Digital Footprint, Hertfordshire, UK</p>
            </div>`,
          },
        });
      } catch {}

      setFormState('success');
    } catch {
      setFormError('Network error. Please check your connection and try again.');
      setFormState('error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="pt-32 pb-20">
          <div className="max-w-2xl mx-auto px-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-slate-100 rounded w-2/3" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
              <div className="h-12 bg-slate-100 rounded" />
              <div className="h-12 bg-slate-100 rounded" />
              <div className="h-32 bg-slate-100 rounded" />
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
          <div className="max-w-2xl mx-auto px-6 text-center">
            <i className="ri-file-unknow-line w-16 h-16 text-slate-300 mx-auto mb-4 flex items-center justify-center" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Role Not Available</h1>
            <p className="text-slate-500 mb-6">This vacancy is no longer accepting applications.</p>
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

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        <section className="relative pt-32 pb-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A1628] via-[#0F1D32] to-white pointer-events-none" />
          <div className="relative max-w-2xl mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Link href={`/careers/${vacancy.slug}`} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-4 cursor-pointer whitespace-nowrap">
                <i className="ri-arrow-left-line w-4 h-4 flex items-center justify-center" />
                Back to Role
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Apply for {vacancy.title}</h1>
              <p className="text-sm text-slate-400">{vacancy.department} · {vacancy.reference}</p>
            </motion.div>
          </div>
        </section>

        <section className="relative -mt-6 pb-20">
          <div className="max-w-2xl mx-auto px-6">
            {formState === 'success' ? (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <i className="ri-check-line w-7 h-7 text-emerald-500 flex items-center justify-center" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Application Submitted</h2>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                  Thank you for applying for {vacancy.title}. We have received your application and will review it shortly. If your experience matches what we are looking for, we will be in touch within two weeks.
                </p>
                <p className="text-sm text-slate-400 mb-6">
                  We review every application individually. You will hear from us either way.
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <Link href="/careers" className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap">
                    View More Roles
                  </Link>
                  <Link href="/careers/withdraw" className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-500 font-medium text-sm hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap">
                    Withdraw Application
                  </Link>
                  <Link href="/" className="px-5 py-2.5 rounded-xl bg-[#06B6D4] text-white font-medium text-sm hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap">
                    Back to Home
                  </Link>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} data-readdy-form="" className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-1">Your Details</h2>
                  <p className="text-sm text-slate-500">All fields marked with * are required.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1.5">Full Name *</label>
                    <input
                      type="text" id="fullName" name="fullName" required value={formValues.fullName} onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
                    <input
                      type="email" id="email" name="email" required value={formValues.email} onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="telephone" className="block text-sm font-medium text-slate-700 mb-1.5">Telephone</label>
                    <input
                      type="tel" id="telephone" name="telephone" value={formValues.telephone} onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40"
                      placeholder="+44 7000 000000"
                    />
                  </div>
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-1.5">General Location</label>
                    <input
                      type="text" id="location" name="location" value={formValues.location} onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40"
                      placeholder="e.g. London, UK"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="workEligibility" className="block text-sm font-medium text-slate-700 mb-1.5">Right to Work in the UK *</label>
                  <select
                    id="workEligibility" name="workEligibility" required value={formValues.workEligibility} onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer pr-10 appearance-none"
                  >
                    <option value="">Please select...</option>
                    <option value="yes_british">Yes — I am a British citizen</option>
                    <option value="yes_settled">Yes — I have settled or pre-settled status</option>
                    <option value="yes_visa">Yes — I hold a valid work visa</option>
                    <option value="yes_other">Yes — I have another right to work in the UK</option>
                    <option value="no_sponsorship">No — I would require visa sponsorship</option>
                    <option value="prefer_not">Prefer not to say at this stage</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <h2 className="text-lg font-bold text-slate-900 mb-1">Your Application</h2>
                </div>

                <div>
                  <label htmlFor="coverNote" className="block text-sm font-medium text-slate-700 mb-1.5">Cover Note *</label>
                  <p className="text-xs text-slate-400 mb-1.5">Tell us why you are interested in this role and what you would bring to Digital Footprint. Max 500 characters.</p>
                  <textarea
                    id="coverNote" name="coverNote" required value={formValues.coverNote} onChange={handleChange}
                    rows={5} maxLength={500}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 resize-none"
                    placeholder="Write your cover note here..."
                  />
                  <p className="text-xs text-slate-400 mt-1">{formValues.coverNote.length}/500</p>
                </div>

                <div>
                  <label htmlFor="portfolioUrl" className="block text-sm font-medium text-slate-700 mb-1.5">Portfolio or Professional Link</label>
                  <input
                    type="url" id="portfolioUrl" name="portfolioUrl" value={formValues.portfolioUrl} onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40"
                    placeholder="https://github.com/yourname or LinkedIn URL"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <h2 className="text-lg font-bold text-slate-900 mb-1">Accessibility</h2>
                </div>

                <div>
                  <label htmlFor="adjustmentRequest" className="block text-sm font-medium text-slate-700 mb-1.5">Reasonable Adjustment Request</label>
                  <p className="text-xs text-slate-400 mb-1.5">If you need any adjustments during the recruitment process, please let us know. This information is confidential and only shared as needed.</p>
                  <textarea
                    id="adjustmentRequest" name="adjustmentRequest" value={formValues.adjustmentRequest} onChange={handleChange}
                    rows={3} maxLength={500}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 resize-none"
                    placeholder="Optional — describe any adjustments you may need..."
                  />
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <h2 className="text-lg font-bold text-slate-900 mb-1">Consent</h2>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox" name="privacyConsent" required checked={formValues.privacyConsent} onChange={handleChange}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#06B6D4] focus:ring-[#06B6D4] cursor-pointer"
                  />
                  <span className="text-sm text-slate-600">
                    I confirm I have read and understood the privacy notice. I consent to Digital Footprint processing my application data for this recruitment process. *
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox" name="futureConsent" checked={formValues.futureConsent} onChange={handleChange}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#06B6D4] focus:ring-[#06B6D4] cursor-pointer"
                  />
                  <span className="text-sm text-slate-600">
                    I would like Digital Footprint to keep my details on file and contact me about future opportunities that may match my profile. (Optional)
                  </span>
                </label>

                <input
                  type="text"
                  name="website_alt"
                  value={formValues.website_alt}
                  onChange={handleChange}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  readOnly
                  className="absolute opacity-0 pointer-events-none"
                  style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}
                />

                {formError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                    {formError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={formState === 'submitting'}
                  className="w-full py-3 rounded-xl bg-[#06B6D4] text-white font-semibold text-sm hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formState === 'submitting' ? 'Submitting...' : 'Submit Application'}
                </button>

                <p className="text-xs text-slate-400 text-center">
                  By submitting, you confirm the information provided is accurate. We will never ask for bank details, passport copies, or sensitive documents at this stage.
                </p>
              </form>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
