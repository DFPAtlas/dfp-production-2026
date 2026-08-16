'use client';

import { useMemo } from 'react';
import {
  IntelligenceCard,
  WonDriver,
  RecentSignal,
  RecommendedContent,
  Lead,
  LeadState,
} from '../lib/types';
import {
  defaultIntelligence,
  wonDrivers,
  recentSignals,
  recommendedContent,
} from '../lib/data';

interface AIIntelligencePanelProps {
  lead: Lead;
  state: LeadState;
  researched: boolean;
  qualified: boolean;
  replyApproved: boolean;
  proposalApproved: boolean;
}

export default function AIIntelligencePanel({
  lead,
  state,
  researched,
  qualified,
  replyApproved,
  proposalApproved,
}: AIIntelligencePanelProps) {
  const cards = useMemo<IntelligenceCard[]>(() => {
    const base = [...defaultIntelligence];
    if (researched) {
      base[0] = {
        ...base[0],
        value: 'High',
        detail: 'Enquiry describes active operational pain with clear budget and timeline.',
      };
      base[1] = {
        ...base[1],
        value: 'Lead capture, follow-up, pipeline visibility',
      };
    }
    if (qualified) {
      base[2] = { ...base[2], value: 'Strong' };
      base[3] = {
        ...base[3],
        value: 'Prepare AI draft response for human review.',
        detail: 'Lead is qualified with strong fit and budget confirmation.',
      };
    }
    if (replyApproved) {
      base[3] = {
        ...base[3],
        value: 'Build opportunity proposal.',
        detail: 'Response approved. Move to proposal preparation.',
      };
    }
    if (proposalApproved) {
      base[3] = {
        ...base[3],
        value: 'Hand off to sales team for closing.',
        detail: 'Proposal approved. Opportunity is ready for the sales team.',
      };
    }
    return base;
  }, [researched, qualified, replyApproved, proposalApproved]);

  const pipelineHealth = useMemo(() => {
    if (proposalApproved) return 94;
    if (replyApproved) return 88;
    if (qualified) return 82;
    if (researched) return 76;
    return 72;
  }, [researched, qualified, replyApproved, proposalApproved]);

  const healthLabel = pipelineHealth >= 90 ? 'Excellent' : pipelineHealth >= 80 ? 'Healthy' : 'Good';
  const healthColor = pipelineHealth >= 90 ? 'text-emerald-400' : pipelineHealth >= 80 ? 'text-cyan-400' : 'text-amber-400';

  return (
    <aside className="flex w-full flex-col gap-4 lg:w-[300px] lg:shrink-0">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">AI Intelligence</h3>
        <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-400">
          Demo AI Analysis
        </span>
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-white">Pipeline Health</p>
          <p className="text-[10px] text-slate-500">This Month</p>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="5"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke={pipelineHealth >= 80 ? '#22d3ee' : '#f59e0b'}
                strokeWidth="5"
                strokeDasharray={`${(pipelineHealth / 100) * 175.9} 175.9`}
                strokeLinecap="round"
              />
            </svg>
            <span className={`absolute text-sm font-bold ${healthColor}`}>
              {pipelineHealth}%
            </span>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-[10px]">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Healthy
              </span>
              <span className="text-slate-400">72%</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="flex items-center gap-1 text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                At Risk
              </span>
              <span className="text-slate-400">18%</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="flex items-center gap-1 text-red-400">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                Stalled
              </span>
              <span className="text-slate-400">10%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {cards.map((card) => (
          <div
            key={card.id}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              {card.label}
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              {card.value}
            </p>
            {card.detail && (
              <p className="mt-1 text-[11px] leading-4 text-slate-500">
                {card.detail}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
        <p className="text-xs font-medium text-white">Top Won Drivers</p>
        <p className="text-[10px] text-slate-500">This Month</p>
        <div className="mt-3 space-y-3">
          {wonDrivers.map((driver) => (
            <div key={driver.label}>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">{driver.label}</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  {driver.value}%
                  <i className="ri-arrow-up-line text-xs"></i>
                </span>
              </div>
              <div className="mt-1.5 h-1 rounded-full bg-white/[0.06]">
                <div
                  className="h-1 rounded-full bg-cyan-500"
                  style={{ width: `${driver.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-white">Recent Signals</p>
          <button
            type="button"
            className="text-[10px] text-cyan-400 transition hover:text-cyan-300"
          >
            View All Signals
          </button>
        </div>
        <div className="mt-3 space-y-3">
          {recentSignals.map((signal, i) => (
            <div key={i} className="flex items-start gap-2">
              <span
                className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                  signal.type === 'positive'
                    ? 'bg-emerald-400'
                    : signal.type === 'warning'
                      ? 'bg-amber-400'
                      : 'bg-slate-500'
                }`}
              />
              <div>
                <p className="text-[11px] leading-4 text-slate-300">
                  {signal.action}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-600">
                  {signal.company} &middot; {signal.date}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
        <p className="text-xs font-medium text-white">Recommended Content</p>
        <p className="text-[10px] text-slate-500">For This Lead</p>
        <div className="mt-3 flex items-start gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
            <i className="ri-file-pdf-line text-lg text-slate-400"></i>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white">
              {recommendedContent.title}
            </p>
            <p className="text-[10px] text-slate-500">
              {recommendedContent.subtitle}
            </p>
            <p className="mt-1 text-[10px] text-slate-600">
              {recommendedContent.reason}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="mt-2 w-full rounded-lg border border-white/[0.08] py-2 text-center text-[11px] font-medium text-slate-400 transition hover:border-white/[0.15] hover:text-slate-300"
        >
          Use in Response
        </button>
      </div>
    </aside>
  );
}