import type { Metadata } from 'next';
import AILeadSalesClient from './AILeadSalesClient';

export const metadata: Metadata = {
  title: 'AI Lead & Sales Demo | Digital Footprint',
  description:
    'Interactive demo of an AI-assisted CRM. Qualify leads, generate replies, build proposals, forecast pipeline and automate sales workflows — all using fictional demo data.',
  alternates: { canonical: '/demos/ai-lead-system' },
  openGraph: {
    title: 'AI Lead & Sales Demo | Digital Footprint',
    description: 'Explore an interactive AI-assisted CRM — lead qualification, reply generation, proposals and pipeline forecasting.',
    url: 'https://digital-footprint.uk/demos/ai-lead-system',
    siteName: 'Digital Footprint',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Lead & Sales Demo | Digital Footprint',
    description: 'Interactive AI-assisted CRM — lead qualification, reply generation, proposals and pipeline forecasting.',
  },
};

export default function AILeadSystemDemoPage() {
  return <AILeadSalesClient />;
}