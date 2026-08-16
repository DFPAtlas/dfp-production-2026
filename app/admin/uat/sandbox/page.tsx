'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import {
  Search, RefreshCw, Eye, Box, AlertCircle, ChevronDown,
  Play, Pause, Clock, XCircle, ExternalLink, Server,
  Wifi, WifiOff, Activity,
  Mail, MessageSquare, Webhook, Ban, Shield,
} from 'lucide-react';
import {
  SANDBOX_STATUS_CONFIG, SANDBOX_MODE_CONFIG, SANDBOX_HEALTH_CONFIG,
  formatTimeRemaining,
} from '@/lib/uat-sandbox/types';
import type { SandboxInstance, SandboxStatus } from '@/lib/uat-sandbox/types';
import { checkWorkerHealth } from '@/lib/uat-sandbox/worker/sandbox-service';
import { useStaffMailbox } from '@/hooks/useStaffMailbox';
import {
  formatMessageTypeLabel, formatStatusLabel, getStatusColor,
} from '@/lib/uat-communications/adapters/base';

export default function AdminSandboxPage() {
  const router = useRouter();
  const [instances, setInstances] = useState<SandboxInstance[]>([]);
  const [filteredInstances, setFilteredInstances] = useState<SandboxInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState('all');
  const [selected, setSelected] = useState<SandboxInstance | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [seededRecords, setSeededRecords] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [workerOnline, setWorkerOnline] = useState(false);
  const [workerActiveCount, setWorkerActiveCount] = useState(0);
  const [detailTab, setDetailTab] = useState<'overview' | 'accounts' | 'actions' | 'records' | 'messages'>('overview');

  const {
    messages: staffMessages, events: staffEvents, attachments: staffAttachments,
    loading: staffLoading, error: staffError, refresh: refreshStaffMessages,
    quarantineMessage,
  } = useStaffMailbox(selected?.id || null);

  const [quarantineReason, setQuarantineReason] = useState('');
  const [quarantineTarget, setQuarantineTarget] = useState<string | null>(null);

  const handleQuarantine = async (messageId: string) => {
    if (!quarantineReason.trim()) return;
    await quarantineMessage(messageId, quarantineReason.trim());
    setQuarantineTarget(null);
    setQuarantineReason('');
  };

  function getTypeIcon(type: string) {
    switch (type) {
      case 'email': return <Mail className="w-3.5 h-3.5 text-blue-400" />;
      case 'sms': return <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />;
      case 'webhook': return <Webhook className="w-3.5 h-3.5 text-purple-400" />;
      default: return <Mail className="w-3.5 h-3.5 text-slate-400" />;
    }
  }

  useEffect(() => { fetchData(); checkWorker(); }, []);

  const checkWorker = async () => {
    const state = await checkWorkerHealth();
    setWorkerOnline(state.workerOnline);
    setWorkerActiveCount(state.activeSandboxCount);
  };

  const fetchData = async () => {
    const { data } = await supabase.from('uat_sandbox_instances').select('*').order('created_at', { ascending: false });
    if (!data) { setLoading(false); return; }

    const instancesData = data as SandboxInstance[];

    const projectIds = [...new Set(instancesData.map((i) => i.project_id))];
    const testerIds = [...new Set(instancesData.map((i) => i.tester_id))];
    const envIds = [...new Set(instancesData.filter((i) => i.environment_id).map((i) => i.environment_id!))];

    const [{ data: projects }, { data: testers }, { data: envs }] = await Promise.all([
      supabase.from('uat_projects').select('id, name').in('id', projectIds),
      supabase.from('uat_testers').select('id, full_name, email').in('id', testerIds),
      supabase.from('uat_environments').select('id, environment_name').in('id', envIds),
    ]);

    const projectMap: Record<string, string> = {};
    projects?.forEach((p: any) => { projectMap[p.id] = p.name; });
    const testerMap: Record<string, any> = {};
    testers?.forEach((t: any) => { testerMap[t.id] = t; });
    const envMap: Record<string, string> = {};
    envs?.forEach((e: any) => { envMap[e.id] = e.environment_name; });

    const merged = instancesData.map((i) => ({
      ...i,
      project_name: projectMap[i.project_id] || 'Unknown',
      tester_name: testerMap[i.tester_id]?.full_name || 'Unknown',
      tester_email: testerMap[i.tester_id]?.email || '',
      environment_name: i.environment_id ? envMap[i.environment_id] : null,
    }));

    setInstances(merged);
    setFilteredInstances(merged);
    setLoading(false);
  };

  useEffect(() => {
    let filtered = instances;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((i) =>
        (i.tester_name && i.tester_name.toLowerCase().includes(q)) ||
        (i.project_name && i.project_name.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== 'all') filtered = filtered.filter((i) => i.status === statusFilter);
    if (healthFilter !== 'all') filtered = filtered.filter((i) => i.health_status === healthFilter);
    setFilteredInstances(filtered);
  }, [searchQuery, statusFilter, healthFilter, instances]);

  const openDetail = async (instance: SandboxInstance) => {
    setSelected(instance);
    setDetailOpen(true);

    const [{ data: accts }, { data: acts }, { data: seeds }] = await Promise.all([
      supabase.from('uat_sandbox_accounts').select('*').eq('sandbox_instance_id', instance.id),
      supabase.from('uat_sandbox_actions').select('*').eq('sandbox_instance_id', instance.id).order('requested_at', { ascending: false }),
      supabase.from('uat_sandbox_seeded_records').select('*').eq('sandbox_instance_id', instance.id),
    ]);

    setAccounts(accts || []);
    setActions(acts || []);
    setSeededRecords(seeds || []);
  };

  const handleAction = async (instanceId: string, actionType: string) => {
    setActionLoading(instanceId);
    if (actionType === 'end') {
      await supabase.rpc('end_uat_sandbox', { p_instance_id: instanceId });
    } else if (actionType === 'extend') {
      await supabase.rpc('extend_uat_sandbox', { p_instance_id: instanceId });
    }
    setActionLoading(null);
    fetchData();
    if (detailOpen && selected?.id === instanceId) {
      const updated = instances.find((i) => i.id === instanceId);
      if (updated) openDetail(updated);
    }
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
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Sandbox Management</h1>
            <p className="text-sm text-slate-400 mt-0.5">Monitor and manage UAT sandbox instances</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/admin/uat/worker')}
              className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-[#06B6D4] transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap">
              <Server className="w-4 h-4" /> Worker Dashboard
            </button>
            <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl">
              <span className={`w-2 h-2 rounded-full ${workerOnline ? 'bg-emerald-500' : 'bg-red-400'}`} />
              <span className={`text-xs font-medium ${workerOnline ? 'text-emerald-400' : 'text-red-400'}`}>
                {workerOnline ? `Worker Online (${workerActiveCount} active)` : 'Worker Offline'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" placeholder="Search by tester or project..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <i className="ri-filter-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-9 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="ready">Ready</option>
                  <option value="resetting">Resetting</option>
                  <option value="requested">Requested</option>
                  <option value="provisioning">Provisioning</option>
                  <option value="ended">Ended</option>
                  <option value="expired">Expired</option>
                  <option value="failed">Failed</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
              <div className="relative">
                <i className="ri-heart-pulse-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
                <select value={healthFilter} onChange={(e) => setHealthFilter(e.target.value)}
                  className="pl-9 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
                  <option value="all">All Health</option>
                  <option value="healthy">Healthy</option>
                  <option value="degraded">Degraded</option>
                  <option value="unhealthy">Unhealthy</option>
                  <option value="unknown">Unknown</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
              <button onClick={() => { fetchData(); checkWorker(); }}
                className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-[#06B6D4] transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Tester</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Project</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Mode</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Health</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Worker</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Started</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Expires</th>
                  <th className="text-right py-3 px-5 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInstances.map((inst) => {
                  const sc = SANDBOX_STATUS_CONFIG[inst.status as SandboxStatus];
                  const mc = SANDBOX_MODE_CONFIG[inst.sandbox_mode as keyof typeof SANDBOX_MODE_CONFIG];
                  const hc = SANDBOX_HEALTH_CONFIG[inst.health_status as keyof typeof SANDBOX_HEALTH_CONFIG];
                  const isWorkerBacked = ['ready', 'active', 'paused', 'resetting'].includes(inst.status);
                  const workerStateLabel = !isWorkerBacked ? '—' :
                    workerOnline ? 'Active' : 'Offline';
                  const workerStateColor = !isWorkerBacked ? '#64748B' :
                    workerOnline ? '#10B981' : '#EF4444';

                  return (
                    <tr key={inst.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-5">
                        <p className="text-sm font-medium text-white">{inst.tester_name}</p>
                        <p className="text-xs text-slate-500">{inst.tester_email}</p>
                      </td>
                      <td className="py-3 px-5">
                        <p className="text-sm text-white">{inst.project_name}</p>
                        {inst.environment_name && <p className="text-xs text-slate-500">{inst.environment_name}</p>}
                      </td>
                      <td className="py-3 px-5">
                        <span className="text-xs font-medium" style={{ color: mc?.color || '#94A3B8' }}>{mc?.label || inst.sandbox_mode}</span>
                      </td>
                      <td className="py-3 px-5">
                        <span className="px-2 py-0.5 rounded-lg text-xs font-medium" style={{ color: sc?.color || '#94A3B8', backgroundColor: sc?.bg }}>
                          {sc?.label || inst.status}
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        <span className="text-xs" style={{ color: hc?.color || '#94A3B8' }}>{hc?.label || inst.health_status}</span>
                      </td>
                      <td className="py-3 px-5">
                        <span className="text-xs font-medium" style={{ color: workerStateColor }}>{workerStateLabel}</span>
                      </td>
                      <td className="py-3 px-5">
                        <span className="text-xs text-slate-400">{inst.started_at ? new Date(inst.started_at).toLocaleDateString('en-GB') : '—'}</span>
                      </td>
                      <td className="py-3 px-5">
                        <div className="text-xs">
                          <span className="text-slate-400">{formatTimeRemaining(inst.expires_at)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => openDetail(inst)}
                            className="p-1.5 rounded-lg bg-white/5 border border-[rgba(255,255,255,0.06)] text-slate-400 hover:text-[#06B6D4] cursor-pointer" title="View">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {inst.status === 'active' && (
                            <>
                              <button onClick={() => handleAction(inst.id, 'extend')} disabled={actionLoading === inst.id}
                                className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 cursor-pointer" title="Extend">
                                <Clock className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleAction(inst.id, 'end')} disabled={actionLoading === inst.id}
                                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer" title="End">
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {inst.status === 'paused' && (
                            <button onClick={() => handleAction(inst.id, 'end')} disabled={actionLoading === inst.id}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer" title="End">
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredInstances.length === 0 && (
            <div className="text-center py-16">
              <Box className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No sandbox instances</p>
              <p className="text-sm text-slate-500 mt-1">Sandbox instances appear when testers start sandbox testing</p>
            </div>
          )}
        </div>

        {detailOpen && selected && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDetailOpen(false)}>
            <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-[#1E293B] border-b border-[rgba(255,255,255,0.08)] p-5 flex items-center justify-between z-10">
                <h3 className="text-lg font-bold text-white">Sandbox Detail</h3>
                <button onClick={() => setDetailOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/5 text-slate-400 hover:text-white cursor-pointer">
                  <i className="ri-close-line text-lg" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><span className="text-slate-500 block text-xs mb-0.5">Tester</span><span className="text-white font-medium">{selected.tester_name}</span></div>
                  <div><span className="text-slate-500 block text-xs mb-0.5">Project</span><span className="text-white font-medium">{selected.project_name}</span></div>
                  <div><span className="text-slate-500 block text-xs mb-0.5">Mode</span>
                    <span className="font-medium" style={{ color: SANDBOX_MODE_CONFIG[selected.sandbox_mode as keyof typeof SANDBOX_MODE_CONFIG]?.color }}>{SANDBOX_MODE_CONFIG[selected.sandbox_mode as keyof typeof SANDBOX_MODE_CONFIG]?.label}</span>
                  </div>
                  <div><span className="text-slate-500 block text-xs mb-0.5">Status</span>
                    <span className="px-2 py-0.5 rounded-lg text-xs font-medium" style={{ color: SANDBOX_STATUS_CONFIG[selected.status as SandboxStatus]?.color, backgroundColor: SANDBOX_STATUS_CONFIG[selected.status as SandboxStatus]?.bg }}>{SANDBOX_STATUS_CONFIG[selected.status as SandboxStatus]?.label}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                  <div><span className="text-slate-500 block text-xs mb-0.5">Worker Instance</span><span className="text-white font-medium font-mono text-xs">{selected.metadata?.worker_instance_id ? (selected.metadata.worker_instance_id as string).substring(0, 12) : '—'}</span></div>
                  <div><span className="text-slate-500 block text-xs mb-0.5">Context State</span><span className="text-white font-medium">{['ready', 'active', 'paused', 'resetting'].includes(selected.status) ? 'Active' : '—'}</span></div>
                  <div><span className="text-slate-500 block text-xs mb-0.5">Last Health Check</span><span className="text-white font-medium">{selected.last_health_at ? new Date(selected.last_health_at).toLocaleTimeString('en-GB') : '—'}</span></div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Temporary Accounts</h4>
                  {accounts.length === 0 ? (
                    <p className="text-sm text-slate-500">No temporary accounts</p>
                  ) : (
                    <div className="space-y-2">
                      {accounts.map((acct) => (
                        <div key={acct.id} className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-3 flex items-center justify-between">
                          <div>
                            <span className="text-sm text-white font-medium">{acct.display_name}</span>
                            <span className="text-xs text-slate-500 ml-2 capitalize">{acct.account_type}</span>
                            {acct.username && <span className="text-xs text-slate-500 ml-2 font-mono">{acct.username}</span>}
                          </div>
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                            acct.status === 'active' ? 'text-emerald-400 bg-emerald-400/10' :
                            acct.status === 'disabled' ? 'text-slate-400 bg-slate-400/10' :
                            'text-amber-400 bg-amber-400/10'
                          }`}>{acct.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Seeded Records ({seededRecords.length})</h4>
                  {seededRecords.length === 0 ? (
                    <p className="text-sm text-slate-500">No seeded records</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {seededRecords.map((rec) => (
                        <div key={rec.id} className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-lg p-2 text-xs">
                          <span className="text-slate-400">{rec.record_type}</span>
                          {rec.display_reference && <span className="text-white ml-2">{rec.display_reference}</span>}
                          <span className={`ml-2 px-1 py-0 rounded ${
                            rec.status === 'created' ? 'text-emerald-400 bg-emerald-400/10' :
                            rec.status === 'removed' ? 'text-red-400 bg-red-400/10' :
                            'text-slate-400 bg-slate-400/10'
                          }`}>{rec.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Action History ({actions.length})</h4>
                  {actions.length === 0 ? (
                    <p className="text-sm text-slate-500">No actions recorded</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {actions.map((act) => (
                        <div key={act.id} className="flex items-center gap-3 text-xs py-1 border-b border-[rgba(255,255,255,0.04)] last:border-0">
                          <span className="text-slate-500 font-mono w-20 shrink-0">{new Date(act.requested_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-white capitalize">{act.action_type.replace(/_/g, ' ')}</span>
                          <span className={`px-1.5 py-0 rounded font-medium ${
                            act.status === 'completed' ? 'text-emerald-400 bg-emerald-400/10' :
                            act.status === 'failed' ? 'text-red-400 bg-red-400/10' :
                            'text-amber-400 bg-amber-400/10'
                          }`}>{act.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-1 mt-4 border-b border-[rgba(255,255,255,0.08)]">
                  {(['overview', 'accounts', 'actions', 'records', 'messages'] as const).map((tab) => (
                    <button key={tab} onClick={() => setDetailTab(tab)}
                      className={`px-4 py-2 text-xs font-medium capitalize transition-colors cursor-pointer ${
                        detailTab === tab ? 'text-[#06B6D4] border-b-2 border-[#06B6D4]' : 'text-slate-500 hover:text-slate-300'
                      }`}>
                      {tab}
                    </button>
                  ))}
                </div>

                {detailTab === 'messages' && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Intercepted Messages ({staffMessages.length})</h4>
                      <button onClick={refreshStaffMessages} disabled={staffLoading}
                        className="text-xs text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer flex items-center gap-1">
                        <i className="ri-refresh-line" /> Refresh
                      </button>
                    </div>
                    {staffError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 mb-3">{staffError}</div>
                    )}
                    {staffMessages.length === 0 && !staffLoading && (
                      <p className="text-sm text-slate-500">No intercepted messages for this sandbox</p>
                    )}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {staffMessages.map((msg: any) => (
                        <div key={msg.id} className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-3">
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5">{getTypeIcon(msg.message_type)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm text-white font-medium truncate">{msg.subject || msg.safe_preview || 'No subject'}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${getStatusColor(msg.status)}`}>
                                  {formatStatusLabel(msg.status)}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 truncate">
                                {msg.sender_address || 'Unknown'} → {msg.recipient_address || 'Unknown'}
                                {msg.recipient_display && msg.recipient_display !== msg.recipient_address && (
                                  <span className="ml-1 text-slate-600">({msg.recipient_display})</span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-600 mt-1">
                                {new Date(msg.intercepted_at).toLocaleString('en-GB')}
                                {msg.provider_name && <span className="ml-2">Provider: {msg.provider_name}</span>}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              {msg.status !== 'quarantined' && (
                                <button onClick={() => setQuarantineTarget(msg.id)}
                                  className="p-1 rounded bg-white/5 text-slate-400 hover:text-red-400 cursor-pointer" title="Quarantine">
                                  <Shield className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {quarantineTarget && (
                      <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        <p className="text-xs text-amber-400 mb-2">Quarantine reason required</p>
                        <input
                          type="text"
                          value={quarantineReason}
                          onChange={(e) => setQuarantineReason(e.target.value)}
                          placeholder="Reason for quarantine..."
                          className="w-full px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 mb-2"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleQuarantine(quarantineTarget)}
                            disabled={!quarantineReason.trim()}
                            className="px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-lg text-xs font-medium cursor-pointer disabled:opacity-40 whitespace-nowrap">
                            Quarantine
                          </button>
                          <button onClick={() => { setQuarantineTarget(null); setQuarantineReason(''); }}
                            className="px-3 py-1.5 bg-white/5 text-slate-400 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}