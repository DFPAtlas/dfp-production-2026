'use client';

import Link from 'next/link';
import { useState } from 'react';
import { TECH_INTEGRATION_CATEGORIES } from '@/lib/cms-definitions';
import { submitEnquiry } from '@/lib/submit-enquiry';

export default function TechnologyPartnersPage() {
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const honeypot = formData.get('company_alt') as string;
    if (honeypot && honeypot.trim() !== '') {
      setFormState('success');
      return;
    }

    setFormState('submitting');
    setFormError('');

    try {
      const result = await submitEnquiry('partner_applications', {
        application_type: 'technology_integration',
        company_name: (formData.get('company_name') as string) || null,
        applicant_name: (formData.get('applicant_name') as string) || null,
        email: (formData.get('email') as string) || null,
        experience_summary: (formData.get('use_case') as string) || null,
        capabilities: {
          platform_name: (formData.get('platform_name') as string) || null,
          integration_category: (formData.get('integration_category') as string) || null,
          api_docs_url: (formData.get('api_docs_url') as string) || null,
          security_overview: (formData.get('security_overview') as string) || null,
          product_alignment: (formData.get('product_alignment') as string) || null,
          sandbox_available: (formData.get('sandbox_available') as string) || null,
          notes: (formData.get('notes') as string) || null,
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
            <h1 className="text-3xl font-bold text-slate-900 mb-3">Technology Enquiry Received</h1>
            <p className="text-slate-500 mb-6 leading-relaxed">
              Thank you for your interest in integrating with Digital Footprint. Our team will review your platform and proposed use case. We will be in touch if there is a technical and commercial fit.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/partners" className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap">
                Back to Partners
              </Link>
              <Link href="/contact" className="px-5 py-2.5 rounded-xl bg-[#06B6D4] text-white font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap">
                Contact Us
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
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Technology Partners</h1>
          <p className="text-lg text-slate-500 max-w-2xl leading-relaxed mb-10">
            Integrate your platform or technology with Digital Footprint products and services. We collaborate with SaaS platforms, API providers and technology companies to create better outcomes for shared clients.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
            <div className="bg-[#F8FAFC] rounded-xl p-5 border border-slate-100">
              <i className="ri-plug-line text-[#06B6D4] w-7 h-7 flex items-center justify-center mb-3" />
              <h3 className="font-bold text-slate-900 text-sm mb-2">Integration Types</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                API integration, platform extensions, data synchronisation, single sign-on, embedded components, payment processing and communication APIs.
              </p>
            </div>
            <div className="bg-[#F8FAFC] rounded-xl p-5 border border-slate-100">
              <i className="ri-shield-flash-line text-[#06B6D4] w-7 h-7 flex items-center justify-center mb-3" />
              <h3 className="font-bold text-slate-900 text-sm mb-2">Security Standards</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                We expect technology partners to meet modern security standards including secure API design, data protection compliance and regular security assessments.
              </p>
            </div>
            <div className="bg-[#F8FAFC] rounded-xl p-5 border border-slate-100">
              <i className="ri-git-repository-line text-[#06B6D4] w-7 h-7 flex items-center justify-center mb-3" />
              <h3 className="font-bold text-slate-900 text-sm mb-2">What to Provide</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Public API documentation, integration use case, security overview and any sandbox availability. Do not submit API keys or credentials.
              </p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-10">
            <div className="flex items-start gap-3">
              <i className="ri-error-warning-line text-red-600 w-5 h-5 flex items-center justify-center mt-0.5 shrink-0" />
              <div>
                <h3 className="font-bold text-red-800 text-sm mb-1">Do Not Submit Credentials</h3>
                <p className="text-sm text-red-700 leading-relaxed">
                  Never submit API keys, access tokens, passwords or other credentials through this form. Technical integration details will be exchanged through a secure channel after initial screening.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Technology Integration Enquiry</h2>
          <p className="text-sm text-slate-500 mb-6">All fields marked with * are required.</p>

          <form onSubmit={handleSubmit} data-readdy-form="" className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Name *</label>
                <input type="text" name="company_name" required className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="Your company" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact Name *</label>
                <input type="text" name="applicant_name" required className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="Your full name" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
                <input type="email" name="email" required className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="you@company.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Platform or Service Name *</label>
                <input type="text" name="platform_name" required className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="Your platform or service" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Integration Category *</label>
                <div className="relative">
                  <select name="integration_category" required className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 appearance-none pr-8 cursor-pointer">
                    <option value="">Select category...</option>
                    {TECH_INTEGRATION_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 flex items-center justify-center pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Public API / Documentation URL</label>
                <input type="url" name="api_docs_url" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="https://docs.example.com" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Proposed Use Case *</label>
              <textarea
                name="use_case"
                required
                maxLength={500}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 resize-none"
                placeholder="Describe how your platform would integrate with Digital Footprint products or services"
              />
              <p className="text-xs text-slate-400 mt-1">Maximum 500 characters.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Security / Compliance Overview</label>
                <input type="text" name="security_overview" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="e.g. SOC 2, ISO 27001, GDPR compliant" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">DFP Product Alignment</label>
                <input type="text" name="product_alignment" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="e.g. GuardianHub, QuickGuard, Synqoro" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Sandbox / Test Environment Availability</label>
              <div className="relative">
                <select name="sandbox_available" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 appearance-none pr-8 cursor-pointer">
                  <option value="">Select...</option>
                  <option value="yes_public">Yes - Public sandbox</option>
                  <option value="yes_private">Yes - Available on request</option>
                  <option value="no_sandbox">No sandbox currently</option>
                  <option value="not_applicable">Not applicable</option>
                </select>
                <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 flex items-center justify-center pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Additional Notes</label>
              <textarea
                name="notes"
                maxLength={500}
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 resize-none"
                placeholder="Any other relevant information about your platform or integration interest"
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
                I confirm I have not included API keys, tokens, passwords or credentials in this form. I understand Digital Footprint will use this information for partnership screening in accordance with the <Link href="/privacy" className="text-[#06B6D4] underline">Privacy Policy</Link>. *
              </label>
            </div>

            <input type="text" name="company_alt" tabIndex={-1} autoComplete="off" aria-hidden="true" readOnly className="absolute opacity-0 pointer-events-none" style={{ position: 'absolute', left: '-9999px' }} />

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
              {formState === 'submitting' ? 'Submitting...' : 'Submit Enquiry'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}