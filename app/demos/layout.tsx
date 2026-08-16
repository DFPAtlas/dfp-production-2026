import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import DemoAgentWidget from './DemoAgentWidget';

export const metadata: Metadata = {
  title: 'Interactive Software Demos | Digital Footprint',
  description:
    'Try three interactive Digital Footprint software demos: a business command centre, an AI lead and sales system, and a customer project portal.',
  alternates: {
    canonical: '/demos',
  },
  openGraph: {
    title: 'DFP Demo Lab | Try Our Software',
    description:
      'Explore safe, interactive software demos built by Digital Footprint. No registration and no real customer data.',
    url: 'https://digital-footprint.uk/demos',
    siteName: 'Digital Footprint',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DFP Demo Lab | Try Our Software',
    description:
      'Explore a business command centre, AI sales workflow and customer project portal in a safe demonstration environment.',
  },
};

export default function DemosLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <DemoAgentWidget />
      {children}
    </>
  );
}