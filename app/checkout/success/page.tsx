import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SuccessClient from './SuccessClient';

export const metadata: Metadata = {
  title: 'Payment Received | Digital Footprint',
  description: 'Your Digital Footprint project is officially underway.',
};

export default function CheckoutSuccessPage() {
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
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(ellipse 600px 400px at 50% 30%, rgba(56,232,198,0.08), transparent 70%)',
          }}
        />
        <div className="relative z-10">
          <SuccessClient />
        </div>
      </main>
      <Footer />
    </>
  );
}