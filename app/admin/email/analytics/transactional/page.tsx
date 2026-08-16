'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, RefreshCw, ShieldOff, AlertTriangle, CheckCircle2, Ban, Clock } from 'lucide-react';
import { TransactionalReport } from '@/components/admin/email/analytics/analytics-types';

const CRITICAL_EVENTS = ['account_verification', 'password_reset', 'payment_receipt', 'payment_failed', 'security_alert'];

export default function TransactionalAnalytics() {
  const [reports, setReports] = useState<TransactionalReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: mappings, error } = await supabase.from('email_transactional_mappings').select('*');
    if (mappings) {
      const result: TransactionalReport[] = await Promise.all((mappings as Record<string, unknown>[]).map(async (m) => {
        const mId = m.id as string;
        const { count: triggered } = await supabase.from('email_delivery_events').select('*', { count: 'exact' }).eq('transactional_mapping_id', mId);
        const { count: delivered } = await supabase.from('email_delivery_events').select('*', { count: 'exact' }).eq('transactional_mapping_id', mId).eq('event_type', 'delivered');
        const { count: failed } = await supabase.from('email_delivery_events').select('*', { count: 'exact' }).eq('transactional_mapping_id', mId).eq('event_type', 'failed');
        const { count: hardBounces } = await supabase.from('email_delivery_events').select('*', { count: 'exact' }).eq('transactional_mapping_id', mId).eq('event_type', 'hard_bounced');
        const { count: softBounces } = await supabase.from('email_delivery_events').select('*', { count: 'exact' }).eq('transactional_mapping_id', mId).eq('event_type', 'soft_bounced');
        const { count: complaints } = await supabase.from('email_delivery_events').select('*', { count: 'exact' }).eq('transactional_mapping_id', mId).eq('event_type', 'complained');

        const senderConfig = m.sender_config as Record<string, unknown> | null;

        return {
          eventKey: (m.event_key as string) || '',
          product: (m.product_name as string) || '',
          internalName: (m.internal_name as string) || '',
          triggered: triggered || 0,
          submitted: triggered || 0,
          delivered: delivered || 0,
          failed: failed || 0,
          hardBounces: hardBounces || 0,
          softBounces: softBounces || 0,
          complaints: complaints || 0,
          medianResponseMs: null,
          recentIncident: (failed || 0) > 0,
          activeTemplate: (m.template_id as string) || null,
          activeSender: (senderConfig?.from_email as string) || null,
        };
      }));
      setReports(result);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/email/analytics" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer whitespace-nowrap">
          <ArrowLeft className="w-4 h-4" /> Analytics
        </Link>
        <span className="text-slate-600">/</span>
        <h2 className="text-lg font-bold text-white">Transactional Email Health</h2>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">Delivery health for system emails — account, security, payments, and notifications.</p>
        <button onClick={fetchData} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12">
          <ShieldOff className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No transactional mappings configured</p>
          <Link href="/admin/email/transactional" className="text-xs text-[#06B6D4] hover:underline mt-2 inline-block">Configure transactional emails</Link>
        </div>
      ) : (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)] text-left text-[11px] text-slate-500 uppercase tracking-wider">
                  <th className="p-4 font-medium">Event Key</th>
                  <th className="p-4 font-medium">Product</th>
                  <th className="p-4 font-medium text-right">Triggered</th>
                  <th className="p-4 font-medium text-right">Delivered</th>
                  <th className="p-4 font-medium text-right">Failed</th>
                  <th className="p-4 font-medium text-right">Hard Bounces</th>
                  <th className="p-4 font-medium text-right">Complaints</th>
                  <th className="p-4 font-medium">Health</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => {
                  const isCritical = CRITICAL_EVENTS.includes(r.eventKey);
                  const deliveryRate = r.triggered > 0 ? Math.round((r.delivered / r.triggered) * 100) : null;
                  const healthOk = r.failed === 0 && r.hardBounces === 0 && r.complaints === 0;
                  return (
                    <tr key={r.eventKey} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02]">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{r.internalName || r.eventKey}</span>
                          {isCritical && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/10 text-rose-400">CRITICAL</span>}
                        </div>
                        <p className="text-[10px] text-slate-500">{r.eventKey}</p>
                      </td>
                      <td className="p-4 text-slate-400 text-xs">{r.product || '—'}</td>
                      <td className="p-4 text-right text-slate-300">{r.triggered.toLocaleString()}</td>
                      <td className="p-4 text-right text-emerald-400">{r.delivered.toLocaleString()}</td>
                      <td className="p-4 text-right text-red-400">{r.failed.toLocaleString()}</td>
                      <td className="p-4 text-right text-orange-400">{r.hardBounces.toLocaleString()}</td>
                      <td className="p-4 text-right text-rose-400">{r.complaints.toLocaleString()}</td>
                      <td className="p-4">
                        {healthOk ? (
                          <span className="flex items-center gap-1 text-emerald-400 text-xs"><CheckCircle2 className="w-3.5 h-3.5" /> Healthy</span>
                        ) : r.recentIncident ? (
                          <span className="flex items-center gap-1 text-red-400 text-xs"><AlertTriangle className="w-3.5 h-3.5" /> Issues</span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-400 text-xs"><Clock className="w-3.5 h-3.5" /> No data</span>
                        )}
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