'use client';

import { useState } from 'react';
import { motion } from '@/components/motion';
import { usePaymentApprovals } from '@/hooks/useUatTesterData';
import { supabase } from '@/lib/supabase';
import { PAYMENT_APPROVAL_CONFIG } from '@/lib/uat-tester-definitions';
import { Search, RefreshCw, Eye, ChevronDown, DollarSign, CheckCircle, XCircle, Ban, Clock, Loader2, X, Send, AlertTriangle } from 'lucide-react';

export default function PaymentApprovalQueue() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { payments, loading, refetch } = usePaymentApprovals(
    statusFilter !== 'all' ? { status: statusFilter } : undefined
  );
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);

  const handleStatusChange = async (payId: string, newState: string, extra?: any) => {
    setStatusUpdating(payId);
    const updates: any = { eligibility_state: newState, updated_at: new Date().toISOString() };
    if (newState === 'paid') updates.confirmed_at = new Date().toISOString();
    if (newState === 'rejected') updates.rejected_at = new Date().toISOString();
    if (newState === 'cancelled') updates.cancelled_at = new Date().toISOString();
    if (extra) Object.assign(updates, extra);

    await supabase.from('uat_payments').update(updates).eq('id', payId);
    await supabase.from('uat_audit_log').insert({ action: `Payment ${newState}`, entity_type: 'uat_payment', entity_id: payId, new_value: updates });
    setStatusUpdating(null);
    setRejectOpen(false);
    setRejectReason('');
    refetch();
  };

  const openReject = (pay: any) => {
    setSelected(pay);
    setRejectReason('');
    setRejectOpen(true);
  };

  let filtered = payments;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = payments.filter((p: any) =>
      (p.tester_name && p.tester_name.toLowerCase().includes(q)) ||
      (p.job_title && p.job_title.toLowerCase().includes(q)) ||
      (p.tester_reference && p.tester_reference.toLowerCase().includes(q))
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
      </div>
    );
  }

  const totalApproved = payments.filter((p: any) => ['approved', 'sent_to_finance', 'processing', 'paid'].includes(p.eligibility_state)).reduce((s: number, p: any) => s + (p.total_amount || 0), 0);
  const totalPending = payments.filter((p: any) => ['draft', 'awaiting_review', 'changes_required'].includes(p.eligibility_state)).reduce((s: number, p: any) => s + (p.total_amount || 0), 0);

  return (
    <div>
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Total Payments</p>
          <p className="text-xl font-bold text-white">{payments.length}</p>
        </div>
        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Approved/Paid</p>
          <p className="text-xl font-bold text-emerald-400">£{totalApproved.toFixed(2)}</p>
        </div>
        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Pending Approval</p>
          <p className="text-xl font-bold text-amber-400">£{totalPending.toFixed(2)}</p>
        </div>
        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Failed</p>
          <p className="text-xl font-bold text-red-400">{payments.filter((p: any) => p.eligibility_state === 'failed').length}</p>
        </div>
      </div>

      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" placeholder="Search by tester, job, or reference..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-3 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
                <option value="all">All States</option>
                {Object.entries(PAYMENT_APPROVAL_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
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
                <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Tester</th>
                <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Job / Ref</th>
                <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Base</th>
                <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Bonus</th>
                <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Total</th>
                <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">State</th>
                <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Date</th>
                <th className="text-right text-xs font-medium text-slate-500 px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: any) => {
                const conf = PAYMENT_APPROVAL_CONFIG[p.eligibility_state] || PAYMENT_APPROVAL_CONFIG.draft;
                return (
                  <tr key={p.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-white">{p.tester_name}</p>
                      <p className="text-xs text-slate-500">{p.tester_reference || p.tester_email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-white">{p.job_title}</p>
                      <p className="text-xs text-slate-500">{p.assignment_status}</p>
                    </td>
                    <td className="px-6 py-4"><p className="text-sm text-white">£{p.base_amount || 0}</p></td>
                    <td className="px-6 py-4"><p className="text-sm text-white">{(p.bonus_amount || 0) > 0 ? `£${p.bonus_amount}` : '-'}</p></td>
                    <td className="px-6 py-4"><p className="text-sm font-semibold text-white">£{p.total_amount || 0} {p.currency || 'GBP'}</p></td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2.5 py-0.5 rounded-lg text-xs font-medium"
                        style={{ color: conf.color, backgroundColor: conf.color + '15', border: '1px solid ' + conf.color + '30' }}>
                        {conf.label}
                      </span>
                    </td>
                    <td className="px-6 py-4"><p className="text-xs text-slate-400">{p.paid_at ? new Date(p.paid_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</p></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {['draft', 'awaiting_review'].includes(p.eligibility_state) && (
                          <>
                            <button onClick={() => handleStatusChange(p.id, 'approved')} disabled={statusUpdating === p.id}
                              className="p-1.5 rounded-lg bg-[#06B6D4]/10 text-[#06B6D4] hover:bg-[#06B6D4]/20 cursor-pointer" title="Approve">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => openReject(p)} disabled={statusUpdating === p.id}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer" title="Reject">
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {p.eligibility_state === 'approved' && (
                          <>
                            <button onClick={() => handleStatusChange(p.id, 'sent_to_finance')} disabled={statusUpdating === p.id}
                              className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 cursor-pointer" title="Send to Finance">
                              <Send className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleStatusChange(p.id, 'cancelled')} disabled={statusUpdating === p.id}
                              className="p-1.5 rounded-lg bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 cursor-pointer" title="Cancel">
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {p.eligibility_state === 'sent_to_finance' && (
                          <button onClick={() => handleStatusChange(p.id, 'paid')} disabled={statusUpdating === p.id}
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer" title="Mark Paid">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {statusUpdating === p.id && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                        )}
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
            <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">No payments found</p>
            <p className="text-sm text-slate-500 mt-1">{payments.length === 0 ? 'No payments have been created yet.' : 'No payments match your filters.'}</p>
          </div>
        )}
      </div>

      {rejectOpen && selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setRejectOpen(false)}>
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-[rgba(255,255,255,0.08)]">
              <h2 className="text-lg font-bold text-white">Reject Payment</h2>
              <p className="text-xs text-slate-400 mt-1">{selected.tester_name} — £{selected.total_amount}</p>
            </div>
            <div className="p-5">
              <label className="text-xs text-slate-400 mb-1.5 block">Reason for Rejection</label>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3}
                className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 resize-none" />
            </div>
            <div className="p-5 border-t border-[rgba(255,255,255,0.08)] flex justify-end gap-3">
              <button onClick={() => setRejectOpen(false)} className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-white cursor-pointer whitespace-nowrap">Cancel</button>
              <button onClick={() => handleStatusChange(selected.id, 'rejected', { rejection_reason: rejectReason })}
                disabled={!rejectReason}
                className="px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap">
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}