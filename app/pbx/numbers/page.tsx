'use client';

import PBXShell from '@/components/pbx/PBXShell';
import PBXStatusBadge from '@/components/pbx/PBXStatusBadge';
import PBXEmptyState from '@/components/pbx/PBXEmptyState';
import { usePBXNumbers, usePBXTenants } from '@/hooks/usePBXData';
import { Phone, RefreshCw } from 'lucide-react';

export default function PBXNumbersPage() {
  const { numbers, loading, refetch } = usePBXNumbers();
  const { tenants } = usePBXTenants();
  const tenantMap = new Map(tenants.map((t) => [t.id, t.name]));

  return (
    <PBXShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Phone Numbers</h1>
            <p className="text-sm text-slate-400 mt-0.5">Phone numbers assigned to your tenant</p>
          </div>
          <button onClick={refetch} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-400 rounded-xl text-xs font-semibold hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap">
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" /></div>
        ) : numbers.length === 0 ? (
          <PBXEmptyState icon={<Phone className="w-7 h-7 text-slate-500" />} title="No numbers yet" description="Numbers are provisioned and assigned by Digital-Footprint once your Twilio account is connected." />
        ) : (
          <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-[rgba(255,255,255,0.06)]">
                    <th className="px-5 py-3 font-medium">Number</th>
                    <th className="px-5 py-3 font-medium">Tenant</th>
                    <th className="px-5 py-3 font-medium">Country</th>
                    <th className="px-5 py-3 font-medium">Capabilities</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Monthly Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {numbers.map((n) => (
                    <tr key={n.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02]">
                      <td className="px-5 py-3 text-slate-300 font-mono text-xs">{n.display_format || n.e164}</td>
                      <td className="px-5 py-3 text-white text-sm">{tenantMap.get(n.tenant_id) || '—'}</td>
                      <td className="px-5 py-3 text-slate-400 text-xs">{n.country || '—'}</td>
                      <td className="px-5 py-3 text-slate-400 text-xs">{(n.capabilities || []).join(', ') || '—'}</td>
                      <td className="px-5 py-3"><PBXStatusBadge status={n.assignment_status} /></td>
                      <td className="px-5 py-3 text-slate-300 text-xs">{n.confirmed_monthly_cost != null ? `£${Number(n.confirmed_monthly_cost).toFixed(2)}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-[#1E293B]/50 rounded-xl border border-[rgba(255,255,255,0.04)] p-4">
          <p className="text-xs text-slate-500">Number purchase, porting and assignment are managed by Digital-Footprint through the provider.</p>
        </div>
      </div>
    </PBXShell>
  );
}