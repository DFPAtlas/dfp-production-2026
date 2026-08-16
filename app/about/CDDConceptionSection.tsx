'use client';

import { motion, type Variants } from '@/components/motion';

const ACCENT = '#F97316';

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export default function CDDConceptionSection() {
  return (
    <section id="cdd-conception" className="relative py-24 px-6 section-dark-alt overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#F97316]/20 to-transparent" />
      <div className="relative z-10 max-w-6xl mx-auto grid lg:grid-cols-[280px_1fr] gap-10 items-start">
        <div className="hidden lg:block pointer-events-none select-none">
          <span className="text-[18rem] font-black leading-none opacity-[0.08]" style={{ color: ACCENT }}>C</span>
        </div>
        <motion.div variants={fadeUpVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold text-white" style={{ backgroundColor: `${ACCENT}18`, border: `1px solid ${ACCENT}35` }}>C</div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Stage One</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mt-0.5">Conception</h2>
            </div>
          </div>
          <p className="text-lg text-slate-600 leading-relaxed mb-6 max-w-2xl">
            This is where the idea starts. We work with you to understand the original concept, explore the what-if questions, shape the vision, and turn rough ideas into a clear product direction.
          </p>
          <p className="text-base text-slate-500 leading-relaxed mb-8 max-w-2xl">
            Our designers create the first UI vision, user journeys and brand direction so the product is clear before development starts.
          </p>
          <div className="flex flex-wrap gap-3">
            {['Vision Workshops', 'User Personas', 'Wireframing', 'Prototyping', 'Brand Strategy', 'UI Concepts'].map((item) => (
              <span key={item} className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ backgroundColor: `${ACCENT}10`, color: ACCENT, border: `1px solid ${ACCENT}20` }}>{item}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}