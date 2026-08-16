'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GuidanceModal from './GuidanceModal';

const accountCards = [
  {
    id: 'client',
    title: 'Client Portal',
    description: 'Access your projects, files, invoices and communications.',
    whoFor: 'For Digital Footprint clients with active projects.',
    icon: 'ri-user-line',
    href: '/portal/login',
    helpLabel: 'Need access?',
    helpInfo: 'Contact your Digital Footprint account manager.',
  },
  {
    id: 'staff',
    title: 'Staff Gateway',
    description: 'Manage projects, tasks, leads and client deliverables.',
    whoFor: 'For Digital Footprint team members.',
    icon: 'ri-team-line',
    href: '/staff/login',
    helpLabel: 'Staff access only.',
    helpInfo: 'Requires an invitation from your administrator.',
  },
  {
    id: 'admin',
    title: 'Administrator',
    description: 'Full platform administration and operational controls.',
    whoFor: 'For authorised Digital Footprint administrators.',
    icon: 'ri-shield-line',
    href: '/admin/login',
    helpLabel: 'Restricted access.',
    helpInfo: 'Administrator accounts are strictly controlled.',
  },
  {
    id: 'uat',
    title: 'UAT TestLab',
    description: 'Test software, submit feedback and manage assignments.',
    whoFor: 'For approved UAT testers.',
    icon: 'ri-test-tube-line',
    href: '/uat/jobs',
    helpLabel: 'Become a tester?',
    helpInfo: 'Visit the UAT TestLab page to apply.',
  },
  {
    id: 'pbx',
    title: 'Cloud PBX',
    description: 'Manage calls, voicemail, routing and business numbers.',
    whoFor: 'For Cloud PBX customers.',
    icon: 'ri-phone-line',
    href: '/pbx/dashboard',
    helpLabel: 'PBX customer?',
    helpInfo: 'Sign in with your PBX credentials.',
  },
];

const productAccounts = [
  { name: 'GuardianHub', href: '/products/guardianhub' },
  { name: 'QuickGuard', href: '/products/quickguard' },
  { name: 'LetHub', href: '/products/lethub' },
  { name: 'Synqoro', href: '/products/synqoro' },
];

export default function LoginGatewayPage() {
  const [guidanceOpen, setGuidanceOpen] = useState(false);

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-white pt-24">
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-4">
              <Link href="/" className="inline-block mb-6">
                <img
                  src="https://storage.readdy-site.link/project_files/9c829bf4-c727-45a7-99f8-358e1780c66a/eee9f9ba-b907-488b-a1a8-f6d02534a71b_compressed_Remove-Background-Keep-Foot-Logo.webp"
                  alt="Digital Footprint Logo"
                  width={56}
                  height={56}
                  className="object-contain rounded-xl mx-auto"
                />
              </Link>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-3">
                Sign in to Digital Footprint
              </h1>
              <p className="text-lg text-slate-500 max-w-xl mx-auto">
                Choose your account type below to reach the correct sign-in area.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
              {accountCards.map((card) => (
                <div
                  key={card.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col hover:border-[#06B6D4]/30 hover:shadow-lg hover:shadow-[#06B6D4]/5 transition-all duration-200"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#06B6D4]/8 flex items-center justify-center mb-4">
                    <i className={`${card.icon} text-xl text-[#06B6D4] w-6 h-6 flex items-center justify-center`} />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-1">{card.title}</h2>
                  <p className="text-sm text-slate-500 mb-3 flex-1">{card.description}</p>
                  <p className="text-xs text-slate-400 mb-4">{card.whoFor}</p>
                  <Link
                    href={card.href}
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-[#06B6D4] hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
                  >
                    Sign in
                    <i className="ri-arrow-right-line w-4 h-4 flex items-center justify-center" />
                  </Link>
                  <p className="text-xs text-slate-400 mt-2 text-center">
                    <span className="font-medium">{card.helpLabel}</span> {card.helpInfo}
                  </p>
                </div>
              ))}

              <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col hover:border-[#06B6D4]/30 hover:shadow-lg hover:shadow-[#06B6D4]/5 transition-all duration-200">
                <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
                  <i className="ri-question-line text-xl text-amber-500 w-6 h-6 flex items-center justify-center" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 mb-1">Unsure where to sign in?</h2>
                <p className="text-sm text-slate-500 mb-3 flex-1">We will send secure sign-in guidance to your email without revealing account details.</p>
                <p className="text-xs text-slate-400 mb-4">Your account information stays private.</p>
                <button
                  onClick={() => setGuidanceOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl font-semibold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer whitespace-nowrap"
                >
                  Get sign-in help
                  <i className="ri-mail-send-line w-4 h-4 flex items-center justify-center" />
                </button>
                <p className="text-xs text-slate-400 mt-2 text-center">We will email guidance if an account is found.</p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-12 mb-12">
              <h2 className="text-xl font-semibold text-slate-900 mb-2 text-center">Digital Footprint Products</h2>
              <p className="text-sm text-slate-500 mb-6 text-center">
                Some DFP products use separate authentication. Visit the product page for specific sign-in details.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {productAccounts.map((product) => (
                  <Link
                    key={product.name}
                    href={product.href}
                    className="px-4 py-2 rounded-full border border-slate-200 text-sm text-slate-600 hover:border-[#06B6D4] hover:text-[#06B6D4] transition-all cursor-pointer whitespace-nowrap"
                  >
                    {product.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <Link
                href="/account/help"
                className="p-4 rounded-xl border border-slate-200 hover:border-[#06B6D4]/30 transition-all cursor-pointer"
              >
                <i className="ri-information-line text-xl text-slate-400 w-6 h-6 flex items-center justify-center mx-auto mb-2" />
                <span className="text-sm font-medium text-slate-700">Account Help</span>
                <p className="text-xs text-slate-400 mt-1">Password recovery, invitations, FAQs</p>
              </Link>

              <Link
                href="/contact"
                className="p-4 rounded-xl border border-slate-200 hover:border-[#06B6D4]/30 transition-all cursor-pointer"
              >
                <i className="ri-customer-service-line text-xl text-slate-400 w-6 h-6 flex items-center justify-center mx-auto mb-2" />
                <span className="text-sm font-medium text-slate-700">Contact Support</span>
                <p className="text-xs text-slate-400 mt-1">Get help from our team</p>
              </Link>

              <div className="p-4 rounded-xl border border-slate-200">
                <i className="ri-shield-check-line text-xl text-slate-400 w-6 h-6 flex items-center justify-center mx-auto mb-2" />
                <span className="text-sm font-medium text-slate-700">Secure Sign-In</span>
                <p className="text-xs text-slate-400 mt-1">Your credentials are protected with industry-standard encryption.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      <GuidanceModal open={guidanceOpen} onClose={() => setGuidanceOpen(false)} />
    </>
  );
}