'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const faqs = [
  {
    q: 'Which sign-in should I use?',
    a: 'Clients use the Client Portal. Digital Footprint team members use Staff Gateway. Administrators use the Admin Portal. UAT testers use the UAT TestLab. PBX customers use Cloud PBX. If you are unsure, use the "Unsure where to sign in?" option on the sign-in page.',
  },
  {
    q: 'I did not receive my invitation email.',
    a: 'Check your spam or junk folder. If you still cannot find it, contact your Digital Footprint account manager or the person who invited you. Do not share invitation links with others.',
  },
  {
    q: 'My invitation link has expired.',
    a: 'Invitation links have a limited validity period for security. Contact the person who sent the invitation to request a new one. Your account administrator can reissue the invitation.',
  },
  {
    q: 'I forgot my password.',
    a: 'Use the "Forgot Password?" link on your specific sign-in page (Admin or Staff). For the Client Portal, request a new magic link. We will never ask for your password via email.',
  },
  {
    q: 'My email address has changed.',
    a: 'Contact your Digital Footprint administrator or account manager. For security reasons, email changes must be verified through an established support process.',
  },
  {
    q: 'My account is locked or showing as inactive.',
    a: 'Accounts may be temporarily locked after multiple failed sign-in attempts or deactivated by an administrator. Contact support or your account manager to resolve this.',
  },
  {
    q: 'What is the difference between a product account and a DFP portal account?',
    a: 'Digital Footprint products like GuardianHub or Synqoro may have their own separate authentication. A DFP portal account (Client, Staff, Admin) is for accessing DFP services, projects, and the workspace. Visit the product page for product-specific sign-in details.',
  },
  {
    q: 'Can I use the same account for everything?',
    a: 'Your sign-in credentials are managed through a single identity, but access to different areas depends on your authorised roles. You may have access to more than one area, in which case you will see an account chooser after signing in.',
  },
  {
    q: 'How do I get access to the Client Portal?',
    a: 'Client Portal access is arranged through your Digital Footprint account manager when you begin a project with us. You will receive an invitation to set up your access.',
  },
  {
    q: 'How do I become a UAT tester?',
    a: 'Visit the UAT TestLab page to learn about the programme and submit an application. Approved testers receive access credentials.',
  },
];

export default function AccountHelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-white pt-24">
        <section className="py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer mb-6">
                <i className="ri-arrow-left-line w-4 h-4 flex items-center justify-center" />
                Back to sign-in
              </Link>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-3">
                Account Help
              </h1>
              <p className="text-lg text-slate-500 max-w-xl mx-auto">
                Find answers to common sign-in and account questions.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="border border-slate-200 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                    aria-expanded={openIndex === i}
                  >
                    <span className="text-sm font-medium text-slate-900 pr-4">{faq.q}</span>
                    {openIndex === i ? (
                      <i className="ri-arrow-up-s-line text-slate-400 w-5 h-5 flex items-center justify-center shrink-0" />
                    ) : (
                      <i className="ri-arrow-down-s-line text-slate-400 w-5 h-5 flex items-center justify-center shrink-0" />
                    )}
                  </button>
                  {openIndex === i && (
                    <div className="px-5 pb-4">
                      <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-12 p-6 rounded-2xl border border-slate-200 bg-slate-50 text-center">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Still need help?</h2>
              <p className="text-sm text-slate-500 mb-4">
                If you cannot find the answer above, our support team can help.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl font-semibold text-sm text-white bg-[#06B6D4] hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
              >
                <i className="ri-customer-service-line w-4 h-4 flex items-center justify-center" />
                Contact Support
              </Link>
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/login"
                className="text-sm text-[#06B6D4] hover:text-[#0891B2] transition-colors cursor-pointer"
              >
                Back to sign-in page
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}