'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 bg-white text-slate-800">
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-slate-900">Privacy Policy</h1>
            <p className="text-slate-500 mb-12" suppressHydrationWarning={true}>Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">1. Introduction</h2>
                <p className="text-slate-500 leading-relaxed">
                  Digital Footprint respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, store and protect your information when you use our website or services.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">2. Information We Collect</h2>
                <p className="text-slate-500 leading-relaxed mb-3">
                  We may collect the following types of information:
                </p>
                <ul className="list-disc list-inside text-slate-500 space-y-1">
                  <li>Contact details (name, email, phone number) when you submit enquiries</li>
                  <li>Company information for business services</li>
                  <li>Website usage data via cookies and analytics</li>
                  <li>Communication history and project details</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">3. How We Use Your Information</h2>
                <p className="text-slate-500 leading-relaxed mb-3">
                  We use your information to:
                </p>
                <ul className="list-disc list-inside text-slate-500 space-y-1">
                  <li>Provide and manage our services</li>
                  <li>Respond to enquiries and support requests</li>
                  <li>Improve our website and services</li>
                  <li>Send relevant updates (with your consent)</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">4. Data Security</h2>
                <p className="text-slate-500 leading-relaxed">
                  We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, alteration, disclosure or destruction.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">5. Your Rights</h2>
                <p className="text-slate-500 leading-relaxed mb-3">
                  Under UK data protection law, you have the right to:
                </p>
                <ul className="list-disc list-inside text-slate-500 space-y-1">
                  <li>Access your personal data</li>
                  <li>Request correction or deletion</li>
                  <li>Object to processing</li>
                  <li>Request data portability</li>
                  <li>Withdraw consent at any time</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">6. Cookies</h2>
                <p className="text-slate-500 leading-relaxed">
                  We use cookies to improve your browsing experience and analyse website traffic. You can manage cookie preferences through your browser settings. For more details, see our <Link href="/cookie-policy" className="text-[#06B6D4] hover:underline">Cookie Policy</Link>.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">7. Contact Us</h2>
                <p className="text-slate-500 leading-relaxed">
                  If you have questions about this privacy policy or your data, please contact us at{' '}
                  <a href="mailto:info@digital-footprint.uk" className="text-[#06B6D4] hover:underline">info@digital-footprint.uk</a>.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}