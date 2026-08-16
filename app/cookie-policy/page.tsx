'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function CookiePolicyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 bg-white text-slate-800">
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-slate-900">Cookie Policy</h1>
            <p className="text-slate-500 mb-12" suppressHydrationWarning={true}>Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">What Are Cookies</h2>
                <p className="text-slate-500 leading-relaxed">
                  Cookies are small text files stored on your device when you visit websites. They help websites function properly, improve user experience, and provide useful information to website owners.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">How We Use Cookies</h2>
                <p className="text-slate-500 leading-relaxed mb-3">
                  Digital Footprint uses cookies for the following purposes:
                </p>
                <ul className="list-disc list-inside text-slate-500 space-y-1">
                  <li><strong className="text-slate-300">Essential cookies:</strong> Required for the website to function correctly</li>
                  <li><strong className="text-slate-300">Analytics cookies:</strong> Help us understand how visitors use our website (Google Analytics)</li>
                  <li><strong className="text-slate-300">Preference cookies:</strong> Remember your settings and choices (e.g. theme preference)</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">Third-Party Cookies</h2>
                <p className="text-slate-500 leading-relaxed">
                  We use third-party services that may set cookies on your device. These include Google Analytics for website analytics. These services have their own privacy and cookie policies.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">Managing Cookies</h2>
                <p className="text-slate-500 leading-relaxed">
                  You can control and manage cookies through your browser settings. Most browsers allow you to refuse or delete cookies. Please note that disabling essential cookies may affect website functionality.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">Changes to This Policy</h2>
                <p className="text-slate-500 leading-relaxed">
                  We may update this cookie policy to reflect changes in our practices or legal requirements. Please check this page periodically for updates.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">Contact</h2>
                <p className="text-slate-500 leading-relaxed">
                  If you have questions about our cookie policy, please contact us at{' '}
                  <a href="mailto:info@digital-footprint.uk" className="text-[#06B6D4] hover:underline">info@digital-footprint.uk</a> or refer to our <Link href="/privacy" className="text-[#06B6D4] hover:underline">Privacy Policy</Link>.
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