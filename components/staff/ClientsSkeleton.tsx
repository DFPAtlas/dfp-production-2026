'use client';

import { motion } from '@/components/motion';
import { Building2, Users, FolderKanban, UserCheck } from 'lucide-react';

export default function ClientsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-white/5 rounded w-24" />
          <div className="h-7 bg-white/5 rounded w-28" />
          <div className="h-3.5 bg-white/5 rounded w-56" />
        </div>
        <div className="h-10 bg-white/5 rounded-xl w-24" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-4 animate-pulse">
            <div className="h-2.5 bg-white/5 rounded w-20 mb-3" />
            <div className="h-7 bg-white/5 rounded w-12" />
          </div>
        ))}
      </div>

      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden animate-pulse">
        <div className="p-4 border-b border-[rgba(255,255,255,0.06)]">
          <div className="h-10 bg-white/5 rounded-xl" />
        </div>
        <div className="space-y-3 p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-white/5 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 bg-white/5 rounded w-36" />
                <div className="h-3 bg-white/5 rounded w-24" />
              </div>
              <div className="h-4 bg-white/5 rounded w-20" />
              <div className="h-5 bg-white/5 rounded-lg w-16" />
              <div className="h-4 bg-white/5 rounded w-8" />
              <div className="h-4 bg-white/5 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}