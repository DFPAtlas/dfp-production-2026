import type { Metadata } from 'next';
import QuickGuardWalkthroughWorkspace from './QuickGuardWalkthroughWorkspace';

export const metadata: Metadata = {
  title: 'QuickGuard Marketplace Demo | Digital Footprint',
  description:
    'Interactive demo of a two-sided security marketplace. Book guards as a client, then switch perspective and accept jobs as a guard. No real bookings — fully simulated demo experience.',
  alternates: { canonical: '/demos/quickguard-walkthrough' },
  openGraph: {
    title: 'QuickGuard Marketplace Demo | Digital Footprint',
    description: 'Explore a two-sided security marketplace — book guards as a client, then switch and accept jobs as a guard. Fully interactive demo.',
    url: 'https://digital-footprint.uk/demos/quickguard-walkthrough',
    siteName: 'Digital Footprint',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QuickGuard Marketplace Demo | Digital Footprint',
    description: 'Interactive two-sided security marketplace — book guards, switch perspective, accept jobs. Fully simulated demo.',
  },
};

export default function QuickGuardWalkthroughPage() {
  return <QuickGuardWalkthroughWorkspace />;
}