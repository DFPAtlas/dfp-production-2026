'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, RefreshCw, Clock, Zap, ChevronRight, Activity
} from 'lucide-react';
import {
  AutomationExecution,
  ExecutionStatus,
  EXECUTION_STATUS_LABELS,
  EXECUTION_STATUS_COLORS,
} from '@/components/admin/email/automations/automation-types';

export default function AutomationActivityClient({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [automationName, setAutomationName] = useState('');

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    const { data: auto } = await supabase.from('email_automations').select('name').eq('id', params.id).maybeSingle();
    if (auto) setAutomationName((auto as { name: string }).name);

    const query = supabase.from('email_automation_executions').select('*').eq('automation_id', params.id).order('created_at', { ascending: false }).limit(50);
    const { data } = await query;
    if (data) setExecutions(data as AutomationExecution[]);
    setLoading(false);
  }, [params.id]);

  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  const filtered = statusFilter === 'all' ? executions : executions.filter(e => e.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(`/admin/email/automations/${params.id}`)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Activity Log</h1>
            <p className="text-sm text-slate-400">{automationName || 'Automation'} — Execution history</p>
          </div>
        </div>
        <button onClick={fetchActivity} className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm font-medium hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {['all', 'completed', 'failed', 'running', 'waiting', 'needs_attention'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === s
                ? 'bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/30'
                : 'bg-white/[0.03] text-slate-400 border border-[rgba(255,255,255,0.06)] hover:text-white'
            }`}
          >
            {s === 'all' ? 'All' : EXECUTION_STATUS_LABELS[s as ExecutionStatus]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-14 bg-white/[0.02] rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-[#121215] border border-[rgba(255,255,255,0.06)] flex items-center justify-center mx-auto mb-4">
            <Activity className="w-6 h-6 text-slate-500" />
          </div>
          <p className="text-sm text-slate-400">No execution records found.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map(ex => {
            const statusStyle = EXECUTION_STATUS_COLORS[ex.status as ExecutionStatus] || EXECUTION_STATUS_COLORS.pending;
            return (
              <div key={ex.id} className="flex items-center gap-4 px-4 py-3 bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl hover:bg-white/[0.04] transition-all">
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  ex.status === 'completed' ? 'bg-emerald-400' :
                  ex.status === 'failed' || ex.status === 'needs_attention' ? 'bg-red-400' :
                  ex.status === 'running' ? 'bg-cyan-400 animate-pulse' :
                  ex.status === 'waiting' ? 'bg-violet-400' :
                  'bg-slate-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium ${statusStyle}`}>
                      {EXECUTION_STATUS_LABELS[ex.status as ExecutionStatus]}
                    </span>
                    {ex.idempotency_key && <span className="text-[9px] text-slate-600 font-mono">{ex.idempotency_key.slice(0, 12)}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(ex.created_at).toLocaleString('en-GB')}</span>
                    {ex.recipient_email && <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {ex.recipient_email}</span>}
                    <span>Step {ex.current_step}/{ex.max_attempts} attempt(s)</span>
                  </div>
                  {ex.error_message && (
                    <p className="text-[11px] text-red-400 mt-1 truncate">{ex.error_message}</p>
                  )}
                </div>
                {ex.status === 'needs_attention' && (
                  <button className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-[11px] font-medium hover:bg-amber-500/20 transition-all cursor-pointer whitespace-nowrap">
                    <RefreshCw className="w-3 h-3" /> Retry
                  </button>
                )}
                <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}