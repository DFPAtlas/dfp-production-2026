'use client';

import AdminShell from '@/components/admin/AdminShell';
import PBXStatusBadge from '@/components/pbx/PBXStatusBadge';
import { usePBXCosts, usePBXTenants } from '@/hooks/usePBXData';
import { RefreshCw } from 'lucide-react';

export default function AdminBillingPage() {
  const { costs, loading, refetch } = usePBXCosts();
  const { tenants } = usePBXTenants();
  const tenantMap = new Map(tenants.map(t => [t.id, t.name]));

  const totalCost = costs.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const totalMinutes = costs.reduce((sum, c) => sum + (c.call_minutes || 0), 0);
  const totalCalls = costs.reduce((sum, c) => sum + (c.call_count || 0), 0);
  const totalMessages = costs.reduce((sum, c) => sum + (c.message_segments || 0), 0);

  return (
    <AdminShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Usage & Costs</h1>
            <p className="text-sm text-slate-400 mt-0.5">View provider costs and usage across all tenants</p>
          </div>
          <button onClick={refetch} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-400 rounded-xl text-xs font-semibold hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap">
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Cost', value: `£${totalCost.toFixed(2)}`, color: '#F97316' },
            { label: 'Total Minutes', value: totalMinutes.toLocaleString(), color: '#06B6D4' },
            { label: 'Total Calls', value: totalCalls.toLocaleString(), color: '#10B981' },
            { label: 'Total Messages', value: totalMessages.toLocaleString(), color: '#8B5CF6' },
          ].map(s => (
            <div key={s.label} className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-4">
              <p className="text-xs text-slate-400">{s.label}</p>
              <p className="text-xl font-bold text-white mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32"><div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" /></div>
        ) : costs.length === 0 ? (
          <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-12 text-center">
            <p className="text-slate-400 text-sm">No cost records yet</p>
            <p className="text-xs text-slate-600 mt-1">Cost data is populated from provider sync or manual entry</p>
          </div>
        ) : (
          <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-[rgba(255,255,255,0.06)]">
                    <th className="px-5 py-3 font-medium">Tenant</th>
                    <th className="px-5 py-3 font-medium">Period</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Minutes</th>
                    <th className="px-5 py-3 font-medium">Calls</th>
                    <th className="px-5 py-3 font-medium">Messages</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Confirmed</th>
                  </tr>
                </thead>
                <tbody>
                  {costs.map(c => (
                    <tr key={c.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02]">
                      <td className="px-5 py-2.5 text-white text-sm">{tenantMap.get(c.tenant_id) || '—'}</td>
                      <td className="px-5 py-2.5 text-slate-400 text-xs">{c.period_start} — {c.period_end}</td>
                      <td className="px-5 py-2.5 text-slate-300 text-xs">{c.cost_type}</td>
                      <td className="px-5 py-2.5 text-slate-300 text-xs">{c.call_minutes || '—'}</td>
                      <td className="px-5 py-2.5 text-slate-300 text-xs">{c.call_count || '—'}</td>
                      <td className="px-5 py-2.5 text-slate-300 text-xs">{c.message_segments || '—'}</td>
                      <td className="px-5 py-2.5 text-white text-sm font-medium">£{Number(c.amount).toFixed(2)}</td>
                      <td className="px-5 py-2.5">{c.confirmed ? <span className="text-[#10B981] text-xs">Yes</span> : <span className="text-[#F59E0B] text-xs">Pending</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-[#1E293B]/50 rounded-xl border border-[rgba(255,255,255,0.04)] p-4">
          <p className="text-xs text-slate-500">Cost data reflects confirmed provider charges where available. Estimates are marked as unconfirmed.</p>
        </div>
      </div>
    </AdminShell>
  );
}