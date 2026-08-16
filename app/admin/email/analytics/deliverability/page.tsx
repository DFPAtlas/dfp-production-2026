'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, RefreshCw, TrendingUp, AlertTriangle, Ban, ShieldOff, CheckCircle2, XCircle } from 'lucide-react';
import { DeliverabilitySummary, calcRate } from '@/components/admin/email/analytics/analytics-types';
import { BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Bar } from 'recharts';

export default function DeliverabilityDashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DeliverabilitySummary>({
    deliveryRate: null, hardBounceRate: null, softBounceRate: null,
    complaintRate: null, unsubscribeRate: null, rejectionRate: null,
    senderHealth: [], domainHealth: [], incidents: [],
  });
  const [chartData, setChartData] = useState<{ name: string; delivery: number; bounces: number; complaints: number }[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    const { data: profile } = userId ? await supabase.from('admin_profiles').select('organisation_id').eq('id', userId).maybeSingle() : { data: null };
    const orgId = profile?.organisation_id;

    let eventsQuery = supabase.from('email_delivery_events').select('event_type', { count: 'exact' });
    if (orgId) eventsQuery = eventsQuery.eq('organisation_id', orgId);
    const { data: events } = await eventsQuery;

    const byType: Record<string, number> = {};
    if (events) events.forEach((e: { event_type: string }) => { byType[e.event_type] = (byType[e.event_type] || 0) + 1; });

    const totalSent = (byType['sent'] || 0);
    const totalDelivered = (byType['delivered'] || 0);
    const hardBounces = (byType['hard_bounced'] || 0);
    const softBounces = (byType['soft_bounced'] || 0);
    const complaints = (byType['complained'] || 0);
    const unsubs = (byType['unsubscribed'] || 0);

    setSummary({
      deliveryRate: calcRate(totalDelivered, totalSent),
      hardBounceRate: calcRate(hardBounces, totalSent),
      softBounceRate: calcRate(softBounces, totalSent),
      complaintRate: calcRate(complaints, totalSent),
      unsubscribeRate: calcRate(unsubs, totalSent),
      rejectionRate: calcRate((totalSent - totalDelivered), totalSent),
      senderHealth: [{ name: 'Digital Footprint', email: 'noreply@digital-footprint.uk', deliveryRate: calcRate(totalDelivered, totalSent), status: 'verified' }],
      domainHealth: [{ domain: 'digital-footprint.uk', deliveryRate: calcRate(totalDelivered, totalSent), bounces: hardBounces + softBounces, complaints }],
      incidents: [],
    });

    setChartData([
      { name: 'Delivery', delivery: totalDelivered, bounces: 0, complaints: 0 },
      { name: 'Hard Bounces', delivery: 0, bounces: hardBounces, complaints: 0 },
      { name: 'Soft Bounces', delivery: 0, bounces: softBounces, complaints: 0 },
      { name: 'Complaints', delivery: 0, bounces: 0, complaints },
    ]);

    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const METRICS = [
    { label: 'Delivery Rate', value: summary.deliveryRate !== null ? `${summary.deliveryRate}%` : 'N/A', icon: CheckCircle2, color: 'text-emerald-400', warning: false },
    { label: 'Hard Bounce Rate', value: summary.hardBounceRate !== null ? `${summary.hardBounceRate}%` : 'N/A', icon: Ban, color: 'text-red-400', warning: summary.hardBounceRate !== null && summary.hardBounceRate > 5 },
    { label: 'Soft Bounce Rate', value: summary.softBounceRate !== null ? `${summary.softBounceRate}%` : 'N/A', icon: AlertTriangle, color: 'text-orange-400', warning: false },
    { label: 'Complaint Rate', value: summary.complaintRate !== null ? `${summary.complaintRate}%` : 'N/A', icon: XCircle, color: 'text-rose-400', warning: summary.complaintRate !== null && summary.complaintRate > 0.1 },
    { label: 'Unsubscribe Rate', value: summary.unsubscribeRate !== null ? `${summary.unsubscribeRate}%` : 'N/A', icon: ShieldOff, color: 'text-slate-400', warning: false },
    { label: 'Rejection Rate', value: summary.rejectionRate !== null ? `${summary.rejectionRate}%` : 'N/A', icon: TrendingUp, color: 'text-amber-400', warning: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/email/analytics" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer whitespace-nowrap">
          <ArrowLeft className="w-4 h-4" /> Analytics
        </Link>
        <span className="text-slate-600">/</span>
        <h2 className="text-lg font-bold text-white">Deliverability</h2>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">Bounce rates, complaint monitoring, sender reputation and domain health.</p>
        <button onClick={fetchData} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {METRICS.map(m => (
          <div key={m.label} className={`bg-[#121215] border rounded-2xl p-4 ${m.warning ? 'border-red-500/20' : 'border-[rgba(255,255,255,0.06)]'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">{m.label}</span>
              <m.icon className={`w-4 h-4 ${m.color}`} />
            </div>
            <p className={`text-xl font-bold ${m.warning ? 'text-red-400' : 'text-white'}`}>{loading ? '—' : m.value}</p>
            {m.warning && <p className="text-[10px] text-red-400/70 mt-0.5">Above threshold</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Bounce & Complaint Breakdown</h3>
          <div className="h-[240px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} />
                  <Bar dataKey="delivery" fill="#10B981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="bounces" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="complaints" fill="#EF4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">No data yet</div>
            )}
          </div>
        </div>

        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Sender Profile Health</h3>
          {summary.senderHealth.map((s, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-[rgba(255,255,255,0.04)]">
              <div>
                <p className="text-sm font-medium text-white">{s.name}</p>
                <p className="text-[10px] text-slate-500">{s.email}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-400">{s.deliveryRate !== null ? `${s.deliveryRate}%` : 'N/A'}</p>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400">{s.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Domain Health</h3>
        {summary.domainHealth.length === 0 ? (
          <p className="text-sm text-slate-500">No domain data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 font-medium">Domain</th>
                  <th className="pb-3 font-medium text-right">Delivery Rate</th>
                  <th className="pb-3 font-medium text-right">Bounces</th>
                  <th className="pb-3 font-medium text-right">Complaints</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {summary.domainHealth.map((d, i) => (
                  <tr key={i} className="border-t border-[rgba(255,255,255,0.04)]">
                    <td className="py-3 text-white font-medium">{d.domain}</td>
                    <td className="py-3 text-right text-emerald-400">{d.deliveryRate !== null ? `${d.deliveryRate}%` : 'N/A'}</td>
                    <td className="py-3 text-right text-orange-400">{d.bounces}</td>
                    <td className="py-3 text-right text-rose-400">{d.complaints}</td>
                    <td className="py-3"><span className="px-2 py-0.5 rounded-md text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Verified</span></td>
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