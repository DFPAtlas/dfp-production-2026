'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CommandN8nRedirect() {
  const router = useRouter();
  useEffect(() => { setTimeout(() => router.replace('/admin/automation'), 0); }, [router]);
  return (
    <div className="flex items-center justify-center h-96">
      <p className="text-slate-400 text-sm">Redirecting to Automation Control Room...</p>
    </div>
  );
}