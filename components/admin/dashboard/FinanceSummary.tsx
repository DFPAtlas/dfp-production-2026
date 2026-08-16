'use client';

import { motion } from '@/components/motion';
import Link from 'next/link';
import type { FinanceData } from '@/hooks/useDashboardData';

interface FinanceSummaryProps {
  data: FinanceData;
  loading: boolean;
}

export default function FinanceSummary({ data, loading }: FinanceSummaryProps) {
  const ageingBands = data.ageing || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-white">Finance Summary</h3>
        <Link href="/admin/invoices" className="text-xs text-[#06B6D4] hover:underline cursor-pointer whitespace-nowrap">
          View all invoices
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 bg-white/5 rounded animate-pulse" style={{ width: `${60 + i * 10}%` }} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="bg-[#0F172A] rounded-xl p-4">
              <div className="text-xs text-slate-400 mb-1">Paid This Period</div>
              <div className="text-xl font-bold text-[#10B981]">£{data.paidPeriod.toLocaleString()}</div>
            </div>
            <div className="bg-[#0F172A] rounded-xl p-4">
              <div className="text-xs text-slate-400 mb-1">Outstanding</div>
              <div className="text-xl font-bold text-[#F59E0B]">£{data.outstanding.toLocaleString()}</div>
            </div>
            <div className="bg-[#0F172A] rounded-xl p-4">
              <div className="text-xs text-slate-400 mb-1">Overdue</div>
              <div className="text-xl font-bold text-[#EF4444]">£{data.overdueValue.toLocaleString()}</div>
            </div>
            <div className="bg-[#0F172A] rounded-xl p-4">
              <div className="text-xs text-slate-400 mb-1">Overdue Count</div>
              <div className="text-xl font-bold text-white">{data.overdueCount}</div>
            </div>
          </div>

          {ageingBands.length > 0 && ageingBands.some((b) => b.count > 0) && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Invoice Ageing</p>
              <div className="space-y-2">
                {ageingBands.map((band) => {
                  const totalValue = ageingBands.reduce((s, b) => s + b.value, 0) || 1;
                  const pct = Math.round((band.value / totalValue) * 100);
                  return (
                    <div key={band.band} className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 w-32 shrink-0">{band.band}</span>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: band.band.includes('90') ? '#EF4444' : band.band.includes('60') ? '#F97316' : band.band.includes('30') ? '#F59E0B' : '#10B981',
                          }}
                        />
                      </div>
                      <span className="text-xs text-slate-300 w-16 text-right shrink-0">
                        {band.count > 0 ? `£${band.value.toLocaleString()}` : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {data.outstanding === 0 && data.paidPeriod === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">No invoice data available yet.</p>
          )}
        </>
      )}
    </motion.div>
  );
}