'use client';

import { useEffect } from 'react';

interface JsonLdScriptProps {
  schemas: Record<string, unknown> | Record<string, unknown>[];
}

export default function JsonLdScript({ schemas }: JsonLdScriptProps) {
  useEffect(() => {
    const schemaArray = Array.isArray(schemas) ? schemas : [schemas];
    const existing: HTMLScriptElement[] = [];

    schemaArray.forEach((schema) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
      existing.push(script);
    });

    return () => {
      existing.forEach((s) => {
        if (s.parentNode) s.parentNode.removeChild(s);
      });
    };
  }, [schemas]);

  return null;
}