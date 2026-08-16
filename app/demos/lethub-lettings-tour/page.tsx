import type { Metadata } from 'next';
import LetHubWorkspace from './LetHubWorkspace';

export const metadata: Metadata = {
  title: 'LetHub Property Operations Demo | Digital Footprint',
  description:
    'Interactive demo of a property management platform. Manage a fictional portfolio of properties, tenancies, maintenance, compliance and rent — all in one connected workspace with demo data.',
  alternates: { canonical: '/demos/lethub-lettings-tour' },
  openGraph: {
    title: 'LetHub Property Operations Demo | Digital Footprint',
    description: 'Explore an interactive property management platform — portfolio, tenancies, maintenance, compliance and rent in one workspace.',
    url: 'https://digital-footprint.uk/demos/lethub-lettings-tour',
    siteName: 'Digital Footprint',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LetHub Property Operations Demo | Digital Footprint',
    description: 'Interactive property management — portfolio, tenancies, maintenance, compliance and rent in one connected workspace.',
  },
};

export default function LetHubPage() {
  return <LetHubWorkspace />;
}