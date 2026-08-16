'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Download, FileText, BarChart3, ShieldOff, RefreshCw } from 'lucide-react';
import { CampaignReport, AutomationReport, getDateRangeStart, DateRange, DATE_RANGE_LABELS } from '@/components/admin/email/analytics/analytics-types';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(false);
  const [exportStatus, setExportStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExportCSV = async (type: string) => {
    setLoading(true);
    setExportStatus(null);

    try {
      let rows: Record<string, unknown>[] = [];
      if (type === 'campaigns') {
        const { data } = await supabase.from('email_campaigns').select('id, name, status, campaign_type, created_at');
        rows = (data || []);
      } else if (type === 'deliverability') {
        const { data } = await supabase.from('email_delivery_events').select('event_type, event_time, provider_message_id, campaign_id');
        rows = (data || []);
      } else if (type === 'automations') {
        const { data } = await supabase.from('email_automations').select('id, name, status, trigger_type, created_at');
        rows = (data || []);
      } else if (type === 'suppressions') {
        const { data } = await supabase.from('email_suppressions').select('masked_email, reason, scope, is_permanent, created_at').limit(1000);
        rows = (data || []);
      }

      if (rows.length === 0) {
        setExportStatus({ type: 'error', text: 'No data to export' });
        setLoading(false);
        return;
      }

      const headers = Object.keys(rows[0]);
      const csv = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify((r as Record<string, unknown>)[h] ?? '')).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus({ type: 'success', text: `${type} exported` });
    } catch {
      setExportStatus({ type: 'error', text: 'Export failed' });
    }
    setLoading(false);
    setTimeout(() => setExportStatus(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/email/analytics" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer whitespace-nowrap">
          <ArrowLeft className="w-4 h-4" /> Analytics
        </Link>
        <span className="text-slate-600">/</span>
        <h2 className="text-lg font-bold text-white">Reports & Exports</h2>
      </div>

      {exportStatus && (
        <div className={`px-4 py-2.5 rounded-xl text-xs ${exportStatus.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          {exportStatus.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Campaign Summary</h3>
              <p className="text-[10px] text-slate-500">All campaigns with status and dates</p>
            </div>
          </div>
          <button onClick={() => handleExportCSV('campaigns')} disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl text-sm font-medium hover:bg-cyan-500/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            {loading ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>

        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <ShieldOff className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Deliverability Summary</h3>
              <p className="text-[10px] text-slate-500">Delivery events with types and timestamps</p>
            </div>
          </div>
          <button onClick={() => handleExportCSV('deliverability')} disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-500/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            {loading ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>

        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Automation Performance</h3>
              <p className="text-[10px] text-slate-500">Automation configurations and statuses</p>
            </div>
          </div>
          <button onClick={() => handleExportCSV('automations')} disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-xl text-sm font-medium hover:bg-violet-500/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            {loading ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>

        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Suppression Records</h3>
              <p className="text-[10px] text-slate-500">Masked emails with reasons and scopes (up to 1,000)</p>
            </div>
          </div>
          <button onClick={() => handleExportCSV('suppressions')} disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm font-medium hover:bg-rose-500/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            {loading ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Scheduled Reports</h3>
        <p className="text-xs text-slate-500">Scheduled recurring reports are not yet available. Exports above use the current data snapshot.</p>
      </div>
    </div>
  );
}