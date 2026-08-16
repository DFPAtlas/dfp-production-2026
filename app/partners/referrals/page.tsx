'use client';

import Link from 'next/link';
import { useState } from 'react';
import { REFERRAL_NO_REWARD_NOTE } from '@/lib/cms-definitions';
import { submitEnquiry } from '@/lib/submit-enquiry';

export default function ReferralsPage() {
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const honeypot = formData.get('website_alt') as string;
    if (honeypot && honeypot.trim() !== '') {
      setFormState('success');
      return;
    }

    const authorityConfirmed = formData.get('authority_confirmed') as string;
    if (authorityConfirmed !== 'on') {
      setFormError('You must confirm you are authorised to share this information.');
      setFormState('error');
      return;
    }

    setFormState('submitting');
    setFormError('');

    try {
      const result = await submitEnquiry('partner_applications', {
        application_type: 'referral_registration',
        applicant_name: (formData.get('referrer_name') as string) || null,
        email: (formData.get('email') as string) || null,
        company_name: (formData.get('referrer_company') as string) || null,
        referral_details: {
          relationship: (formData.get('relationship') as string) || null,
          referred_company: (formData.get('referred_company') as string) || null,
          referred_contact_name: (formData.get('referred_contact_name') as string) || null,
          referred_email: (formData.get('referred_email') as string) || null,
          service_interest: (formData.get('service_interest') as string) || null,
          referral_reason: (formData.get('referral_reason') as string) || null,
        },
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
            <h1 className="text-3xl font-bold text-slate-900 mb-3">Referral Submitted</h1>
            <p className="text-slate-500 mb-6 leading-relaxed">
              Thank you for your referral. Our team will review the introduction and, where appropriate, reach out to explore the opportunity. We will not automatically contact or market to the referred individual.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/partners" className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap">
                Back to Partners
              </Link>
              <Link href="/partners/referrals" className="px-5 py-2.5 rounded-xl bg-[#06B6D4] text-white font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap">
                Submit Another Referral
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
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Referral Programme</h1>
          <p className="text-lg text-slate-500 max-w-2xl leading-relaxed mb-10">
            Know a business that could benefit from Digital Footprint? We welcome trusted introductions from consultants, agencies, existing clients and professionals.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
            <div className="bg-[#F8FAFC] rounded-xl p-5 border border-slate-100">
              <i className="ri-user-search-line text-[#06B6D4] w-7 h-7 flex items-center justify-center mb-3" />
              <h3 className="font-bold text-slate-900 text-sm mb-2">Who May Refer</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Consultants, agencies, existing clients and professionals who have a genuine relationship with the business being referred.
              </p>
            </div>
            <div className="bg-[#F8FAFC] rounded-xl p-5 border border-slate-100">
              <i className="ri-lightbulb-line text-[#06B6D4] w-7 h-7 flex items-center justify-center mb-3" />
              <h3 className="font-bold text-slate-900 text-sm mb-2">Suitable Referrals</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Businesses needing websites, SaaS, AI automation, business portals, cloud infrastructure or digital transformation.
              </p>
            </div>
            <div className="bg-[#F8FAFC] rounded-xl p-5 border border-slate-100">
              <i className="ri-shield-check-line text-[#06B6D4] w-7 h-7 flex items-center justify-center mb-3" />
              <h3 className="font-bold text-slate-900 text-sm mb-2">Privacy</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                We treat all referral information confidentially. We will not automatically market to referred contacts without an appropriate basis.
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-10">
            <div className="flex items-start gap-3">
              <i className="ri-information-line text-amber-600 w-5 h-5 flex items-center justify-center mt-0.5 shrink-0" />
              <div>
                <h3 className="font-bold text-amber-800 text-sm mb-1">Important: No Active Reward Programme</h3>
                <p className="text-sm text-amber-700 leading-relaxed">{REFERRAL_NO_REWARD_NOTE}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Submit a Referral</h2>
          <p className="text-sm text-slate-500 mb-6">All fields marked with * are required.</p>

          <form onSubmit={handleSubmit} data-readdy-form="" className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Your Name *</label>
                <input type="text" name="referrer_name" required className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="Your full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Your Email *</label>
                <input type="email" name="email" required className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="you@example.com" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Your Company</label>
                <input type="text" name="referrer_company" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="Company name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Relationship to Potential Customer *</label>
                <input type="text" name="relationship" required className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="e.g. Consultant, Agency, Colleague" />
              </div>
            </div>

            <div className="bg-[#F8FAFC] rounded-xl border border-slate-200 p-5 space-y-4">
              <p className="text-sm font-semibold text-slate-700">About the Referred Business</p>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Potential Customer Company *</label>
                <input type="text" name="referred_company" required className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="Company name" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact Name (if known)</label>
                <input type="text" name="referred_contact_name" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="Contact person name" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Business Email (only if authorised to share)</label>
                <input type="email" name="referred_email" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="contact@company.com" />
                <p className="text-xs text-slate-400 mt-1">Only share this if you have a lawful basis to do so.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Product or Service Interest</label>
                <div className="relative">
                  <select name="service_interest" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 appearance-none pr-8 cursor-pointer">
                    <option value="">Select...</option>
                    <option value="websites_and_saas">Websites and SaaS</option>
                    <option value="ai_and_automation">AI and Automation</option>
                    <option value="business_portals">Business Portals</option>
                    <option value="cloud_infrastructure">Cloud and Infrastructure</option>
                    <option value="pbx">Cloud PBX</option>
                    <option value="digital_transformation">Digital Transformation</option>
                    <option value="not_sure">Not sure - please advise</option>
                  </select>
                  <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 flex items-center justify-center pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason for Referral *</label>
              <textarea
                name="referral_reason"
                required
                maxLength={500}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 resize-none"
                placeholder="Briefly explain why this is a good fit for Digital Footprint"
              />
              <p className="text-xs text-slate-400 mt-1">Maximum 500 characters.</p>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name="authority_confirmed"
                id="authority_confirmed"
                required
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#06B6D4] focus:ring-[#06B6D4]/20 cursor-pointer accent-[#06B6D4]"
              />
              <label htmlFor="authority_confirmed" className="text-sm text-slate-600 leading-relaxed cursor-pointer">
                I confirm I am authorised to share this information with Digital Footprint and have a lawful basis for sharing any personal data included. *
              </label>
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
                I understand Digital Footprint will use this information to review the referral and may contact me about it. The referred party will not be contacted without an appropriate basis. See our <Link href="/privacy" className="text-[#06B6D4] underline">Privacy Policy</Link>. *
              </label>
            </div>

            <input type="text" name="website_alt" tabIndex={-1} autoComplete="off" aria-hidden="true" readOnly className="absolute opacity-0 pointer-events-none" style={{ position: 'absolute', left: '-9999px' }} />

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
              {formState === 'submitting' ? 'Submitting...' : 'Submit Referral'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}