'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Globe, ArrowLeft, CheckCircle2, XCircle, AlertTriangle,
  TrendingUp, TrendingDown, BarChart3, Shield, Search,
} from 'lucide-react';

interface DomainAsset {
  id: string;
  name: string;
  type: string;
  brand: string | null;
  provider: string | null;
  state: string;
  delivery_rate: number | null;
  bounce_rate: number | null;
  complaint_rate: number | null;
  deferral_count: number | null;
  rejection_count: number | null;
  monthly_volume: number | null;
  last_checked: string | null;
  authentication: Record<string, unknown> | null;
  verification_status: Record<string, unknown> | null;
}

const STATE_META: Record<string, { label: string; color: string; bg: string }> = {
  healthy: { label: 'Healthy', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  needs_attention: { label: 'Needs Attention', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  degraded: { label: 'Degraded', color: 'text-red-400', bg: 'bg-red-400/10' },
  warming: { label: 'Warming', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  paused: { label: 'Paused', color: 'text-slate-400', bg: 'bg-slate-400/10' },
  blocked: { label: 'Blocked', color: 'text-red-500', bg: 'bg-red-500/10' },
  not_configured: { label: 'Not Configured', color: 'text-slate-600', bg: 'bg-slate-600/10' },
};

function authBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (v && typeof v === 'object') {
    const obj = v as Record<string, unknown>;
    if (typeof obj.present === 'boolean') return obj.present;
    if (typeof obj.verified === 'boolean') return obj.verified;
    if (typeof obj.valid === 'boolean') return obj.valid;
    return Object.keys(obj).length > 0;
  }
  return Boolean(v);
}

export default function ReputationDomains() {
  const [domains, setDomains] = useState<DomainAsset[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('email_reputation_assets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      const rows = ((data || []) as Record<string, unknown>[])
        .filter((a) => typeof a.asset_type === 'string' && (a.asset_type as string).includes('domain'))
        .map((a) => ({
          id: a.id as string,
          name: ((a.domain_value as string) || (a.name as string) || 'Unknown domain') as string,
          type: a.asset_type as string,
          brand: (a.brand as string) || null,
          provider: (a.provider as string) || null,
          state: (a.health_state as string) || 'not_configured',
          delivery_rate: a.delivery_rate as number | null,
          bounce_rate: a.bounce_rate as number | null,
          complaint_rate: a.complaint_rate as number | null,
          deferral_count: a.deferral_count as number | null,
          rejection_count: a.rejection_count as number | null,
          monthly_volume: a.monthly_volume as number | null,
          last_checked: (a.last_checked_at as string) || null,
          authentication: (a.authentication as Record<string, unknown>) || null,
          verification_status: (a.verification_status as Record<string, unknown>) || null,
        }));
      setDomains(rows);
      if (rows.length > 0) setSelectedId(rows[0].id);
      setLoading(false);
    };
    load();
  }, []);

  const selectedDomain = domains.find((d) => d.id === selectedId) || null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-72 bg-[#121215] rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="h-64 bg-[#121215] rounded-2xl animate-pulse" />
          <div className="lg:col-span-3 h-64 bg-[#121215] rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/email/reputation" className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Domain Reputation</h1>
          <p className="text-xs text-slate-400 mt-0.5">Authentication monitoring, delivery signals and health per domain</p>
        </div>
      </div>

      {domains.length === 0 ? (
        <div className="text-center py-24 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl">
          <Globe className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-sm text-slate-400">No sending domains recorded yet</p>
          <p className="text-xs text-slate-500 mt-1">Configure domains in Reputation Settings to start tracking.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1 space-y-2">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider px-1">Domains</p>
            {domains.map((d) => {
              const meta = STATE_META[d.state] || STATE_META.not_configured;
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedId(d.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedId === d.id
                      ? 'bg-[#06B6D4]/5 border-[#06B6D4]/20'
                      : 'bg-white/[0.02] border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Globe className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-sm font-medium text-white truncate">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${meta.bg} ${meta.color}`}>{meta.label}</span>
                    <span className="text-[10px] text-slate-500 capitalize">{d.type.replace(/_/g, ' ')}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-3 space-y-6">
            {selectedDomain && (
              <>
                <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Globe className="w-5 h-5 text-[#06B6D4]" />
                        <h2 className="text-lg font-bold text-white">{selectedDomain.name}</h2>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${STATE_META[selectedDomain.state]?.bg} ${STATE_META[selectedDomain.state]?.color}`}>
                          {STATE_META[selectedDomain.state]?.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{selectedDomain.type.replace(/_/g, ' ')} · {selectedDomain.brand || '—'} · {selectedDomain.provider || '—'}</p>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      Last checked: {selectedDomain.last_checked ? new Date(selectedDomain.last_checked).toLocaleString('en-GB') : '—'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl p-4">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">SPF</h3>
                      {authBool(selectedDomain.authentication?.spf) ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm text-white font-medium">Passing</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-400" />
                          <span className="text-sm text-slate-400 font-medium">Not verified</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl p-4">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">DKIM</h3>
                      {authBool(selectedDomain.authentication?.dkim) ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm text-white font-medium">Verified</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-400" />
                          <span className="text-sm text-slate-400 font-medium">Not verified</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl p-4">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">DMARC</h3>
                      {authBool(selectedDomain.authentication?.dmarc) ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm text-white font-medium">Enforced</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-400" />
                          <span className="text-sm text-slate-400 font-medium">Not enforced</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
                  <h2 className="text-sm font-bold text-white mb-4">Delivery Signals</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Delivery Rate</p>
                      <p className={`text-xl font-bold ${selectedDomain.delivery_rate === null ? 'text-slate-500' : selectedDomain.delivery_rate >= 97 ? 'text-emerald-400' : selectedDomain.delivery_rate >= 94 ? 'text-amber-400' : 'text-red-400'}`}>
                        {selectedDomain.delivery_rate !== null ? `${selectedDomain.delivery_rate}%` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">30-Day Volume</p>
                      <p className="text-xl font-bold text-white">{(selectedDomain.monthly_volume || 0).toLocaleString()}</p>
                      <p className="text-[10px] text-slate-500">emails</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Deferred</p>
                      <p className={`text-xl font-bold ${(selectedDomain.deferral_count || 0) > 100 ? 'text-amber-400' : 'text-white'}`}>{selectedDomain.deferral_count ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Rejected</p>
                      <p className={`text-xl font-bold ${(selectedDomain.rejection_count || 0) > 50 ? 'text-red-400' : 'text-white'}`}>{selectedDomain.rejection_count ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Provider</p>
                      <p className="text-xl font-bold text-white">{selectedDomain.provider || '—'}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-[rgba(255,255,255,0.04)]">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Bounce Rate</p>
                      <p className={`text-lg font-bold ${selectedDomain.bounce_rate !== null && selectedDomain.bounce_rate > 2 ? 'text-red-400' : 'text-white'}`}>
                        {selectedDomain.bounce_rate !== null ? `${selectedDomain.bounce_rate}%` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Complaint Rate</p>
                      <p className={`text-lg font-bold ${selectedDomain.complaint_rate !== null && selectedDomain.complaint_rate > 0.2 ? 'text-red-400' : 'text-white'}`}>
                        {selectedDomain.complaint_rate !== null ? `${selectedDomain.complaint_rate}%` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Health State</p>
                      <p className="text-lg font-bold text-white capitalize">{(selectedDomain.state || 'unknown').replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
                  <h2 className="text-sm font-bold text-white mb-3">Remediation Guidance</h2>
                  <div className="space-y-2 text-xs text-slate-400">
                    {selectedDomain.state === 'needs_attention' && (
                      <p className="flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>Delivery or complaint rates are outside healthy ranges. Verify audience quality and remove invalid contacts.</span>
                      </p>
                    )}
                    {selectedDomain.state === 'degraded' && (
                      <p className="flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                        <span>Domain health is degraded. Review recent sends, suppression rules and authentication records immediately.</span>
                      </p>
                    )}
                    {selectedDomain.state === 'healthy' && (
                      <p className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>All signals within healthy ranges. Continue monitoring and maintain list hygiene.</span>
                      </p>
                    )}
                    <p className="flex items-start gap-2 mt-2">
                      <Shield className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span>Ensure SPF, DKIM and DMARC are configured in your provider dashboard and reflected in this inventory.</span>
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}