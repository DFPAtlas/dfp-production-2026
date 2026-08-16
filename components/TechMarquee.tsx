
'use client';

import { useState, useEffect } from 'react';
import { motion } from '@/components/motion';
import { useTheme } from './ThemeProvider';

const technologies = [
  { name: 'Next.js', icon: 'ri-nextjs-fill' },
  { name: 'Stripe', icon: 'ri-bank-card-line' },
  { name: 'Supabase', icon: 'ri-database-2-line' },
  { name: 'OpenAI', icon: 'ri-openai-fill' },
  { name: 'React', icon: 'ri-reactjs-line' },
  { name: 'TypeScript', icon: 'ri-code-s-slash-line' },
  { name: 'Tailwind', icon: 'ri-tailwind-css-fill' },
  { name: 'Node.js', icon: 'ri-nodejs-line' },
  { name: 'n8n', icon: 'ri-flow-chart' },
  { name: 'Zapier', icon: 'ri-flashlight-line' },
  { name: 'Make', icon: 'ri-settings-4-line' },
  { name: 'Next.js', icon: 'ri-nextjs-fill' },
  { name: 'Stripe', icon: 'ri-bank-card-line' },
  { name: 'Supabase', icon: 'ri-database-2-line' },
  { name: 'OpenAI', icon: 'ri-openai-fill' },
  { name: 'React', icon: 'ri-reactjs-line' },
  { name: 'TypeScript', icon: 'ri-code-s-slash-line' },
  { name: 'Tailwind', icon: 'ri-tailwind-css-fill' },
  { name: 'Node.js', icon: 'ri-nodejs-line' },
  { name: 'n8n', icon: 'ri-flow-chart' },
  { name: 'Zapier', icon: 'ri-flashlight-line' },
  { name: 'Make', icon: 'ri-settings-4-line' }
];

export default function TechMarquee() {
  const [isAnimating, setIsAnimating] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section 
      className={`absolute bottom-0 left-0 right-0 w-screen py-12 overflow-hidden bg-transparent`} 
      style={{ marginLeft: 'calc(-50vw + 50%)' }}
      aria-label="Technology stack"
    >
      <motion.div
        animate={isAnimating ? { x: [-1500, 0] } : { x: 0 }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: 'loop',
            duration: 35,
            ease: 'linear'
          }
        }}
        className="flex gap-16 items-center"
        style={{ 
          willChange: 'transform',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          opacity: isAnimating ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out'
        }}
      >
        {technologies.map((tech, index) => (
          <div
            key={index}
            className="flex items-center gap-4 whitespace-nowrap"
          >
            <div className={`w-10 h-10 flex items-center justify-center ${
              isDark ? 'text-white/30' : 'text-gray-400'
            }`}>
              <i className={`${tech.icon} text-3xl`} aria-hidden="true"></i>
            </div>
            <span className={`text-3xl font-bold font-mono ${
              isDark ? 'text-white/20' : 'text-gray-300'
            }`}>
              {tech.name}
            </span>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
