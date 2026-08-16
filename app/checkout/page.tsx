import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CheckoutClient from './CheckoutClient';

export const metadata: Metadata = {
  title: 'Secure Project Checkout | Digital Footprint',
  description: 'Secure your build slot with a 50% starting payment for your Digital Footprint website project.',
};

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="bg-[#0B0F14]">
        <CheckoutClient />
      </main>
      <Footer />
    </>
  );
}