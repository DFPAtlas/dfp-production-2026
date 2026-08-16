'use client';

import { AgentRecord } from '@/hooks/useAutomationData';
import { AGENT_STATUS_STYLES } from '@/lib/automation-definitions';
import { Bot } from 'lucide-react';

interface Props {
  agents: AgentRecord[];
  loading: boolean;
}

export default function AgentsList({ agents, loading }: Props) {
  if (loading) {
    return <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" /></div>;
  }

  if (agents.length === 0) {
    return (
      <div className="text-center py-16">
        <Bot className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">No AI agents configured</p>
        <p className="text-xs text-slate-600 mt-1">Create your first AI agent to see it here</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-500 border-b border-[rgba(255,255,255,0.06)]">
            <th className="px-4 py-3 font-medium">Agent</th>
            <th className="px-4 py-3 font-medium">Provider</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Runs</th>
            <th className="px-4 py-3 font-medium">Tokens</th>
            <th className="px-4 py-3 font-medium">Cost</th>
            <th className="px-4 py-3 font-medium">Last Run</th>
            <th className="px-4 py-3 font-medium">Latest Error</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((agent) => {
            const st = AGENT_STATUS_STYLES[agent.status] || AGENT_STATUS_STYLES.draft;
            const successRate = agent.total_runs > 0 ? Math.round((agent.total_successes / agent.total_runs) * 100) : null;

            return (
              <tr key={agent.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <p className="text-white font-medium">{agent.name}</p>
                  <p className="text-xs text-slate-500">{agent.purpose?.slice(0, 40)}{(agent.purpose?.length || 0) > 40 ? '...' : ''}</p>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">{agent.provider || '--'}</td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase" style={{ color: st.color, background: st.bg }}>{st.label}</span>
                </td>
                <td className="px-4 py-3 text-slate-300 text-xs">
                  {agent.total_runs} <span className="text-slate-500">({successRate !== null ? `${successRate}%` : '--'})</span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs font-mono">{agent.total_tokens > 0 ? (agent.total_tokens >= 1000 ? `${(agent.total_tokens / 1000).toFixed(1)}K` : String(agent.total_tokens)) : '0'}</td>
                <td className="px-4 py-3 text-slate-400 text-xs font-mono">${agent.confirmed_cost.toFixed(2)}</td>
                <td className="px-4 py-3 text-slate-400 text-xs font-mono">
                  {agent.last_run_at ? new Date(agent.last_run_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '--'}
                </td>
                <td className="px-4 py-3 text-xs max-w-[180px] truncate" style={{ color: agent.latest_error ? '#EF4444' : '#64748B' }}>
                  {agent.latest_error || '--'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}