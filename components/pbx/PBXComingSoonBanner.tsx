'use client';

import { motion } from '@/components/motion';
import { Megaphone, ArrowRight } from 'lucide-react';

interface PBXComingSoonBannerProps {
  onRequestAccess: () => void;
  compact?: boolean;
}

export default function PBXComingSoonBanner({ onRequestAccess, compact = false }: PBXComingSoonBannerProps) {
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#1E293B] via-[#1E293B] to-[#1E293B] rounded-xl border border-[#F59E0B]/20 p-4 flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center shrink-0">
            <Megaphone className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Coming Soon — In Testing</p>
            <p className="text-xs text-slate-400">Some features use demo data</p>
          </div>
        </div>
        <button
          onClick={onRequestAccess}
          className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#F59E0B] border border-[#F59E0B]/30 hover:bg-[#F59E0B]/10 transition-colors cursor-pointer whitespace-nowrap"
        >
          Request Access
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-gradient-to-r from-[#1E293B] via-[#1E293B] to-[#1E293B] rounded-xl border border-[#F59E0B]/20 p-5"
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#F59E0B]/3 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center shrink-0 mt-0.5">
            <Megaphone className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-white">Digital-Footprint Cloud PBX is coming soon</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/20 whitespace-nowrap">In Testing</span>
            </div>
            <p className="text-sm text-slate-400 max-w-2xl">
              We are currently testing AI call routing, Twilio voice/SMS, n8n automations, voicemail, call logs, and usage billing. Some features shown here are in testing and may use demo data.
            </p>
          </div>
        </div>
        <button
          onClick={onRequestAccess}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-[#F59E0B]/10"
        >
          Request Early Access
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}