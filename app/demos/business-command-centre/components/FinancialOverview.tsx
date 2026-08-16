'use client';

import { TrendingUp } from 'lucide-react';
import type { FinanceMetric } from '../lib/types';

interface FinancialOverviewProps {
  metrics: FinanceMetric[];
}

export default function FinancialOverview({ metrics }: FinancialOverviewProps) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0d111c] p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white">Financial Overview</h3>
          <p className="mt-0.5 text-[10px] text-slate-600">Financial trends and insights</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-1 text-[10px] text-cyan-400 transition hover:text-cyan-300"
        >
          View full financials
          <i className="ri-arrow-right-s-line text-xs"></i>
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg border border-white/[0.04] bg-white/[0.015] p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500">{metric.label}</span>
              <TrendingUp className="h-3 w-3 text-cyan-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-lg font-semibold text-white">{metric.value}</span>
              <span className={`text-[10px] ${metric.inverse ? 'text-orange-400' : 'text-emerald-400'}`}>
                {metric.change}
              </span>
            </div>
            <div className="mt-3 flex items-end gap-0.5">
              {metric.bars.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm bg-cyan-500/20 transition-all"
                  style={{ height: `${Math.max(h * 0.25, 4)}px` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}