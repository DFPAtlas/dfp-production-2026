'use client';

import PBXShell from '@/components/pbx/PBXShell';
import PBXStatusBadge from '@/components/pbx/PBXStatusBadge';
import PBXEmptyState from '@/components/pbx/PBXEmptyState';
import { usePBXRoutingRules, usePBXRingGroups } from '@/hooks/usePBXData';
import { GitBranch, Users, RefreshCw } from 'lucide-react';

const destinationTypeLabels: Record<string, string> = {
  user: 'User', ring_group: 'Ring Group', queue: 'Queue', voicemail: 'Voicemail',
  ai_receptionist: 'AI Receptionist', external: 'External Number', n8n_workflow: 'n8n Workflow', ivr: 'IVR Menu',
};

export default function PBXCallRoutingPage() {
  const { rules, loading: rulesLoading, refetch: refetchRules } = usePBXRoutingRules();
  const { groups, loading: groupsLoading, refetch: refetchGroups } = usePBXRingGroups();

  const refresh = () => { refetchRules(); refetchGroups(); };

  return (
    <PBXShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Call Routing</h1>
            <p className="text-sm text-slate-400 mt-0.5">Inbound routing rules and ring groups for your tenant</p>
          </div>
          <button onClick={refresh} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-400 rounded-xl text-xs font-semibold hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap">
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
        </div>

        <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2"><GitBranch className="w-4 h-4 text-[#06B6D4]" /> Routing Rules</h3>
          </div>
          {rulesLoading ? (
            <div className="flex items-center justify-center h-40"><div className="w-7 h-7 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" /></div>
          ) : rules.length === 0 ? (
            <PBXEmptyState icon={<GitBranch className="w-7 h-7 text-slate-500" />} title="No routing rules yet" description="Inbound routing is configured by Digital-Footprint when your numbers go live." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-[rgba(255,255,255,0.06)]">
                    <th className="px-5 py-2.5 font-medium">Rule</th>
                    <th className="px-5 py-2.5 font-medium">Priority</th>
                    <th className="px-5 py-2.5 font-medium">Destination</th>
                    <th className="px-5 py-2.5 font-medium">Fallback</th>
                    <th className="px-5 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((r) => (
                    <tr key={r.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02]">
                      <td className="px-5 py-2.5 text-white text-sm">{r.name}</td>
                      <td className="px-5 py-2.5 text-slate-400 font-mono text-xs">{r.priority}</td>
                      <td className="px-5 py-2.5 text-slate-300 text-xs">{destinationTypeLabels[r.destination_type] || r.destination_type} — {r.destination_target}</td>
                      <td className="px-5 py-2.5 text-slate-400 text-xs">{r.fallback_type ? `${destinationTypeLabels[r.fallback_type] || r.fallback_type} — ${r.fallback_target || ''}` : '—'}</td>
                      <td className="px-5 py-2.5"><PBXStatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Users className="w-4 h-4 text-[#06B6D4]" /> Ring Groups</h3>
          </div>
          {groupsLoading ? (
            <div className="flex items-center justify-center h-40"><div className="w-7 h-7 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" /></div>
          ) : groups.length === 0 ? (
            <PBXEmptyState icon={<Users className="w-7 h-7 text-slate-500" />} title="No ring groups yet" description="Ring groups are created by Digital-Footprint as part of your routing setup." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-[rgba(255,255,255,0.06)]">
                    <th className="px-4 py-2.5 font-medium">Group</th>
                    <th className="px-4 py-2.5 font-medium">Strategy</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((rg) => (
                    <tr key={rg.id} className="border-b border-[rgba(255,255,255,0.03)]">
                      <td className="px-4 py-2.5 text-white text-sm">{rg.name}</td>
                      <td className="px-4 py-2.5 text-slate-300 text-xs">{rg.strategy ? rg.strategy.replace(/_/g, ' ') : '—'}</td>
                      <td className="px-4 py-2.5"><PBXStatusBadge status={rg.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-[#1E293B]/50 rounded-xl border border-[rgba(255,255,255,0.04)] p-4">
          <p className="text-xs text-slate-500">Routing changes are applied by Digital-Footprint to avoid invalid or circular call paths.</p>
        </div>
      </div>
    </PBXShell>
  );
}