'use client';

import { useState, useEffect } from 'react';
import { motion } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import { useInvoiceDetail } from '@/hooks/useFinanceData';
import { STATUS_COLORS, STATUS_LABELS, formatMoney, PAYMENT_STATUSES, PAYMENT_METHODS, isInvoiceMutable, isInvoiceEditable } from '@/lib/finance-definitions';
import AdminShell from '@/components/admin/AdminShell';
import Link from 'next/link';
import {
  ArrowLeft, FileText, List, CreditCard, RotateCcw, Paperclip,
  Activity, Settings, Send, CheckCircle, XCircle, AlertTriangle,
  Clock, Plus, RefreshCw, Loader2, DollarSign, Calculator, Ban
} from 'lucide-react';

const TABS = [
  { key: 'overview', label: 'Overview', icon: FileText },
  { key: 'items', label: 'Line Items', icon: List },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'credits', label: 'Credits & Refunds', icon: RotateCcw },
  { key: 'delivery', label: 'Delivery', icon: Send },
  { key: 'files', label: 'Files', icon: Paperclip },
  { key: 'activity', label: 'Activity', icon: Activity },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export default function InvoiceDetailWorkspace({ invoiceId }: { invoiceId: string }) {
  const { invoice, lineItems, payments, credits, refunds, dispute, loading, refresh } = useInvoiceDetail(invoiceId);
  const [activeTab, setActiveTab] = useState('overview');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [showAddCredit, setShowAddCredit] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '', method: 'bank_transfer', payment_date: new Date().toISOString().split('T')[0],
    provider: '', provider_payment_id: '', confirmation_reason: '',
  });

  const [creditForm, setCreditForm] = useState({ reason: '', amount: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [statusReason, setStatusReason] = useState('');
  const [showStatusReason, setShowStatusReason] = useState<string | null>(null);

  const showNotif = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (['cancelled', 'written_off', 'archived'].includes(newStatus) && !statusReason.trim()) {
      setShowStatusReason(newStatus);
      return;
    }
    const update: Record<string, unknown> = { status: newStatus, updated_at: new Date().toISOString() };
    if (newStatus === 'cancelled') { update.cancelled_at = new Date().toISOString(); update.cancellation_reason = statusReason; }
    if (newStatus === 'written_off') { update.written_off_at = new Date().toISOString(); update.write_off_reason = statusReason; }
    if (newStatus === 'archived') update.archived_at = new Date().toISOString();
    if (newStatus === 'approved') update.approved_at = new Date().toISOString();
    if (newStatus === 'issued') update.issued_at = new Date().toISOString();

    const { error } = await supabase.from('invoices').update(update).eq('id', invoiceId);
    if (!error) {
      showNotif('success', `Status changed to ${STATUS_LABELS[newStatus] || newStatus}`);
      setStatusReason('');
      setShowStatusReason(null);
      refresh();
    } else {
      showNotif('error', 'Failed to update status');
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      showNotif('error', 'Enter a valid amount');
      return;
    }
    setSubmitting(true);
    const amount = parseFloat(paymentForm.amount);
    const currency = String(invoice?.currency || 'GBP');
    const existingPaid = parseFloat(String(invoice?.amount_paid || 0));
    const total = parseFloat(String(invoice?.total || 0));
    const newPaid = existingPaid + amount;

    const { error: payErr } = await supabase.from('payments').insert([{
      invoice_id: invoiceId,
      client_id: invoice?.client_id,
      amount,
      currency,
      payment_date: new Date(paymentForm.payment_date).toISOString(),
      method: paymentForm.method,
      status: 'succeeded',
      provider: paymentForm.provider || null,
      provider_payment_id: paymentForm.provider_payment_id || null,
      confirmation_reason: paymentForm.confirmation_reason || null,
      reconciliation_state: newPaid >= total ? 'matched' : 'partial',
      confirmed_at: new Date().toISOString(),
    }]);

    if (!payErr) {
      const invUpdate: Record<string, unknown> = {
        amount_paid: newPaid,
        amount_outstanding: Math.max(0, total - newPaid),
        updated_at: new Date().toISOString(),
      };
      if (newPaid >= total) {
        invUpdate.status = 'paid';
        invUpdate.paid_at = new Date().toISOString();
      } else if (newPaid > 0 && invUpdate.status !== 'partially_paid') {
        invUpdate.status = 'partially_paid';
      }
      await supabase.from('invoices').update(invUpdate).eq('id', invoiceId);
      showNotif('success', 'Payment recorded');
      setShowRecordPayment(false);
      refresh();
    } else {
      showNotif('error', 'Failed to record payment');
    }
    setSubmitting(false);
  };

  const handleAddCredit = async () => {
    if (!creditForm.reason.trim() || !creditForm.amount || parseFloat(creditForm.amount) <= 0) {
      showNotif('error', 'Enter a reason and valid amount');
      return;
    }
    setSubmitting(true);
    const ref = `DFP-CRN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    const { error } = await supabase.from('credit_notes').insert([{
      credit_reference: ref,
      invoice_id: invoiceId,
      client_id: invoice?.client_id,
      reason: creditForm.reason.trim(),
      amount: parseFloat(creditForm.amount),
      currency: String(invoice?.currency || 'GBP'),
      status: 'draft',
      applied_amount: 0,
      notes: creditForm.notes || null,
    }]);
    if (!error) {
      showNotif('success', 'Credit note created');
      setShowAddCredit(false);
      setCreditForm({ reason: '', amount: '', notes: '' });
      refresh();
    } else {
      showNotif('error', 'Failed to create credit note');
    }
    setSubmitting(false);
  };

  if (loading || !invoice) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
        </div>
      </AdminShell>
    );
  }

  const client = invoice.clients as { company_name?: string; contact_name?: string; email?: string } | null;
  const status = String(invoice.status || 'draft');
  const total = parseFloat(String(invoice.total || invoice.amount || 0));
  const subtotal = parseFloat(String(invoice.subtotal || 0));
  const tax = parseFloat(String(invoice.tax || 0));
  const amountPaid = parseFloat(String(invoice.amount_paid || 0));
  const amountOutstanding = parseFloat(String(invoice.amount_outstanding || total - amountPaid));
  const currency = String(invoice.currency || 'GBP');
  const dueDate = invoice.due_date ? new Date(String(invoice.due_date)) : null;
  const isOverdue = dueDate && dueDate < new Date() && status !== 'paid' && status !== 'cancelled' && status !== 'written_off' && status !== 'archived';

  return (
    <AdminShell>
      {notification && (
        <div className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg ${
          notification.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/invoices" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4 cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> Back to Invoices
          </Link>

          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-xl font-bold text-white">{String(invoice.invoice_number)}</h1>
                <p className="text-sm text-slate-400 mt-1">{String(invoice.description)}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-medium border ${STATUS_COLORS[status] || ''}`}>
                    {STATUS_LABELS[status] || status}
                  </span>
                  {isOverdue && <span className="px-2.5 py-0.5 rounded-lg text-xs font-medium border bg-red-500/10 text-red-400 border-red-500/20">Overdue</span>}
                  <span className="text-xs text-slate-400">
                    {client?.company_name || client?.contact_name || 'No client'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isInvoiceMutable(status) && (
                  <>
                    <button onClick={() => handleStatusChange('awaiting_approval')}
                      className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-sm font-medium hover:bg-blue-500/20 transition-all cursor-pointer whitespace-nowrap"
                    >Submit for Approval</button>
                  </>
                )}
                {status === 'approved' && (
                  <button onClick={() => handleStatusChange('issued')}
                    className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl text-sm font-medium hover:bg-cyan-500/20 transition-all cursor-pointer whitespace-nowrap"
                  >Issue Invoice</button>
                )}
                {['issued', 'overdue', 'partially_paid'].includes(status) && (
                  <button onClick={() => setShowRecordPayment(true)}
                    className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-500/20 transition-all cursor-pointer whitespace-nowrap"
                  ><DollarSign className="w-4 h-4 inline mr-1" /> Record Payment</button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[rgba(255,255,255,0.06)]">
              {[
                { label: 'Total', value: formatMoney(total, currency), color: '#06B6D4' },
                { label: 'Paid', value: formatMoney(amountPaid, currency), color: '#10B981' },
                { label: 'Outstanding', value: formatMoney(amountOutstanding, currency), color: amountOutstanding > 0 ? '#F59E0B' : '#10B981' },
                { label: 'Due Date', value: dueDate ? dueDate.toLocaleDateString('en-GB') : 'Not set', color: isOverdue ? '#EF4444' : '#94A3B8' },
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <p className="text-xs text-slate-400">{stat.label}</p>
                  <p className="text-lg font-bold mt-1" style={{ color: stat.color }}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-1 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-1 mb-6 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.key ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'text-slate-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-white">Invoice Details</h3>
                  {[
                    ['Invoice Number', invoice.invoice_number],
                    ['Status', STATUS_LABELS[status]],
                    ['Currency', currency],
                    ['Payment Terms', String(invoice.payment_terms || 'NET_30').replace('_', ' ')],
                    ['PO Reference', invoice.purchase_order_reference || 'None'],
                    ['Issue Date', invoice.issue_date ? new Date(String(invoice.issue_date)).toLocaleDateString('en-GB') : 'Not set'],
                    ['Due Date', dueDate ? dueDate.toLocaleDateString('en-GB') : 'Not set'],
                    ['Created', new Date(String(invoice.created_at)).toLocaleDateString('en-GB')],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="flex justify-between py-2 border-b border-[rgba(255,255,255,0.04)] last:border-0">
                      <span className="text-sm text-slate-400">{String(label)}</span>
                      <span className="text-sm text-white">{String(value)}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-white">Amount Breakdown</h3>
                  {[
                    ['Subtotal', formatMoney(subtotal, currency)],
                    ['Tax', formatMoney(tax, currency)],
                    ['Total', formatMoney(total, currency)],
                    ['Paid', formatMoney(amountPaid, currency)],
                    ['Outstanding', formatMoney(amountOutstanding, currency)],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="flex justify-between py-2 border-b border-[rgba(255,255,255,0.04)] last:border-0">
                      <span className="text-sm text-slate-400">{String(label)}</span>
                      <span className={`text-sm font-medium ${label === 'Outstanding' && amountOutstanding > 0 ? 'text-amber-400' : 'text-white'}`}>{String(value)}</span>
                    </div>
                  ))}
                  {amountOutstanding > 0 && status !== 'paid' && (
                    <div className="mt-4">
                      <button onClick={() => setShowRecordPayment(true)}
                        className="w-full py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-500/20 transition-all cursor-pointer"
                      >Record Payment</button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Notes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                    <p className="text-xs text-slate-400 mb-1">Client Notes</p>
                    <p className="text-sm text-slate-300">{String(invoice.client_notes || 'No client notes')}</p>
                  </div>
                  <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                    <p className="text-xs text-slate-400 mb-1">Internal Notes</p>
                    <p className="text-sm text-slate-300">{String(invoice.internal_notes || 'No internal notes')}</p>
                  </div>
                </div>
              </div>

              {dispute && (
                <div className="bg-orange-500/5 border border-orange-500/15 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    <h3 className="text-sm font-semibold text-orange-400">Dispute Active</h3>
                  </div>
                  <p className="text-sm text-slate-300">{String((dispute as Record<string, unknown>).reason || 'No reason provided')}</p>
                  <p className="text-xs text-slate-400 mt-1">Status: {String((dispute as Record<string, unknown>).status)}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'items' && (
            <div>
              {lineItems.length === 0 ? (
                <div className="text-center py-12">
                  <List className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400">No line items</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[rgba(255,255,255,0.06)]">
                        <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase">#</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase">Description</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-slate-400 uppercase">Qty</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-slate-400 uppercase">Unit Price</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-slate-400 uppercase">Discount</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-slate-400 uppercase">Tax</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-slate-400 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item: Record<string, unknown>, i: number) => (
                        <tr key={String(item.id || i)} className="border-b border-[rgba(255,255,255,0.03)]">
                          <td className="py-3 px-3 text-sm text-slate-400">{i + 1}</td>
                          <td className="py-3 px-3 text-sm text-white">{String(item.description)}</td>
                          <td className="py-3 px-3 text-sm text-right text-slate-300">{String(item.quantity)}</td>
                          <td className="py-3 px-3 text-sm text-right text-slate-300">{formatMoney(parseFloat(String(item.unit_price)), currency)}</td>
                          <td className="py-3 px-3 text-sm text-right text-slate-300">{formatMoney(parseFloat(String(item.discount || 0)), currency)}</td>
                          <td className="py-3 px-3 text-sm text-right text-slate-300">{String(item.tax_rate)}%</td>
                          <td className="py-3 px-3 text-sm text-right text-white font-medium">{formatMoney(parseFloat(String(item.line_total)), currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Payment Records</h3>
                <button onClick={() => setShowRecordPayment(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/20 transition-all cursor-pointer"
                ><Plus className="w-3 h-3" /> Record Payment</button>
              </div>
              {payments.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400">No payments recorded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((p: Record<string, unknown>) => (
                    <div key={String(p.id)} className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{formatMoney(parseFloat(String(p.amount)), String(p.currency))}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {String(p.method).replace('_', ' ')} • {new Date(String(p.payment_date)).toLocaleDateString('en-GB')}
                          {p.provider ? ` • ${String(p.provider)}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium border ${
                          p.status === 'succeeded' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          p.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>{String(p.status)}</span>
                        <span className="text-xs text-slate-500">{String(p.reconciliation_state)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'credits' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Credits & Refunds</h3>
                <button onClick={() => setShowAddCredit(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-lg text-xs font-medium hover:bg-violet-500/20 transition-all cursor-pointer"
                ><Plus className="w-3 h-3" /> Add Credit Note</button>
              </div>

              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 mt-6">Credit Notes</h4>
              {credits.length === 0 ? (
                <p className="text-sm text-slate-500 py-4">No credit notes</p>
              ) : (
                <div className="space-y-2">
                  {credits.map((c: Record<string, unknown>) => (
                    <div key={String(c.id)} className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white">{String(c.credit_reference)}</p>
                        <p className="text-xs text-slate-400">{String(c.reason)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-violet-400 font-medium">{formatMoney(parseFloat(String(c.amount)), String(c.currency))}</span>
                        <span className="text-xs text-slate-400">{String(c.status)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 mt-6">Refunds</h4>
              {refunds.length === 0 ? (
                <p className="text-sm text-slate-500 py-4">No refunds</p>
              ) : (
                <div className="space-y-2">
                  {refunds.map((r: Record<string, unknown>) => (
                    <div key={String(r.id)} className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white">{formatMoney(parseFloat(String(r.amount)), String(r.currency))}</p>
                        <p className="text-xs text-slate-400">{String(r.reason || 'No reason')}</p>
                      </div>
                      <span className="text-xs text-slate-400">{String(r.status)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'delivery' && (
            <div className="text-center py-12">
              <Send className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">Delivery status: {String(invoice.delivery_status || 'not_sent')}</p>
              <p className="text-xs text-slate-500 mt-1">Email delivery tracking is managed via the invoice reminders edge function</p>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="text-center py-12">
              <Paperclip className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No files attached</p>
              <p className="text-xs text-slate-500 mt-1">Upload receipts, POs, or supporting documents</p>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="text-center py-12">
              <Activity className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">Activity timeline</p>
              <p className="text-xs text-slate-500 mt-1">Status changes and payment events will appear here</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Invoice Status</h3>
                <div className="flex flex-wrap gap-2">
                  {['draft','awaiting_approval','approved','issued','overdue','paid','disputed','cancelled','written_off','archived'].map(s => (
                    <button key={s} onClick={() => handleStatusChange(s)}
                      disabled={s === status}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer whitespace-nowrap ${
                        s === status ? STATUS_COLORS[s] || '' : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20'
                      } disabled:opacity-60`}
                    >{STATUS_LABELS[s] || s}</button>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
                <h3 className="text-sm font-semibold text-white mb-3">Timestamps</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Created', invoice.created_at],
                    ['Updated', invoice.updated_at],
                    ['Approved', invoice.approved_at],
                    ['Issued', invoice.issued_at],
                    ['Paid', invoice.paid_at],
                    ['Cancelled', invoice.cancelled_at],
                    ['Written Off', invoice.written_off_at],
                    ['Archived', invoice.archived_at],
                  ].map(([label, val]) => val != null ? (
                    <div key={String(label)} className="flex justify-between py-1">
                      <span className="text-xs text-slate-400">{String(label)}</span>
                      <span className="text-xs text-slate-300">{new Date(String(val)).toLocaleString('en-GB')}</span>
                    </div>
                  ) : null)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showRecordPayment && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowRecordPayment(false)}>
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Record Payment</h3>
              <button onClick={() => setShowRecordPayment(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 cursor-pointer"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Amount ({currency})</label>
                <input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00" step="0.01" min="0" max={amountOutstanding}
                  className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Method</label>
                <select value={paymentForm.method} onChange={(e) => setPaymentForm(prev => ({ ...prev, method: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none pr-8"
                >
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Payment Date</label>
                <input type="date" value={paymentForm.payment_date} onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Provider (for Stripe payments)</label>
                <input type="text" value={paymentForm.provider} onChange={(e) => setPaymentForm(prev => ({ ...prev, provider: e.target.value }))}
                  placeholder="e.g., stripe" className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Confirmation Note</label>
                <input type="text" value={paymentForm.confirmation_reason} onChange={(e) => setPaymentForm(prev => ({ ...prev, confirmation_reason: e.target.value }))}
                  placeholder="e.g., Bank transfer reference ABC123" className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowRecordPayment(false)} className="flex-1 py-3 bg-white/5 text-slate-400 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap">Cancel</button>
                <button onClick={handleRecordPayment} disabled={submitting}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >{submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Payment'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddCredit && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddCredit(false)}>
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Add Credit Note</h3>
              <button onClick={() => setShowAddCredit(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 cursor-pointer"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Reason</label>
                <input type="text" value={creditForm.reason} onChange={(e) => setCreditForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g., Service credit for downtime" className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Amount ({currency})</label>
                <input type="number" value={creditForm.amount} onChange={(e) => setCreditForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00" step="0.01" min="0" className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Notes</label>
                <textarea value={creditForm.notes} onChange={(e) => setCreditForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Internal notes" rows={2} maxLength={500}
                  className="w-full px-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAddCredit(false)} className="flex-1 py-3 bg-white/5 text-slate-400 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap">Cancel</button>
                <button onClick={handleAddCredit} disabled={submitting}
                  className="flex-1 py-3 bg-violet-500 text-white rounded-xl text-sm font-semibold hover:bg-violet-600 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >{submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Add Credit Note'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showStatusReason && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowStatusReason(null)}>
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white">Reason Required</h3>
            </div>
            <p className="text-sm text-slate-400 mb-4">This status change ({STATUS_LABELS[showStatusReason] || showStatusReason}) requires a reason for the audit log.</p>
            <textarea value={statusReason} onChange={(e) => setStatusReason(e.target.value)}
              placeholder="Enter reason..." rows={3} maxLength={500}
              className="w-full px-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowStatusReason(null); setStatusReason(''); }} className="flex-1 py-2.5 bg-white/5 text-slate-400 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap">Cancel</button>
              <button onClick={() => handleStatusChange(showStatusReason)} disabled={!statusReason.trim()}
                className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >Confirm</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
