'use client';

import { useState, useEffect } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import PBXStatusBadge from '@/components/pbx/PBXStatusBadge';
import { supabase } from '@/lib/supabase';
import { Workflow, RefreshCw, Search } from 'lucide-react';

interface PBXWorkflow {
  id: string;
  workflow_name: string;
  status: string;
  workflow_type: string;
  last_run_at: string | null;
  latest_error: string | null;
  environment: string;
  health_status: string;
}

export default function AdminN8nPage() {
  const [workflows, setWorkflows] = useState<PBXWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchWorkflows = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('digital_footprint_n8n_agents')
      .select('id, workflow_name, status, workflow_type, last_run_at, latest_error, environment, health_status')
      .in('workflow_type', ['standard', 'webhook', 'scheduled', 'notification', 'ai_agent', 'integration'])
      .order('created_at', { ascending: false });
    setWorkflows((data || []) as PBXWorkflow[]);
    setLoading(false);
  };

  useEffect(() => { fetchWorkflows(); const interval = setInterval(fetchWorkflows, 30000); return () => clearInterval(interval); }, []);

  const filtered = workflows.filter(w => !search || w.workflow_name.toLowerCase().includes(search.toLowerCase()) || w.workflow_type.toLowerCase().includes(search.toLowerCase()));

  const stats = {
    total: workflows.length,
    active: workflows.filter(w => w.status === 'active').length,
    failed: workflows.filter(w => w.health_status === 'failing').length,
    disabled: workflows.filter(w => w.status === 'disabled' || w.status === 'paused').length,
  };

  return (
    <AdminShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">n8n Workflows</h1>
            <p className="text-sm text-slate-400 mt-0.5">Monitor n8n workflow integrations across all tenants</p>
          </div>
          <button onClick={fetchWorkflows} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-400 rounded-xl text-xs font-semibold hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap">
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Workflows', value: stats.total, color: '#06B6D4' },
            { label: 'Active', value: stats.active, color: '#10B981' },
            { label: 'Failing', value: stats.failed, color: '#EF4444' },
            { label: 'Disabled', value: stats.disabled, color: '#F97316' },
          ].map(s => (
            <div key={s.label} className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-4">
              <p className="text-xs text-slate-400">{s.label}</p>
              <p className="text-xl font-bold text-white mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search workflows..."
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
          />
        </div>

        <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Workflow className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No n8n workflows found</p>
              <p className="text-xs text-slate-600 mt-1">Connect workflows in the Automation Control Room</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-[rgba(255,255,255,0.06)]">
                    <th className="px-5 py-3 font-medium">Workflow</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Env</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Health</th>
                    <th className="px-5 py-3 font-medium">Last Run</th>
                    <th className="px-5 py-3 font-medium">Last Error</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(w => (
                    <tr key={w.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02]">
                      <td className="px-5 py-2.5 text-white text-sm">{w.workflow_name}</td>
                      <td className="px-5 py-2.5 text-slate-400 text-xs">{w.workflow_type?.replace(/_/g, ' ')}</td>
                      <td className="px-5 py-2.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-slate-500/10 text-slate-400">{w.environment}</span>
                      </td>
                      <td className="px-5 py-2.5"><PBXStatusBadge status={w.status} /></td>
                      <td className="px-5 py-2.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          w.health_status === 'healthy' ? 'bg-emerald-500/10 text-emerald-400' :
                          w.health_status === 'failing' ? 'bg-red-500/10 text-red-400' :
                          w.health_status === 'degraded' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-slate-500/10 text-slate-400'
                        }`}>{w.health_status || 'no_data'}</span>
                      </td>
                      <td className="px-5 py-2.5 text-slate-400 text-xs font-mono">
                        {w.last_run_at ? new Date(w.last_run_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '--'}
                      </td>
                      <td className="px-5 py-2.5 text-xs max-w-[180px] truncate" style={{ color: w.latest_error ? '#EF4444' : '#64748B' }}>
                        {w.latest_error || '--'}
                      </td>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <a href="/admin/automation" className="text-xs text-[#06B6D4] hover:underline cursor-pointer">View</a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
          <p className="text-xs text-slate-400">n8n webhook secrets are stored securely and never exposed to the frontend. Full workflow management is available in the <a href="/admin/automation" className="text-[#06B6D4] hover:underline">Automation Control Room</a>.</p>
        </div>
      </div>
    </AdminShell>
  );
}