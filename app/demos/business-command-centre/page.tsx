import type { Metadata } from 'next';
import BusinessCommandCentreClient from './BusinessCommandCentreClient';

export const metadata: Metadata = {
  title: 'Business Command Centre Demo | Digital Footprint',
  description:
    'Interactive demo of a premium business command centre. Explore real-time business pulse, attention centre, projects, team capacity and financial overview — all driven by fictional demo data.',
  alternates: { canonical: '/demos/business-command-centre' },
  openGraph: {
    title: 'Business Command Centre Demo | Digital Footprint',
    description: 'Explore an interactive business command centre — pulse, projects, team capacity and financials in one executive workspace.',
    url: 'https://digital-footprint.uk/demos/business-command-centre',
    siteName: 'Digital Footprint',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Business Command Centre Demo | Digital Footprint',
    description: 'Interactive business command centre — pulse, projects, team capacity and financials in one executive workspace.',
  },
};

export default function BusinessCommandCentreDemoPage() {
  return <BusinessCommandCentreClient />;
}