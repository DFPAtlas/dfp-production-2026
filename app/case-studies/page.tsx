'use client';

import { motion } from '@/components/motion';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const caseStudies = [
  { title: 'Construction Management Platform', industry: 'Construction', desc: 'Replacing spreadsheets and disconnected tools with a single project management and workforce scheduling system — one connected place for planning, scheduling and on-site coordination.', tags: ['Custom Software', 'Cloud', 'Automation'], image: 'https://readdy.ai/api/search-image?query=Dark%20themed%20modern%20construction%20project%20management%20software%20platform%20with%20scheduling%20dashboards%20and%20workforce%20planning%20tools%2C%20clean%20professional%20UI%20design%20on%20dark%20background%2C%20construction%20technology%20concept&width=600&height=380&seq=cs-list-constr-light&orientation=landscape' },
  { title: 'Security Operations System', industry: 'Security Industry', desc: 'Bringing rostering, patrol tracking, invoicing and compliance into one connected operations platform instead of relying on paper-based processes.', tags: ['GuardianHub', 'Mobile App', 'Cloud'], image: 'https://readdy.ai/api/search-image?query=Dark%20themed%20security%20company%20digital%20operations%20dashboard%20with%20patrol%20maps%20officer%20scheduling%20and%20compliance%20tracking%2C%20modern%20security%20management%20platform%20on%20dark%20background&width=600&height=380&seq=cs-list-sec-light&orientation=landscape' },
  { title: 'Lettings & Property Platform', industry: 'Property & Lettings', desc: 'Connecting landlords, agents and tenants through automated workflows, smart matching and digital document management in one place.', tags: ['LetHub', 'AI', 'Automation'], image: 'https://readdy.ai/api/search-image?query=Dark%20themed%20modern%20property%20management%20platform%20with%20AI%20matching%20technology%20showing%20property%20listings%20and%20tenant%20dashboards%2C%20professional%20real%20estate%20tech%20design%20on%20dark%20background&width=600&height=380&seq=cs-list-prop-light&orientation=landscape' },
  { title: 'Retail E-Commerce Platform', industry: 'Retail', desc: 'Unifying a multi-store retail operation on one e-commerce platform with real-time inventory, CRM and automated marketing campaigns.', tags: ['E-Commerce', 'CRM', 'Integration'], image: 'https://readdy.ai/api/search-image?query=Dark%20themed%20modern%20e-commerce%20retail%20platform%20dashboard%20with%20inventory%20management%20and%20sales%20analytics%2C%20clean%20professional%20retail%20technology%20design%20on%20dark%20background&width=600&height=380&seq=cs-list-retail-light&orientation=landscape' },
  { title: 'Practice Management System', industry: 'Healthcare', desc: 'A practice management platform with scheduling, secure messaging, digital records and automated appointment reminders.', tags: ['Web App', 'Security', 'Automation'], image: 'https://readdy.ai/api/search-image?query=Dark%20themed%20modern%20healthcare%20practice%20management%20platform%20with%20patient%20scheduling%20and%20digital%20records%20interface%2C%20clean%20professional%20medical%20technology%20design%20on%20dark%20background&width=600&height=380&seq=cs-list-health-light&orientation=landscape' },
  { title: 'Hospitality Booking Platform', industry: 'Hospitality', desc: 'A unified booking and operations platform for multi-venue hospitality groups, integrating reservations, events and customer data.', tags: ['Booking System', 'CRM', 'Cloud'], image: 'https://readdy.ai/api/search-image?query=Dark%20themed%20modern%20hospitality%20booking%20and%20operations%20platform%20dashboard%20for%20multi-venue%20management%2C%20clean%20professional%20restaurant%20and%20hotel%20technology%20design%20on%20dark%20background&width=600&height=380&seq=cs-list-hosp-light&orientation=landscape' },
];

export default function CaseStudiesPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen pt-24 bg-white text-slate-800">
        <section className="py-20 px-6 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(6,182,212,0.05),transparent_60%)]" />
          <div className="relative z-10 max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] text-sm font-medium mb-6">
                <i className="ri-folder-chart-line w-4 h-4 flex items-center justify-center" />
                Illustrative Examples
              </div>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4 text-slate-900">Case Studies</h1>
              <p className="text-xl text-slate-500 max-w-2xl mx-auto">Representative examples of the kinds of systems Digital Footprint designs and builds.</p>
            </motion.div>

            <div className="max-w-3xl mx-auto mb-12">
              <div className="flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-100 px-5 py-4">
                <i className="ri-information-line w-5 h-5 flex items-center justify-center text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 leading-relaxed">
                  These examples illustrate the problems we solve and the outcomes our approach is designed to achieve. They are not specific client engagements, and no results are guaranteed.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {caseStudies.map((cs, index) => (
                <motion.div
                  key={cs.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="group glass-card rounded-2xl overflow-hidden"
                >
                  <div className="relative h-52 overflow-hidden">
                    <img src={cs.image} alt={cs.title} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200">{cs.industry}</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-[#06B6D4] transition-colors">{cs.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-4">{cs.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {cs.tags.map((tag) => (
                        <span key={tag} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-500 border border-slate-100">{tag}</span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mt-16">
              <div className="section-dark-alt rounded-2xl p-12 border border-slate-200">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#06B6D4]/8 border border-[#06B6D4]/20 text-[#06B6D4] text-sm font-medium mb-6">
                  <i className="ri-star-line w-4 h-4 flex items-center justify-center" />
                  Your Story
                </div>
                <h2 className="text-3xl font-bold mb-4 text-slate-900">Want to be our next case study?</h2>
                <p className="text-slate-500 mb-8 max-w-xl mx-auto">Let us build something remarkable together. Book a free consultation to discuss your project.</p>
                <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white bg-[#06B6D4] hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                  Start Your Project
                  <i className="ri-arrow-right-line w-5 h-5 flex items-center justify-center" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}