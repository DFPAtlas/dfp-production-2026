import type { Metadata } from 'next';
import CustomerProjectPortalClient from './CustomerProjectPortalClient';

export const metadata: Metadata = {
  title: 'Customer Portal Demo | Digital Footprint',
  description:
    'Interactive demo of a client-facing project portal. Experience milestones, approvals, messages, files and invoices from the customer perspective — all with fictional demo data.',
  alternates: { canonical: '/demos/customer-portal' },
  openGraph: {
    title: 'Customer Portal Demo | Digital Footprint',
    description: 'Explore an interactive customer portal — milestones, approvals, messages, files and invoices in one client workspace.',
    url: 'https://digital-footprint.uk/demos/customer-portal',
    siteName: 'Digital Footprint',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Customer Portal Demo | Digital Footprint',
    description: 'Interactive customer portal — milestones, approvals, messages, files and invoices in one client workspace.',
  },
};

export default function CustomerPortalDemoPage() {
  return <CustomerProjectPortalClient />;
}