'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import {
  Server, RefreshCw, Wifi, WifiOff, Activity,
  AlertCircle, Box, Shield, ExternalLink, ArrowLeft,
} from 'lucide-react';
import { checkWorkerHealth, getCachedWorkerDetails, type WorkerConnectionState } from '@/lib/uat-sandbox/worker/sandbox-service';
import { SANDBOX_MODE_CONFIG } from '@/lib/uat-sandbox/types';

export default function AdminWorkerDashboard() {
  const router = useRouter();
  const [workerState, setWorkerState] = useState<WorkerConnectionState>({
    workerOnline: false,
    workerStatus: 'offline',
    activeSandboxCount: 0,
    lastHealthCheck: null,
  });
  const [loading, setLoading] = useState(true);
  const [instances, setInstances] = useState<any[]>([]);
  const [detailedHealth, setDetailedHealth] = useState<any>(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const state = await checkWorkerHealth();
    setWorkerState(state);

    const { data: insts } = await supabase
      .from('uat_sandbox_instances')
      .select('*')
      .in('status', ['ready', 'active', 'paused', 'resetting', 'provisioning', 'requested'])
      .order('created_at', { ascending: false });

    setInstances(insts || []);

    if (state.workerOnline) {
      setDetailedHealth(getCachedWorkerDetails());
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto">
        <button onClick={() => router.push('/admin/uat/sandbox')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-[#06B6D4] transition-colors mb-6 cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to Sandbox Management
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Server className="w-6 h-6 text-[#06B6D4]" /> Playwright Worker Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Monitor the isolated browser sandbox worker</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${workerState.workerOnline ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                {workerState.workerOnline ? <Wifi className="w-5 h-5 text-emerald-400" /> : <WifiOff className="w-5 h-5 text-red-400" />}
              </div>
              <div>
                <p className="text-xs text-slate-500">Worker Status</p>
                <p className={`text-lg font-bold ${workerState.workerOnline ? 'text-emerald-400' : 'text-red-400'}`}>
                  {workerState.workerOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
            {workerState.lastHealthCheck && (
              <p className="text-xs text-slate-500">
                Last checked: {new Date(workerState.lastHealthCheck).toLocaleTimeString('en-GB')}
              </p>
            )}
          </div>

          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Active Sandboxes</p>
                <p className="text-lg font-bold text-white">{workerState.activeSandboxCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Playwright Version</p>
                <p className="text-lg font-bold text-white">{detailedHealth?.playwright_version || '1.40+'}</p>
              </div>
            </div>
          </div>
        </div>

        {detailedHealth && (
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 mb-6">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Server className="w-4 h-4 text-[#06B6D4]" /> Worker Details
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-slate-500 text-xs block">Instance ID</span>
                <span className="text-white font-medium font-mono text-xs">{detailedHealth.worker_instance_id || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block">Status</span>
                <span className={`font-medium capitalize ${detailedHealth.status === 'online' ? 'text-emerald-400' : detailedHealth.status === 'degraded' ? 'text-amber-400' : 'text-red-400'}`}>
                  {detailedHealth.status || 'unknown'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block">Active Sandboxes</span>
                <span className="text-white font-medium">{detailedHealth.active_sandbox_count ?? '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block">Allowed Hosts</span>
                <span className={`font-medium ${detailedHealth.allowed_hosts_configured ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {detailedHealth.allowed_hosts_configured ? 'Configured' : 'Not Configured'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block">Playwright Version</span>
                <span className="text-white font-medium">{detailedHealth.playwright_version || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block">Uptime</span>
                <span className="text-white font-medium">{detailedHealth.uptime_seconds ? `${Math.floor(detailedHealth.uptime_seconds / 60)}m` : '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block">Last Health Check</span>
                <span className="text-white font-medium">{detailedHealth.last_health_check ? new Date(detailedHealth.last_health_check).toLocaleTimeString('en-GB') : '—'}</span>
              </div>
            </div>
          </div>
        )}

        {!workerState.workerOnline && (
          <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-8 text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <WifiOff className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Worker Offline</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              The Playwright sandbox worker is not reachable. Isolated browser contexts cannot be created until the worker is restarted. Existing sandbox data and test results are preserved.
            </p>
          </div>
        )}

        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Box className="w-4 h-4 text-[#06B6D4]" /> Active & Pending Sandboxes ({instances.length})
            </h2>
            <button onClick={loadAll}
              className="px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-[#06B6D4] transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>

          {instances.length === 0 ? (
            <div className="text-center py-12">
              <Box className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No active sandbox instances</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)]">
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Status</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Mode</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Health</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Resets</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Expires</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Last Health</th>
                  </tr>
                </thead>
                <tbody>
                  {instances.map((inst) => {
                    const mc = SANDBOX_MODE_CONFIG[inst.sandbox_mode as keyof typeof SANDBOX_MODE_CONFIG];
                    const remaining = new Date(inst.expires_at).getTime() - Date.now();
                    const isExpiring = remaining > 0 && remaining < 600000; // within 10 min
                    return (
                      <tr key={inst.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-5">
                          <span className="px-2 py-0.5 rounded-lg text-xs font-medium capitalize"
                            style={{
                              color: inst.status === 'active' ? '#10B981' : inst.status === 'paused' ? '#F59E0B' : '#94A3B8',
                              backgroundColor: inst.status === 'active' ? 'rgba(16,185,129,0.1)' : inst.status === 'paused' ? 'rgba(245,158,11,0.1)' : 'rgba(148,163,184,0.1)',
                            }}>
                            {inst.status}
                          </span>
                        </td>
                        <td className="py-3 px-5">
                          <span className="text-xs" style={{ color: mc?.color }}>{mc?.label}</span>
                        </td>
                        <td className="py-3 px-5">
                          <span className={`text-xs capitalize ${inst.health_status === 'healthy' ? 'text-emerald-400' : inst.health_status === 'unhealthy' ? 'text-red-400' : 'text-slate-400'}`}>
                            {inst.health_status}
                          </span>
                        </td>
                        <td className="py-3 px-5">
                          <span className="text-xs text-slate-400">{inst.reset_count || 0}</span>
                        </td>
                        <td className="py-3 px-5">
                          <span className={`text-xs ${isExpiring ? 'text-amber-400' : remaining <= 0 ? 'text-red-400' : 'text-slate-400'}`}>
                            {remaining <= 0 ? 'Expired' : `${Math.ceil(remaining / 60000)}m`}
                          </span>
                        </td>
                        <td className="py-3 px-5">
                          <span className="text-xs text-slate-500">{inst.last_health_at ? new Date(inst.last_health_at).toLocaleTimeString('en-GB') : '—'}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}