'use client';

import { motion, AnimatePresence } from '@/components/motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';

interface PBXDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}

export default function PBXDetailDrawer({ open, onClose, title, children, width = 'max-w-xl' }: PBXDetailDrawerProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
      document.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEsc);
      };
    }
    return () => { document.body.style.overflow = ''; };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className={`relative w-full ${width} bg-[#0F172A] border-l border-[rgba(255,255,255,0.08)] shadow-2xl z-10 h-full overflow-y-auto`}
          >
            <div className="sticky top-0 z-10 bg-[#0F172A]/95 backdrop-blur-xl flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <h2 className="text-base font-semibold text-white">{title}</h2>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function DetailRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-[rgba(255,255,255,0.04)] last:border-0">
      <span className="text-xs text-slate-500 shrink-0 mr-4">{label}</span>
      <span className={`text-sm text-white text-right ${mono ? 'font-mono text-xs' : ''}`}>{value || '—'}</span>
    </div>
  );
}