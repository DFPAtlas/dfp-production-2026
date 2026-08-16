'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Sparkles, TrendingUp, BarChart3, Activity, AlertTriangle, X, RefreshCw, Clock, Zap } from 'lucide-react';

interface UsageStats {
  total_requests: number;
  successful: number;
  failed: number;
  total_input_tokens: number;
  total_output_tokens: number;
  estimated_total_cost: number;
  today_requests: number;
  today_limit: number;
  user_today_requests: number;
  user_today_limit: number;
}

interface UsageRecord {
  id: string;
  action_type: string;
  model_used: string;
  input_units: number;
  output_units: number;
  estimated_cost: number;
  success: boolean;
  error_code: string | null;
  content_applied: boolean;
  created_at: string;
  brand_id: string | null;
}

const ACTION_LABELS: Record<string, string> = {
  subject_lines: 'Subject Lines',
  preview_text: 'Preview Text',
  rewrite_text: 'Text Rewrite',
  draft_from_brief: 'Draft from Brief',
  cta_suggestions: 'CTA Suggestions',
  content_review: 'Content Review',
  accessibility_suggestions: 'Accessibility',
  tone_consistency: 'Tone Check',
  content_variation: 'A/B Variation',
  content_adaptation: 'Adaptation',
  plain_text: 'Plain Text',
  simplify_language: 'Simplify',
  make_professional: 'Professional',
  make_friendlier: 'Friendlier',
  shorten: 'Shorten',
  expand: 'Expand',
};

