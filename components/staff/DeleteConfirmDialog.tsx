'use client';

import { motion, AnimatePresence } from '@/components/motion';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface DeleteConfirmDialogProps {
  open: boolean;
  taskTitle: string;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmDialog({ open, taskTitle, deleting, onConfirm, onCancel }: DeleteConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      confirmRef.current?.focus();
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onCancel();
      };
      document.addEventListener('keydown', handleKey);
      return () => document.removeEventListener('keydown', handleKey);
    }
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="relative bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-xl w-full max-w-md mx-4 p-6"
            role="dialog"
            aria-labelledby="delete-dialog-title"
            aria-modal="true"
          >
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#EF4444]/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
              </div>
              <h2 id="delete-dialog-title" className="text-lg font-bold text-white">Delete Task</h2>
            </div>

            <p className="text-sm text-slate-400 mb-1">
              Are you sure you want to delete this task?
            </p>
            <p className="text-sm font-medium text-white mb-1 truncate">
              &ldquo;{taskTitle}&rdquo;
            </p>
            <p className="text-xs text-slate-500 mb-6">
              This action cannot be undone.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={onCancel}
                disabled={deleting}
                className="px-4 py-2.5 border border-[rgba(255,255,255,0.1)] rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                ref={confirmRef}
                onClick={onConfirm}
                disabled={deleting}
                className="px-5 py-2.5 bg-[#EF4444] text-white rounded-xl text-sm font-semibold hover:bg-[#EF4444]/90 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}