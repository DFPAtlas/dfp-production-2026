'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Thermometer, ArrowLeft, Plus, CheckCircle2, AlertTriangle,
  Clock, TrendingUp, BarChart3, Shield, Globe, Server,
  Pause, Play, ChevronRight, X,
} from 'lucide-react';

interface StageRow {
  stage: number;
  label: string;
  daily_cap: number | null;
  observation_days: number | null;
  completed: boolean;
  completed_at: string | null;
  started_at: string | null;
  status: string;
}

interface WarmupPlan {
  id: string;
  name: string;
  asset_type: string;
  asset_value: string;
  provider: string;
  brand: string | null;
  owner: string;
  status: string;
  start_date: string | null;
  target_volume: number | null;
  current_stage: number | null;
  total_stages: number | null;
  daily_cap: number | null;
  hourly_cap: number | null;
  current_daily_count: number | null;
  stages: StageRow[];
  pause_thresholds: Record<string, unknown>;
  guardrails: string[];
  audience_sources: string[];
  email_categories: string[];
}

function parseStages(raw: unknown): StageRow[] {
  if (!Array.isArray(raw)) return [];
  return (raw as Record<string, unknown>[]).map((s, i) => ({
    stage: typeof s.stage === 'number' ? (s.stage as number) : i,
    label: (s.label as string) || `Stage ${i}`,
    daily_cap: typeof s.daily_cap === 'number' ? (s.daily_cap as number) : null,
    observation_days: typeof s.observation_days === 'number' ? (s.observation_days as number) : null,
    completed: Boolean(s.completed),
    completed_at: (s.completed_at as string) || null,
    started_at: (s.started_at as string) || null,
    status: (s.status as string) || 'pending',
  }));
}

function parseGuardrails(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((g) => String(g));
  if (raw && typeof raw === 'object') return Object.keys(raw as Record<string, unknown>);
  return [];
}

