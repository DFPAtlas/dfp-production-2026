'use client';

import Link from 'next/link';
import { useState } from 'react';

const partnerTypes = [
  {
    key: 'referral',
    title: 'Referral Partner',
    icon: 'ri-user-shared-line',
    description: 'Refer potential customers to Digital Footprint. If you know a business that could benefit from our services, we welcome your introduction.',
    who: 'For consultants, agencies, existing clients, and professionals with a trusted network.',
    href: '/partners/referrals',
    action: 'Learn about referrals',
  },
  {
    key: 'supplier',
    title: 'Supplier',
    icon: 'ri-truck-line',
    description: 'Supply approved products or services that support Digital Footprint operations and client delivery.',
    who: 'For businesses providing cloud infrastructure, software, security, design, consulting or managed services.',
    href: '/partners/suppliers',
    action: 'Register supplier interest',
  },
  {
    key: 'technology',
    title: 'Technology Partner',
    icon: 'ri-code-s-slash-line',
    description: 'Integrate your platform or technology with Digital Footprint products and services to create better outcomes for shared clients.',
    who: 'For SaaS platforms, API providers, and technology companies with complementary offerings.',
    href: '/partners/technology',
    action: 'Explore technology partnership',
  },
  {
    key: 'implementation',
    title: 'Implementation & Delivery Partner',
    icon: 'ri-team-line',
    description: 'Deliver Digital Footprint solutions to clients with approved skills, quality standards and confidentiality.',
    who: 'For agencies, consultancies, system integrators and experienced delivery teams.',
    href: '/partners/apply?type=delivery_collaboration',
    action: 'Apply as delivery partner',
  },
  {
    key: 'strategic',
    title: 'Strategic Partner',
    icon: 'ri-building-2-line',
    description: 'Explore a longer-term strategic collaboration that aligns with Digital Footprint\'s venture studio model and product roadmap.',
    who: 'For established organisations seeking deep commercial or technology alignment.',
    href: '/partners/apply?type=strategic_partnership',
    action: 'Discuss strategic partnership',
  },
  {
    key: 'community',
    title: 'Education & Community Partner',
    icon: 'ri-graduation-cap-line',
    description: 'Partner with Digital Footprint on education, community, or industry initiatives that support the broader ecosystem.',
    who: 'For universities, industry bodies, training providers and community organisations.',
    href: '/partners/apply?type=partner_enquiry',
    action: 'Start a conversation',
  },
];

const processSteps = [
  { step: '01', title: 'Submit Interest', description: 'Tell us about your organisation and the type of partnership you have in mind.' },
  { step: '02', title: 'Internal Screening', description: 'Our team reviews your application against current needs and strategic fit.' },
  { step: '03', title: 'Introduction Call', description: 'If there is a mutual fit, we arrange a call to explore the opportunity further.' },
  { step: '04', title: 'Due Diligence', description: 'For approved partnerships, we complete any necessary verification and checks.' },
  { step: '05', title: 'Agreement & Onboarding', description: 'Formalise the relationship and get set up with any required access or tools.' },
  { step: '06', title: 'Approved Partnership', description: 'Begin working together within the agreed scope.' },
];

const faqs = [
  { q: 'Is there a referral commission or reward programme?', a: 'Digital Footprint reviews each referral individually. No commission, payment, or reward programme is currently active. Submitting a referral does not create any payment obligation.' },
  { q: 'How long does the partnership application process take?', a: 'Screening typically takes 5-10 working days. Due diligence timelines vary depending on the partnership type and scope.' },
  { q: 'Can I apply as an individual freelancer or contractor?', a: 'Individual freelancers and contractors should apply through our Freelancer Network. The Partner Programme is designed for organisational relationships.' },
  { q: 'Will my application be automatically approved?', a: 'No. Every application goes through screening, and approval requires meeting our criteria for the specific partnership type. Submitting an application does not guarantee acceptance.' },
  { q: 'What happens after I submit my application?', a: 'You will receive an acknowledgement. Our team reviews applications regularly. If there is a potential fit, we will contact you to discuss next steps.' },
  { q: 'Do you list partners publicly?', a: 'We do not maintain a public partner directory by default. Any public listing requires explicit written permission from both parties.' },
];

