import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import JsonLdScript from '@/components/JsonLdScript';
import PricingHero from './PricingHero';
import PricingTabs from './PricingTabs';
import BespokeCallout from './BespokeCallout';
import TrustStrip from './TrustStrip';
import DFPMethod from './DFPMethod';
import HowPricingWorks from './HowPricingWorks';
import PricingFAQ from './PricingFAQ';

export const metadata: Metadata = {
  title: 'Pricing | Websites, Software & AI Automation | Digital Footprint',
  description:
    'Explore Digital Footprint pricing for professional websites, business systems, SaaS development, AI automation and ongoing website care.',
  alternates: {
    canonical: 'https://digital-footprint.uk/pricing',
  },
};

const webPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Pricing | Websites, Software & AI Automation | Digital Footprint',
  description:
    'Explore Digital Footprint pricing for professional websites, business systems, SaaS development, AI automation and ongoing website care.',
  url: 'https://digital-footprint.uk/pricing',
  publisher: {
    '@type': 'Organization',
    name: 'Digital Footprint',
  },
};

export default function PricingPage() {
  return (
    <>
      <JsonLdScript schemas={[webPageSchema]} />
      <Header />
      <main id="main-content" className="min-h-screen bg-[#0B0F14] relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            backgroundImage: `
              linear-gradient(rgba(148,163,184,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(148,163,184,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        <div
          className="absolute top-0 left-0 w-[500px] h-[500px] pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(ellipse 600px 500px at 20% 30%, rgba(56,232,198,0.06), transparent 70%)',
          }}
        />
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(ellipse 600px 500px at 80% 30%, rgba(139,108,255,0.05), transparent 70%)',
          }}
        />

        <div className="relative z-10">
          <PricingHero />
          <PricingTabs />
          <BespokeCallout />
          <TrustStrip />
          <DFPMethod />
          <HowPricingWorks />
          <PricingFAQ />
        </div>
      </main>
      <Footer />
    </>
  );
}