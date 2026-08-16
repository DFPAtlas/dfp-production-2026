'use client';

import Link from 'next/link';
import { useState } from 'react';
import { trackConversion } from '@/lib/analytics';
import { submitEnquiry } from '@/lib/submit-enquiry';

const ISSUE_CATEGORIES = [
  { value: 'general', label: 'General Question' },
  { value: 'account', label: 'Account Access' },
  { value: 'billing', label: 'Billing and Invoices' },
  { value: 'project', label: 'Project Delivery' },
  { value: 'product', label: 'Product Support' },
  { value: 'uat', label: 'UAT Testing' },
  { value: 'pbx', label: 'Cloud PBX' },
  { value: 'security', label: 'Security or Privacy' },
  { value: 'other', label: 'Other' },
];

const URGENCY_OPTIONS = [
  { value: 'general', label: 'General question' },
  { value: 'normal', label: 'Normal issue' },
  { value: 'important', label: 'Important' },
  { value: 'service-unavailable', label: 'Service unavailable' },
  { value: 'security', label: 'Security or privacy concern' },
];

export default function SupportRequestPage() {
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const honeypot = (formData.get('website_alt') as string || '').trim();
    if (honeypot) {
      setFormState('success');
      return;
    }

    if ((formData.get('description') as string).length > 500) {
      setFormError('Description must be 500 characters or fewer.');
      return;
    }

    setFormState('submitting');
    setFormError('');

    try {
      const urgency = (formData.get('urgency') as string) || 'normal';
      const priorityMap: Record<string, string> = {
        general: 'Low',
        normal: 'Medium',
        important: 'High',
        'service-unavailable': 'Urgent',
        security: 'High',
      };

      const descriptionParts = [];
      descriptionParts.push((formData.get('description') as string) || '');
      const organisation = (formData.get('organisation') as string) || '';
      const category = (formData.get('category') as string) || '';
      const productService = (formData.get('product_service') as string) || '';
      if (organisation) descriptionParts.push(`Organisation: ${organisation}`);
      if (category) descriptionParts.push(`Category: ${category}`);
      if (productService) descriptionParts.push(`Product/Service: ${productService}`);

      const result = await submitEnquiry('digital_footprint_support', {
        ticket_title: (formData.get('subject') as string) || 'Support Request',
        ticket_description: descriptionParts.join('\n'),
        status: 'Open',
        priority: priorityMap[urgency] || 'Medium',
        submitted_by: (formData.get('name') as string) || '',
        submitted_email: (formData.get('email') as string) || '',
      }, true);

      if (result.code === 'OK') {
        setFormState('success');
        trackConversion('support_request', `support_${formData.get('email') as string}_${Date.now()}`, { service_key: productService || undefined, content_slug: category || undefined });
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
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="max-w-md mx-auto px-6 text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-5">
            <i className="ri-check-line w-8 h-8 text-emerald-500 flex items-center justify-center" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Request Submitted</h1>
          <p className="text-slate-500 text-sm mb-6">
            Thank you. Our support team will review your request and respond as soon as possible. You will receive a confirmation by email.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/help" className="px-5 py-2.5 bg-[#06B6D4] text-white text-sm font-semibold rounded-xl hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap">
              Help Centre
            </Link>
            <Link href="/" className="px-5 py-2.5 bg-white text-slate-600 text-sm font-medium rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer whitespace-nowrap">
              Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="bg-gradient-to-b from-[#0A1628] to-[#0F1F3D] text-white py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#06B6D4]/15 flex items-center justify-center mx-auto mb-5">
            <i className="ri-mail-send-line w-7 h-7 text-[#06B6D4] flex items-center justify-center" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-3">Submit a Support Request</h1>
          <p className="text-slate-300 text-sm max-w-md mx-auto">
            Tell us what you need help with and we will get back to you.
          </p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
          <form onSubmit={handleSubmit} data-readdy-form="">
            {/* Honeypot */}
            <input
              type="text"
              name="website_alt"
              tabIndex={-1}
              autoComplete="off"
              readOnly
              aria-hidden="true"
              className="absolute opacity-0 pointer-events-none"
              style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}
            />

            {formError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <i className="ri-error-warning-line w-5 h-5 text-red-500 flex-shrink-0 mt-0.5 flex items-center justify-center" />
                <p className="text-sm text-red-700">{formError}</p>
              </div>
            )}

            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Organisation</label>
                <input
                  type="text"
                  name="organisation"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40"
                  placeholder="Company or organisation name"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Issue Category *</label>
                  <div className="relative">
                    <select
                      name="category"
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer pr-8"
                    >
                      <option value="">Select category</option>
                      {ISSUE_CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 flex items-center justify-center pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Urgency *</label>
                  <div className="relative">
                    <select
                      name="urgency"
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer pr-8"
                    >
                      {URGENCY_OPTIONS.map(u => (
                        <option key={u.value} value={u.value}>{u.label}</option>
                      ))}
                    </select>
                    <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 flex items-center justify-center pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Product or Service</label>
                <input
                  type="text"
                  name="product_service"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40"
                  placeholder="Which product or service is this about?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject *</label>
                <input
                  type="text"
                  name="subject"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40"
                  placeholder="Brief summary of your issue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description * <span className="text-slate-400 font-normal">(max 500 characters)</span>
                </label>
                <textarea
                  name="description"
                  required
                  maxLength={500}
                  rows={5}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 resize-none"
                  placeholder="Please describe your issue in detail..."
                />
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="privacy_acknowledgement"
                  required
                  id="privacy-ack"
                  className="mt-1 w-4 h-4 rounded border-slate-300 text-[#06B6D4] focus:ring-[#06B6D4] cursor-pointer"
                />
                <label htmlFor="privacy-ack" className="text-xs text-slate-500">
                  I understand that my information will be used to respond to my enquiry and will be handled in accordance with the{' '}
                  <Link href="/privacy" className="text-[#06B6D4] underline cursor-pointer">Privacy Policy</Link>.
                </label>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <Link href="/support" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 cursor-pointer">
                <i className="ri-arrow-left-line w-4 h-4 flex items-center justify-center" />
                Back
              </Link>
              <button
                type="submit"
                disabled={formState === 'submitting'}
                className="px-6 py-2.5 bg-[#06B6D4] text-white text-sm font-semibold rounded-xl hover:bg-[#0891B2] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer whitespace-nowrap"
              >
                {formState === 'submitting' ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}