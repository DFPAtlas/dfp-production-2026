'use client';

import { DollarSign, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  total: number | null;
  amount_outstanding: number | null;
  status: string;
  due_date: string | null;
  issue_date: string | null;
  currency: string;
}

export default function ProjectInvoicesTab({
  invoices,
  loading,
  error,
  onRetry,
}: {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid': return { bg: 'bg-[#10B981]/10', text: 'text-[#10B981]', label: 'Paid' };
      case 'overdue': return { bg: 'bg-[#EF4444]/10', text: 'text-[#EF4444]', label: 'Overdue' };
      case 'sent': case 'pending': return { bg: 'bg-[#F59E0B]/10', text: 'text-[#F59E0B]', label: 'Pending' };
      case 'draft': return { bg: 'bg-white/5', text: 'text-slate-400', label: 'Draft' };
      case 'cancelled': case 'void': return { bg: 'bg-white/5', text: 'text-slate-500', label: 'Cancelled' };
      default: return { bg: 'bg-white/5', text: 'text-slate-400', label: status };
    }
  };

  const formatAmount = (invoice: Invoice): string => {
    const amt = invoice.total || invoice.amount || 0;
    const curr = invoice.currency || 'GBP';
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: curr }).format(Number(amt));
  };

  const today = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5" />
              <div className="flex-1"><div className="h-4 bg-white/5 rounded w-1/2 mb-2" /><div className="h-3 bg-white/5 rounded w-1/3" /></div>
              <div className="w-24 h-8 bg-white/5 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-10 h-10 text-[#F59E0B] mx-auto mb-3" />
          <p className="text-slate-300 font-medium mb-1">Could not load invoices</p>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <button onClick={onRetry}
            className="px-4 py-2 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl">
        <div className="text-center py-16">
          <DollarSign className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-300 font-medium mb-1">No invoices yet</p>
          <p className="text-sm text-slate-500">Invoices for this project will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
      <div className="divide-y divide-[rgba(255,255,255,0.04)]">
        {invoices.map(inv => {
          const statusStyle = getStatusStyle(inv.status);
          const isOverdue = inv.due_date && inv.due_date < today && inv.status !== 'paid' && inv.status !== 'cancelled';
          return (
            <div key={inv.id} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${statusStyle.bg}`}>
                  <DollarSign className="w-5 h-5" style={{ color: statusStyle.text.replace('text-', '') === '[#10B981]' ? '#10B981' : statusStyle.text === 'text-[#F59E0B]' ? '#F59E0B' : statusStyle.text === 'text-[#EF4444]' ? '#EF4444' : undefined }} />
                </div>
                <div>
                  <p className="font-medium text-white">{inv.invoice_number}</p>
                  <p className={`text-xs ${isOverdue ? 'text-[#EF4444] font-medium' : 'text-slate-400'}`}>
                    {inv.due_date
                      ? `Due ${new Date(inv.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      : 'No due date'}
                    {isOverdue && ' · Overdue'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-300">{formatAmount(inv)}</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                  {statusStyle.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}