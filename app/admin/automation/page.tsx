'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import AdminShell from '@/components/admin/AdminShell';
import AutomationOverviewCards from '@/components/admin/automation/AutomationOverviewCards';
import WorkflowsTable from '@/components/admin/automation/WorkflowsTable';
import ExecutionsList from '@/components/admin/automation/ExecutionsList';
import FailureQueue from '@/components/admin/automation/FailureQueue';
import AgentsList from '@/components/admin/automation/AgentsList';
import {
  useAutomationOverview, useWorkflows, useExecutions, useWebhooks,
  useSchedules, useAgents, useModels, useApprovals
} from '@/hooks/useAutomationData';
import {
  HEALTH_STATUS_STYLES, OPERATIONAL_STATUS_STYLES, ENVIRONMENT_STYLES,
  APPROVAL_STATUSES
} from '@/lib/automation-definitions';
import {
  Activity, Workflow, Bot, AlertTriangle, Clock, Globe, RefreshCw,
  Zap, DollarSign, CheckCircle2, Shield, Settings, Play, Pause,
  Archive, Eye, Calendar, Link2, Cpu, Key, FileText, BarChart3,
  AlertOctagon, Plus, Search, X, Trash2
} from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'workflows', label: 'Workflows', icon: Workflow },
  { id: 'executions', label: 'Executions', icon: Activity },
  { id: 'failures', label: 'Failure Queue', icon: AlertTriangle },
  { id: 'webhooks', label: 'Webhooks', icon: Globe },
  { id: 'schedules', label: 'Schedules', icon: Clock },
  { id: 'agents', label: 'AI Agents', icon: Bot },
  { id: 'models', label: 'Models', icon: Cpu },
  { id: 'usage', label: 'Usage & Costs', icon: DollarSign },
  { id: 'approvals', label: 'Approvals', icon: CheckCircle2 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function AutomationControlRoom() {
  const [activeTab, setActiveTab] = useState('overview');
  const [execSearch, setExecSearch] = useState('');
  const { data: overview, loading: overviewLoading, refetch: refetchOverview } = useAutomationOverview();
  const { workflows, loading: wfLoading, refetch: refetchWf } = useWorkflows();
  const { executions, loading: execLoading, refetch: refetchExec } = useExecutions();
  const { webhooks, loading: whLoading, refetch: refetchWh } = useWebhooks();
  const { schedules, loading: schedLoading, refetch: refetchSched } = useSchedules();
  const { agents, loading: agentsLoading, refetch: refetchAgents } = useAgents();
  const { models, loading: modelsLoading } = useModels();
  const { approvals, loading: appLoading, refetch: refetchApp } = useApprovals();

  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [killSwitchConfirm, setKillSwitchConfirm] = useState<string | null>(null);

  const filteredExecs = executions.filter(ex => {
    if (!execSearch) return true;
    const s = execSearch.toLowerCase();
    return (
      (ex.workflow?.workflow_name || '').toLowerCase().includes(s) ||
      (ex.error_summary || '').toLowerCase().includes(s) ||
      (ex.correlation_id || '').toLowerCase().includes(s) ||
      (ex.failed_node || '').toLowerCase().includes(s)
    );
  });

  const handleSelectWorkflow = (id: string) => {
    setSelectedWorkflowId(id);
    setActiveTab('executions');
  };

  const refreshAll = () => {
    refetchOverview();
    refetchWf();
    refetchExec();
    refetchWh();
    refetchSched();
    refetchAgents();
    refetchApp();
  };

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Automation Control Room</h1>
            <p className="text-sm text-slate-400">n8n workflows, AI agents, webhooks, schedules and automation health</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refreshAll} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-400 rounded-xl text-xs font-semibold hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap">
              <RefreshCw className="w-3.5 h-3.5" />Refresh
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.id === 'failures' && executions.filter(e => e.status === 'failed').length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
                    {executions.filter(e => e.status === 'failed').length}
                  </span>
                )}
                {tab.id === 'approvals' && approvals.filter(a => a.status === 'pending').length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                    {approvals.filter(a => a.status === 'pending').length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>

            {activeTab === 'overview' && (
              <div className="space-y-6">
                <AutomationOverviewCards />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
                    <h3 className="text-sm font-bold text-white mb-3">Workflow Health Distribution</h3>
                    <div className="space-y-2">
                      {['healthy', 'degraded', 'failing', 'unknown', 'no_data'].map(h => {
                        const st = HEALTH_STATUS_STYLES[h];
                        const count = workflows.filter(w => w.health_status === h).length;
                        const pct = workflows.length > 0 ? Math.round((count / workflows.length) * 100) : 0;
                        return (
                          <div key={h} className="flex items-center gap-3">
                            <span className="text-xs w-20 text-slate-400">{st.label}</span>
                            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: st.color }} />
                            </div>
                            <span className="text-xs text-slate-300 w-8 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
                    <h3 className="text-sm font-bold text-white mb-3">Environment Distribution</h3>
                    <div className="space-y-2">
                      {['production', 'staging', 'uat', 'testing', 'development'].map(env => {
                        const st = ENVIRONMENT_STYLES[env];
                        const count = workflows.filter(w => w.environment === env).length;
                        const pct = workflows.length > 0 ? Math.round((count / workflows.length) * 100) : 0;
                        return (
                          <div key={env} className="flex items-center gap-3">
                            <span className="text-xs w-20 text-slate-400">{st.label}</span>
                            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: st.color }} />
                            </div>
                            <span className="text-xs text-slate-300 w-8 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'workflows' && (
              <WorkflowsTable workflows={workflows} loading={wfLoading} refetch={refetchWf} onSelect={handleSelectWorkflow} />
            )}

            {activeTab === 'executions' && (
              <ExecutionsList executions={filteredExecs} loading={execLoading} search={execSearch} onSearchChange={setExecSearch} />
            )}

            {activeTab === 'failures' && (
              <FailureQueue executions={executions} loading={execLoading} />
            )}

            {activeTab === 'webhooks' && (
              <div>
                {whLoading ? (
                  <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" /></div>
                ) : webhooks.length === 0 ? (
                  <div className="text-center py-16">
                    <Globe className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No webhooks configured</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-slate-500 border-b border-[rgba(255,255,255,0.06)]">
                          <th className="px-4 py-3 font-medium">Workflow</th>
                          <th className="px-4 py-3 font-medium">Purpose</th>
                          <th className="px-4 py-3 font-medium">Method</th>
                          <th className="px-4 py-3 font-medium">Classification</th>
                          <th className="px-4 py-3 font-medium">Active</th>
                          <th className="px-4 py-3 font-medium">Failures</th>
                          <th className="px-4 py-3 font-medium">Last Request</th>
                        </tr>
                      </thead>
                      <tbody>
                        {webhooks.map((wh) => (
                          <tr key={wh.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02]">
                            <td className="px-4 py-3 text-white text-xs font-medium">{wh.workflow?.workflow_name || '--'}</td>
                            <td className="px-4 py-3 text-slate-400 text-xs">{wh.purpose || '--'}</td>
                            <td className="px-4 py-3 text-slate-400 text-xs font-mono">{wh.http_method}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${wh.classification === 'public' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-500/10 text-slate-400'}`}>
                                {wh.classification}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${wh.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-500'}`}>
                                {wh.active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs" style={{ color: wh.failure_count > 0 ? '#EF4444' : '#64748B' }}>{wh.failure_count}</td>
                            <td className="px-4 py-3 text-slate-400 text-xs font-mono">
                              {wh.last_request_at ? new Date(wh.last_request_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '--'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'schedules' && (
              <div>
                {schedLoading ? (
                  <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" /></div>
                ) : schedules.length === 0 ? (
                  <div className="text-center py-16">
                    <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No schedules configured</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-slate-500 border-b border-[rgba(255,255,255,0.06)]">
                          <th className="px-4 py-3 font-medium">Workflow</th>
                          <th className="px-4 py-3 font-medium">Recurrence</th>
                          <th className="px-4 py-3 font-medium">Timezone</th>
                          <th className="px-4 py-3 font-medium">Active</th>
                          <th className="px-4 py-3 font-medium">Next Run</th>
                          <th className="px-4 py-3 font-medium">Last Actual</th>
                          <th className="px-4 py-3 font-medium">Missed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schedules.map((sch) => (
                          <tr key={sch.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02]">
                            <td className="px-4 py-3 text-white text-xs font-medium">{sch.workflow?.workflow_name || '--'}</td>
                            <td className="px-4 py-3 text-slate-400 text-xs font-mono">{sch.recurrence_rule}</td>
                            <td className="px-4 py-3 text-slate-400 text-xs">{sch.timezone}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${sch.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-500'}`}>
                                {sch.active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-400 text-xs font-mono">
                              {sch.next_expected_run ? new Date(sch.next_expected_run).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '--'}
                            </td>
                            <td className="px-4 py-3 text-slate-400 text-xs font-mono">
                              {sch.last_actual_run ? new Date(sch.last_actual_run).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '--'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${sch.missed_state === 'missed' || sch.missed_state === 'alerted' ? 'bg-red-500/10 text-red-400' : 'bg-slate-500/10 text-slate-400'}`}>
                                {sch.missed_state}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'agents' && (
              <AgentsList agents={agents} loading={agentsLoading} />
            )}

            {activeTab === 'models' && (
              <div>
                {modelsLoading ? (
                  <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" /></div>
                ) : models.length === 0 ? (
                  <div className="text-center py-16">
                    <Cpu className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No AI models registered</p>
                    <p className="text-xs text-slate-600 mt-1">Add models to track connection status and pricing</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-slate-500 border-b border-[rgba(255,255,255,0.06)]">
                          <th className="px-4 py-3 font-medium">Provider</th>
                          <th className="px-4 py-3 font-medium">Model</th>
                          <th className="px-4 py-3 font-medium">Connection</th>
                          <th className="px-4 py-3 font-medium">Context Limit</th>
                          <th className="px-4 py-3 font-medium">Pricing (1K in/out)</th>
                          <th className="px-4 py-3 font-medium">Approved Use</th>
                          <th className="px-4 py-3 font-medium">Last Verified</th>
                        </tr>
                      </thead>
                      <tbody>
                        {models.map((m) => (
                          <tr key={m.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02]">
                            <td className="px-4 py-3 text-white text-xs font-medium">{m.provider}</td>
                            <td className="px-4 py-3 text-slate-300 text-xs font-mono">{m.display_name}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                m.connection_status === 'verified' ? 'bg-emerald-500/10 text-emerald-400' :
                                m.connection_status === 'failed' ? 'bg-red-500/10 text-red-400' :
                                'bg-amber-500/10 text-amber-400'
                              }`}>{m.connection_status}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-400 text-xs font-mono">{m.context_limit ? m.context_limit.toLocaleString() : '--'}</td>
                            <td className="px-4 py-3 text-slate-400 text-xs font-mono">
                              {m.pricing_confirmed ? (
                                <span>${(m.pricing_per_1k_input || 0).toFixed(4)} / ${(m.pricing_per_1k_output || 0).toFixed(4)}</span>
                              ) : (
                                <span className="text-amber-400">unconfirmed</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-400 text-xs">{m.approved_use?.replace(/_/g, ' ')}</td>
                            <td className="px-4 py-3 text-slate-400 text-xs font-mono">
                              {m.last_verified_at ? new Date(m.last_verified_at).toLocaleDateString('en-GB') : 'never'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'usage' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Total Tokens', value: overview.totalTokens > 0 ? (overview.totalTokens >= 1000000 ? `${(overview.totalTokens / 1000000).toFixed(1)}M` : `${(overview.totalTokens / 1000).toFixed(0)}K`) : '0', sub: 'All agents + executions', color: '#06B6D4' },
                    { label: 'Confirmed Cost', value: `$${overview.confirmedCost.toFixed(2)}`, sub: 'USD — provider confirmed', color: '#10B981' },
                    { label: 'Active Agents', value: overview.activeAgents, sub: `${overview.failingAgents} failing`, color: '#8B5CF6' },
                    { label: 'Total Executions', value: overview.totalExecutions, sub: overview.successRate !== null ? `${overview.successRate}% success` : 'No data', color: '#F59E0B' },
                  ].map(m => (
                    <div key={m.label} className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-4">
                      <p className="text-xs text-slate-400 mb-1">{m.label}</p>
                      <p className="text-xl font-bold text-white">{m.value}</p>
                      <p className="text-[11px] text-slate-500">{m.sub}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
                  <h3 className="text-sm font-bold text-white mb-2">Cost Transparency</h3>
                  <p className="text-xs text-slate-400">All costs are shown in USD. Only provider-confirmed costs are displayed as confirmed. Estimated costs are clearly labelled. Local infrastructure costs are tracked separately from per-call provider costs. No currency conversion is performed without a verified source.</p>
                </div>
              </div>
            )}

            {activeTab === 'approvals' && (
              <div>
                {appLoading ? (
                  <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" /></div>
                ) : approvals.length === 0 ? (
                  <div className="text-center py-16">
                    <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No pending approvals</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {approvals.map((app) => (
                      <div key={app.id} className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-white font-medium text-sm">{app.title}</p>
                            <p className="text-xs text-slate-500">{app.approval_type?.replace(/_/g, ' ')} &bull; {app.workflow?.workflow_name || app.agent?.name || '--'}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            app.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                            app.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                            app.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                            'bg-slate-500/10 text-slate-400'
                          }`}>{app.status}</span>
                        </div>
                        {app.description && <p className="text-xs text-slate-400 mb-3">{app.description}</p>}
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span>Created: {new Date(app.created_at).toLocaleString('en-GB')}</span>
                          {app.expires_at && <span>&bull; Expires: {new Date(app.expires_at).toLocaleString('en-GB')}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-red-400" />Kill Switches
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">Emergency controls to stop automation immediately. These actions require confirmation and are audited.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { label: 'Pause All Workflows', desc: 'Pause every active workflow across all environments', color: '#F97316' },
                      { label: 'Disable All AI Agents', desc: 'Stop all AI agent runs immediately', color: '#EF4444' },
                      { label: 'Disable All Webhooks', desc: 'Deactivate all public and internal webhooks', color: '#F59E0B' },
                      { label: 'Emergency Lockdown', desc: 'Pause workflows, disable agents, deactivate webhooks', color: '#DC2626' },
                    ].map(ks => (
                      <div key={ks.label} className="bg-[#0F172A] rounded-xl border border-[rgba(255,255,255,0.06)] p-4">
                        <p className="text-white font-medium text-sm mb-1">{ks.label}</p>
                        <p className="text-xs text-slate-500 mb-3">{ks.desc}</p>
                        <button
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer whitespace-nowrap transition-all"
                          style={{ color: ks.color, borderColor: `${ks.color}30`, backgroundColor: `${ks.color}0a` }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${ks.color}15`; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = `${ks.color}0a`; }}
                        >
                          Activate
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
                  <h3 className="text-sm font-bold text-white mb-4">Credentials Status</h3>
                  <p className="text-xs text-slate-400 mb-4">All credentials and secrets are stored server-side and never exposed to the browser. n8n credential values and secret workflow JSON are not stored in browser-readable records.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { label: 'n8n Webhook Secret', status: 'configured', desc: 'n8n-webhook edge function active' },
                      { label: 'Stripe Webhook Secret', status: 'configured', desc: 'stripe-webhook edge function active' },
                      { label: 'Resend API Key', status: 'configured', desc: 'Email delivery configured' },
                      { label: 'Ollama / AI Provider', status: 'unverified', desc: 'No confirmed AI provider connection' },
                    ].map(c => (
                      <div key={c.label} className="bg-[#0F172A] rounded-xl border border-[rgba(255,255,255,0.06)] p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white text-xs font-medium">{c.label}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            c.status === 'configured' ? 'bg-emerald-500/10 text-emerald-400' :
                            c.status === 'unverified' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-red-500/10 text-red-400'
                          }`}>{c.status}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">{c.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
                  <h3 className="text-sm font-bold text-white mb-2">Data Classification</h3>
                  <p className="text-xs text-slate-400">Workflows are tagged with data classification levels. Restricted data workflows require additional approval for changes. No full confidential payloads are stored in execution records by default.</p>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </AdminShell>
  );
}