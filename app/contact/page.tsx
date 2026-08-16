'use client';

import { motion } from '@/components/motion';
import { useState, useRef, useCallback, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { trackConversion } from '@/lib/analytics';
import { submitEnquiry, makeIdempotencyKey } from '@/lib/submit-enquiry';

const needLabelMap: Record<string, string> = {
  website: 'I need a new website',
  'website-improvement': 'My current website needs improving',
  'lead-generation': 'I need more enquiries',
  automation: 'I want to automate my business',
  portal: 'I need a client or staff portal',
  saas: 'I have a software or SaaS idea',
  discovery: 'I\'m not sure what I need',
};

const needServiceMap: Record<string, string> = {
  website: 'Website Development',
  'website-improvement': 'Website Development',
  'lead-generation': 'Business Process Automation',
  automation: 'Business Process Automation',
  portal: 'Customer Portals',
  saas: 'Website Development',
  discovery: '',
};

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', company: '', phone: '', service: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedNeed, setSelectedNeed] = useState<{ value: string; label: string } | null>(null);
  const lastSubmitRef = useRef(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const needValue = params.get('need');
    const needLabel = params.get('need_label');
    const packageParam = params.get('package');
    const resolvedLabel = needLabel || (needValue && needLabelMap[needValue] ? needLabelMap[needValue] : null);
    if (needValue && resolvedLabel) {
      setSelectedNeed({ value: needValue, label: resolvedLabel });
      const service = needServiceMap[needValue] || '';
      const baseMessage = service
        ? `I selected: "${resolvedLabel}". I'd like to discuss this with the team.`
        : `I selected: "${resolvedLabel}". I'm looking for guidance on the best next step.`;
      const packageNote = packageParam ? `\n\nPackage of interest: ${packageParam}` : '';
      setFormData((prev) => ({
        ...prev,
        service: service || prev.service,
        message: baseMessage + packageNote,
      }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formData.message.length > 500) return;

    const form = e.currentTarget;
    const honeypot = (form.elements.namedItem('website_alt') as HTMLInputElement)?.value;
    if (honeypot && honeypot.trim()) {
      setSubmitted(true);
      return;
    }

    const now = Date.now();
    if (now - lastSubmitRef.current < 3000) {
      setErrorMsg('Please wait a moment before submitting again.');
      return;
    }
    lastSubmitRef.current = now;

    setSubmitting(true);
    setErrorMsg('');

    const payload: Record<string, string> = { ...formData };
    if (selectedNeed) {
      payload.message = `[Starting point: ${selectedNeed.label}]\n\n${payload.message}`;
    }

    try {
      const result = await submitEnquiry('leads', {
        name: payload.name,
        email: payload.email,
        phone: payload.phone || null,
        company_name: payload.company || null,
        service_interest: payload.service || null,
        message: payload.message,
        source: 'contact_page',
        status: 'new',
        stage: 'new',
        consent_contact: true,
        idempotency_key: makeIdempotencyKey(),
      }, true);

      if (result.code === 'OK') {
        setSubmitted(true);
        trackConversion('contact_form', `contact_${formData.email}_${Date.now()}`, { service_key: formData.service || undefined });
      } else {
        setErrorMsg(result.message);
      }
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }, [formData, selectedNeed]);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white text-slate-800">

        <section className="relative pt-32 pb-16 px-6 overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(249,115,22,0.5) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
            }}
          />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-px bg-gradient-to-r from-transparent via-[#F97316]/15 to-transparent" />

          <div className="relative z-10 max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-16"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#F97316] bg-[#F97316]/8 border border-[#F97316]/15 mb-6">
                Get in Touch
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 text-slate-900">
                Let&apos;s build something{' '}
                <span className="bg-gradient-to-r from-[#F97316] to-[#EA580C] bg-clip-text text-transparent">
                  great
                </span>{' '}
                together
              </h1>
              <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
                Book a free consultation and discover how technology can reshape your business. No pressure, just an honest conversation about what you need.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-2 space-y-5"
              >
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#F97316]/8 flex items-center justify-center shrink-0">
                    <i className="ri-mail-line text-xl text-[#F97316] w-6 h-6 flex items-center justify-center" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-base">Email</h3>
                    <a href="mailto:info@digital-footprint.uk" className="text-slate-500 text-sm hover:text-[#F97316] transition-colors cursor-pointer">info@digital-footprint.uk</a>
                    <p className="text-xs text-slate-400 mt-0.5">Response within 24 hours</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#F97316]/8 flex items-center justify-center shrink-0">
                    <i className="ri-phone-line text-xl text-[#F97316] w-6 h-6 flex items-center justify-center" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-base">Phone</h3>
                    <a href="tel:+441438123456" className="text-slate-500 text-sm hover:text-[#F97316] transition-colors cursor-pointer">01438 123 456</a>
                    <p className="text-xs text-slate-400 mt-0.5">Mon-Fri, 9am-6pm</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#F97316]/8 flex items-center justify-center shrink-0">
                    <i className="ri-map-pin-line text-xl text-[#F97316] w-6 h-6 flex items-center justify-center" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-base">Location</h3>
                    <p className="text-slate-500 text-sm">Hertfordshire, United Kingdom</p>
                    <p className="text-xs text-slate-400 mt-0.5">Serving businesses across the UK</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#FFF7ED] to-[#FFF1F2] rounded-2xl p-6 border border-[#F97316]/15">
                  <h3 className="font-semibold text-slate-800 mb-3 text-base">What happens next?</h3>
                  <ul className="space-y-2.5">
                    {[
                      'We review your inquiry within 2 hours',
                      'A team member reaches out to discuss your needs',
                      'You get a free consultation and project roadmap',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <span className="w-5 h-5 rounded-full bg-[#F97316]/15 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F97316]" />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-3"
              >
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                  {submitted ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-12"
                    >
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#F97316]/10 to-[#EA580C]/10 flex items-center justify-center mx-auto mb-6">
                        <i className="ri-check-line text-4xl text-[#F97316] w-10 h-10 flex items-center justify-center" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-2">Thank You!</h3>
                      <p className="text-slate-500 mb-8 max-w-sm mx-auto">Your message has been received. We&apos;ll get back to you within 24 hours — usually much sooner.</p>
                      <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-[#F97316] hover:text-white border border-[#F97316]/30 hover:bg-[#F97316] transition-all duration-200 cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-arrow-left-line w-4 h-4 flex items-center justify-center" />
                        Back to Home
                      </Link>
                    </motion.div>
                  ) : (
                    <form data-readdy-form id="contact-form" onSubmit={handleSubmit} className="space-y-5">
                      <div>
                        <p className="text-sm text-slate-500 mb-6">
                          Fill in the form below and we&apos;ll get back to you within one business day. All fields marked with * are required.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">Full Name *</label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/10 focus:outline-none text-sm text-slate-800 placeholder-slate-400 transition-all"
                            placeholder="John Smith"
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Email Address *</label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/10 focus:outline-none text-sm text-slate-800 placeholder-slate-400 transition-all"
                            placeholder="john@company.com"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label htmlFor="company" className="block text-sm font-medium text-slate-700 mb-1.5">Company</label>
                          <input
                            type="text"
                            id="company"
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/10 focus:outline-none text-sm text-slate-800 placeholder-slate-400 transition-all"
                            placeholder="Your company name"
                          />
                        </div>
                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/10 focus:outline-none text-sm text-slate-800 placeholder-slate-400 transition-all"
                            placeholder="+44"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="service" className="block text-sm font-medium text-slate-700 mb-1.5">Service Interested In</label>
                        <div className="relative">
                          <select
                            id="service"
                            name="service"
                            value={formData.service}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/10 focus:outline-none text-sm text-slate-800 transition-all pr-8 appearance-none cursor-pointer"
                          >
                            <option value="">Select a service</option>
                            <option value="Website Development">Website Design & Development</option>
                            <option value="AI Agents">AI Agent Development</option>
                            <option value="Business Automation">Business Process Automation</option>
                            <option value="Customer Portals">Customer Portals</option>
                            <option value="CRM Integration">CRM Integration</option>
                            <option value="Cloud Systems">Cloud Systems</option>
                            <option value="Cyber Security">Cyber Security</option>
                            <option value="IT Support">IT Support</option>
                            <option value="Consultancy">Technology Consultancy</option>
                            <option value="Other">Other / Not Sure</option>
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <i className="ri-arrow-down-s-line text-slate-400 w-5 h-5 flex items-center justify-center" />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1.5">Tell us about your project *</label>
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          required
                          rows={5}
                          maxLength={500}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/10 focus:outline-none text-sm text-slate-800 placeholder-slate-400 transition-all resize-none"
                          placeholder="Describe your project, goals and timeline..."
                        />
                        <div className="text-right text-xs text-slate-400 mt-1">{formData.message.length}/500</div>
                      </div>

                      <input
                        type="text"
                        name="website_alt"
                        tabIndex={-1}
                        autoComplete="off"
                        aria-hidden="true"
                        readOnly
                        className="absolute opacity-0 w-0 h-0 pointer-events-none"
                      />

                      {selectedNeed && (
                        <div className="mb-6 p-4 rounded-xl bg-[#06B6D4]/5 border border-[#06B6D4]/15">
                          <p className="text-xs text-[#06B6D4] font-semibold uppercase tracking-wider mb-1">You selected</p>
                          <p className="text-sm text-slate-700 font-medium">{selectedNeed.label}</p>
                        </div>
                      )}

                      {errorMsg && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                          {errorMsg}
                        </motion.div>
                      )}

                      <button
                        type="submit"
                        disabled={submitting || formData.message.length > 500}
                        className="group relative w-full px-6 py-4 rounded-xl font-semibold text-white overflow-hidden whitespace-nowrap cursor-pointer transition-all duration-300 bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] shadow-lg shadow-[#F97316]/15 hover:shadow-xl hover:shadow-[#F97316]/25 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {submitting ? (
                            <>
                              <i className="ri-loader-4-line animate-spin w-4 h-4 flex items-center justify-center" />
                              Sending...
                            </>
                          ) : (
                            <>
                              Send Message
                              <i className="ri-send-plane-line w-4 h-4 flex items-center justify-center group-hover:translate-x-0.5 transition-transform duration-200" />
                            </>
                          )}
                        </span>
                        <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      </button>
                    </form>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: 'ri-shield-check-line', title: 'Trusted Partner', desc: 'Working with businesses across the UK since 2018, delivering reliable technology solutions.' },
                { icon: 'ri-speed-up-line', title: 'Fast Response', desc: 'Most inquiries receive a response within 2 hours during business hours. We move quickly.' },
                { icon: 'ri-user-heart-line', title: 'No-Pressure Approach', desc: 'Honest advice with no hard sell. If we are not the right fit, we will tell you upfront.' },
              ].map((item) => (
                <div key={item.title} className="bg-white rounded-2xl p-6 border border-slate-200 text-center">
                  <div className="w-12 h-12 rounded-xl bg-[#F97316]/8 flex items-center justify-center mx-auto mb-4">
                    <i className={`${item.icon} text-xl text-[#F97316] w-6 h-6 flex items-center justify-center`} />
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}