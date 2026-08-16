'use client';

import { Activity, Workflow, Bot, AlertTriangle, Clock, Globe, Zap, DollarSign, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAutomationOverview } from '@/hooks/useAutomationData';

export default function AutomationOverview() {
  const { data, loading } = useAutomationOverview();

  const metrics = [
    { label: 'Active Workflows', value: data.activeWorkflows, sub: `${data.failingWorkflows} failing`, icon: Workflow, color: '#10B981' },
    { label: 'Total Executions', value: data.totalExecutions, sub: data.successRate !== null ? `${data.successRate}% success` : 'No data', icon: Activity, color: '#06B6D4' },
    { label: 'Avg Duration', value: data.avgDurationMs !== null ? `${(data.avgDurationMs / 1000).toFixed(1)}s` : '--', sub: 'per execution', icon: Clock, color: '#8B5CF6' },
    { label: 'Webhook Failures', value: data.webhookFailures, sub: 'total failures', icon: Globe, color: data.webhookFailures > 0 ? '#EF4444' : '#10B981' },
    { label: 'Missed Schedules', value: data.missedSchedules, sub: 'needs attention', icon: RefreshCw, color: data.missedSchedules > 0 ? '#F97316' : '#10B981' },
    { label: 'Active Agents', value: data.activeAgents, sub: `${data.failingAgents} failing`, icon: Bot, color: '#06B6D4' },
    { label: 'Total Tokens', value: data.totalTokens > 0 ? (data.totalTokens >= 1000000 ? `${(data.totalTokens / 1000000).toFixed(1)}M` : (data.totalTokens >= 1000 ? `${(data.totalTokens / 1000).toFixed(0)}K` : String(data.totalTokens))) : '0', sub: 'all agents', icon: Zap, color: '#F59E0B' },
    { label: 'Confirmed Cost', value: `$${data.confirmedCost.toFixed(2)}`, sub: 'USD', icon: DollarSign, color: '#64748B' },
    { label: 'Pending Approvals', value: data.pendingApprovals, sub: data.pendingApprovals > 0 ? 'action needed' : 'clear', icon: CheckCircle2, color: data.pendingApprovals > 0 ? '#F97316' : '#10B981' },
    { label: 'Open Incidents', value: data.openIncidents, sub: 'from automation', icon: AlertTriangle, color: data.openIncidents > 0 ? '#EF4444' : '#10B981' },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-4 animate-pulse">
            <div className="h-3 w-20 bg-white/5 rounded mb-2" />
            <div className="h-6 w-12 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {metrics.map((m) => (
        <div key={m.label} className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-4 hover:border-[rgba(255,255,255,0.12)] transition-all cursor-pointer">
          <div className="flex items-center gap-2 mb-2">
            <m.icon className="w-4 h-4" style={{ color: m.color }} />
            <span className="text-xs text-slate-400">{m.label}</span>
          </div>
          <p className="text-xl font-bold text-white">{m.value}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{m.sub}</p>
        </div>
      ))}
    </div>
  );
}