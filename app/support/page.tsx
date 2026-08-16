'use client';

import Link from 'next/link';
import { useState } from 'react';

interface RouteOption {
  icon: string;
  title: string;
  description: string;
  href: string;
  isExternal?: boolean;
}

export default function SupportPage() {
  const [step, setStep] = useState(0);

  const questions = [
    {
      question: 'Are you an existing Digital Footprint client?',
      options: [
        { label: 'Yes, I am a current client', next: 1 },
        { label: 'No, I am not a client yet', next: 4 },
      ],
    },
    {
      question: 'Can you sign in to your Client Portal?',
      options: [
        { label: 'Yes, I can sign in', next: 2 },
        { label: 'No, I am having trouble signing in', next: 3 },
      ],
    },
    {
      question: 'What do you need help with?',
      options: [
        { label: 'Project or delivery question', icon: 'ri-git-branch-line' },
        { label: 'Files or approvals', icon: 'ri-file-text-line' },
        { label: 'Billing or invoice question', icon: 'ri-bill-line' },
        { label: 'Something else', icon: 'ri-question-line' },
      ],
      isFinal: true,
    },
    {
      question: 'What issue are you experiencing?',
      options: [
        { label: 'Forgot or cannot access email', icon: 'ri-mail-close-line' },
        { label: 'Magic link not arriving', icon: 'ri-link-m' },
        { label: 'Account seems locked', icon: 'ri-lock-line' },
        { label: 'Other sign-in problem', icon: 'ri-question-line' },
      ],
      isFinal: true,
    },
    {
      question: 'What brings you to Digital Footprint?',
      options: [
        { label: 'Interested in our services', icon: 'ri-briefcase-line' },
        { label: 'Question about a product', icon: 'ri-stack-line' },
        { label: 'Partnership or supplier enquiry', icon: 'ri-team-line' },
        { label: 'General question', icon: 'ri-chat-3-line' },
      ],
      isFinal: true,
    },
  ];

  const current = questions[step];
  const isFinal = (current as { isFinal?: boolean }).isFinal;

  const routeMap: Record<string, RouteOption> = {
    'Project or delivery question': {
      icon: 'ri-git-branch-line',
      title: 'Use Your Client Portal',
      description: 'Sign in to your Client Portal to message your project team directly. They can help with delivery questions, changes and updates.',
      href: '/portal/login',
    },
    'Files or approvals': {
      icon: 'ri-file-text-line',
      title: 'Check Your Portal Files',
      description: 'Your files and approvals are managed through your Client Portal. Sign in to view, upload and approve files.',
      href: '/portal/login',
    },
    'Billing or invoice question': {
      icon: 'ri-bill-line',
      title: 'Contact Your Project Lead',
      description: 'For billing questions, your project lead can help directly. You can also browse our billing help articles for common questions.',
      href: '/help/billing-and-invoices',
    },
    'Something else': {
      icon: 'ri-customer-service-line',
      title: 'Submit a Support Request',
      description: 'Tell us what you need and we will get back to you. Your message will go to the right team.',
      href: '/support/request',
    },
    'Forgot or cannot access email': {
      icon: 'ri-mail-close-line',
      title: 'Contact Support Directly',
      description: 'If you no longer have access to your registered email, our support team can help verify your identity and update your account.',
      href: '/support/request',
    },
    'Magic link not arriving': {
      icon: 'ri-link-m',
      title: 'Check Spam and Try Again',
      description: 'Magic links sometimes land in spam or junk folders. Try requesting a new link. If it still does not arrive, submit a request.',
      href: '/help/accounts-and-sign-in',
    },
    'Account seems locked': {
      icon: 'ri-lock-line',
      title: 'Account Access Help',
      description: 'Read our account troubleshooting guide first. If your account is still inaccessible, submit a support request.',
      href: '/support/request',
    },
    'Other sign-in problem': {
      icon: 'ri-question-line',
      title: 'Sign-In Help',
      description: 'Browse our accounts help articles or submit a support request if your issue is not covered.',
      href: '/help/accounts-and-sign-in',
    },
    'Interested in our services': {
      icon: 'ri-briefcase-line',
      title: 'Discuss a Project',
      description: 'Tell us about your project and we will arrange a discovery call to explore how we can help.',
      href: '/contact',
    },
    'Question about a product': {
      icon: 'ri-stack-line',
      title: 'Browse Product Help',
      description: 'Find help articles for your product, request a demo or contact our product team.',
      href: '/products',
    },
    'Partnership or supplier enquiry': {
      icon: 'ri-team-line',
      title: 'Get in Touch',
      description: 'We are always open to conversations with potential partners and suppliers. Send us a message.',
      href: '/contact',
    },
    'General question': {
      icon: 'ri-chat-3-line',
      title: 'Browse the Help Centre',
      description: 'Search our help articles for answers to common questions about Digital Footprint.',
      href: '/help',
    },
  };

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const route = selectedOption ? routeMap[selectedOption] : null;

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      {/* Hero */}
      <section className="bg-gradient-to-b from-[#0A1628] to-[#0F1F3D] text-white py-14 md:py-18">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#06B6D4]/15 flex items-center justify-center mx-auto mb-5">
            <i className="ri-customer-service-line w-7 h-7 text-[#06B6D4] flex items-center justify-center" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-3">How Can We Help?</h1>
          <p className="text-slate-300 text-sm max-w-md mx-auto">
            Answer a few quick questions and we will point you in the right direction.
          </p>
        </div>
      </section>

      {/* Guided selector */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        {route ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#06B6D4]/10 flex items-center justify-center mx-auto mb-5">
              <i className={`${route.icon} w-7 h-7 text-[#06B6D4] flex items-center justify-center`} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">{route.title}</h2>
            <p className="text-slate-500 mb-6">{route.description}</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link
                href={route.href}
                className="px-6 py-2.5 bg-[#06B6D4] text-white text-sm font-semibold rounded-xl hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap"
              >
                Continue
              </Link>
              <button
                onClick={() => { setSelectedOption(null); setStep(0); }}
                className="px-6 py-2.5 bg-white text-slate-600 text-sm font-medium rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer whitespace-nowrap"
              >
                Start Over
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
            {/* Progress */}
            <div className="flex items-center gap-1.5 mb-8">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full flex-1 transition-colors ${
                    i < step ? 'bg-[#06B6D4]' : i === step ? 'bg-[#06B6D4]/40' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>

            <h2 className="text-lg font-bold text-slate-800 mb-6">{current.question}</h2>

            <div className="space-y-3">
              {current.options.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => {
                    if (isFinal) {
                      setSelectedOption(opt.label);
                    } else if ((opt as { next?: number }).next !== undefined) {
                      setStep((opt as { next: number }).next!);
                    }
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-[#06B6D4]/30 hover:bg-[#06B6D4]/[0.02] transition-all cursor-pointer text-left group"
                >
                  {(opt as { icon?: string }).icon && (
                    <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/8 flex items-center justify-center flex-shrink-0">
                      <i className={`${(opt as { icon: string }).icon} w-5 h-5 text-[#06B6D4] flex items-center justify-center`} />
                    </div>
                  )}
                  <span className="text-sm font-medium text-slate-700 group-hover:text-[#06B6D4] transition-colors">
                    {opt.label}
                  </span>
                  <i className="ri-arrow-right-s-line w-5 h-5 text-slate-300 group-hover:text-[#06B6D4] ml-auto flex items-center justify-center" />
                </button>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              {step > 0 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <i className="ri-arrow-left-line w-4 h-4 flex items-center justify-center" />
                  Back
                </button>
              )}
              <div className="ml-auto">
                <button
                  onClick={() => setStep(0)}
                  className="text-sm text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Start Over
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/support/request" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-[#06B6D4]/30 hover:shadow-sm transition-all cursor-pointer group">
            <i className="ri-mail-send-line w-5 h-5 text-[#06B6D4] flex items-center justify-center flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-700 group-hover:text-[#06B6D4] transition-colors">Submit a Request</p>
              <p className="text-xs text-slate-400">Send us a message directly</p>
            </div>
          </Link>
          <Link href="/help" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-[#06B6D4]/30 hover:shadow-sm transition-all cursor-pointer group">
            <i className="ri-book-open-line w-5 h-5 text-[#06B6D4] flex items-center justify-center flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-700 group-hover:text-[#06B6D4] transition-colors">Browse Help Articles</p>
              <p className="text-xs text-slate-400">Search for answers</p>
            </div>
          </Link>
          <Link href="/support/status" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-[#06B6D4]/30 hover:shadow-sm transition-all cursor-pointer group">
            <i className="ri-signal-wifi-line w-5 h-5 text-[#06B6D4] flex items-center justify-center flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-700 group-hover:text-[#06B6D4] transition-colors">Service Status</p>
              <p className="text-xs text-slate-400">Check system availability</p>
            </div>
          </Link>
        </div>

        {/* Security reporting */}
        <div className="mt-6 p-5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <i className="ri-shield-line w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5 flex items-center justify-center" />
          <div>
            <p className="text-sm font-medium text-amber-800 mb-1">Reporting a Security or Privacy Concern?</p>
            <p className="text-xs text-amber-700">
              Please email{' '}
              <a href="mailto:security@digital-footprint.uk" className="font-medium underline cursor-pointer">
                security@digital-footprint.uk
              </a>{' '}
              with a clear description. Do not include passwords or exploit code. We respond within two business days.
              <Link href="/help/article/how-to-report-a-security-concern" className="block mt-1 font-medium underline cursor-pointer">
                Read our security reporting guide
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}