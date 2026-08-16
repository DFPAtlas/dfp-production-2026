'use client';

import { motion } from '@/components/motion';
import Link from 'next/link';

interface ClientSummaryData {
  total: number;
  active: number;
  newThisPeriod: number;
  recentlyUpdated: { id: string; name: string; industry: string | null }[];
}

interface ClientSummaryCardProps {
  data: ClientSummaryData;
  loading: boolean;
}

export default function ClientSummaryCard({ data, loading }: ClientSummaryCardProps) {
  if (loading) {
    return (
      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <div className="h-4 w-28 bg-white/5 rounded animate-pulse mb-5" />
        <div className="grid grid-cols-3 gap-3 mb-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-white">Client Overview</h3>
        <Link href="/admin/clients" className="text-xs text-[#06B6D4] hover:underline cursor-pointer whitespace-nowrap">
          View all clients
        </Link>
      </div>

      {data.total === 0 ? (
        <div className="py-10 text-center">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-3">
            <i className="ri-building-line text-slate-500 text-lg" />
          </div>
          <p className="text-sm text-slate-500">No clients yet. Your client list will appear here.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-[#0F172A] rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-[#06B6D4]">{data.total}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total</div>
            </div>
            <div className="bg-[#0F172A] rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-[#10B981]">{data.active}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Active</div>
            </div>
            <div className="bg-[#0F172A] rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-[#8B5CF6]">{data.newThisPeriod}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">New</div>
            </div>
          </div>

          {data.recentlyUpdated.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Recent Clients</p>
              <div className="space-y-1.5">
                {data.recentlyUpdated.map((c) => (
                  <Link
                    key={c.id}
                    href="/admin/clients"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#06B6D4]/20 to-[#22D3EE]/20 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-[#06B6D4]">
                        {c.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-300 truncate">{c.name}</p>
                      {c.industry && (
                        <p className="text-[10px] text-slate-500">{c.industry}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}