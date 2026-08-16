import { Metadata } from 'next'
import SynqoroEventDemoClient from './SynqoroEventDemoClient'

export const metadata: Metadata = {
  title: 'Synqoro Event Operations Demo | Digital Footprint',
  description:
    'An interactive demo showing how event teams can plan, coordinate suppliers, manage guests and run live operations from one platform.',
  alternates: { canonical: '/demos/synqoro-event-demo' },
  openGraph: {
    title: 'Synqoro Event Operations Demo | Digital Footprint',
    description: 'Explore interactive event operations — planning, suppliers, guests and live management in one place.',
    url: 'https://digital-footprint.uk/demos/synqoro-event-demo',
    siteName: 'Digital Footprint',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Synqoro Event Operations Demo | Digital Footprint',
    description: 'Interactive event operations — planning, suppliers, guests and live management in one platform.',
  },
}

export default function SynqoroEventDemoPage() {
  return <SynqoroEventDemoClient />
}