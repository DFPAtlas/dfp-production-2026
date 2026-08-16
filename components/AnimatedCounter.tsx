'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  value: string;
  label: string;
  suffix?: string;
  prefix?: string;
  duration?: number;
}

export default function AnimatedCounter({ value, label, suffix = '', prefix = '', duration = 2000 }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
  const isDecimal = value.includes('.');
  const decimals = isDecimal ? value.split('.')[1]?.length || 0 : 0;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      if (isDecimal) {
        setCount(parseFloat((eased * numericValue).toFixed(decimals)));
      } else {
        setCount(Math.floor(eased * numericValue));
      }

      if (progress >= 1) {
        clearInterval(interval);
        setCount(numericValue);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [visible, numericValue, duration, isDecimal, decimals]);

  const displayValue = isDecimal
    ? count.toFixed(decimals)
    : count.toLocaleString();

  return (
    <div ref={ref} className="text-center p-4">
      <div className="text-3xl md:text-4xl font-bold text-white mb-1">
        {prefix}{displayValue}{suffix}
      </div>
      <div className="text-sm text-slate-400">{label}</div>
    </div>
  );
}