export default function AIUsagePage() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week');
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => { loadData(); }, [dateRange]);

  const loadData = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = user ? await supabase.from('admin_profiles').select('organisation_id').eq('id', user.id).maybeSingle() : { data: null };
    const orgId = profile?.organisation_id;

    const { data: brandData } = await supabase.from('email_brand_kits').select('id, name');
    setBrands(brandData || []);

    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const sinceDate = dateRange === 'today' ? today : dateRange === 'week' ? weekAgo : monthAgo;

    let query = supabase.from('email_ai_usage_logs').select('*').gte('created_at', sinceDate).order('created_at', { ascending: false }).limit(200);
    if (orgId) query = query.eq('organisation_id', orgId);

    const { data: usageData, count } = await query;

    if (usageData) {
      const all: UsageRecord[] = usageData as UsageRecord[];
      setRecords(all);

      const successful = all.filter(r => r.success).length;
      const failed = all.filter(r => !r.success).length;

      let todayQuery = supabase.from('email_ai_usage_logs').select('*', { count: 'exact', head: true }).gte('created_at', today);
      if (orgId) todayQuery = todayQuery.eq('organisation_id', orgId);
      const { count: todayCount } = await todayQuery;

      const { data: settings } = await supabase.from('email_studio_settings').select('ai_config').maybeSingle();
      const aiConfig = settings?.ai_config as Record<string, unknown> | null;

      setStats({
        total_requests: count || 0,
        successful,
        failed,
        total_input_tokens: all.reduce((a, r) => a + (r.input_units || 0), 0),
        total_output_tokens: all.reduce((a, r) => a + (r.output_units || 0), 0),
        estimated_total_cost: all.reduce((a, r) => a + (r.estimated_cost || 0), 0),
        today_requests: todayCount || 0,
        today_limit: (aiConfig?.daily_org_limit as number) || 500,
        user_today_requests: todayCount || 0,
        user_today_limit: (aiConfig?.daily_user_limit as number) || 100,
      });
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-white/[0.04] rounded-lg" />
        <div className="h-96 bg-[#121215] rounded-2xl" />
      </div>
    );
  }

  const usagePct = stats ? Math.round(stats.today_requests / stats.today_limit * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-[#06B6D4]" />
            </div>
            <h1 className="text-xl font-bold text-white">AI Usage</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1 ml-11">
            Monitor AI assistant usage, costs and limits across the organisation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/email/settings/ai"
            className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] text-slate-300 rounded-xl text-xs font-medium hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" /> AI Settings
          </Link>
          <button onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] text-slate-300 rounded-xl text-xs font-medium hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {(['today', 'week', 'month'] as const).map(range => (
          <button key={range} onClick={() => setDateRange(range)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${dateRange === range ? 'bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20' : 'text-slate-400 border border-[rgba(255,255,255,0.06)] hover:text-white'}`}
          >{range === 'today' ? 'Today' : range === 'week' ? 'This Week' : 'This Month'}</button>
        ))}
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center"><Zap className="w-3.5 h-3.5 text-[#06B6D4]" /></div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Requests</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.total_requests}</p>
            <div className="flex items-center gap-2 mt-1 text-[10px]">
              <span className="text-emerald-400">{stats.successful} success</span>
              {stats.failed > 0 && <span className="text-red-400">{stats.failed} failed</span>}
            </div>
          </div>
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center"><TrendingUp className="w-3.5 h-3.5 text-emerald-400" /></div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Tokens</span>
            </div>
            <p className="text-2xl font-bold text-white">{(stats.total_input_tokens + stats.total_output_tokens).toLocaleString()}</p>
            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
              <span>In: {stats.total_input_tokens.toLocaleString()}</span>
              <span>Out: {stats.total_output_tokens.toLocaleString()}</span>
            </div>
          </div>
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center"><BarChart3 className="w-3.5 h-3.5 text-amber-400" /></div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Est. Cost</span>
            </div>
            <p className="text-2xl font-bold text-white">${stats.estimated_total_cost.toFixed(4)}</p>
            <p className="text-[10px] text-slate-600 mt-1">Based on provider pricing</p>
          </div>
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center"><Clock className="w-3.5 h-3.5 text-blue-400" /></div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Today</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.today_requests}/{stats.today_limit}</p>
            <div className="w-full h-1.5 bg-white/[0.04] rounded-full mt-2 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${usagePct > 90 ? 'bg-red-400' : usagePct > 70 ? 'bg-amber-400' : 'bg-[#06B6D4]'}`} style={{ width: `${Math.min(usagePct, 100)}%` }} />
            </div>
          </div>
        </div>
      )}

      {usagePct > 80 && (
        <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-300">Approaching Daily Limit</p>
            <p className="text-xs text-amber-400/70 mt-0.5">{usagePct}% of daily limit used ({stats?.today_requests}/{stats?.today_limit} requests).</p>
          </div>
        </div>
      )}

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[rgba(255,255,255,0.06)]">
          <h2 className="text-sm font-bold text-white">Recent Requests</h2>
        </div>
        {records.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No AI usage recorded</p>
            <p className="text-xs text-slate-600 mt-1">Usage will appear here when the AI assistant is used</p>
          </div>
        ) : (
          <div className="divide-y divide-[rgba(255,255,255,0.03)] max-h-[500px] overflow-y-auto">
            {records.map(rec => (
              <div key={rec.id} className="p-4 flex items-center justify-between gap-4 hover:bg-white/[0.01] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${rec.success ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <div className="min-w-0">
                    <p className="text-sm text-white">{ACTION_LABELS[rec.action_type] || rec.action_type}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                      <span>{rec.model_used}</span>
                      {rec.content_applied && <span className="text-emerald-400">· Applied</span>}
                      {rec.error_code && <span className="text-red-400">· {rec.error_code}</span>}
                      {rec.brand_id && brands.find(b => b.id === rec.brand_id) && (
                        <span className="text-slate-600">· {brands.find(b => b.id === rec.brand_id)?.name}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right shrink-0">
                  <div className="text-[10px] text-slate-600">
                    <span>{rec.input_units} in / {rec.output_units} out</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    ${rec.estimated_cost.toFixed(6)}
                  </div>
                  <div className="text-[10px] text-slate-600">
                    {new Date(rec.created_at).toLocaleDateString()} {new Date(rec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}