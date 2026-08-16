'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Search, Filter, Mail, Eye, MousePointerClick, AlertTriangle, Ban, RefreshCw, ExternalLink } from 'lucide-react';
import { CampaignReport } from '@/components/admin/email/analytics/analytics-types';

export default function CampaignAnalytics() {
  const [campaigns, setCampaigns] = useState<CampaignReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    const { data: profile } = userId ? await supabase.from('admin_profiles').select('organisation_id').eq('id', userId).maybeSingle() : { data: null };
    const orgId = profile?.organisation_id;

    let query = supabase.from('email_campaigns').select('*').order('created_at', { ascending: false });
    if (orgId) query = query.eq('organisation_id', orgId);
    const { data } = await query;

    const { data: jobs } = await supabase.from('email_campaign_send_jobs').select('*');

    if (data) {
      const reports: CampaignReport[] = await Promise.all((data as Record<string, unknown>[]).map(async (c) => {
        const cId = c.id as string;
        const campaignJobs = (jobs || []).filter(j => j.campaign_id === cId);

        const delivered = 0, opens = 0, clicks = 0, bounces = 0, unsubs = 0, complaints = 0;
        const { count: delCount } = await supabase.from('email_delivery_events').select('*', { count: 'exact' }).eq('campaign_id', cId).eq('event_type', 'delivered');
        const { count: openCount } = await supabase.from('email_delivery_events').select('*', { count: 'exact' }).eq('campaign_id', cId).eq('event_type', 'opened');
        const { count: clickCount } = await supabase.from('email_delivery_events').select('*', { count: 'exact' }).eq('campaign_id', cId).eq('event_type', 'clicked');
        const { count: bounceCount } = await supabase.from('email_delivery_events').select('*', { count: 'exact' }).eq('campaign_id', cId).in('event_type', ['soft_bounced', 'hard_bounced']);
        const { count: compCount } = await supabase.from('email_delivery_events').select('*', { count: 'exact' }).eq('campaign_id', cId).eq('event_type', 'complained');
        const { count: unsCount } = await supabase.from('email_delivery_events').select('*', { count: 'exact' }).eq('campaign_id', cId).eq('event_type', 'unsubscribed');

        const jobRecipients = campaignJobs.reduce((a, j) => a + (j.submitted_count || 0), 0);
        const jobDelivered = campaignJobs.reduce((a, j) => a + (j.delivered_count || 0), 0);

        return {
          id: cId,
          name: (c.name as string) || 'Unnamed',
          brand: (c.brand_kit_id as string) || '—',
          subject: '',
          status: (c.status as string) || 'draft',
          sentDate: (c.created_at as string) || null,
          recipients: jobRecipients,
          delivered: jobDelivered || (delCount || 0),
          uniqueOpens: openCount || 0,
          uniqueClicks: clickCount || 0,
          bounces: bounceCount || 0,
          unsubscribes: unsCount || 0,
          complaints: compCount || 0,
        };
      }));
      setCampaigns(reports);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = campaigns.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && c.status !== statusFilter) return false;
    return true;
  });

  const STATUS_OPTIONS = ['draft', 'sending', 'sent', 'failed', 'cancelled'];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/email/analytics" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer whitespace-nowrap">
          <ArrowLeft className="w-4 h-4" /> Analytics
        </Link>
        <span className="text-slate-600">/</span>
        <h2 className="text-lg font-bold text-white">Campaign Reports</h2>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns..." className="w-full pl-9 pr-4 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={fetchData} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Mail className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No campaign reports found</p>
        </div>
      ) : (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)] text-left text-[11px] text-slate-500 uppercase tracking-wider">
                  <th className="p-4 font-medium">Campaign</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Recipients</th>
                  <th className="p-4 font-medium text-right">Delivered</th>
                  <th className="p-4 font-medium text-right">Opens</th>
                  <th className="p-4 font-medium text-right">Clicks</th>
                  <th className="p-4 font-medium text-right">Bounces</th>
                  <th className="p-4 font-medium text-right">Unsubs</th>
                  <th className="p-4 font-medium text-right">Complaints</th>
                  <th className="p-4 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02]">
                    <td className="p-4"><span className="text-white font-medium">{c.name}</span><p className="text-[10px] text-slate-500">{c.sentDate ? new Date(c.sentDate).toLocaleDateString() : '—'}</p></td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                        c.status === 'sent' ? 'bg-emerald-500/10 text-emerald-400' :
                        c.status === 'sending' ? 'bg-cyan-500/10 text-cyan-400' :
                        c.status === 'failed' ? 'bg-red-500/10 text-red-400' : 'bg-slate-500/10 text-slate-400'
                      }`}>{c.status}</span>
                    </td>
                    <td className="p-4 text-right text-slate-300">{c.recipients.toLocaleString()}</td>
                    <td className="p-4 text-right text-emerald-400">{c.delivered.toLocaleString()}</td>
                    <td className="p-4 text-right text-violet-400">{c.uniqueOpens.toLocaleString()}</td>
                    <td className="p-4 text-right text-amber-400">{c.uniqueClicks.toLocaleString()}</td>
                    <td className="p-4 text-right text-red-400">{c.bounces.toLocaleString()}</td>
                    <td className="p-4 text-right text-orange-400">{c.unsubscribes.toLocaleString()}</td>
                    <td className="p-4 text-right text-rose-400">{c.complaints.toLocaleString()}</td>
                    <td className="p-4 text-right">
                      <Link href={`/admin/email/campaigns/${c.id}`} className="text-xs text-[#06B6D4] hover:underline cursor-pointer"><ExternalLink className="w-3.5 h-3.5 inline" /></Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}