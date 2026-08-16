import { Metadata } from 'next';
import DemosPageContent from './DemosPageContent';

export const metadata: Metadata = {
  title: 'Digital Footprint Experience Centre | Interactive Software Demos',
  description:
    'Explore interactive software experiences showing how Digital Footprint can run operations, automate sales, improve customer service and build complete digital platforms.',
  alternates: {
    canonical: '/demos',
  },
  openGraph: {
    title: 'DFP Experience Centre | Interactive Software Demos',
    description:
      'Don\'t just look at our work. Step inside it. Seven interactive software experiences — no signup, no real data.',
    url: 'https://digital-footprint.uk/demos',
    siteName: 'Digital Footprint',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DFP Experience Centre | Interactive Software Demos',
    description:
      'Seven interactive software experiences. Operations, AI sales, client portals, marketplaces, property and events.',
  },
};

export default function DemosPage() {
  return <DemosPageContent />;
}