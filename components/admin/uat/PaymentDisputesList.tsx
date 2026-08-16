'use client';

import { useState } from 'react';
import { useDisputes } from '@/hooks/useUatTesterData';
import { supabase } from '@/lib/supabase';
import { DISPUTE_STATUS_CONFIG } from '@/lib/uat-tester-definitions';
import { Search, RefreshCw, ShieldAlert, ChevronDown, Eye, X, CheckCircle, Clock, Loader2 } from 'lucide-react';

export default function PaymentDisputesList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { disputes, loading, refetch } = useDisputes(
    statusFilter !== 'all' ? { status: statusFilter } : undefined
  );
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [resolveOpen, setResolveOpen] = useState(false);

  const handleStatusChange = async (dispId: string, newStatus: string, extra?: any) => {
    setStatusUpdating(dispId);
    const updates: any = { status: newStatus, updated_at: new Date().toISOString() };
    if (newStatus === 'resolved' || newStatus === 'closed') updates.resolved_at = new Date().toISOString();
    if (newStatus === 'upheld' || newStatus === 'rejected') updates.decided_at = new Date().toISOString();
    if (extra) Object.assign(updates, extra);

    await supabase.from('uat_payment_disputes').update(updates).eq('id', dispId);
    await supabase.from('uat_audit_log').insert({ action: `Dispute ${newStatus}`, entity_type: 'uat_payment_dispute', entity_id: dispId, new_value: updates });
    setStatusUpdating(null);
    setResolveOpen(false);
    setDecisionReason('');
    refetch();
  };

  const openResolve = (d: any) => {
    setSelected(d);
    setDecisionReason('');
    setResolveOpen(true);
  };

  let filtered = disputes;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = disputes.filter((d: any) =>
      (d.tester_name && d.tester_name.toLowerCase().includes(q)) ||
      (d.reason && d.reason.toLowerCase().includes(q)) ||
      (d.reference && d.reference.toLowerCase().includes(q))
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Disputes', value: disputes.length, color: '#94A3B8' },
          { label: 'Open', value: disputes.filter((d: any) => d.status === 'open').length, color: '#F59E0B' },
          { label: 'Under Review', value: disputes.filter((d: any) => d.status === 'under_review').length, color: '#8B5CF6' },
          { label: 'Resolved', value: disputes.filter((d: any) => ['resolved', 'closed'].includes(d.status)).length, color: '#10B981' },
        ].map((item) => (
          <div key={item.label} className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-1">{item.label}</p>
            <p className="text-xl font-bold" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" placeholder="Search by tester, reference, or reason..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-3 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
                <option value="all">All Status</option>
                {Object.entries(DISPUTE_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>
            <button onClick={refetch} className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-[#06B6D4] transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)]">
                <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Reference</th>
                <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Tester</th>
                <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Reason</th>
                <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Status</th>
                <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Decision</th>
                <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Submitted</th>
                <th className="text-right text-xs font-medium text-slate-500 px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d: any) => {
                const conf = DISPUTE_STATUS_CONFIG[d.status] || DISPUTE_STATUS_CONFIG.open;
                return (
                  <tr key={d.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4"><p className="text-xs font-mono text-slate-400">{d.reference || '-'}</p></td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-white">{d.tester_name}</p>
                      <p className="text-xs text-slate-500">{d.tester_reference || d.tester_email}</p>
                    </td>
                    <td className="px-6 py-4"><p className="text-sm text-slate-300 max-w-[200px] truncate">{d.reason}</p></td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2.5 py-0.5 rounded-lg text-xs font-medium"
                        style={{ color: conf.color, backgroundColor: conf.color + '15', border: '1px solid ' + conf.color + '30' }}>
                        {conf.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-white max-w-[150px] truncate">{d.decision || '-'}</p>
                      {d.adjustment_amount && <p className="text-xs text-amber-400">Adj: £{d.adjustment_amount}</p>}
                    </td>
                    <td className="px-6 py-4"><p className="text-xs text-slate-400">{new Date(d.submitted_at || d.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {['open', 'under_review', 'information_required'].includes(d.status) && (
                          <>
                            <button onClick={() => handleStatusChange(d.id, 'under_review')} disabled={d.status === 'under_review' || statusUpdating === d.id}
                              className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 cursor-pointer" title="Review">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => openResolve(d)} disabled={statusUpdating === d.id}
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer" title="Resolve">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {['under_review'].includes(d.status) && (
                          <button onClick={() => handleStatusChange(d.id, 'closed')} disabled={statusUpdating === d.id}
                            className="p-1.5 rounded-lg bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 cursor-pointer" title="Close">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {statusUpdating === d.id && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">No disputes found</p>
            <p className="text-sm text-slate-500 mt-1">No payment disputes have been filed yet.</p>
          </div>
        )}
      </div>

      {resolveOpen && selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setResolveOpen(false)}>
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-[rgba(255,255,255,0.08)]">
              <h2 className="text-lg font-bold text-white">Resolve Dispute</h2>
              <p className="text-xs text-slate-400 mt-1">{selected.tester_name} — {selected.reason}</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Decision</label>
                <div className="flex flex-wrap gap-2">
                  {['upheld', 'partially_upheld', 'rejected'].map((dec) => {
                    const dConf = DISPUTE_STATUS_CONFIG[dec];
                    return (
                      <button key={dec} onClick={() => setSelected({ ...selected, decision: dec })}
                        className={`px-3 py-2 rounded-xl text-xs font-medium cursor-pointer whitespace-nowrap transition-colors ${selected.decision === dec ? 'bg-white/10 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
                        {dConf?.label || dec}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Adjustment Amount (£)</label>
                <input type="number" step="0.01" value={selected.adjustment_amount || ''}
                  onChange={(e) => setSelected({ ...selected, adjustment_amount: e.target.value ? Number(e.target.value) : null })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Decision Reason</label>
                <textarea value={decisionReason} onChange={(e) => setDecisionReason(e.target.value)} rows={3}
                  className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 resize-none" />
              </div>
            </div>
            <div className="p-5 border-t border-[rgba(255,255,255,0.08)] flex justify-end gap-3">
              <button onClick={() => setResolveOpen(false)} className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-white cursor-pointer whitespace-nowrap">Cancel</button>
              <button onClick={() => handleStatusChange(selected.id, selected.decision === 'rejected' ? 'rejected' : 'resolved', {
                decision: selected.decision, decision_reason: decisionReason,
                adjustment_amount: selected.adjustment_amount,
              })} disabled={!selected.decision || !decisionReason}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap">
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}