'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductDetail from '../ProductDetail';

export default function GuardianHubPage() {
  return (
    <>
      <Header />
      <ProductDetail slug="guardianhub" />
      <Footer />
    </>
  );
}