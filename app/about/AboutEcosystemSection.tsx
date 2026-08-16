'use client';

import { motion } from '@/components/motion';
import Link from 'next/link';

const products = [
  { name: 'QuickGuard', desc: 'Security staffing platform for scheduling, compliance and workforce management.', color: '#F97316', icon: 'ri-shield-line', href: '/products/quickguard' },
  { name: 'GuardianHub', desc: 'Centralised security operations management with real-time monitoring and reporting.', color: '#10B981', icon: 'ri-dashboard-3-line', href: '/products/guardianhub' },
  { name: 'Synqoro', desc: 'AI-powered automation platform connecting business systems and streamlining workflows.', color: '#7C3AED', icon: 'ri-brain-line', href: '/products/synqoro' },
  { name: 'Lethub', desc: 'End-to-end property and lettings management for agents, landlords and tenants.', color: '#2563EB', icon: 'ri-building-2-line', href: '/products/lethub' },
];

export default function AboutEcosystemSection() {
  return (
    <section className="py-20 px-6 section-dark relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#06B6D4]/20 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.03),transparent_70%)]" />
      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] text-sm font-medium mb-4">
            <i className="ri-global-line w-4 h-4 flex items-center justify-center" />
            Our Ecosystem
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">A Technology Group, Not Just a Website Agency</h2>
          <p className="text-slate-500 max-w-2xl mx-auto">Digital Footprint is the parent company behind four specialised platforms — each built to solve real industry problems.</p>
        </motion.div>

        <div className="relative flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl p-8 mb-8 relative overflow-hidden z-10"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.08),transparent)]" />
            <div className="relative z-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#06B6D4]/10 flex items-center justify-center mx-auto mb-4 border border-[#06B6D4]/20 overflow-hidden">
                <img
                  src="https://storage.readdy-site.link/project_files/9c829bf4-c727-45a7-99f8-358e1780c66a/eee9f9ba-b907-488b-a1a8-f6d02534a71b_compressed_Remove-Background-Keep-Foot-Logo.webp"
                  alt="Digital Footprint Logo"
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">Digital Footprint</h3>
              <p className="text-sm text-slate-500">The Parent Technology Company</p>
            </div>
          </motion.div>

          <div className="hidden lg:block absolute top-1/2 w-full h-px bg-gradient-to-r from-transparent via-[#06B6D4]/15 to-transparent z-0" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
            {products.map((product, index) => (
              <motion.div
                key={product.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={product.href}
                  className="glass-card rounded-2xl p-6 text-center block group cursor-pointer"
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors duration-300"
                    style={{ backgroundColor: `${product.color}15` }}
                  >
                    <i
                      className={`${product.icon} text-2xl w-7 h-7 flex items-center justify-center transition-colors duration-300`}
                      style={{ color: product.color }}
                    />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 mb-1">{product.name}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{product.desc}</p>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium" style={{ color: product.color }}>
                    Explore
                    <i className="ri-arrow-right-line w-3 h-3 flex items-center justify-center" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}