'use client';

import { Sparkles, TrendingUp, Zap, ArrowRight, BarChart3, ShieldCheck } from 'lucide-react';
import type { Insight } from '../lib/types';
import SparklineMini from './SparklineMini';

interface IntelligenceRailProps {
  insights: Insight[];
}

export default function IntelligenceRail({ insights }: IntelligenceRailProps) {
  const aiInsight = insights.find((i) => i.id === 'ai');
  const predictive = insights.find((i) => i.id === 'predictive');
  const recommendation = insights.find((i) => i.id === 'recommendation');
  const benchmark = insights.find((i) => i.id === 'benchmark');
  const dataQuality = insights.find((i) => i.id === 'data');

  return (
    <aside className="hidden w-60 shrink-0 border-l border-white/[0.05] bg-[#0c101a] xl:flex xl:flex-col">
      <div className="flex items-center gap-2 border-b border-white/[0.04] px-4 py-3">
        <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white">
          Northstar Intelligence
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {/* AI Insight */}
        {aiInsight && (
          <div className="rounded-lg border border-white/[0.04] bg-white/[0.015] p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap className="h-3 w-3 text-cyan-400" />
                <span className="text-[9px] font-semibold uppercase tracking-wider text-cyan-400">AI Insight</span>
              </div>
              <span className="text-[9px] text-slate-600">Just now</span>
            </div>
            <p className="mt-2 text-[11px] leading-4 text-slate-300">{aiInsight.title}</p>
            <p className="mt-1 text-[10px] text-slate-500">{aiInsight.detail}</p>
            <button
              type="button"
              className="mt-2 flex items-center gap-1 text-[10px] text-cyan-400 transition hover:text-cyan-300"
            >
              {aiInsight.recommendation}
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Predictive Outlook */}
        {predictive && (
          <div className="rounded-lg border border-white/[0.04] bg-white/[0.015] p-3">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-cyan-400" />
              <span className="text-[9px] font-semibold uppercase tracking-wider text-white">Predictive Outlook</span>
            </div>
            <p className="mt-2 text-[10px] text-slate-500">30 day forecast</p>
            <p className="mt-1 text-lg font-semibold text-white">{predictive.detail}</p>
            <p className="mt-1 text-[10px] text-emerald-400">{predictive.recommendation}</p>
            <SparklineMini color="#22d3ee" />
          </div>
        )}

        {/* Recommendation */}
        {recommendation && (
          <div className="rounded-lg border border-white/[0.04] bg-white/[0.015] p-3">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="h-3 w-3 text-cyan-400" />
              <span className="text-[9px] font-semibold uppercase tracking-wider text-white">Recommendation</span>
            </div>
            <p className="mt-1 text-[10px] text-slate-600">Based on current data</p>
            <p className="mt-2 text-[11px] leading-4 text-slate-300">{recommendation.title}</p>
            <p className="mt-1 text-[10px] text-slate-500">{recommendation.detail}</p>
            <button
              type="button"
              className="mt-2 flex items-center gap-1 text-[10px] text-cyan-400 transition hover:text-cyan-300"
            >
              {recommendation.recommendation}
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Benchmark */}
        {benchmark && (
          <div className="rounded-lg border border-white/[0.04] bg-white/[0.015] p-3">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="h-3 w-3 text-cyan-400" />
              <span className="text-[9px] font-semibold uppercase tracking-wider text-white">Benchmark</span>
            </div>
            <p className="mt-2 text-[10px] text-slate-500">Your performance vs industry</p>
            <p className="mt-1 text-lg font-semibold text-white">93.2%</p>
            <p className="mt-1 text-[10px] text-emerald-400">Top quartile</p>
            <div className="mt-2 flex items-end gap-0.5">
              {[40, 55, 48, 62, 70, 78, 85, 88, 90, 92, 93, 93].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm bg-cyan-500/20"
                  style={{ height: `${h * 0.3}px` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Data Quality */}
        {dataQuality && (
          <div className="rounded-lg border border-white/[0.04] bg-white/[0.015] p-3">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              <span className="text-[9px] font-semibold uppercase tracking-wider text-white">Data Quality</span>
            </div>
            <p className="mt-2 text-[10px] text-slate-500">All critical datasets</p>
            <p className="mt-1 text-2xl font-semibold text-white">100%</p>
            <p className="mt-1 text-[10px] text-emerald-400">Data integrity score</p>
            <button
              type="button"
              className="mt-2 flex items-center gap-1 text-[10px] text-cyan-400 transition hover:text-cyan-300"
            >
              View data quality
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}