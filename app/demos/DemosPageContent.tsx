'use client';

import { useState } from 'react';
import ExperienceHero from './components/ExperienceHero';
import FeaturedExperience from './components/FeaturedExperience';
import ExperienceLibrary from './components/ExperienceLibrary';
import PreviewModal from './components/PreviewModal';
import NeedSelector from './components/NeedSelector';
import CapabilityStrip from './components/CapabilityStrip';
import BuildYourSystem from './components/BuildYourSystem';
import DifferentProject from './components/DifferentProject';
import SocialProof from './components/SocialProof';
import DFPDifference from './components/DFPDifference';
import FinalCTA from './components/FinalCTA';
import StickyExperienceNav from './components/StickyExperienceNav';
import type { Demo } from './lib/data';

export default function DemosPageContent() {
  const [previewDemo, setPreviewDemo] = useState<Demo | null>(null);

  return (
    <>
      <StickyExperienceNav />

      <main className="relative min-h-screen overflow-hidden bg-[#050914] text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.010)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.010)_1px,transparent_1px)] bg-[size:72px_72px]" />
        </div>

        <ExperienceHero />

        <div className="relative">
          <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
          <FeaturedExperience />
        </div>

        <div id="experience-library" className="relative">
          <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
          <ExperienceLibrary openPreview={setPreviewDemo} />
        </div>

        <div id="need-selector" className="relative">
          <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
          <NeedSelector />
        </div>

        <CapabilityStrip />

        <div id="build-your-system" className="relative">
          <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
          <BuildYourSystem />
        </div>

        <div className="relative">
          <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
          <DifferentProject />
        </div>

        <SocialProof />

        <div className="relative">
          <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
          <DFPDifference />
        </div>

        <FinalCTA />
      </main>

      {previewDemo && (
        <PreviewModal demo={previewDemo} onClose={() => setPreviewDemo(null)} />
      )}
    </>
  );
}