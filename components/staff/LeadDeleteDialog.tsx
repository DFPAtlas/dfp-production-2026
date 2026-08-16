'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { AlertTriangle, Loader2, X } from 'lucide-react';

interface LeadDeleteDialogProps {
  leadName: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export default function LeadDeleteDialog({ leadName, onConfirm, onClose }: LeadDeleteDialogProps) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    await onConfirm();
    setDeleting(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        onClick={() => !deleting && onClose()}
      >
        <motion.div
          role="alertdialog"
          aria-modal="true"
          aria-label="Delete lead"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl max-w-md w-full"
          onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="w-12 h-12 rounded-2xl bg-[#EF4444]/10 flex items-center justify-center mb-5">
              <AlertTriangle className="w-6 h-6 text-[#EF4444]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Close Lead Permanently</h3>
            <p className="text-sm text-slate-400 mb-1">
              Are you sure you want to permanently delete <span className="text-white font-medium">{leadName}</span>?
            </p>
            <p className="text-xs text-slate-500">
              This action cannot be undone. The lead and all associated data will be removed.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                disabled={deleting}
                className="flex-1 py-3 border border-[rgba(255,255,255,0.1)] rounded-xl text-sm font-semibold text-slate-300 hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={deleting}
                className="flex-1 py-3 bg-[#EF4444] rounded-xl font-bold text-white text-sm hover:shadow-lg hover:shadow-[#EF4444]/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Lead'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
