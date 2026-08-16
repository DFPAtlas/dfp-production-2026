'use client';

import type { Insight } from '../lib/types';

interface Props {
  insights: Insight[];
  onNavigate: (view: string) => void;
}

export default function IntelligencePanel({ insights, onNavigate }: Props) {
  const active = insights.filter((i) => i.status === 'active');

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-[#e8e5df] px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1a2332]">Portfolio Insights</h3>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-slate-500">Simulated</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {active.length === 0 && (
          <div className="rounded-lg border border-[#e8e5df] bg-[#faf9f7] p-4 text-center">
            <i className="ri-check-line text-lg text-emerald-500 mb-1 block" />
            <p className="text-xs text-[#8a8a8a]">All insights resolved</p>
          </div>
        )}
        {active.map((insight) => (
          <div key={insight.id} className="rounded-lg border border-[#e8e5df] bg-[#faf9f7] p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-[#0d9488]">{insight.category}</span>
            </div>
            <p className="text-xs font-medium text-[#1a2332]">{insight.title}</p>
            <p className="mt-0.5 text-[10px] text-[#8a8a8a]">{insight.detail}</p>
            <button
              onClick={() => onNavigate(insight.category)}
              className="mt-2 rounded border border-[#e8e5df] bg-white px-2.5 py-1 text-[10px] font-medium text-[#1a2332] transition hover:bg-[#f6f5f2] cursor-pointer whitespace-nowrap"
            >
              {insight.actionText}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}