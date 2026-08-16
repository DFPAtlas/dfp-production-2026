'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SUPPLIER_CATEGORIES } from '@/lib/cms-definitions';
import { submitEnquiry } from '@/lib/submit-enquiry';

export default function SuppliersPage() {
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const honeypot = formData.get('phone_alt') as string;
    if (honeypot && honeypot.trim() !== '') {
      setFormState('success');
      return;
    }

    setFormState('submitting');
    setFormError('');

    try {
      const result = await submitEnquiry('partner_applications', {
        application_type: 'supplier_interest',
        company_name: (formData.get('company_name') as string) || null,
        applicant_name: (formData.get('applicant_name') as string) || null,
        email: (formData.get('email') as string) || null,
        website: (formData.get('website') as string) || null,
        region: (formData.get('region') as string) || null,
        experience_summary: (formData.get('experience_summary') as string) || null,
        products_or_services: {
          service_category: (formData.get('service_category') as string) || null,
          products_supported: (formData.get('products_supported') as string) || null,
        },
        capabilities: {
          business_type: (formData.get('business_type') as string) || null,
          certifications: (formData.get('certifications') as string) || null,
          insurance_confirmed: (formData.get('insurance_confirmed') as string) || null,
          availability: (formData.get('availability') as string) || null,
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
            <h1 className="text-3xl font-bold text-slate-900 mb-3">Supplier Interest Received</h1>
            <p className="text-slate-500 mb-6 leading-relaxed">
              Thank you for registering your interest as a supplier. Our team will review your details and get in touch if there is a potential fit. This does not create a supplier relationship.
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
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Supplier Interest</h1>
          <p className="text-lg text-slate-500 max-w-2xl leading-relaxed mb-10">
            Supply approved products or services that support Digital Footprint operations and client delivery. We work with suppliers who meet our quality, security and reliability standards.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
            <div className="bg-[#F8FAFC] rounded-xl p-5 border border-slate-100">
              <i className="ri-check-double-line text-[#06B6D4] w-7 h-7 flex items-center justify-center mb-3" />
              <h3 className="font-bold text-slate-900 text-sm mb-2">What We Look For</h3>
              <ul className="text-sm text-slate-500 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-[#10B981] mt-0.5 shrink-0">&#10003;</span>
                  Proven track record and relevant experience
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#10B981] mt-0.5 shrink-0">&#10003;</span>
                  Appropriate certifications and insurance
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#10B981] mt-0.5 shrink-0">&#10003;</span>
                  Alignment with DFP quality and security standards
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#10B981] mt-0.5 shrink-0">&#10003;</span>
                  Reliable communication and delivery
                </li>
              </ul>
            </div>
            <div className="bg-[#F8FAFC] rounded-xl p-5 border border-slate-100">
              <i className="ri-file-shield-line text-[#06B6D4] w-7 h-7 flex items-center justify-center mb-3" />
              <h3 className="font-bold text-slate-900 text-sm mb-2">What We Do Not Collect Publicly</h3>
              <ul className="text-sm text-slate-500 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-[#EF4444] mt-0.5 shrink-0">&#10007;</span>
                  Bank details or payment information
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#EF4444] mt-0.5 shrink-0">&#10007;</span>
                  Tax documents or identity documents
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#EF4444] mt-0.5 shrink-0">&#10007;</span>
                  Passwords, API keys or credentials
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#EF4444] mt-0.5 shrink-0">&#10007;</span>
                  Sensitive client or personal data
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-10">
            <div className="flex items-start gap-3">
              <i className="ri-information-line text-blue-600 w-5 h-5 flex items-center justify-center mt-0.5 shrink-0" />
              <div>
                <h3 className="font-bold text-blue-800 text-sm mb-1">Due Diligence Process</h3>
                <p className="text-sm text-blue-700 leading-relaxed">
                  After initial screening, approved suppliers go through a secure due diligence process which may include identity verification, insurance confirmation, reference checks and compliance review. Sensitive documents are collected through a separate secure channel — never through this public form.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Register Supplier Interest</h2>
          <p className="text-sm text-slate-500 mb-6">All fields marked with * are required. Your information will be reviewed but does not create a supplier relationship automatically.</p>

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
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Website</label>
                <input type="url" name="website" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="https://" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Service Category *</label>
                <div className="relative">
                  <select name="service_category" required className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 appearance-none pr-8 cursor-pointer">
                    <option value="">Select category...</option>
                    {SUPPLIER_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 flex items-center justify-center pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Regions Covered</label>
                <input type="text" name="region" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="e.g. UK, Europe, Global" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Business Type</label>
                <div className="relative">
                  <select name="business_type" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 appearance-none pr-8 cursor-pointer">
                    <option value="">Select...</option>
                    <option value="limited_company">Limited Company</option>
                    <option value="partnership">Partnership</option>
                    <option value="sole_trader">Sole Trader</option>
                    <option value="public_body">Public Body</option>
                    <option value="non_profit">Non-Profit</option>
                    <option value="other">Other</option>
                  </select>
                  <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 flex items-center justify-center pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">DFP Products Supported</label>
                <input type="text" name="products_supported" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="e.g. GuardianHub, QuickGuard" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Relevant Certifications</label>
              <input type="text" name="certifications" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="e.g. ISO 27001, Cyber Essentials, etc." />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Insurance Confirmation</label>
              <div className="relative">
                <select name="insurance_confirmed" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 appearance-none pr-8 cursor-pointer">
                  <option value="">Select...</option>
                  <option value="yes_professional_indemnity">Yes - Professional Indemnity</option>
                  <option value="yes_public_liability">Yes - Public Liability</option>
                  <option value="yes_both">Yes - Both</option>
                  <option value="in_progress">In Progress</option>
                  <option value="not_applicable">Not Applicable</option>
                </select>
                <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 flex items-center justify-center pointer-events-none" />
              </div>
              <p className="text-xs text-slate-400 mt-1">Document upload will be requested during due diligence if we proceed.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Experience Summary *</label>
              <textarea
                name="experience_summary"
                required
                maxLength={500}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 resize-none"
                placeholder="Brief summary of relevant experience and typical engagements"
              />
              <p className="text-xs text-slate-400 mt-1">Maximum 500 characters.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Availability Notes</label>
              <input type="text" name="availability" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="e.g. Available immediately, 2 weeks notice, etc." />
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
                I understand Digital Footprint will use this information for supplier screening and due diligence. My data will be handled in accordance with the <Link href="/privacy" className="text-[#06B6D4] underline">Privacy Policy</Link>. I am not submitting bank details, identity documents or credentials through this form. *
              </label>
            </div>

            <input type="text" name="phone_alt" tabIndex={-1} autoComplete="off" aria-hidden="true" readOnly className="absolute opacity-0 pointer-events-none" style={{ position: 'absolute', left: '-9999px' }} />

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
              {formState === 'submitting' ? 'Submitting...' : 'Register Interest'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}