import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CancelledClient from './CancelledClient';

export const metadata: Metadata = {
  title: 'Checkout Cancelled | Digital Footprint',
  description: 'Your project has not been started yet. No payment has been confirmed.',
};

export default function CheckoutCancelledPage() {
  return (
    <>
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
        <div className="relative z-10">
          <CancelledClient />
        </div>
      </main>
      <Footer />
    </>
  );
}