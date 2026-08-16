'use client';

import type { IntelligenceInsight } from '../lib/types';

interface IntelligencePanelProps {
  insights: IntelligenceInsight[];
}

const categoryIcons: Record<string, string> = {
  'Patrol Risk': 'ri-footprint-line',
  'Rota Risk': 'ri-calendar-check-line',
  'Compliance': 'ri-file-shield-2-line',
};

export default function IntelligencePanel({ insights }: IntelligencePanelProps) {
  const unresolved = insights.filter((i) => !i.resolved);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0a0f18] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <i className="ri-brain-line text-sm w-4 h-4 flex items-center justify-center text-violet-400"></i>
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">Operations Intelligence</span>
        </div>
        <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[8px] font-medium text-violet-400">Simulated Insight</span>
      </div>

      {insights.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/[0.04] px-3 py-3">
          <i className="ri-check-double-line text-xs w-3 h-3 flex items-center justify-center text-emerald-400"></i>
          <span className="text-[11px] text-emerald-400">All operational risks cleared.</span>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight) => (
            <div key={insight.id} className={`rounded-lg border ${insight.resolved ? 'border-emerald-500/15 bg-emerald-500/[0.04]' : 'border-white/[0.06] bg-white/[0.02]'} p-3`}>
              <div className="flex items-start gap-2.5">
                <span className={`mt-0.5 w-3 h-3 flex items-center justify-center ${insight.resolved ? 'text-emerald-400' : insight.category === 'Patrol Risk' ? 'text-amber-400' : insight.category === 'Compliance' ? 'text-red-400' : 'text-violet-400'}`}>
                  <i className={`${categoryIcons[insight.category] || 'ri-information-line'} text-xs`}></i>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500">{insight.category}</span>
                    {insight.resolved && (
                      <span className="text-[9px] font-medium text-emerald-400">RESOLVED</span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-white">{insight.title}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{insight.detail}</p>
                  {!insight.resolved && (
                    <p className="mt-1.5 text-[10px] font-medium text-cyan-400">{insight.action}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}