export default function PartnersPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <main className="min-h-screen bg-white">
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest text-[#06B6D4] uppercase mb-3">Ecosystem</p>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-5">
            Partner, Supplier &amp; Referral Network
          </h1>
          <p className="text-lg text-slate-500 max-w-3xl mx-auto leading-relaxed">
            Digital Footprint works with a trusted network of partners, suppliers and referrers who share our commitment to quality, security and client outcomes. Whether you want to refer business, supply services, integrate technology or explore a strategic collaboration — start here.
          </p>
        </div>
      </section>

      <section className="pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {partnerTypes.map((pt) => (
              <div key={pt.key} className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-6 flex flex-col hover:border-[#06B6D4]/30 hover:shadow-lg hover:shadow-[#06B6D4]/5 transition-all duration-300">
                <div className="w-11 h-11 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center mb-4">
                  <i className={`${pt.icon} text-[#06B6D4] w-5 h-5 flex items-center justify-center`} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{pt.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-3 flex-1">{pt.description}</p>
                <div className="bg-white rounded-xl border border-slate-100 p-3 mb-4">
                  <p className="text-xs font-medium text-slate-600 mb-1">Who it is for</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{pt.who}</p>
                </div>
                <Link
                  href={pt.href}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#06B6D4] text-white text-sm font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap"
                >
                  {pt.action}
                  <i className="ri-arrow-right-line w-4 h-4 flex items-center justify-center" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-[#F8FAFC] border-y border-slate-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-3 text-center">How the Process Works</h2>
          <p className="text-slate-500 text-center mb-12 max-w-2xl mx-auto">
            Every partnership goes through the same careful review. We do not promise acceptance, but we do promise a fair and thorough process.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {processSteps.map((ps, idx) => (
              <div key={ps.step} className="relative">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#06B6D4]/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-[#06B6D4]">{ps.step}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">{ps.title}</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">{ps.description}</p>
                  </div>
                </div>
                {idx < processSteps.length - 1 && (
                  <div className="hidden md:block absolute left-5 top-12 h-full w-px bg-slate-200" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-3 text-center">Eligibility &amp; Expectations</h2>
          <p className="text-slate-500 text-center mb-10">
            We look for partners who share our standards and can deliver real value to our clients.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Quality Commitment', desc: 'All partners must demonstrate a commitment to high-quality delivery and client satisfaction.' },
              { title: 'Security & Confidentiality', desc: 'Partners must respect client confidentiality and follow our security standards.' },
              { title: 'Verified Capability', desc: 'We verify relevant experience, certifications and references before approval.' },
              { title: 'No Automatic Access', desc: 'Partnership does not automatically grant access to client projects or systems.' },
              { title: 'Clear Communication', desc: 'Transparent, professional communication is expected at every stage.' },
              { title: 'Documentation & UAT', desc: 'Delivery partners must follow our documentation, testing and handover processes.' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 bg-[#F8FAFC] rounded-xl p-4 border border-slate-100">
                <i className="ri-check-line text-[#10B981] w-5 h-5 flex items-center justify-center mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm mb-1">{item.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-[#F8FAFC] border-y border-slate-200">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-slate-900 text-sm pr-4">{faq.q}</span>
                  <i className={`w-5 h-5 flex items-center justify-center shrink-0 transition-transform duration-200 ${expandedFaq === idx ? 'rotate-180 text-[#06B6D4]' : 'text-slate-400'}`}>
                    ri-arrow-down-s-line
                  </i>
                </button>
                {expandedFaq === idx && (
                  <div className="px-5 pb-4 pt-0">
                    <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to Start a Conversation?</h2>
          <p className="text-slate-500 mb-8 max-w-xl mx-auto">
            Choose the partnership type that best matches your organisation. Our team will review your application and get back to you.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/partners/apply"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#06B6D4] text-white font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
            >
              Submit an Application
              <i className="ri-arrow-right-line w-4 h-4 flex items-center justify-center" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-all cursor-pointer whitespace-nowrap"
            >
              Contact Us
            </Link>
          </div>
          <p className="text-xs text-slate-400 mt-6">
            Individual freelancers and contractors should apply through the Freelancer Network instead.
          </p>
        </div>
      </section>
    </main>
  );
}