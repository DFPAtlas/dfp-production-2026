'use client';

import { useState } from 'react';
import { motion } from '@/components/motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { submitEnquiry, makeIdempotencyKey } from '@/lib/submit-enquiry';

export default function BlogPage() {
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState('');

  const handleNewsletterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const honeypot = (formData.get('website_alt') as string || '').trim();
    if (honeypot) { setFormStatus('success'); return; }
    setFormStatus('submitting');
    setFormError('');
    formData.delete('website_alt');
    try {
      const result = await submitEnquiry('leads', {
        name: 'Newsletter Subscriber',
        email: (formData.get('email') as string) || '',
        enquiry_type: 'newsletter',
        source: 'blog',
        status: 'new',
        stage: 'new',
        consent_marketing: true,
        idempotency_key: makeIdempotencyKey(),
      });

      if (result.code === 'OK') {
        setFormStatus('success');
        form.reset();
      } else {
        setFormError(result.message);
        setFormStatus('error');
      }
    } catch {
      setFormError('Unable to connect. Please check your connection and try again.');
      setFormStatus('error');
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen pt-24 bg-white text-slate-800">
        <section className="py-20 px-6 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(6,182,212,0.05),transparent_60%)]" />
          <div className="relative z-10 max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] text-sm font-medium mb-6">
                <i className="ri-article-line w-4 h-4 flex items-center justify-center" />
                Insights
              </div>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4 text-slate-900">Insights</h1>
              <p className="text-xl text-slate-500 max-w-2xl mx-auto">Practical thinking on technology, automation and digital systems for modern businesses.</p>
            </motion.div>

            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
                <i className="ri-article-line w-8 h-8 text-slate-400 flex items-center justify-center" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Articles coming soon</h2>
              <p className="text-slate-500 max-w-md mx-auto mb-8">We are preparing our first insights and guides. Subscribe below to be notified when new articles are published.</p>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
              <div className="section-dark-alt rounded-2xl p-12 border border-slate-200">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#06B6D4]/8 border border-[#06B6D4]/20 text-[#06B6D4] text-sm font-medium mb-6">
                  <i className="ri-mail-send-line w-4 h-4 flex items-center justify-center" />
                  Stay in the Loop
                </div>
                <h2 className="text-3xl font-bold mb-4 text-slate-900">Stay Updated</h2>
                <p className="text-slate-500 mb-8 max-w-xl mx-auto">Subscribe to our newsletter for the latest insights on technology, automation and digital transformation.</p>
                {formStatus === 'success' ? (
                  <div className="max-w-md mx-auto text-center py-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                      <i className="ri-check-line w-7 h-7 text-emerald-500 flex items-center justify-center" />
                    </div>
                    <p className="text-emerald-700 font-medium">Thank you for subscribing. You&apos;ll hear from us soon.</p>
                  </div>
                ) : (
                  <form data-readdy-form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto">
                    <input type="text" name="website_alt" tabIndex={-1} autoComplete="off" aria-hidden="true" readOnly className="absolute opacity-0 pointer-events-none" />
                    <input type="email" name="email" placeholder="Enter your email" required className="flex-1 w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#06B6D4] transition-colors text-sm" />
                    <button type="submit" disabled={formStatus === 'submitting'} className="px-6 py-3 rounded-xl font-semibold text-sm text-white bg-[#06B6D4] hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50">
                      {formStatus === 'submitting' ? 'Subscribing...' : 'Subscribe'}
                    </button>
                  </form>
                )}
                {formError && <p className="text-xs text-red-500 mt-3">{formError}</p>}
              </div>
            </motion.div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}