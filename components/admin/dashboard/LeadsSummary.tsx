'use client';

import { motion } from '@/components/motion';
import Link from 'next/link';
import type { LeadsData } from '@/hooks/useDashboardData';

interface LeadsSummaryProps {
  data: LeadsData;
  loading: boolean;
}

export default function LeadsSummary({ data, loading }: LeadsSummaryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-white">Leads Overview</h3>
        <Link href="/admin/leads" className="text-xs text-[#06B6D4] hover:underline cursor-pointer whitespace-nowrap">
          View all leads
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-4 bg-white/5 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-[#0F172A] rounded-xl p-3">
              <div className="text-xl font-bold text-[#8B5CF6]">{data.newPeriod}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">New This Period</div>
            </div>
            <div className="bg-[#0F172A] rounded-xl p-3">
              <div className="text-xl font-bold text-[#F59E0B]">{data.awaitingContact}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Awaiting Contact</div>
            </div>
            <div className="bg-[#0F172A] rounded-xl p-3">
              <div className="text-xl font-bold text-white">{data.total}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total</div>
            </div>
            <div className="bg-[#0F172A] rounded-xl p-3">
              <div className="text-xl font-bold text-[#F97316]">{data.unassigned}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Unassigned</div>
            </div>
          </div>

          {data.recentlyAdded.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Recently Added</p>
              <div className="space-y-1.5">
                {data.recentlyAdded.map((l) => (
                  <Link
                    key={l.id}
                    href="/admin/leads"
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <span className="text-sm text-slate-300 truncate block">{l.name}</span>
                      {l.company_name && (
                        <span className="text-[10px] text-slate-500">{l.company_name}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                      {l.created_at ? new Date(l.created_at).toLocaleDateString('en-GB') : ''}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {data.total === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">No leads yet.</p>
          )}
        </>
      )}
    </motion.div>
  );
}