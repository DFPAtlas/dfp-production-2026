'use client';

import { motion } from '@/components/motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AboutHero from './AboutHero';
import FounderSection from './FounderSection';
import CDDSideNav from './CDDSideNav';
import CDDConceptionSection from './CDDConceptionSection';
import CDDDevelopmentSection from './CDDDevelopmentSection';
import CDDDeploymentSection from './CDDDeploymentSection';
import AICloudSection from './AICloudSection';
import OngoingGrowthSection from './OngoingGrowthSection';
import AboutTeamSection from './AboutTeamSection';

function CDDHeadline() {
  return (
    <section className="py-16 px-6 section-dark relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#06B6D4]/20 to-transparent" />
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-4 leading-snug">
            From first idea to live system — our CDD method turns concepts into working digital products.
          </h2>
          <p className="text-slate-500 text-base leading-relaxed max-w-3xl mx-auto">
            Conception shapes the idea. Development builds the experience. Deployment tests, launches,
            and supports the final system. Around every stage, we use the right mix of people, AI,
            automation, and cloud infrastructure.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white text-slate-800">
        <AboutHero />
        <FounderSection />
        <CDDHeadline />
        <div className="relative">
          <CDDSideNav />
          <CDDConceptionSection />
          <CDDDevelopmentSection />
          <CDDDeploymentSection />
        </div>
        <AICloudSection />
        <AboutTeamSection />
        <OngoingGrowthSection />
      </main>
      <Footer />
    </>
  );
}