'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { WorkflowRecord } from '@/hooks/useAutomationData';
import { HEALTH_STATUS_STYLES, OPERATIONAL_STATUS_STYLES, ENVIRONMENT_STYLES } from '@/lib/automation-definitions';
import { Search, Workflow } from 'lucide-react';

interface Props {
  workflows: WorkflowRecord[];
  loading: boolean;
  refetch: () => void;
  onSelect: (id: string) => void;
}

export default function WorkflowsTable({ workflows, loading, refetch, onSelect }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [envFilter, setEnvFilter] = useState('all');
  const [actioningId, setActioningId] = useState<string | null>(null);

  const filtered = workflows.filter(w => {
    if (search && !w.workflow_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && w.status !== statusFilter) return false;
    if (envFilter !== 'all' && w.environment !== envFilter) return false;
    return true;
  });

  const toggleStatus = async (wf: WorkflowRecord, newStatus: string) => {
    setActioningId(wf.id);
    await supabase.from('digital_footprint_n8n_agents').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', wf.id);
    setActioningId(null);
    refetch();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search workflows..."
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer pr-8">
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="disabled">Disabled</option>
          <option value="maintenance">Maintenance</option>
          <option value="archived">Archived</option>
        </select>
        <select value={envFilter} onChange={e => setEnvFilter(e.target.value)} className="px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer pr-8">
          <option value="all">All Envs</option>
          <option value="development">Dev</option>
          <option value="testing">Test</option>
          <option value="staging">Staging</option>
          <option value="uat">UAT</option>
          <option value="production">Production</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Workflow className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No workflows found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-[rgba(255,255,255,0.06)]">
                <th className="px-4 py-3 font-medium">Workflow</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Env</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Health</th>
                <th className="px-4 py-3 font-medium">Executions</th>
                <th className="px-4 py-3 font-medium">Last Run</th>
                <th className="px-4 py-3 font-medium">Avg Duration</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((wf) => {
                const health = HEALTH_STATUS_STYLES[wf.health_status] || HEALTH_STATUS_STYLES.no_data;
                const opStatus = OPERATIONAL_STATUS_STYLES[wf.status] || OPERATIONAL_STATUS_STYLES.paused;
                const env = ENVIRONMENT_STYLES[wf.environment] || ENVIRONMENT_STYLES.development;
                const successRate = wf.total_executions > 0 ? Math.round((wf.total_successes / wf.total_executions) * 100) : null;

                return (
                  <tr key={wf.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <button onClick={() => onSelect(wf.id)} className="text-left cursor-pointer">
                        <p className="text-white font-medium">{wf.workflow_name}</p>
                        <p className="text-xs text-slate-500">{wf.digital_footprint_projects?.name || 'Unassigned'}</p>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{wf.workflow_type?.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase" style={{ color: env.color, background: env.bg.replace(/\/10$/, '/15') }}>{env.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase" style={{ color: opStatus.color, background: opStatus.bg }}>{opStatus.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase" style={{ color: health.color, background: health.bg }}>{health.label}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-xs">
                      {wf.total_executions} <span className="text-slate-500">({successRate !== null ? `${successRate}%` : '--'})</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs font-mono">
                      {wf.last_run_at ? new Date(wf.last_run_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '--'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {wf.avg_duration_ms ? `${(wf.avg_duration_ms / 1000).toFixed(1)}s` : '--'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {wf.status === 'active' && (
                          <button onClick={() => toggleStatus(wf, 'paused')} disabled={actioningId === wf.id} className="px-2 py-1 text-xs text-amber-400 hover:bg-amber-500/10 rounded cursor-pointer whitespace-nowrap">
                            Pause
                          </button>
                        )}
                        {wf.status === 'paused' && (
                          <button onClick={() => toggleStatus(wf, 'active')} disabled={actioningId === wf.id} className="px-2 py-1 text-xs text-emerald-400 hover:bg-emerald-500/10 rounded cursor-pointer whitespace-nowrap">
                            Resume
                          </button>
                        )}
                        {(wf.status === 'paused' || wf.status === 'active' || wf.status === 'maintenance') && (
                          <button onClick={() => toggleStatus(wf, 'disabled')} disabled={actioningId === wf.id} className="px-2 py-1 text-xs text-slate-400 hover:bg-slate-500/10 rounded cursor-pointer whitespace-nowrap">
                            Disable
                          </button>
                        )}
                        <button onClick={() => onSelect(wf.id)} className="px-2 py-1 text-xs text-[#06B6D4] hover:bg-[#06B6D4]/10 rounded cursor-pointer whitespace-nowrap">View</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

