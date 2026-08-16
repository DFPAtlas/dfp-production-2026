'use client';

import { useRouter } from 'next/navigation';
import { useRef, useCallback, useEffect } from 'react';

export function useSafeNavigation() {
  const router = useRouter();
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const push = useCallback(
    (href: string) => {
      if (!mountedRef.current) return;
      router.push(href);
    },
    [router],
  );

  const replace = useCallback(
    (href: string) => {
      if (!mountedRef.current) return;
      router.replace(href);
    },
    [router],
  );

  return { push, replace, ready: true };
}