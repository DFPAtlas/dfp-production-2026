'use client';

import { ExecutionRecord } from '@/hooks/useAutomationData';
import { AlertTriangle, Clock, CheckCircle2, XCircle, Timer, Search } from 'lucide-react';

interface Props {
  executions: ExecutionRecord[];
  loading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
}

const STATUS_ICONS: Record<string, { Icon: any; color: string }> = {
  successful: { Icon: CheckCircle2, color: '#10B981' },
  failed: { Icon: XCircle, color: '#EF4444' },
  running: { Icon: Timer, color: '#3B82F6' },
  queued: { Icon: Clock, color: '#64748B' },
  cancelled: { Icon: XCircle, color: '#94A3B8' },
  timed_out: { Icon: AlertTriangle, color: '#F97316' },
  waiting_approval: { Icon: Clock, color: '#F59E0B' },
  retrying: { Icon: Timer, color: '#8B5CF6' },
  unknown: { Icon: AlertTriangle, color: '#64748B' },
};

export default function ExecutionsList({ executions, loading, search, onSearchChange }: Props) {
  if (loading) {
    return <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text" value={search} onChange={e => onSearchChange(e.target.value)}
          placeholder="Search by workflow name, error, correlation ID..."
          className="w-full pl-9 pr-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
        />
      </div>

      {executions.length === 0 ? (
        <div className="text-center py-16">
          <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No executions found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-[rgba(255,255,255,0.06)]">
                <th className="px-4 py-3 font-medium">Workflow</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Trigger</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Started</th>
                <th className="px-4 py-3 font-medium">Error</th>
              </tr>
            </thead>
            <tbody>
              {executions.map((ex) => {
                const si = STATUS_ICONS[ex.status] || STATUS_ICONS.unknown;
                return (
                  <tr key={ex.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium text-xs">{ex.workflow?.workflow_name || 'Unknown'}</p>
                      <p className="text-[10px] text-slate-600 font-mono">{ex.correlation_id?.slice(0, 12) || '--'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase" style={{ color: si.color, background: `${si.color}10` }}>
                        <si.Icon className="w-3 h-3" />{ex.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{ex.trigger_type?.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs font-mono">{ex.duration_ms ? `${(ex.duration_ms / 1000).toFixed(2)}s` : '--'}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs font-mono">
                      {ex.started_at ? new Date(ex.started_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '--'}
                    </td>
                    <td className="px-4 py-3 text-xs max-w-[200px] truncate" style={{ color: ex.status === 'failed' ? '#EF4444' : '#64748B' }}>
                      {ex.error_summary || '--'}
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