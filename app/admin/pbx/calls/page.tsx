'use client';

import AdminShell from '@/components/admin/AdminShell';
import PBXStatusBadge from '@/components/pbx/PBXStatusBadge';
import { usePBXCallLogs, usePBXTenants } from '@/hooks/usePBXData';
import { RefreshCw } from 'lucide-react';

export default function AdminCallsPage() {
  const { calls, loading, totalCount, refetch } = usePBXCallLogs();
  const { tenants } = usePBXTenants();
  const tenantMap = new Map(tenants.map(t => [t.id, t.name]));

  const answered = calls.filter(c => c.status === 'completed').length;
  const missed = calls.filter(c => c.status === 'no_answer').length;
  const failed = calls.filter(c => c.status === 'failed').length;

  return (
    <AdminShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Call Logs</h1>
            <p className="text-sm text-slate-400 mt-0.5">View calls across all tenants</p>
          </div>
          <button onClick={refetch} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-400 rounded-xl text-xs font-semibold hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap">
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Calls', value: totalCount.toLocaleString(), color: '#06B6D4' },
            { label: 'Completed', value: String(answered), color: '#10B981' },
            { label: 'Missed', value: String(missed), color: '#F97316' },
            { label: 'Failed', value: String(failed), color: '#EF4444' },
          ].map(s => (
            <div key={s.label} className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-4">
              <p className="text-xs text-slate-400">{s.label}</p>
              <p className="text-xl font-bold text-white mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" /></div>
        ) : calls.length === 0 ? (
          <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-12 text-center">
            <p className="text-slate-400 text-sm">No call records yet</p>
            <p className="text-xs text-slate-600 mt-1">Call logs will appear when provider webhooks are configured and receiving events</p>
          </div>
        ) : (
          <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-[rgba(255,255,255,0.06)]">
                    <th className="px-5 py-3 font-medium">Time</th>
                    <th className="px-5 py-3 font-medium">Tenant</th>
                    <th className="px-5 py-3 font-medium">Dir</th>
                    <th className="px-5 py-3 font-medium">From</th>
                    <th className="px-5 py-3 font-medium">To</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Duration</th>
                    <th className="px-5 py-3 font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {calls.map(c => (
                    <tr key={c.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02]">
                      <td className="px-5 py-2.5 text-slate-400 text-xs font-mono">{c.start_time ? new Date(c.start_time).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td className="px-5 py-2.5 text-white text-sm">{tenantMap.get(c.tenant_id) || '—'}</td>
                      <td className="px-5 py-2.5"><span className={`text-xs ${c.direction === 'inbound' ? 'text-[#10B981]' : 'text-[#8B5CF6]'}`}>{c.direction === 'inbound' ? 'In' : 'Out'}</span></td>
                      <td className="px-5 py-2.5 text-slate-300 font-mono text-xs">{c.from_number}</td>
                      <td className="px-5 py-2.5 text-slate-300 font-mono text-xs">{c.to_number}</td>
                      <td className="px-5 py-2.5"><PBXStatusBadge status={c.status} /></td>
                      <td className="px-5 py-2.5 text-slate-400 font-mono text-xs">{c.duration_seconds ? `${Math.floor(c.duration_seconds / 60)}:${String(c.duration_seconds % 60).padStart(2, '0')}` : '—'}</td>
                      <td className="px-5 py-2.5 text-slate-300 text-xs">{c.provider_cost ? `£${Number(c.provider_cost).toFixed(2)}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-[#1E293B]/50 rounded-xl border border-[rgba(255,255,255,0.04)] p-4">
          <p className="text-xs text-slate-500">Call records are populated from verified Twilio webhook events. Provider configuration is required.</p>
        </div>
      </div>
    </AdminShell>
  );
}