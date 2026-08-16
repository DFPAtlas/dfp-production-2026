'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  BarChart3, TrendingUp, Mail, MousePointerClick, AlertTriangle,
  ShieldOff, Users, Ban, ArrowUpRight, ArrowDownRight,
  Eye, Calendar, Filter, Download, RefreshCw, ChevronDown,
} from 'lucide-react';
import {
  AnalyticsSummary, emptySummary, calcRate, DateRange, DATE_RANGE_LABELS,
  getDateRangeStart, CampaignReport, AutomationReport, TransactionalReport,
} from '@/components/admin/email/analytics/analytics-types';
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Tooltip, CartesianGrid, Area } from 'recharts';

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary>(emptySummary());
  const [campaigns, setCampaigns] = useState<CampaignReport[]>([]);
  const [automations, setAutomations] = useState<AutomationReport[]>([]);
  const [transactional, setTransactional] = useState<TransactionalReport[]>([]);
  const [chartData, setChartData] = useState<{ date: string; sent: number; delivered: number; opened: number }[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  const dateStart = getDateRangeStart(dateRange, customStart);
  const dateEnd = customEnd || new Date().toISOString();

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    const { data: profile } = userId ? await supabase.from('admin_profiles').select('organisation_id').eq('id', userId).maybeSingle() : { data: null };
    const orgId = profile?.organisation_id;

    let jobQuery = supabase.from('email_campaign_send_jobs').select('*', { count: 'exact' });
    if (orgId) jobQuery = jobQuery.eq('organisation_id', orgId);
    jobQuery = jobQuery.gte('created_at', dateStart);
    const { data: jobs, error: jobsErr } = await jobQuery;

    let deliveryQuery = supabase.from('email_delivery_events').select('event_type', { count: 'exact' });
    if (orgId) deliveryQuery = deliveryQuery.eq('organisation_id', orgId);
    deliveryQuery = deliveryQuery.gte('event_time', dateStart);
    const { data: events, count: eventsCount } = await deliveryQuery;

    let execQuery = supabase.from('email_automation_executions').select('*', { count: 'exact' });
    if (orgId) execQuery = execQuery.eq('organisation_id', orgId);
    execQuery = execQuery.gte('created_at', dateStart);
    const { data: executions } = await execQuery;

    const campaignQuery = supabase.from('email_campaigns').select('*').order('created_at', { ascending: false }).limit(20);
    const { data: campaignData } = await campaignQuery;

    const autoQuery = supabase.from('email_automations').select('*').order('created_at', { ascending: false }).limit(20);
    const { data: autoData } = await autoQuery;

    const txQuery = supabase.from('email_transactional_mappings').select('*');
    const { data: txData } = await txQuery;

    const { data: brandData } = await supabase.from('email_brand_kits').select('id, name');
    if (brandData) setBrands(brandData as { id: string; name: string }[]);

    const subs = summary;
    if (jobs) {
      subs.sent = jobs.reduce((a, j) => a + (j.submitted_count || 0), 0);
      subs.delivered = jobs.reduce((a, j) => a + (j.delivered_count || 0), 0);
      subs.failed = jobs.reduce((a, j) => a + (j.failed_count || 0), 0);
      subs.deliveryRate = calcRate(subs.delivered, subs.sent);
    }

    if (events) {
      const byType: Record<string, number> = {};
      events.forEach((e: { event_type: string }) => { byType[e.event_type] = (byType[e.event_type] || 0) + 1; });
      subs.uniqueOpens = byType['opened'] || 0;
      subs.uniqueClicks = byType['clicked'] || 0;
      subs.softBounces = byType['soft_bounced'] || 0;
      subs.hardBounces = byType['hard_bounced'] || 0;
      subs.complaints = byType['complained'] || 0;
      subs.unsubscribes = byType['unsubscribed'] || 0;
      subs.openRate = calcRate(subs.uniqueOpens, subs.delivered);
      subs.clickRate = calcRate(subs.uniqueClicks, subs.delivered);
      subs.clickToOpenRate = calcRate(subs.uniqueClicks, subs.uniqueOpens);
    }

    setSummary(subs);

    if (campaignData) {
      setCampaigns(campaignData.map((c: Record<string, unknown>) => ({
        id: c.id as string,
        name: (c.name as string) || 'Unnamed',
        brand: (c.brand_kit_id as string) || '—',
        subject: '',
        status: (c.status as string) || 'draft',
        sentDate: (c.created_at as string) || null,
        recipients: 0,
        delivered: 0,
        uniqueOpens: 0,
        uniqueClicks: 0,
        bounces: 0,
        unsubscribes: 0,
        complaints: 0,
      })));
    }

    if (autoData) {
      setAutomations(autoData.map((a: Record<string, unknown>) => ({
        id: a.id as string,
        name: (a.name as string) || 'Unnamed',
        status: (a.status as string) || 'draft',
        triggerCount: 0, started: 0, completed: 0, stopped: 0, failed: 0,
        emailsSent: 0, deliveries: 0, opens: 0, clicks: 0,
        avgCompletionMs: null, delayedCount: 0, topFailureStep: null,
      })));
    }

    if (txData) {
      setTransactional(txData.map((t: Record<string, unknown>) => ({
        eventKey: (t.event_key as string) || '',
        product: (t.product_name as string) || '',
        internalName: (t.internal_name as string) || '',
        triggered: 0, submitted: 0, delivered: 0, failed: 0,
        hardBounces: 0, softBounces: 0, complaints: 0,
        medianResponseMs: null, recentIncident: false,
        activeTemplate: (t.template_id as string) || null,
        activeSender: (t.sender_config as Record<string, unknown>)?.from_email as string || null,
      })));
    }

    const chartRows: { date: string; sent: number; delivered: number; opened: number }[] = [];
    if (jobs && jobs.length > 0) {
      const jobMap: Record<string, { sent: number; delivered: number; opened: number }> = {};
      jobs.forEach((j: { created_at?: string; submitted_count?: number; delivered_count?: number }) => {
        const dateKey = (j.created_at || '').slice(0, 10);
        if (!dateKey) return;
        if (!jobMap[dateKey]) jobMap[dateKey] = { sent: 0, delivered: 0, opened: 0 };
        jobMap[dateKey].sent += j.submitted_count || 0;
        jobMap[dateKey].delivered += j.delivered_count || 0;
      });
      for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        chartRows.push({ date: key, sent: jobMap[key]?.sent || 0, delivered: jobMap[key]?.delivered || 0, opened: jobMap[key]?.opened || 0 });
      }
    } else {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        chartRows.push({ date: d.toISOString().slice(0, 10), sent: 0, delivered: 0, opened: 0 });
      }
    }
    setChartData(chartRows);

    setLoading(false);
  }, [dateStart, dateRange, customStart, customEnd]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const KPI_CARDS = [
    { label: 'Sent', value: summary.sent.toLocaleString(), icon: Mail, color: 'text-slate-400', bg: 'bg-slate-500/10' },
    { label: 'Delivered', value: summary.delivered.toLocaleString(), icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Delivery Rate', value: summary.deliveryRate !== null ? `${summary.deliveryRate}%` : 'N/A', icon: ShieldOff, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Unique Opens', value: summary.uniqueOpens.toLocaleString(), icon: Eye, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Open Rate', value: summary.openRate !== null ? `${summary.openRate}%` : 'N/A', icon: BarChart3, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Unique Clicks', value: summary.uniqueClicks.toLocaleString(), icon: MousePointerClick, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Hard Bounces', value: summary.hardBounces.toLocaleString(), icon: Ban, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Complaints', value: summary.complaints.toLocaleString(), icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Email Analytics</h1>
          <p className="text-sm text-slate-400 mt-0.5">Monitor delivery, engagement, failures and email performance across Digital Footprint products.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-[#121215] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-300 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer whitespace-nowrap"
            >
              <Calendar className="w-4 h-4 text-slate-500" />
              {DATE_RANGE_LABELS[dateRange]}
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>
            {dateDropdownOpen && (
              <div className="absolute right-0 top-11 w-48 bg-[#1E293B] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl overflow-hidden z-50">
                {(['today', '7d', '30d', '90d'] as DateRange[]).map(r => (
                  <button key={r} onClick={() => { setDateRange(r); setDateDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer whitespace-nowrap ${dateRange === r ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'text-slate-300 hover:bg-white/[0.04]'}`}
                  >{DATE_RANGE_LABELS[r]}</button>
                ))}
                <div className="border-t border-[rgba(255,255,255,0.06)] px-4 py-2.5">
                  <p className="text-[10px] text-slate-500 mb-1.5">Custom range</p>
                  <div className="flex gap-2">
                    <input type="date" value={customStart} onChange={(e) => { setCustomStart(e.target.value); setDateRange('custom'); }}
                      className="flex-1 px-2 py-1 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30"
                    />
                    <input type="date" value={customEnd} onChange={(e) => { setCustomEnd(e.target.value); setDateRange('custom'); }}
                      className="flex-1 px-2 py-1 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30"
                    />
                  </div>
                </div>
              </div>
            )}
            {dateDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setDateDropdownOpen(false)} />}
          </div>
          <button onClick={fetchAnalytics} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {KPI_CARDS.map(kpi => (
          <div key={kpi.label} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider">{kpi.label}</span>
              <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{loading ? '—' : kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Sends & Deliveries</h3>
          <div className="h-[260px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs><linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} /><stop offset="95%" stopColor="#06B6D4" stopOpacity={0} /></linearGradient><linearGradient id="deliveredGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="sent" stroke="#06B6D4" fill="url(#sentGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="delivered" stroke="#10B981" fill="url(#deliveredGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">No chart data available</div>
            )}
          </div>
        </div>

        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Quick Navigation</h3>
          <div className="space-y-2">
            <Link href="/admin/email/analytics/campaigns" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-[rgba(255,255,255,0.04)] hover:border-[#06B6D4]/20 hover:bg-[#06B6D4]/5 transition-all cursor-pointer group">
              <Mail className="w-5 h-5 text-slate-500 group-hover:text-[#06B6D4]" />
              <div><p className="text-sm font-medium text-white">Campaign Reports</p><p className="text-[10px] text-slate-500">Per-campaign performance</p></div>
            </Link>
            <Link href="/admin/email/analytics/automations" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-[rgba(255,255,255,0.04)] hover:border-[#06B6D4]/20 hover:bg-[#06B6D4]/5 transition-all cursor-pointer group">
              <TrendingUp className="w-5 h-5 text-slate-500 group-hover:text-[#06B6D4]" />
              <div><p className="text-sm font-medium text-white">Automation Analytics</p><p className="text-[10px] text-slate-500">Workflow execution stats</p></div>
            </Link>
            <Link href="/admin/email/analytics/transactional" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-[rgba(255,255,255,0.04)] hover:border-[#06B6D4]/20 hover:bg-[#06B6D4]/5 transition-all cursor-pointer group">
              <ShieldOff className="w-5 h-5 text-slate-500 group-hover:text-[#06B6D4]" />
              <div><p className="text-sm font-medium text-white">Transactional Health</p><p className="text-[10px] text-slate-500">System email delivery</p></div>
            </Link>
            <Link href="/admin/email/analytics/deliverability" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-[rgba(255,255,255,0.04)] hover:border-[#06B6D4]/20 hover:bg-[#06B6D4]/5 transition-all cursor-pointer group">
              <AlertTriangle className="w-5 h-5 text-slate-500 group-hover:text-[#06B6D4]" />
              <div><p className="text-sm font-medium text-white">Deliverability</p><p className="text-[10px] text-slate-500">Bounce & complaint rates</p></div>
            </Link>
            <Link href="/admin/email/suppressions" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-[rgba(255,255,255,0.04)] hover:border-[#06B6D4]/20 hover:bg-[#06B6D4]/5 transition-all cursor-pointer group">
              <Ban className="w-5 h-5 text-slate-500 group-hover:text-[#06B6D4]" />
              <div><p className="text-sm font-medium text-white">Suppression List</p><p className="text-[10px] text-slate-500">Manage blocked addresses</p></div>
            </Link>
            <Link href="/admin/email/analytics/links" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-[rgba(255,255,255,0.04)] hover:border-[#06B6D4]/20 hover:bg-[#06B6D4]/5 transition-all cursor-pointer group">
              <MousePointerClick className="w-5 h-5 text-slate-500 group-hover:text-[#06B6D4]" />
              <div><p className="text-sm font-medium text-white">Link Performance</p><p className="text-[10px] text-slate-500">Click tracking & UTM</p></div>
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Recent Campaigns</h3>
          <Link href="/admin/email/analytics/campaigns" className="text-xs text-[#06B6D4] hover:underline cursor-pointer">View all</Link>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500 text-center py-6">Loading...</p>
        ) : campaigns.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">No campaign data yet. Send a campaign to see analytics here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 font-medium">Campaign</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Created</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.slice(0, 5).map(c => (
                  <tr key={c.id} className="border-t border-[rgba(255,255,255,0.04)]">
                    <td className="py-3"><span className="text-white font-medium">{c.name}</span></td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                        c.status === 'sent' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        c.status === 'sending' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                        c.status === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}>{c.status}</span>
                    </td>
                    <td className="py-3 text-slate-400 text-xs">{c.sentDate ? new Date(c.sentDate).toLocaleDateString() : '—'}</td>
                    <td className="py-3 text-right">
                      <Link href={`/admin/email/campaigns/${c.id}`} className="text-xs text-[#06B6D4] hover:underline cursor-pointer">Open</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}