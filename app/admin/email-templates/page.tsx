'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function EmailTemplatesRedirect() {
  const router = useRouter();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (mountedRef.current) router.replace('/admin/email/templates');
    }, 0);
    return () => clearTimeout(timer);
  }, [router]);

  return null;
}