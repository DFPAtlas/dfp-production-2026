'use client';

import { ExecutionRecord } from '@/hooks/useAutomationData';
import { AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';

interface Props {
  executions: ExecutionRecord[];
  loading: boolean;
}

export default function FailureQueue({ executions, loading }: Props) {
  const failures = executions.filter(e => e.status === 'failed' || e.status === 'timed_out');

  if (loading) {
    return <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" /></div>;
  }

  if (failures.length === 0) {
    return (
      <div className="text-center py-16">
        <CheckCircle2 className="w-12 h-12 text-emerald-500/30 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">No failures in queue</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {failures.map((ex) => (
        <div key={ex.id} className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-4 hover:border-red-500/20 transition-all">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-white font-medium text-sm">{ex.workflow?.workflow_name || 'Unknown Workflow'}</p>
              <p className="text-[10px] text-slate-600 font-mono">{ex.correlation_id?.slice(0, 16) || '--'}</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 uppercase">Failed</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs mb-2">
            <div><span className="text-slate-500">Node:</span> <span className="text-slate-300">{ex.failed_node || 'Unknown'}</span></div>
            <div><span className="text-slate-500">Category:</span> <span className="text-slate-300">{ex.error_category || '--'}</span></div>
            <div><span className="text-slate-500">Retry #:</span> <span className="text-slate-300">{ex.retry_number}</span></div>
          </div>

          <p className="text-xs text-red-400 mb-3 line-clamp-2">{ex.error_summary || 'No error details'}</p>

          <div className="flex items-center gap-1">
            <button className="px-3 py-1.5 text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/10 rounded-lg hover:bg-amber-500/15 cursor-pointer whitespace-nowrap">
              <RefreshCw className="w-3 h-3 inline mr-1" />Retry
            </button>
            <button className="px-3 py-1.5 text-[11px] text-slate-400 bg-white/5 border border-[rgba(255,255,255,0.06)] rounded-lg hover:bg-white/10 cursor-pointer whitespace-nowrap">
              Assign
            </button>
            <button className="px-3 py-1.5 text-[11px] text-slate-400 bg-white/5 border border-[rgba(255,255,255,0.06)] rounded-lg hover:bg-white/10 cursor-pointer whitespace-nowrap">
              Mark Reviewed
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}