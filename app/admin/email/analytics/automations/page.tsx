'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Search, RefreshCw, Workflow, TrendingUp, AlertTriangle, Clock, ExternalLink } from 'lucide-react';
import { AutomationReport } from '@/components/admin/email/analytics/analytics-types';
import { AUTOMATION_STATUS_COLORS, AUTOMATION_STATUS_LABELS } from '@/components/admin/email/automations/automation-types';

export default function AutomationAnalytics() {
  const [reports, setReports] = useState<AutomationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    const { data: profile } = userId ? await supabase.from('admin_profiles').select('organisation_id').eq('id', userId).maybeSingle() : { data: null };
    const orgId = profile?.organisation_id;

    let query = supabase.from('email_automations').select('*').order('created_at', { ascending: false });
    if (orgId) query = query.eq('organisation_id', orgId);
    const { data: automations } = await query;

    if (automations) {
      const result: AutomationReport[] = await Promise.all((automations as Record<string, unknown>[]).map(async (a) => {
        const aId = a.id as string;
        const { count: execCount } = await supabase.from('email_automation_executions').select('*', { count: 'exact' }).eq('automation_id', aId);
        const { count: completed } = await supabase.from('email_automation_executions').select('*', { count: 'exact' }).eq('automation_id', aId).eq('status', 'completed');
        const { count: stopped } = await supabase.from('email_automation_executions').select('*', { count: 'exact' }).eq('automation_id', aId).eq('status', 'stopped');
        const { count: failed } = await supabase.from('email_automation_executions').select('*', { count: 'exact' }).eq('automation_id', aId).eq('status', 'failed');
        const { count: waiting } = await supabase.from('email_automation_executions').select('*', { count: 'exact' }).eq('automation_id', aId).eq('status', 'waiting');

        const { count: sentEvents } = await supabase.from('email_delivery_events').select('*', { count: 'exact' }).eq('automation_id', aId).eq('event_type', 'sent');
        const { count: delivered } = await supabase.from('email_delivery_events').select('*', { count: 'exact' }).eq('automation_id', aId).eq('event_type', 'delivered');
        const { count: opens } = await supabase.from('email_delivery_events').select('*', { count: 'exact' }).eq('automation_id', aId).eq('event_type', 'opened');
        const { count: clicks } = await supabase.from('email_delivery_events').select('*', { count: 'exact' }).eq('automation_id', aId).eq('event_type', 'clicked');

        return {
          id: aId,
          name: (a.name as string) || 'Unnamed',
          status: (a.status as string) || 'draft',
          triggerCount: execCount || 0,
          started: execCount || 0,
          completed: completed || 0,
          stopped: stopped || 0,
          failed: failed || 0,
          emailsSent: sentEvents || 0,
          deliveries: delivered || 0,
          opens: opens || 0,
          clicks: clicks || 0,
          avgCompletionMs: null,
          delayedCount: waiting || 0,
          topFailureStep: null,
        };
      }));
      setReports(result);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = reports.filter(r => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/email/analytics" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer whitespace-nowrap">
          <ArrowLeft className="w-4 h-4" /> Analytics
        </Link>
        <span className="text-slate-600">/</span>
        <h2 className="text-lg font-bold text-white">Automation Analytics</h2>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search automations..." className="w-full pl-9 pr-4 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8"
        >
          <option value="">All Statuses</option>
          {Object.entries(AUTOMATION_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
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
          <Workflow className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No automation reports found</p>
        </div>
      ) : (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)] text-left text-[11px] text-slate-500 uppercase tracking-wider">
                  <th className="p-4 font-medium">Automation</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Triggered</th>
                  <th className="p-4 font-medium text-right">Completed</th>
                  <th className="p-4 font-medium text-right">Failed</th>
                  <th className="p-4 font-medium text-right">Emails Sent</th>
                  <th className="p-4 font-medium text-right">Delivered</th>
                  <th className="p-4 font-medium text-right">Opens</th>
                  <th className="p-4 font-medium text-right">Clicks</th>
                  <th className="p-4 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02]">
                    <td className="p-4"><span className="text-white font-medium">{r.name}</span></td>
                    <td className="p-4"><span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${AUTOMATION_STATUS_COLORS[r.status as keyof typeof AUTOMATION_STATUS_COLORS] || ''}`}>{AUTOMATION_STATUS_LABELS[r.status as keyof typeof AUTOMATION_STATUS_LABELS] || r.status}</span></td>
                    <td className="p-4 text-right text-slate-300">{r.triggerCount.toLocaleString()}</td>
                    <td className="p-4 text-right text-emerald-400">{r.completed.toLocaleString()}</td>
                    <td className="p-4 text-right text-red-400">{r.failed.toLocaleString()}</td>
                    <td className="p-4 text-right text-cyan-400">{r.emailsSent.toLocaleString()}</td>
                    <td className="p-4 text-right text-emerald-400">{r.deliveries.toLocaleString()}</td>
                    <td className="p-4 text-right text-violet-400">{r.opens.toLocaleString()}</td>
                    <td className="p-4 text-right text-amber-400">{r.clicks.toLocaleString()}</td>
                    <td className="p-4 text-right">
                      <Link href={`/admin/email/automations/${r.id}`} className="text-xs text-[#06B6D4] hover:underline cursor-pointer"><ExternalLink className="w-3.5 h-3.5 inline" /></Link>
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