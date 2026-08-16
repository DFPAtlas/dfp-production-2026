'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Send, Search, Clock, CheckCircle2, XCircle, AlertTriangle, FileText } from 'lucide-react';

interface SentCampaign {
  id: string;
  name: string;
  status: string;
  campaign_type: string;
  created_at: string;
  updated_at: string;
}

export default function SentPage() {
  const [campaigns, setCampaigns] = useState<SentCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('email_campaigns')
        .select('id, name, status, campaign_type, created_at, updated_at')
        .in('status', ['sent', 'sending', 'scheduled', 'cancelled', 'failed'])
        .order('updated_at', { ascending: false })
        .limit(100);
      if (data) setCampaigns(data as SentCampaign[]);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = campaigns.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    sent: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    sending: { icon: Clock, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
    scheduled: { icon: Clock, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
    cancelled: { icon: XCircle, color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' },
    failed: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/email" className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Sent & Scheduled</h1>
          <p className="text-sm text-slate-400 mt-1">Campaigns that have been sent, are scheduled, or were cancelled.</p>
        </div>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search sent campaigns..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 pr-4 py-2.5 w-full bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 transition-all"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-[rgba(255,255,255,0.04)] flex items-center justify-center mb-4">
            <Send className="w-7 h-7 text-slate-600" />
          </div>
          <p className="text-lg font-semibold text-white mb-1">No sent campaigns yet</p>
          <p className="text-sm text-slate-400 text-center max-w-sm mb-6">Campaigns that have been sent or scheduled will appear here.</p>
          <Link href="/admin/email/campaigns" className="px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
            View Campaigns
          </Link>
        </div>
      ) : (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase">Campaign</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                {filtered.map((c) => {
                  const cfg = statusConfig[c.status] || statusConfig.sent;
                  const Icon = cfg.icon;
                  return (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3.5">
                        <Link href={`/admin/email/campaigns/${c.id}`} className="text-sm font-medium text-white hover:text-[#06B6D4] transition-colors cursor-pointer truncate block">
                          {c.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="text-xs text-slate-400 capitalize">{c.campaign_type}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase border ${cfg.bg} ${cfg.color}`}>
                          <Icon className="w-3 h-3" />
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-xs text-slate-500">
                          {c.updated_at ? new Date(c.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}