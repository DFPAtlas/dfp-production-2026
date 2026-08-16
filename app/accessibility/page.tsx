'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AccessibilityPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#F8FAFC]">
        <section className="bg-gradient-to-b from-[#0A1628] to-[#0F1F3D] text-white py-14 md:py-18">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#06B6D4]/15 flex items-center justify-center mx-auto mb-5">
              <i className="ri-wheelchair-line w-7 h-7 text-[#06B6D4] flex items-center justify-center" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-3">Accessibility Statement</h1>
            <p className="text-slate-300 text-sm max-w-md mx-auto">
              Our commitment to making Digital Footprint products and services accessible to everyone.
            </p>
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-8">
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">Our Commitment</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Digital Footprint is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying relevant accessibility standards.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">Measures We Take</h2>
              <ul className="space-y-3">
                {[
                  'We include accessibility considerations in our design and development process.',
                  'We test our products with keyboard-only navigation and screen reader tools.',
                  'We aim for sufficient colour contrast throughout our interfaces.',
                  'We provide text alternatives for non-text content where practical.',
                  'We structure our pages with semantic HTML and proper heading hierarchies.',
                  'We ensure interactive elements are keyboard-accessible and have visible focus indicators.',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <i className="ri-check-line w-5 h-5 text-[#06B6D4] flex-shrink-0 mt-0.5 flex items-center justify-center" />
                    <p className="text-sm text-slate-600">{item}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">Conformance Status</h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                We aim to meet Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards. Our products are regularly reviewed and tested for accessibility compliance. Some areas may currently be undergoing improvement.
              </p>
              <p className="text-sm text-slate-500">
                This statement applies to the Digital Footprint public website and our product interfaces. Individual products may have separate accessibility documentation.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <i className="ri-feedback-line w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5 flex items-center justify-center" />
                <div>
                  <h3 className="text-sm font-bold text-blue-800 mb-1">Report an Accessibility Issue</h3>
                  <p className="text-xs text-blue-700 leading-relaxed mb-2">
                    We welcome feedback on the accessibility of our products. If you encounter any barriers or have suggestions for improvement, please let us know.
                  </p>
                  <Link href="/support/request" className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 underline cursor-pointer hover:text-blue-800">
                    Submit an accessibility report
                    <i className="ri-arrow-right-line w-4 h-4 flex items-center justify-center" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/support" className="px-5 py-2.5 bg-white text-slate-600 text-sm font-medium rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer whitespace-nowrap">
              Get Support
            </Link>
            <Link href="/cookie-preferences" className="px-5 py-2.5 bg-white text-slate-600 text-sm font-medium rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer whitespace-nowrap">
              Cookie Settings
            </Link>
            <Link href="/contact" className="px-5 py-2.5 bg-[#06B6D4] text-white text-sm font-semibold rounded-xl hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap">
              Contact Us
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}