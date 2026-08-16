'use client';

import { motion } from '@/components/motion';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroLightLines from '@/components/HeroLightLines';

const industries = [
  {
    icon: 'ri-car-line',
    name: 'Independent Car Dealerships',
    desc: 'Vehicle stock workflows, listing distribution, enquiry handling, customer follow-up and dealership automation.',
    color: '#06B6D4',
  },
  {
    icon: 'ri-home-4-line',
    name: 'Property & Lettings',
    desc: 'Property management systems, tenant portals, maintenance tracking and automated communications.',
    color: '#0891B2',
  },
  {
    icon: 'ri-shield-line',
    name: 'Security Companies',
    desc: 'Rostering, patrol tracking, incident reporting, compliance management and mobile workforce apps.',
    color: '#6366F1',
  },
  {
    icon: 'ri-tools-line',
    name: 'Trades & Home Services',
    desc: 'Professional websites, quotation journeys, bookings, job tracking and automated customer communications.',
    color: '#F97316',
  },
  {
    icon: 'ri-heart-line',
    name: 'Wedding & Event Businesses',
    desc: 'Booking journeys, client portals, planning tools, supplier workflows and guest communications.',
    color: '#EC4899',
  },
  {
    icon: 'ri-briefcase-4-line',
    name: 'Professional Services',
    desc: 'Client portals, document management, workflow automation and CRM integration for service firms.',
    color: '#10B981',
  },
];

export default function IndustriesPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen pt-24 bg-white text-slate-800">
        <section className="py-20 px-6 relative overflow-hidden">
          <HeroLightLines />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(6,182,212,0.05),transparent_60%)]" />
          <div className="relative z-10 max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] text-sm font-medium mb-6">
                <i className="ri-global-line w-4 h-4 flex items-center justify-center" />
                Industries
              </div>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">Industries We Serve</h1>
              <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                We focus first on independent UK service businesses where better digital systems can make an immediate commercial difference.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {industries.map((industry, index) => (
                <motion.div
                  key={industry.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="glass-card rounded-2xl p-8 cursor-pointer flex gap-6 group"
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: `${industry.color}12` }}
                  >
                    <i className={`${industry.icon} text-2xl w-7 h-7 flex items-center justify-center`} style={{ color: industry.color }} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-slate-800">{industry.name}</h3>
                    <p className="text-slate-500 leading-relaxed text-sm">{industry.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mt-16">
              <div className="section-dark-alt rounded-2xl p-12">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#06B6D4]/8 border border-[#06B6D4]/20 text-[#06B6D4] text-sm font-medium mb-6">
                  <i className="ri-search-line w-4 h-4 flex items-center justify-center" />
                  Your Industry
                </div>
                <h2 className="text-3xl font-bold mb-4 text-slate-900">Don&apos;t see your industry?</h2>
                <p className="text-slate-500 mb-8 max-w-xl mx-auto">We work with businesses across all sectors. Get in touch and let us understand your unique challenges.</p>
                <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white bg-[#06B6D4] hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                  Talk to Us
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