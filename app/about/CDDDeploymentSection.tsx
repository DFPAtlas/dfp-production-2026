'use client';

import { motion, type Variants } from '@/components/motion';

const ACCENT = '#10B981';

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export default function CDDDeploymentSection() {
  return (
    <section id="cdd-deployment" className="relative py-24 px-6 section-dark-alt overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto grid lg:grid-cols-[280px_1fr] gap-10 items-start">
        <div className="hidden lg:block pointer-events-none select-none">
          <span className="text-[18rem] font-black leading-none opacity-[0.08]" style={{ color: ACCENT }}>D</span>
        </div>
        <motion.div variants={fadeUpVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold text-white" style={{ backgroundColor: `${ACCENT}18`, border: `1px solid ${ACCENT}35` }}>D</div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Stage Three</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mt-0.5">Deployment</h2>
            </div>
          </div>
          <p className="text-lg text-slate-600 leading-relaxed mb-6 max-w-2xl">
            Deployment is where our testers and bug hunters work through the project locally and in the cloud before launch.
          </p>
          <p className="text-base text-slate-500 leading-relaxed mb-8 max-w-2xl">
            We check errors, confirm the user journey, prepare the live environment and support the handover after release.
          </p>
          <div className="flex flex-wrap gap-3">
            {['UAT Testing', 'Bug Checks', 'Cloud Launch', 'Go Live', 'Handover', 'Support'].map((item) => (
              <span key={item} className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ backgroundColor: `${ACCENT}10`, color: ACCENT, border: `1px solid ${ACCENT}20` }}>{item}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}