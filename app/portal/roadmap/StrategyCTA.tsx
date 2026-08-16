'use client';

import { useState } from 'react';
import { motion } from '@/components/motion';
import { Calendar, ArrowRight, CheckCircle } from 'lucide-react';
import { submitEnquiry, makeIdempotencyKey } from '@/lib/submit-enquiry';

export default function StrategyCTA() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    const honeypot = (formData.get('website_alt') as string || '').trim();
    if (honeypot) {
      setSubmitted(true);
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitEnquiry('leads', {
        name,
        email,
        message: message || null,
        enquiry_type: 'strategy_review',
        enquiry_data: { preferred_date: preferredDate || null },
        source: 'portal_roadmap',
        status: 'new',
        stage: 'new',
        consent_contact: true,
        idempotency_key: makeIdempotencyKey(),
      });

      if (result.code === 'OK') {
        setSubmitted(true);
      } else {
        setFormError(result.message);
      }
    } catch {
      setFormError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section>
      <div className="bg-gradient-to-br from-[#2563EB] to-blue-800 rounded-3xl p-8 lg:p-12 text-white relative overflow-hidden shadow-xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white" />
        </div>

        <div className="relative z-10">
          <div className="max-w-2xl mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold mb-3">Ready To Take The Next Step?</h2>
            <p className="text-blue-100 text-sm lg:text-base leading-relaxed">
              Schedule a technology strategy review with your dedicated project lead to discuss opportunities, 
              automation, AI integration and future business growth. Together we will map out your personalised 
              technology journey.
            </p>
          </div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center max-w-lg"
            >
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-emerald-400/20 mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-emerald-300" />
              </div>
              <p className="text-xl font-bold mb-2">Booking Request Sent</p>
              <p className="text-blue-100 text-sm">
                Your project lead will review your roadmap and reach out within 24 hours to confirm your strategy review session.
              </p>
            </motion.div>
          ) : (
            <form
              onSubmit={handleSubmit}
              data-readdy-form
              id="strategy-review-form"
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 max-w-lg"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-1">Your Name</label>
                  <input
                    type="text"
                    name="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 text-sm rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 text-sm rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-1">Preferred Date</label>
                  <input
                    type="date"
                    name="preferredDate"
                    value={preferredDate}
                    onChange={e => setPreferredDate(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 text-sm rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-1">Topics You Would Like To Discuss</label>
                  <textarea
                    name="message"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    maxLength={500}
                    rows={3}
                    className="w-full px-4 py-2.5 text-sm rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all resize-none"
                    placeholder="E.g. AI automation, cloud migration, security review..."
                  />
                  <p className="text-xs text-blue-300/70 mt-1 text-right">{message.length}/500</p>
                </div>
                <input
                  type="text"
                  name="website_alt"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  readOnly
                  className="absolute opacity-0 pointer-events-none h-0 w-0"
                />
                {formError && (
                  <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-3 text-sm text-red-200">
                    {formError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-[#2563EB] font-bold text-sm hover:bg-blue-50 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60 shadow-lg shadow-black/10"
                >
                  {submitting ? (
                    <span className="w-4 h-4 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" />
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      Book Strategy Review
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}