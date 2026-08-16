'use client';

import { motion } from '@/components/motion';
import CurrentProjects from './CurrentProjects';
import Recommendations from './Recommendations';
import MaturityRoadmap from './MaturityRoadmap';
import EcosystemInsights from './EcosystemInsights';
import StrategyCTA from './StrategyCTA';
import PortalShell from '../PortalShell';

export default function RoadmapPage() {
  return (
    <PortalShell>
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl p-8 lg:p-10 space-y-10 shadow-sm border border-slate-100">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#2563EB]/10 text-[#2563EB] uppercase tracking-wider">
                Technology Roadmap
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Your Technology Roadmap</h1>
            <p className="text-slate-500 mt-2 max-w-2xl leading-relaxed">
              A clear view of your current project progress, future opportunities and recommended technology improvements designed to support your business growth.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                One Contact
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                One Relationship
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                One Vision
              </div>
            </div>
          </motion.div>

          <CurrentProjects />
          <Recommendations />
          <MaturityRoadmap />
          <EcosystemInsights />
          <StrategyCTA />
        </div>
      </div>
    </PortalShell>
  );
}