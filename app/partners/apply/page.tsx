'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { partnerTypeConfig } from '@/lib/cms-definitions';
import { submitEnquiry } from '@/lib/submit-enquiry';

function ApplyForm() {
  const searchParams = useSearchParams();
  const preselectedType = searchParams.get('type') || '';

  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState('');
  const [applicationType, setApplicationType] = useState(preselectedType);

  useEffect(() => {
    if (preselectedType) setApplicationType(preselectedType);
  }, [preselectedType]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const honeypot = formData.get('contact_alt') as string;
    if (honeypot && honeypot.trim() !== '') {
      setFormState('success');
      return;
    }

    setFormState('submitting');
    setFormError('');

    try {
      const result = await submitEnquiry('partner_applications', {
        application_type: formData.get('application_type') as string,
        company_name: (formData.get('company_name') as string) || null,
        applicant_name: (formData.get('applicant_name') as string) || null,
        email: (formData.get('email') as string) || null,
        telephone: (formData.get('telephone') as string) || null,
        website: (formData.get('website') as string) || null,
        region: (formData.get('region') as string) || null,
        proposed_relationship: (formData.get('proposed_relationship') as string) || null,
        experience_summary: (formData.get('experience_summary') as string) || null,
        conflict_declaration: (formData.get('conflict_declaration') as string) || null,
        privacy_acknowledged_at: formData.get('privacy_acknowledged') === 'on' ? new Date().toISOString() : null,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      }, true);

      if (result.code === 'OK') {
        setFormState('success');
        form.reset();
      } else {
        setFormError(result.message);
        setFormState('error');
      }
    } catch {
      setFormError('Network error. Please check your connection and try again.');
      setFormState('error');
    }
  };

  if (formState === 'success') {
    return (
      <main className="min-h-screen bg-white">
        <section className="pt-32 pb-16 px-6">
          <div className="max-w-xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <i className="ri-check-line text-emerald-600 w-7 h-7 flex items-center justify-center" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-3">Application Submitted</h1>
            <p className="text-slate-500 mb-6 leading-relaxed">
              Thank you for your interest in partnering with Digital Footprint. Our team will review your application and be in touch if there is a potential fit. Submitting an application does not guarantee acceptance or create a partnership.
            </p>
            <p className="text-sm text-slate-400 mb-6">
              You will receive an acknowledgement shortly. Screening typically takes 5-10 working days.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/partners" className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap">
                Back to Partners
              </Link>
              <Link href="/products" className="px-5 py-2.5 rounded-xl bg-[#06B6D4] text-white font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap">
                Explore Our Products
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-2">
            <Link href="/partners" className="text-sm text-[#06B6D4] hover:text-[#0891B2] transition-colors cursor-pointer inline-flex items-center gap-1">
              <i className="ri-arrow-left-line w-4 h-4 flex items-center justify-center" />
              Back to Partners
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Partner Application</h1>
          <p className="text-lg text-slate-500 max-w-2xl leading-relaxed mb-4">
            Tell us about your organisation and the type of relationship you are interested in. Every application goes through a screening process — submitting this form does not guarantee acceptance.
          </p>
          <p className="text-sm text-slate-400 mb-10">
            Individual freelancers and contractors should apply through the Freelancer Network.
          </p>

          <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-5 mb-10">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Application Process</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { step: '1', label: 'Submit interest' },
                { step: '2', label: 'Internal screening' },
                { step: '3', label: 'Introduction call' },
                { step: '4', label: 'Due diligence' },
                { step: '5', label: 'Agreement & onboarding' },
                { step: '6', label: 'Approved partnership' },
              ].map((s, i) => (
                <div key={s.step} className="flex items-center gap-2 bg-white rounded-lg border border-slate-100 px-3 py-2">
                  <span className="w-5 h-5 rounded-full bg-[#06B6D4]/10 text-[#06B6D4] text-xs font-bold flex items-center justify-center">{s.step}</span>
                  <span className="text-xs text-slate-600">{s.label}</span>
                  {i < 5 && <i className="ri-arrow-right-s-line w-3 h-3 text-slate-300 flex items-center justify-center" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} data-readdy-form="" className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Application Type *</label>
              <div className="relative">
                <select
                  name="application_type"
                  value={applicationType}
                  onChange={e => setApplicationType(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 appearance-none pr-8 cursor-pointer"
                >
                  <option value="">Select type...</option>
                  {Object.entries(partnerTypeConfig).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
                <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 flex items-center justify-center pointer-events-none" />
              </div>
              {applicationType && partnerTypeConfig[applicationType] && (
                <p className="text-xs text-slate-500 mt-1.5">{partnerTypeConfig[applicationType].description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Name *</label>
                <input type="text" name="company_name" required className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="Your company" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Applicant Name *</label>
                <input type="text" name="applicant_name" required className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="Your full name" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
                <input type="email" name="email" required className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="you@company.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Telephone</label>
                <input type="tel" name="telephone" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="Optional" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Website</label>
                <input type="url" name="website" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="https://" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Region</label>
                <input type="text" name="region" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="e.g. UK, Europe, Global" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Proposed Relationship *</label>
              <div className="relative">
                <select name="proposed_relationship" required className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 appearance-none pr-8 cursor-pointer">
                  <option value="">Select...</option>
                  <option value="Referral partner">Referral Partner</option>
                  <option value="Technology partner">Technology Partner</option>
                  <option value="Integration partner">Integration Partner</option>
                  <option value="Implementation partner">Implementation Partner</option>
                  <option value="Delivery partner">Delivery Partner</option>
                  <option value="Supplier">Supplier</option>
                  <option value="Consultant">Consultant</option>
                  <option value="Strategic partner">Strategic Partner</option>
                  <option value="Education or community partner">Education / Community Partner</option>
                </select>
                <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 flex items-center justify-center pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Experience Summary *</label>
              <textarea
                name="experience_summary"
                required
                maxLength={500}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 resize-none"
                placeholder="Brief summary of your organisation and relevant experience"
              />
              <p className="text-xs text-slate-400 mt-1">Maximum 500 characters.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Conflict Declaration</label>
              <textarea
                name="conflict_declaration"
                maxLength={500}
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 resize-none"
                placeholder="Declare any actual or potential conflicts of interest"
              />
              <p className="text-xs text-slate-400 mt-1">Maximum 500 characters.</p>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name="privacy_acknowledged"
                id="privacy_acknowledged"
                required
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#06B6D4] focus:ring-[#06B6D4]/20 cursor-pointer accent-[#06B6D4]"
              />
              <label htmlFor="privacy_acknowledged" className="text-sm text-slate-600 leading-relaxed cursor-pointer">
                I understand Digital Footprint will use this information for partnership screening. My data will be handled in accordance with the <Link href="/privacy" className="text-[#06B6D4] underline">Privacy Policy</Link>. I am not submitting bank details, identity documents or credentials through this form. Submitting does not guarantee acceptance. *
              </label>
            </div>

            <input type="text" name="contact_alt" tabIndex={-1} autoComplete="off" aria-hidden="true" readOnly className="absolute opacity-0 pointer-events-none" style={{ position: 'absolute', left: '-9999px' }} />

            {formError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <p className="text-sm text-red-700">{formError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={formState === 'submitting'}
              className="w-full py-3 rounded-xl bg-[#06B6D4] text-white font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {formState === 'submitting' ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-white pt-32 px-6">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-6 h-6 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin mx-auto" />
        </div>
      </main>
    }>
      <ApplyForm />
    </Suspense>
  );
}