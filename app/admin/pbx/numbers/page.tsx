'use client';

import AdminShell from '@/components/admin/AdminShell';
import PBXStatusBadge from '@/components/pbx/PBXStatusBadge';
import { usePBXNumbers, usePBXTenants } from '@/hooks/usePBXData';
import { RefreshCw } from 'lucide-react';

export default function AdminNumbersPage() {
  const { numbers, loading, refetch } = usePBXNumbers();
  const { tenants } = usePBXTenants();
  const tenantMap = new Map(tenants.map(t => [t.id, t.name]));

  const stats = {
    total: numbers.length,
    assigned: numbers.filter(n => n.assignment_status === 'assigned').length,
    available: numbers.filter(n => n.assignment_status === 'available').length,
    porting: numbers.filter(n => n.porting_status !== 'not_porting').length,
  };

  return (
    <AdminShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Number Inventory</h1>
            <p className="text-sm text-slate-400 mt-0.5">View all phone numbers across all tenants</p>
          </div>
          <button onClick={refetch} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-400 rounded-xl text-xs font-semibold hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap">
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Numbers', value: String(stats.total), color: '#06B6D4' },
            { label: 'Assigned', value: String(stats.assigned), color: '#10B981' },
            { label: 'Available', value: String(stats.available), color: '#64748B' },
            { label: 'Porting', value: String(stats.porting), color: '#F59E0B' },
          ].map(s => (
            <div key={s.label} className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-4">
              <p className="text-xs text-slate-400">{s.label}</p>
              <p className="text-xl font-bold text-white mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" /></div>
        ) : numbers.length === 0 ? (
          <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-12 text-center">
            <p className="text-slate-400 text-sm">No phone numbers in inventory</p>
            <p className="text-xs text-slate-600 mt-1">Numbers are added through provider sync or manual provisioning</p>
          </div>
        ) : (
          <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-[rgba(255,255,255,0.06)]">
                    <th className="px-5 py-3 font-medium">Number</th>
                    <th className="px-5 py-3 font-medium">Tenant</th>
                    <th className="px-5 py-3 font-medium">Country</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Capabilities</th>
                    <th className="px-5 py-3 font-medium">Monthly Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {numbers.map(n => (
                    <tr key={n.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02]">
                      <td className="px-5 py-2.5 text-slate-300 font-mono text-xs">{n.display_format || n.e164}</td>
                      <td className="px-5 py-2.5 text-white text-sm">{tenantMap.get(n.tenant_id) || '—'}</td>
                      <td className="px-5 py-2.5 text-slate-400 text-xs">{n.country}</td>
                      <td className="px-5 py-2.5"><PBXStatusBadge status={n.assignment_status} /></td>
                      <td className="px-5 py-2.5 text-slate-400 text-xs">{(n.capabilities || []).join(', ') || '—'}</td>
                      <td className="px-5 py-2.5 text-slate-300 text-xs">{n.confirmed_monthly_cost ? `£${Number(n.confirmed_monthly_cost).toFixed(2)}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-[#1E293B]/50 rounded-xl border border-[rgba(255,255,255,0.04)] p-4">
          <p className="text-xs text-slate-500">Numbers are managed through the provider. Purchase and porting require verified Twilio credentials.</p>
        </div>
      </div>
    </AdminShell>
  );
}