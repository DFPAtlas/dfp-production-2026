'use client';

import PBXShell from '@/components/pbx/PBXShell';
import PBXStatusBadge from '@/components/pbx/PBXStatusBadge';
import PBXEmptyState from '@/components/pbx/PBXEmptyState';
import { usePBXUsers, usePBXTenants } from '@/hooks/usePBXData';
import { Users, RefreshCw } from 'lucide-react';

export default function PBXUsersPage() {
  const { users, loading, refetch } = usePBXUsers();
  const { tenants } = usePBXTenants();
  const tenantMap = new Map(tenants.map((t) => [t.id, t.name]));

  return (
    <PBXShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Users & Extensions</h1>
            <p className="text-sm text-slate-400 mt-0.5">PBX users and extensions for your tenant</p>
          </div>
          <button onClick={refetch} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-400 rounded-xl text-xs font-semibold hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap">
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" /></div>
        ) : users.length === 0 ? (
          <PBXEmptyState icon={<Users className="w-7 h-7 text-slate-500" />} title="No users yet" description="Users and extensions are created by Digital-Footprint during PBX provisioning." />
        ) : (
          <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-[rgba(255,255,255,0.06)]">
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Tenant</th>
                    <th className="px-5 py-3 font-medium">Ext</th>
                    <th className="px-5 py-3 font-medium">Role</th>
                    <th className="px-5 py-3 font-medium">Department</th>
                    <th className="px-5 py-3 font-medium">Voicemail</th>
                    <th className="px-5 py-3 font-medium">Recording</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02]">
                      <td className="px-5 py-3 text-white text-sm font-medium">{u.name}</td>
                      <td className="px-5 py-3 text-slate-400 text-xs">{tenantMap.get(u.tenant_id) || '—'}</td>
                      <td className="px-5 py-3 text-slate-300 font-mono text-xs">{u.extension}</td>
                      <td className="px-5 py-3 text-slate-300 text-xs">{u.pbx_role || '—'}</td>
                      <td className="px-5 py-3 text-slate-400 text-xs">{u.department || '—'}</td>
                      <td className="px-5 py-3">{u.voicemail_enabled ? <span className="text-[#10B981] text-xs">● Yes</span> : <span className="text-slate-500 text-xs">—</span>}</td>
                      <td className="px-5 py-3">{u.recording_enabled ? <span className="text-[#F59E0B] text-xs">● On</span> : <span className="text-slate-500 text-xs">—</span>}</td>
                      <td className="px-5 py-3"><PBXStatusBadge status={u.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-[#1E293B]/50 rounded-xl border border-[rgba(255,255,255,0.04)] p-4">
          <p className="text-xs text-slate-500">User management is handled by Digital-Footprint to ensure extensions and forwarding remain correct.</p>
        </div>
      </div>
    </PBXShell>
  );
}