'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  UserCheck, ArrowLeft, CheckCircle2, XCircle, AlertTriangle,
  Clock, TrendingUp, TrendingDown, Shield, Mail,
} from 'lucide-react';

interface SenderRow {
  id: string;
  name: string;
  email: string;
  category: string;
  state: string;
  verified: boolean;
  verified_at: string | null;
  delivery_rate: number | null;
  monthly_volume: number | null;
  bounce_rate: number | null;
  complaint_rate: number | null;
  deferral_count: number | null;
  rejection_count: number | null;
  last_used: string | null;
}

const STATE_META: Record<string, { label: string; color: string; bg: string }> = {
  healthy: { label: 'Healthy', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  warming: { label: 'Warming', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  needs_attention: { label: 'Needs Attention', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  degraded: { label: 'Degraded', color: 'text-red-400', bg: 'bg-red-400/10' },
  paused: { label: 'Paused', color: 'text-slate-400', bg: 'bg-slate-400/10' },
  blocked: { label: 'Blocked', color: 'text-red-500', bg: 'bg-red-500/10' },
  not_configured: { label: 'Not Configured', color: 'text-slate-600', bg: 'bg-slate-600/10' },
};

const CATEGORY_META: Record<string, string> = {
  transactional: 'bg-sky-400/10 text-sky-400',
  marketing: 'bg-violet-400/10 text-violet-400',
  notification: 'bg-emerald-400/10 text-emerald-400',
  system: 'bg-slate-400/10 text-slate-400',
};

export default function ReputationSenders() {
  const [senders, setSenders] = useState<SenderRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [profilesRes, assetsRes] = await Promise.all([
        supabase.from('email_sender_profiles').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('email_reputation_assets').select('*').order('created_at', { ascending: false }).limit(200),
      ]);

      const profiles = (profilesRes.data || []) as Record<string, unknown>[];
      const assets = ((assetsRes.data || []) as Record<string, unknown>[]).filter((a) => a.asset_type === 'sender_profile');

      const assetByProfile = new Map<string, Record<string, unknown>>();
      assets.forEach((a) => {
        const pid = a.sender_profile_id as string | null;
        if (pid && !assetByProfile.has(pid)) assetByProfile.set(pid, a);
      });

      const rows: SenderRow[] = profiles.map((p) => {
        const asset = assetByProfile.get(p.id as string);
        const verified = (p.verification_status as string) === 'verified';
        return {
          id: p.id as string,
          name: ((p.from_name as string) || (p.internal_name as string) || 'Sender') as string,
          email: (p.from_email as string) || '—',
          category: (p.profile_type as string) || 'transactional',
          state: (asset?.health_state as string) || ((p.status as string) === 'active' ? 'healthy' : (p.status as string) || 'not_configured'),
          verified,
          verified_at: (p.created_at as string) || null,
          delivery_rate: asset?.delivery_rate != null ? (asset.delivery_rate as number) : null,
          monthly_volume: asset?.monthly_volume != null ? (asset.monthly_volume as number) : null,
          bounce_rate: asset?.bounce_rate != null ? (asset.bounce_rate as number) : null,
          complaint_rate: asset?.complaint_rate != null ? (asset.complaint_rate as number) : null,
          deferral_count: asset?.deferral_count != null ? (asset.deferral_count as number) : null,
          rejection_count: asset?.rejection_count != null ? (asset.rejection_count as number) : null,
          last_used: (p.last_used_at as string) || null,
        };
      });

      setSenders(rows);
      if (rows.length > 0) setSelectedId(rows[0].id);
      setLoading(false);
    };
    load();
  }, []);

  const selectedSender = senders.find((s) => s.id === selectedId) || null;

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
          <h1 className="text-xl font-bold text-white">Sender Profile Reputation</h1>
          <p className="text-xs text-slate-400 mt-0.5">Delivery signals, health metrics and containment controls per sender</p>
        </div>
      </div>

      {senders.length === 0 ? (
        <div className="text-center py-24 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl">
          <UserCheck className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-sm text-slate-400">No sender profiles recorded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1 space-y-2">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider px-1">Sender Profiles</p>
            {senders.map((s) => {
              const meta = STATE_META[s.state] || STATE_META.not_configured;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedId === s.id
                      ? 'bg-[#06B6D4]/5 border-[#06B6D4]/20'
                      : 'bg-white/[0.02] border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-sm font-medium text-white truncate">{s.name}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate mb-1.5">{s.email}</p>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${meta.bg} ${meta.color}`}>{meta.label}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${CATEGORY_META[s.category] || ''}`}>{s.category}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-3 space-y-6">
            {selectedSender && (
              <>
                <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <UserCheck className="w-5 h-5 text-[#06B6D4]" />
                        <h2 className="text-lg font-bold text-white">{selectedSender.name}</h2>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${STATE_META[selectedSender.state]?.bg} ${STATE_META[selectedSender.state]?.color}`}>
                          {STATE_META[selectedSender.state]?.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{selectedSender.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl p-3">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Delivery Rate</p>
                      <p className={`text-xl font-bold ${selectedSender.delivery_rate === null ? 'text-slate-500' : selectedSender.delivery_rate >= 97 ? 'text-emerald-400' : selectedSender.delivery_rate >= 94 ? 'text-amber-400' : 'text-red-400'}`}>
                        {selectedSender.delivery_rate !== null ? `${selectedSender.delivery_rate}%` : '—'}
                      </p>
                    </div>
                    <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl p-3">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">30-Day Volume</p>
                      <p className="text-xl font-bold text-white">{(selectedSender.monthly_volume || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl p-3">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Bounce Rate</p>
                      <p className={`text-xl font-bold ${selectedSender.bounce_rate !== null && selectedSender.bounce_rate > 2 ? 'text-red-400' : 'text-white'}`}>
                        {selectedSender.bounce_rate !== null ? `${selectedSender.bounce_rate}%` : '—'}
                      </p>
                    </div>
                    <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl p-3">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Complaint Rate</p>
                      <p className={`text-xl font-bold ${selectedSender.complaint_rate !== null && selectedSender.complaint_rate > 0.2 ? 'text-red-400' : 'text-white'}`}>
                        {selectedSender.complaint_rate !== null ? `${selectedSender.complaint_rate}%` : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[rgba(255,255,255,0.04)]">
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1">Deferred</p>
                      <p className="text-sm font-medium text-white">{selectedSender.deferral_count ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1">Rejected</p>
                      <p className="text-sm font-medium text-white">{selectedSender.rejection_count ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1">Category</p>
                      <p className="text-sm font-medium text-white capitalize">{selectedSender.category}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1">Verification</p>
                      <p className={`text-sm font-medium ${selectedSender.verified ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {selectedSender.verified ? 'Verified' : 'Not verified'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
                  <h2 className="text-sm font-bold text-white mb-3">Verification & Compliance</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-[rgba(255,255,255,0.04)]">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedSender.verified ? 'bg-emerald-400/10' : 'bg-slate-400/10'}`}>
                        {selectedSender.verified ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-slate-400" />}
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">Domain Verified</p>
                        <p className="text-[10px] text-slate-500">{selectedSender.verified_at ? `Since ${new Date(selectedSender.verified_at).toLocaleDateString('en-GB')}` : 'Not verified'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-[rgba(255,255,255,0.04)]">
                      <div className="w-8 h-8 rounded-lg bg-sky-400/10 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-sky-400" />
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">Last Used</p>
                        <p className="text-[10px] text-slate-500">{selectedSender.last_used ? new Date(selectedSender.last_used).toLocaleString('en-GB') : '—'}</p>
                      </div>
                    </div>
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