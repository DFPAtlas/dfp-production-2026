import type { Metadata } from 'next';
import GuardianHubWorkspace from './GuardianHubWorkspace';

export const metadata: Metadata = {
  title: 'GuardianHub Security Operations Demo | Digital Footprint',
  description:
    'Interactive demo of a security operations command centre. Manage guards, sites, patrols, incidents and compliance — all connected through one operational workspace with fictional demo data.',
  alternates: { canonical: '/demos/guardianhub-preview' },
  openGraph: {
    title: 'GuardianHub Security Operations Demo | Digital Footprint',
    description: 'Explore an interactive security operations centre — guards, sites, patrols, incidents and compliance in one connected workspace.',
    url: 'https://digital-footprint.uk/demos/guardianhub-preview',
    siteName: 'Digital Footprint',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GuardianHub Security Operations Demo | Digital Footprint',
    description: 'Interactive security operations centre — guards, sites, patrols, incidents and compliance in one connected workspace.',
  },
};

export default function GuardianHubPreviewPage() {
  return <GuardianHubWorkspace />;
}