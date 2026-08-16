'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { trackConversion } from '@/lib/analytics';
import { submitEnquiry, makeIdempotencyKey } from '@/lib/submit-enquiry';

interface ProductRef {
  id: string;
  product_name: string;
  slug: string;
}

function RequestDemoContent() {
  const searchParams = useSearchParams();
  const preselectedProduct = searchParams.get('product') || '';
  const preselectedDemo = searchParams.get('demo') || '';

  const [products, setProducts] = useState<ProductRef[]>([]);
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    supabase
      .from('product_registry')
      .select('id,product_name,slug')
      .eq('public_visibility', 'Public')
      .order('sort_order')
      .then(({ data }) => setProducts((data || []) as ProductRef[]));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const honeypot = (formData.get('contact_alt') as string || '').trim();
    if (honeypot) {
      setFormState('success');
      form.reset();
      return;
    }

    setFormState('submitting');
    setFormError('');

    try {
      const result = await submitEnquiry('leads', {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        company_name: formData.get('company') as string || null,
        contact_role: formData.get('job_role') as string || null,
        service_interest: formData.get('product') as string || null,
        message: [formData.get('main_goal'), formData.get('current_challenge')].filter(Boolean).join('\n\n') || null,
        source: 'demo_request',
        stage: 'new',
        status: 'new',
        priority: 'medium',
        consent_contact: true,
        enquiry_type: 'demo_request',
        enquiry_data: {
          product: formData.get('product') as string || null,
          demo_slug: preselectedDemo || null,
          main_goal: formData.get('main_goal') as string || null,
          current_challenge: formData.get('current_challenge') as string || null,
          org_size: formData.get('org_size') as string || null,
          preferred_format: formData.get('preferred_format') as string || null,
          preferred_contact: formData.get('preferred_contact') as string || null,
          timezone: formData.get('timezone') as string || null,
          availability: formData.get('availability') as string || null,
          reason: formData.get('reason') as string || null,
        },
        idempotency_key: makeIdempotencyKey(),
      }, true);

      if (result.code === 'OK') {
        setFormState('success');
        form.reset();
        trackConversion('demo_request', `demo_${formData.get('email') as string}_${Date.now()}`, { product_key: formData.get('product') as string || undefined, demo_key: preselectedDemo || undefined });
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-6 max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-5">
            <i className="ri-check-line w-8 h-8 text-emerald-500 flex items-center justify-center" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Request Received</h1>
          <p className="text-slate-500 mb-6">
            Thank you for your interest. Our team will review your request and get back to you within 2 business days to arrange a suitable time.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/demos" className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap">
              Back to Demo Centre
            </Link>
            <Link href="/products" className="px-5 py-2.5 rounded-xl bg-[#06B6D4] text-white text-sm font-medium hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap">
              Explore Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <Link href="/demos" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors mb-6 cursor-pointer">
          <i className="ri-arrow-left-line w-4 h-4 flex items-center justify-center" />
          Demo Centre
        </Link>

        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Request a Live Demonstration</h1>
          <p className="text-slate-500 max-w-xl">
            Tell us about your needs and our team will arrange a personalised walkthrough of the Digital Footprint products that matter to you.
          </p>
        </div>

        <form onSubmit={handleSubmit} data-readdy-form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">Full Name *</label>
              <input
                type="text" id="name" name="name" required
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Work Email *</label>
              <input
                type="email" id="email" name="email" required
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-slate-700 mb-1.5">Company *</label>
              <input
                type="text" id="company" name="company" required
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40"
                placeholder="Company name"
              />
            </div>

            <div>
              <label htmlFor="job_role" className="block text-sm font-medium text-slate-700 mb-1.5">Job Role</label>
              <input
                type="text" id="job_role" name="job_role"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40"
                placeholder="e.g. CTO, Product Manager"
              />
            </div>
          </div>

          <div>
            <label htmlFor="product" className="block text-sm font-medium text-slate-700 mb-1.5">Product or Service of Interest</label>
            <select
              id="product" name="product"
              defaultValue={preselectedProduct}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer pr-8"
            >
              <option value="">Select a product or service</option>
              {products.map(p => (
                <option key={p.id} value={p.product_name}>{p.product_name}</option>
              ))}
              <option value="Multiple products">Multiple Products</option>
              <option value="Not sure">Not Sure — Need Guidance</option>
            </select>
          </div>

          <div>
            <label htmlFor="main_goal" className="block text-sm font-medium text-slate-700 mb-1.5">Main Goal</label>
            <textarea
              id="main_goal" name="main_goal" rows={2}
              maxLength={500}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 resize-none"
              placeholder="What are you hoping to achieve?"
            />
          </div>

          <div>
            <label htmlFor="current_challenge" className="block text-sm font-medium text-slate-700 mb-1.5">Current Challenge</label>
            <textarea
              id="current_challenge" name="current_challenge" rows={2}
              maxLength={500}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 resize-none"
              placeholder="What problem are you trying to solve?"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="org_size" className="block text-sm font-medium text-slate-700 mb-1.5">Organisation Size</label>
              <select
                id="org_size" name="org_size"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer pr-8"
              >
                <option value="">Select size</option>
                <option value="1-10">1–10 employees</option>
                <option value="11-50">11–50 employees</option>
                <option value="51-200">51–200 employees</option>
                <option value="201-500">201–500 employees</option>
                <option value="501+">501+ employees</option>
              </select>
            </div>

            <div>
              <label htmlFor="preferred_format" className="block text-sm font-medium text-slate-700 mb-1.5">Preferred Demo Format</label>
              <select
                id="preferred_format" name="preferred_format"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer pr-8"
              >
                <option value="">No preference</option>
                <option value="video_call">Video Call</option>
                <option value="in_person">In Person</option>
                <option value="recorded">Pre-recorded Walkthrough</option>
              </select>
            </div>

            <div>
              <label htmlFor="preferred_contact" className="block text-sm font-medium text-slate-700 mb-1.5">Preferred Contact Method</label>
              <select
                id="preferred_contact" name="preferred_contact"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer pr-8"
              >
                <option value="email">Email</option>
                <option value="telephone">Telephone</option>
              </select>
            </div>

            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-slate-700 mb-1.5">Timezone</label>
              <select
                id="timezone" name="timezone"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer pr-8"
              >
                <option value="">Select timezone</option>
                <option value="GMT">GMT (London)</option>
                <option value="CET">CET (Central Europe)</option>
                <option value="EST">EST (US Eastern)</option>
                <option value="PST">PST (US Pacific)</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="availability" className="block text-sm font-medium text-slate-700 mb-1.5">Availability Notes</label>
            <input
              type="text" id="availability" name="availability"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40"
              placeholder="Preferred days/times or any scheduling constraints"
            />
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-slate-700 mb-1.5">Additional Notes</label>
            <textarea
              id="reason" name="reason" rows={3}
              maxLength={500}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 resize-none"
              placeholder="Anything else you'd like us to know?"
            />
          </div>

          <div className="bg-[#f0fdff] rounded-xl p-4 border border-[#06B6D4]/20">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" name="consent" required className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#06B6D4] focus:ring-[#06B6D4]" />
              <span className="text-sm text-slate-600">
                I consent to Digital Footprint processing my information to respond to this demo request. I understand my data will be handled in accordance with the{' '}
                <Link href="/privacy" className="text-[#06B6D4] underline">Privacy Policy</Link>.
              </span>
            </label>
          </div>

          <input
            type="text"
            name="contact_alt"
            tabIndex={-1}
            autoComplete="off"
            readOnly
            aria-hidden="true"
            className="absolute opacity-0 pointer-events-none"
            style={{ position: 'absolute', left: '-9999px' }}
          />

          {formState === 'error' && formError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-700">{formError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={formState === 'submitting'}
            className="w-full px-6 py-3.5 rounded-xl bg-[#06B6D4] text-white font-semibold text-sm hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {formState === 'submitting' ? 'Submitting...' : 'Request Demonstration'}
          </button>

          <input type="hidden" name="demo_slug" value={preselectedDemo} />

          <p className="text-xs text-slate-400 text-center">
            We&apos;ll respond within 2 business days. This form does not confirm a meeting date.
          </p>
        </form>
      </div>
    </div>
  );
}

export default function RequestDemoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
      </div>
    }>
      <RequestDemoContent />
    </Suspense>
  );
}