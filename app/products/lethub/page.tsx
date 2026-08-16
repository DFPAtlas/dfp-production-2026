'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductDetail from '../ProductDetail';

export default function LethubPage() {
  return (
    <>
      <Header />
      <ProductDetail slug="lethub" />
      <Footer />
    </>
  );
}