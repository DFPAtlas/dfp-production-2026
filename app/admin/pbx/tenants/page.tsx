'use client';

import AdminShell from '@/components/admin/AdminShell';
import PBXStatusBadge from '@/components/pbx/PBXStatusBadge';
import PBXDetailDrawer, { DetailRow } from '@/components/pbx/PBXDetailDrawer';
import { usePBXTenants } from '@/hooks/usePBXData';
import { supabase } from '@/lib/supabase';
import { COMMERCIAL_STATUS_LABELS, CONNECTION_STATUS_LABELS, HEALTH_STATUS_LABELS } from '@/lib/pbx-definitions';
import { useState, useCallback } from 'react';
import { Eye, RefreshCw } from 'lucide-react';

export default function AdminTenantsPage() {
  const { tenants, loading, refetch } = usePBXTenants();
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const handleView = useCallback((t: any) => {
    setSelected(t);
    setDetailOpen(true);
  }, []);

  const handleStatusChange = useCallback(async (id: string, newStatus: string) => {
    await supabase.from('pbx_tenants').update({ commercial_status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
    refetch();
  }, [refetch]);

  return (
    <AdminShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Tenants</h1>
            <p className="text-sm text-slate-400 mt-0.5">Manage all PBX tenants</p>
          </div>
          <button onClick={refetch} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-400 rounded-xl text-xs font-semibold hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap">
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" /></div>
        ) : tenants.length === 0 ? (
          <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-12 text-center">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No tenants configured</p>
            <p className="text-xs text-slate-600 mt-1">Tenants are created when provisioning new PBX clients</p>
          </div>
        ) : (
          <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-[rgba(255,255,255,0.06)]">
                    <th className="px-4 py-3 font-medium">Reference</th>
                    <th className="px-4 py-3 font-medium">Company</th>
                    <th className="px-4 py-3 font-medium">Commercial</th>
                    <th className="px-4 py-3 font-medium">Connection</th>
                    <th className="px-4 py-3 font-medium">Health</th>
                    <th className="px-4 py-3 font-medium">Country</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map(t => (
                    <tr key={t.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 text-slate-500 font-mono text-[10px]">{t.reference}</td>
                      <td className="px-4 py-2.5 text-white text-sm font-medium">{t.name}</td>
                      <td className="px-4 py-2.5">
                        <div className="relative inline-block">
                          <button
                            onClick={(e) => {
                              const rect = (e.target as HTMLElement).closest('td')?.querySelector('select') as HTMLSelectElement;
                              if (rect) rect.focus();
                            }}
                            className="cursor-pointer"
                          >
                            <PBXStatusBadge status={t.commercial_status} />
                          </button>
                          <select
                            value={t.commercial_status}
                            onChange={(e) => handleStatusChange(t.id, e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          >
                            {Object.entries(COMMERCIAL_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-2.5"><PBXStatusBadge status={t.connection_status} /></td>
                      <td className="px-4 py-2.5"><PBXStatusBadge status={t.health_status} /></td>
                      <td className="px-4 py-2.5 text-slate-400 text-xs">{t.country || 'GB'}</td>
                      <td className="px-4 py-2.5 text-slate-500 text-xs">{t.created_at ? new Date(t.created_at).toLocaleDateString('en-GB') : '—'}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleView(t)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#06B6D4] hover:bg-white/5 transition-colors cursor-pointer" title="View Details">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <PBXDetailDrawer open={detailOpen} onClose={() => setDetailOpen(false)} title={selected?.name || 'Tenant Details'}>
          {selected && (
            <div className="space-y-5">
              <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-4">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Company Info</h4>
                <DetailRow label="Reference" value={selected.reference} mono />
                <DetailRow label="Name" value={selected.name} />
                <DetailRow label="Commercial Status" value={<PBXStatusBadge status={selected.commercial_status} />} />
                <DetailRow label="Connection Status" value={<PBXStatusBadge status={selected.connection_status} />} />
                <DetailRow label="Health" value={<PBXStatusBadge status={selected.health_status} />} />
                <DetailRow label="Country" value={selected.country} />
                <DetailRow label="Timezone" value={selected.timezone} />
                <DetailRow label="Default Caller ID" value={selected.default_caller_id || '—'} mono />
                <DetailRow label="Created" value={selected.created_at ? new Date(selected.created_at).toLocaleString('en-GB') : '—'} />
              </div>
              <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-4">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Configuration</h4>
                <DetailRow label="Recording Policy" value={selected.recording_policy} />
                <DetailRow label="Retention (days)" value={selected.retention_days} />
                <DetailRow label="Emergency Address" value={selected.emergency_address_status} />
                <DetailRow label="Billing Arrangement" value={selected.billing_arrangement} />
                <DetailRow label="Provider Account" value={selected.provider_account_ref || '—'} mono />
                <DetailRow label="Last Sync" value={selected.last_sync_at ? new Date(selected.last_sync_at).toLocaleString('en-GB') : 'Never'} />
              </div>
            </div>
          )}
        </PBXDetailDrawer>
      </div>
    </AdminShell>
  );
}

function Building2({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22V12h6v10M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01" />
    </svg>
  );
}