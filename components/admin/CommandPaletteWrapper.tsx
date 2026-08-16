'use client';

import { useState, useEffect } from 'react';
import CommandPalette from './CommandPalette';

export default function CommandPaletteWrapper() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    const handleCustomEvent = () => setOpen(true);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('open-command-palette', handleCustomEvent);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('open-command-palette', handleCustomEvent);
    };
  }, []);

  return <CommandPalette open={open} onClose={() => setOpen(false)} />;
}