export default function WarmUpPage() {
  const [plans, setPlans] = useState<WarmupPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('email_warmup_plans')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      const rows = ((data || []) as Record<string, unknown>[]).map((p) => ({
        id: p.id as string,
        name: (p.name as string) || 'Warm-up Plan',
        asset_type: (p.asset_type as string) || 'domain',
        asset_value: (p.asset_value as string) || '—',
        provider: (p.provider as string) || '—',
        brand: (p.brand as string) || null,
        owner: (p.owner as string) || '—',
        status: (p.status as string) || 'draft',
        start_date: (p.start_date as string) || null,
        target_volume: typeof p.target_volume === 'number' ? (p.target_volume as number) : null,
        current_stage: typeof p.current_stage === 'number' ? (p.current_stage as number) : null,
        total_stages: typeof p.total_stages === 'number' ? (p.total_stages as number) : null,
        daily_cap: typeof p.daily_cap === 'number' ? (p.daily_cap as number) : null,
        hourly_cap: typeof p.hourly_cap === 'number' ? (p.hourly_cap as number) : null,
        current_daily_count: typeof p.current_daily_count === 'number' ? (p.current_daily_count as number) : null,
        stages: parseStages(p.stages),
        pause_thresholds: (p.pause_thresholds as Record<string, unknown>) || {},
        guardrails: parseGuardrails(p.guardrails),
        audience_sources: Array.isArray(p.audience_sources) ? (p.audience_sources as string[]) : [],
        email_categories: Array.isArray(p.email_categories) ? (p.email_categories as string[]) : [],
      }));
      setPlans(rows);
      if (rows.length > 0) setExpandedPlan(rows[0].id);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/email/reputation" className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-colors cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Warm-up Plans</h1>
            <p className="text-xs text-slate-400 mt-0.5">Guided domain and IP warm-up with stage-based volume control</p>
          </div>
        </div>
        <button
          onClick={() => setShowNewPlan(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> New Plan
        </button>
      </div>

      {showNewPlan && (
        <div className="bg-[#121215] border border-[#06B6D4]/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Create Warm-up Plan</h2>
            <button onClick={() => setShowNewPlan(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-amber-400 mb-6">
            Warm-up plan creation requires the sending worker. This action is not yet wired to a backend worker.
          </p>
          <button onClick={() => setShowNewPlan(false)} className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer">Cancel</button>
        </div>
      )}

      {plans.length === 0 ? (
        <div className="text-center py-24 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl">
          <Thermometer className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-sm text-slate-400">No warm-up plans recorded yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => {
            const isExpanded = expandedPlan === plan.id;
            const activeStage = plan.stages.find((s) => s.stage === plan.current_stage);
            const cap = plan.daily_cap || 0;
            const pct = cap > 0 ? Math.min(100, ((plan.current_daily_count || 0) / cap) * 100) : 0;
            return (
              <div key={plan.id} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                  className="w-full text-left p-6 hover:bg-white/[0.01] transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.asset_type === 'ip' ? 'bg-violet-400/10' : 'bg-sky-400/10'}`}>
                        {plan.asset_type === 'ip' ? <Server className="w-5 h-5 text-violet-400" /> : <Globe className="w-5 h-5 text-sky-400" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-bold text-white">{plan.name}</h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            plan.status === 'active' ? 'bg-emerald-400/10 text-emerald-400' :
                            plan.status === 'paused' ? 'bg-amber-400/10 text-amber-400' :
                            'bg-slate-400/10 text-slate-400'
                          }`}>{plan.status}</span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {plan.asset_value} · {plan.provider} · Owner: {plan.owner}{plan.start_date ? ` · Started ${new Date(plan.start_date).toLocaleDateString('en-GB')}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">Stage {plan.current_stage ?? '—'}/{plan.total_stages ?? '—'}</p>
                        <p className="text-[10px] text-slate-500">{activeStage?.label || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">{plan.current_daily_count ?? 0} / {plan.daily_cap ?? 0}</p>
                        <p className="text-[10px] text-slate-500">today</p>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                  <div className="mt-2 w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <div className="h-full bg-[#06B6D4] rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-[rgba(255,255,255,0.04)]">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
                      <div className="lg:col-span-3 space-y-3">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Warm-up Stages</h4>
                        {plan.stages.length === 0 ? (
                          <p className="text-xs text-slate-500">No stage configuration recorded</p>
                        ) : (
                          plan.stages.map((stage) => {
                            const isActive = stage.stage === plan.current_stage;
                            const isCompleted = stage.status === 'completed';
                            return (
                              <div key={stage.stage} className={`flex items-start gap-3 p-3 rounded-xl border ${
                                isActive ? 'bg-[#06B6D4]/5 border-[#06B6D4]/20' :
                                isCompleted ? 'bg-emerald-400/[0.03] border-emerald-400/10' :
                                'bg-white/[0.01] border-[rgba(255,255,255,0.03)]'
                              }`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                  isCompleted ? 'bg-emerald-400 text-white' :
                                  isActive ? 'bg-[#06B6D4] text-white' :
                                  'bg-white/[0.04] text-slate-500'
                                } text-xs font-bold`}>
                                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : stage.stage}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-white">{stage.label}</p>
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                      stage.status === 'completed' ? 'bg-emerald-400/10 text-emerald-400' :
                                      stage.status === 'active' ? 'bg-[#06B6D4]/10 text-[#06B6D4]' :
                                      stage.status === 'paused' ? 'bg-amber-400/10 text-amber-400' :
                                      'bg-slate-400/10 text-slate-500'
                                    }`}>{stage.status}</span>
                                  </div>
                                  <div className="flex items-center gap-4 mt-1">
                                    {stage.daily_cap !== null && <span className="text-[10px] text-slate-500">Daily cap: {stage.daily_cap}</span>}
                                    {stage.observation_days !== null && <span className="text-[10px] text-slate-500">{stage.observation_days}d observation</span>}
                                    {stage.completed_at && <span className="text-[10px] text-slate-500">Done: {new Date(stage.completed_at).toLocaleDateString('en-GB')}</span>}
                                  </div>
                                </div>
                                {isActive && plan.status === 'active' && (
                                  <button className="px-3 py-1 rounded-lg text-[10px] font-medium bg-amber-400/10 border border-amber-400/20 text-amber-400 hover:bg-amber-400/20 transition-colors cursor-pointer whitespace-nowrap">
                                    <Pause className="w-3 h-3 inline mr-1" /> Pause
                                  </button>
                                )}
                                {isActive && plan.status === 'paused' && (
                                  <button className="px-3 py-1 rounded-lg text-[10px] font-medium bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 hover:bg-emerald-400/20 transition-colors cursor-pointer whitespace-nowrap">
                                    <Play className="w-3 h-3 inline mr-1" /> Resume
                                  </button>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl p-4">
                          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Guardrails</h4>
                          {plan.guardrails.length === 0 ? (
                            <p className="text-xs text-slate-500">No guardrails configured</p>
                          ) : (
                            <div className="space-y-2">
                              {plan.guardrails.map((g) => (
                                <div key={g} className="flex items-center gap-2">
                                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                                  <span className="text-xs text-slate-300 capitalize">{g.replace(/_/g, ' ')}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl p-4">
                          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Pause Thresholds</h4>
                          {Object.keys(plan.pause_thresholds).length === 0 ? (
                            <p className="text-xs text-slate-500">No thresholds configured</p>
                          ) : (
                            <div className="space-y-2">
                              {Object.entries(plan.pause_thresholds).map(([k, v]) => (
                                <div key={k} className="flex items-center justify-between">
                                  <span className="text-xs text-slate-400 capitalize">{k.replace(/_/g, ' ')}</span>
                                  <span className="text-xs font-medium text-white">&gt; {String(v)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl p-4">
                          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Audience Sources</h4>
                          {plan.audience_sources.length === 0 ? (
                            <p className="text-xs text-slate-500">No audience sources</p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {plan.audience_sources.map((s) => (
                                <span key={s} className="px-2 py-1 rounded-md text-[10px] bg-white/[0.04] text-slate-400">{s}</span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl p-4">
                          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Email Categories</h4>
                          {plan.email_categories.length === 0 ? (
                            <p className="text-xs text-slate-500">No categories</p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {plan.email_categories.map((c) => (
                                <span key={c} className="px-2 py-1 rounded-md text-[10px] bg-white/[0.04] text-slate-400 capitalize">{c}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}