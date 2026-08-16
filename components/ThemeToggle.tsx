'use client';

import { useTheme } from './ThemeProvider';
import { motion } from '@/components/motion';
import React from 'react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme() ?? {};

  const handleToggle = React.useCallback(() => {
    if (typeof toggleTheme === 'function') {
      try {
        toggleTheme();
      } catch (err) {
        console.error('Failed to toggle theme:', err);
      }
    } else {
      console.warn('toggleTheme is not defined');
    }
  }, [toggleTheme]);

  const nextMode = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      onClick={handleToggle}
      className="relative w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00F0FF] focus:ring-offset-2 focus:ring-offset-white bg-gray-100 hover:bg-gray-200"
      aria-label={`Switch to ${nextMode} mode`}
      title={`Switch to ${nextMode} mode`}
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'dark' ? 0 : 180 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="relative w-5 h-5"
      >
        {theme === 'dark' ? (
          <i className="ri-moon-line text-xl text-gray-700"></i>
        ) : (
          <i className="ri-sun-line text-xl text-[#00F0FF]"></i>
        )}
      </motion.div>
    </button>
  );
}