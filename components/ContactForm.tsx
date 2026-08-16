'use client';

import { useState } from 'react';
import { submitEnquiry, makeIdempotencyKey } from '@/lib/submit-enquiry';

interface ContactFormProps {
  onClose: () => void;
}

export default function ContactForm({ onClose }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    serviceType: '',
    subject: '',
    message: '',
    website_alt: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.message.length > 500) {
      return;
    }

    if (formData.website_alt.trim()) {
      setSubmitStatus('success');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    const result = await submitEnquiry('leads', {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || null,
      company_name: formData.company.trim() || null,
      service_interest: formData.serviceType || null,
      message: formData.subject.trim() ? `[${formData.subject.trim()}] ${formData.message}` : formData.message,
      source: 'contact_modal',
      status: 'new',
      stage: 'new',
      consent_contact: true,
      idempotency_key: makeIdempotencyKey(),
    }, true);

    if (result.code === 'OK') {
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        serviceType: '',
        subject: '',
        message: '',
        website_alt: '',
      });
      setTimeout(() => {
        onClose();
      }, 3000);
    } else {
      setSubmitStatus('error');
      setErrorMessage(result.message);
    }
    setIsSubmitting(false);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={handleOverlayClick}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Get In Touch</h2>
              <p className="text-gray-600 mt-2">Have questions? We&apos;d love to hear from you.</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          {submitStatus === 'success' && (
            <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center">
                <i className="ri-checkbox-circle-fill text-green-600 text-2xl mr-4"></i>
                <div>
                  <h3 className="text-green-800 font-semibold text-lg">Message Sent Successfully!</h3>
                  <p className="text-green-600">We&apos;ll get back to you within 24 hours.</p>
                </div>
              </div>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center">
                <i className="ri-error-warning-line text-red-600 text-2xl mr-4"></i>
                <div>
                  <h3 className="text-red-800 font-semibold text-lg">Submission Failed</h3>
                  <p className="text-red-600">{errorMessage || 'Please try again or call us directly.'}</p>
                </div>
              </div>
            </div>
          )}

          <form id="contact-form" onSubmit={handleSubmit} className="space-y-6">
            <input
              type="text"
              name="website_alt"
              value={formData.website_alt}
              onChange={handleChange}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              readOnly
              className="absolute opacity-0 pointer-events-none"
              style={{ position: 'absolute', left: '-9999px' }}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-3">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00F0FF]/30 focus:border-[#00F0FF] text-sm transition-colors bg-gray-50"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00F0FF]/30 focus:border-[#00F0FF] text-sm transition-colors bg-gray-50"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-3">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00F0FF]/30 focus:border-[#00F0FF] text-sm transition-colors bg-gray-50"
                  placeholder="+44 20 XXXX XXXX"
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-semibold text-gray-700 mb-3">
                  Company/Organization
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00F0FF]/30 focus:border-[#00F0FF] text-sm transition-colors bg-gray-50"
                  placeholder="Your company name"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="serviceType" className="block text-sm font-semibold text-gray-700 mb-3">
                  Service Interest *
                </label>
                <select
                  id="serviceType"
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00F0FF]/30 focus:border-[#00F0FF] text-sm pr-8 transition-colors bg-gray-50"
                >
                  <option value="">Select a service</option>
                  <option value="Website Development">Website Design &amp; Development</option>
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
              </div>

              <div className="md:col-span-2">
                <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-3">
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00F0FF]/30 focus:border-[#00F0FF] text-sm transition-colors bg-gray-50"
                  placeholder="Brief description of your inquiry"
                />
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-3">
                Your Message *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                maxLength={500}
                placeholder="Tell us about your project, questions, or how we can help you..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00F0FF]/30 focus:border-[#00F0FF] text-sm resize-none transition-colors bg-gray-50"
              />
              <div className="text-right text-sm text-gray-500 mt-2">
                {formData.message.length}/500 characters
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <i className="ri-information-line text-blue-600 text-xl mr-3 mt-0.5"></i>
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">What happens next?</p>
                  <ul className="space-y-1 text-blue-700">
                    <li>• We&apos;ll review your inquiry within 2 hours</li>
                    <li>• Our team will contact you to discuss your needs</li>
                    <li>• We&apos;ll provide a free consultation and quote</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || formData.message.length > 500}
                className="flex-1 px-8 py-3 bg-gradient-to-r from-[#00F0FF] to-[#00B8CC] text-white rounded-lg hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 whitespace-nowrap cursor-pointer font-medium"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    Sending...
                  </span>
                ) : (
                  'Send Message'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}