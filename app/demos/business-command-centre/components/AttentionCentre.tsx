'use client';

import { AlertTriangle, ChevronRight } from 'lucide-react';
import type { AttentionItem } from '../lib/types';

type ViewKey = 'overview' | 'projects' | 'people' | 'tasks' | 'finance' | 'pulse' | 'attention' | 'activity' | 'workstreams' | 'milestones' | 'resources';

interface AttentionCentreProps {
  items: AttentionItem[];
  onNavigate: (view: ViewKey) => void;
  onActivity: (message: string) => void;
}

const impactConfig: Record<string, { bg: string; text: string; badge: string }> = {
  'High impact': { bg: 'bg-orange-500/10', text: 'text-orange-400', badge: 'bg-orange-500/15 text-orange-400' },
  'Medium': { bg: 'bg-amber-500/10', text: 'text-amber-400', badge: 'bg-amber-500/15 text-amber-400' },
  'Low': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', badge: 'bg-cyan-500/15 text-cyan-400' },
};

const levelBadge: Record<string, string> = {
  high: 'bg-red-500/15 text-red-400',
  medium: 'bg-amber-500/15 text-amber-400',
  low: 'bg-cyan-500/15 text-cyan-400',
};

export default function AttentionCentre({ items, onNavigate, onActivity }: AttentionCentreProps) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0d111c] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white">Attention Centre</h3>
          <p className="mt-0.5 text-[10px] text-slate-600">Requires executive attention</p>
        </div>
        <AlertTriangle className="h-4 w-4 text-amber-400" />
      </div>

      <div className="space-y-2.5">
        {items.map((item, i) => {
          const impact = impactConfig[item.impact] ?? impactConfig['Medium'];
          const level = levelBadge[item.level] ?? levelBadge.medium;
          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                onActivity(`Opened attention item: ${item.title}`);
                onNavigate(item.target);
              }}
              className="flex w-full items-start gap-2.5 rounded-lg border border-white/[0.04] bg-white/[0.015] p-3 text-left transition hover:border-white/[0.08]"
            >
              <div className={`mt-0.5 flex h-5 items-center rounded px-1.5 text-[9px] font-bold uppercase tracking-wider ${level}`}>
                {item.level === 'high' ? 'HIGH' : item.level === 'medium' ? 'MED' : 'LOW'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium leading-4 text-slate-300">{item.title}</p>
                <p className="mt-0.5 text-[10px] text-slate-600">{item.detail}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${impact.badge}`}>
                    {item.impact}
                  </span>
                  <span className="flex items-center gap-0.5 text-[10px] text-cyan-400">
                    {item.actionLabel}
                    <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-white/[0.04] py-2 text-[10px] text-slate-500 transition hover:bg-white/[0.03] hover:text-slate-300"
      >
        View all attention items
        <ChevronRight className="h-3 w-3" />
      </button>
    </div>
  );
}