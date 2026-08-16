'use client';

import { motion } from '@/components/motion';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const sections = [
  {
    id: 'independent-businesses',
    eyebrow: 'Our primary client base',
    heading: 'Independent UK businesses',
    introduction: 'For capable businesses that have outgrown a basic website or a collection of disconnected tools.',
    examples: 'Trades, dealerships, property companies, security providers, wedding suppliers and professional services.',
    outcomes: [
      'A stronger digital presence',
      'More qualified enquiries',
      'Less repeated administration',
      'A system that can grow with the team',
    ],
    icon: 'ri-store-2-line',
    color: '#06B6D4',
    needValue: 'website',
    needLabel: 'Independent business',
  },
  {
    id: 'founders',
    eyebrow: 'From idea to launch',
    heading: 'Founders and start-ups',
    introduction: 'For people with a valuable business idea who need a practical technical team to shape, build and launch it.',
    examples: 'New digital services, marketplaces, SaaS products, member platforms and technology-enabled businesses.',
    outcomes: [
      'Clear proposition and journeys',
      'Credible brand and website',
      'Testable MVP',
      'A realistic launch roadmap',
    ],
    icon: 'ri-rocket-line',
    color: '#A855F7',
    needValue: 'saas',
    needLabel: 'Founder / start-up',
  },
  {
    id: 'growing-companies',
    eyebrow: 'Connected operations',
    heading: 'Growing companies',
    introduction: 'For businesses losing time to spreadsheets, repeated data entry, email chains and software that does not talk to each other.',
    examples: 'Multi-team service companies, expanding operators and businesses managing higher volumes of customers or work.',
    outcomes: [
      'Connected customer data',
      'Staff and client portals',
      'Automated workflows',
      'Clear management reporting',
    ],
    icon: 'ri-line-chart-line',
    color: '#F97316',
    needValue: 'automation',
    needLabel: 'Growing company',
  },
  {
    id: 'agency-partners',
    eyebrow: 'White-label delivery',
    heading: 'Agencies and consultants',
    introduction: 'For partners who want to offer broader digital services without building a permanent technical department.',
    examples: 'Marketing agencies, designers, consultants, IT providers and independent sales partners.',
    outcomes: [
      'Reliable delivery capacity',
      'Clear project communication',
      'White-label build options',
      'Long-term technical support',
    ],
    icon: 'ri-briefcase-4-line',
    color: '#10B981',
    needValue: 'discovery',
    needLabel: 'Agency / consultant',
  },
];

export default function WhoWeHelpPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-white text-slate-800">

        <section className="relative pt-32 pb-16 px-6 overflow-hidden bg-[#0A1628]">
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(circle at 50% 0%, rgba(6,182,212,0.06) 0%, transparent 60%)',
          }} />
          <div className="absolute inset-0 opacity-[0.01]" style={{
            backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.5) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }} />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-px bg-gradient-to-r from-transparent via-[#06B6D4]/15 to-transparent" />

          <div className="relative z-10 max-w-6xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <p className="text-[#06B6D4] text-xs sm:text-sm uppercase tracking-[0.14em] font-semibold mb-6">
                Who we help
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-4">
                Digital systems shaped around real business needs.
              </h1>
              <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                You do not need to arrive with a technical specification. Start with your goals, problems and current way of working.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto space-y-12">
            {sections.map((section, i) => (
              <motion.div
                key={section.id}
                id={section.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-8 md:p-10"
              >
                <div className="flex items-start gap-5 mb-6 flex-wrap">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${section.color}12` }}
                  >
                    <i className={`${section.icon} text-2xl w-7 h-7 flex items-center justify-center`} style={{ color: section.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: section.color }}>
                      {section.eyebrow}
                    </p>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">{section.heading}</h2>
                    <p className="text-slate-500 leading-relaxed mb-3">{section.introduction}</p>
                    <p className="text-sm text-slate-400 italic">{section.examples}</p>
                  </div>
                </div>

                <div className="ml-0 md:ml-[76px]">
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Success outcomes</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    {section.outcomes.map((outcome) => (
                      <div key={outcome} className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: section.color }} />
                        <span className="text-sm text-slate-600">{outcome}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href={`/contact?need=${section.needValue}&need_label=${encodeURIComponent(section.needLabel)}`}
                    className="group relative inline-flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm text-white overflow-hidden whitespace-nowrap cursor-pointer transition-all duration-300 bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] hover:-translate-y-0.5 shadow-lg shadow-[#F97316]/15 hover:shadow-xl hover:shadow-[#F97316]/25 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2"
                  >
                    Start a conversation
                    <i className="ri-arrow-right-line w-4 h-4 flex items-center justify-center relative z-10 group-hover:translate-x-0.5 transition-transform duration-200" />
                    <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

      </div>
      <Footer />
    </>
  );
}