'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CommandFinancePage() {
  const router = useRouter();
  useEffect(() => { setTimeout(() => router.replace('/admin/invoices'), 0); }, [router]);
  return (
    <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
    </div>
  );
}