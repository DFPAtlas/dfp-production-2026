'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function SecurityPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#F8FAFC]">
        <section className="bg-gradient-to-b from-[#0A1628] to-[#0F1F3D] text-white py-14 md:py-18">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#06B6D4]/15 flex items-center justify-center mx-auto mb-5">
              <i className="ri-shield-check-line w-7 h-7 text-[#06B6D4] flex items-center justify-center" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-3">Security at Digital Footprint</h1>
            <p className="text-slate-300 text-sm max-w-md mx-auto">
              How we protect our systems, products and your data.
            </p>
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-8">
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">Our Approach</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Digital Footprint designs, builds and operates digital products and business systems with security built in from the start. We follow secure development practices, apply least-privilege access controls, encrypt data in transit and at rest, and maintain separation between client environments.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">Key Principles</h2>
              <ul className="space-y-3">
                {[
                  { title: 'Secure by Design', desc: 'Security considerations are part of our architecture and design process, not an afterthought.' },
                  { title: 'Least Privilege', desc: 'Access to systems and data is limited to what is necessary for each role and task.' },
                  { title: 'Defence in Depth', desc: 'Multiple layers of security controls protect against different types of threats.' },
                  { title: 'Continuous Improvement', desc: 'We regularly review and update our security posture as threats evolve and our systems change.' },
                  { title: 'Transparency', desc: 'We communicate clearly about our security practices and how we handle security concerns.' },
                ].map(item => (
                  <li key={item.title} className="flex items-start gap-3">
                    <i className="ri-check-line w-5 h-5 text-[#06B6D4] flex-shrink-0 mt-0.5 flex items-center justify-center" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">Infrastructure Security</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Our infrastructure runs on established cloud providers with industry-standard physical and network security controls. We use encryption for data in transit, enforce secure authentication, and maintain separation between environments.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <i className="ri-alert-line w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5 flex items-center justify-center" />
                <div>
                  <h3 className="text-sm font-bold text-amber-800 mb-1">Report a Security Concern</h3>
                  <p className="text-xs text-amber-700 leading-relaxed mb-3">
                    If you discover a potential security vulnerability in any Digital Footprint product or system, please report it to us privately.
                  </p>
                  <p className="text-xs text-amber-700 mb-1">
                    Email: <a href="mailto:security@digital-footprint.uk" className="font-medium underline cursor-pointer">security@digital-footprint.uk</a>
                  </p>
                  <p className="text-xs text-amber-600">
                    Please do not include passwords or exploit code in your initial report. We aim to acknowledge reports within two business days.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/support/status" className="px-5 py-2.5 bg-white text-slate-600 text-sm font-medium rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer whitespace-nowrap">
              Service Status
            </Link>
            <Link href="/privacy" className="px-5 py-2.5 bg-white text-slate-600 text-sm font-medium rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer whitespace-nowrap">
              Privacy Policy
            </Link>
            <Link href="/support" className="px-5 py-2.5 bg-[#06B6D4] text-white text-sm font-semibold rounded-xl hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap">
              Get Support
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}