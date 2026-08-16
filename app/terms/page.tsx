'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 bg-white text-slate-800">
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-slate-900">Terms of Service</h1>
            <p className="text-slate-500 mb-12" suppressHydrationWarning={true}>Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">1. Agreement to Terms</h2>
                <p className="text-slate-500 leading-relaxed">
                  By accessing or using Digital Footprint services, you agree to be bound by these terms. If you do not agree, please do not use our services.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">2. Services</h2>
                <p className="text-slate-500 leading-relaxed">
                  Digital Footprint provides technology solutions including website development, AI services, business automation, cloud systems, cyber security and IT support. Specific terms for each project will be outlined in individual agreements.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">3. Intellectual Property</h2>
                <p className="text-slate-500 leading-relaxed">
                  Unless otherwise agreed in writing, Digital Footprint retains ownership of all intellectual property created during the provision of services until full payment has been received. Upon full payment, ownership transfers to the client as specified in the project agreement.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">4. Payment Terms</h2>
                <p className="text-slate-500 leading-relaxed">
                  Payment terms are specified in individual project agreements. Generally, a deposit is required before work commences, with the balance due upon project completion or according to agreed milestone payments.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">5. Limitation of Liability</h2>
                <p className="text-slate-500 leading-relaxed">
                  Digital Footprint liability is limited to the amount paid for the specific services giving rise to the claim. We are not liable for indirect, consequential or incidental damages.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">6. Confidentiality</h2>
                <p className="text-slate-500 leading-relaxed">
                  Both parties agree to maintain confidentiality of proprietary information shared during the course of business. This obligation continues after the working relationship ends.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">7. Termination</h2>
                <p className="text-slate-500 leading-relaxed">
                  Either party may terminate services with written notice. Fees for work completed up to the termination date remain payable.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">8. Governing Law</h2>
                <p className="text-slate-500 leading-relaxed">
                  These terms are governed by the laws of England and Wales. Any disputes will be subject to the exclusive jurisdiction of the courts of England and Wales.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">9. Changes to Terms</h2>
                <p className="text-slate-500 leading-relaxed">
                  We may update these terms from time to time. Continued use of our services after changes constitutes acceptance of the updated terms.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">10. Contact</h2>
                <p className="text-slate-500 leading-relaxed">
                  For questions about these terms, contact us at{' '}
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