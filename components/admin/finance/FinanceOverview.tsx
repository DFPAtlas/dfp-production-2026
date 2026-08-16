'use client';

import { motion } from '@/components/motion';
import { useFinanceOverview } from '@/hooks/useFinanceData';
import { FileText, Clock, Send, AlertTriangle, CheckCircle, XCircle, Receipt, AlertCircle } from 'lucide-react';

export default function FinanceOverview() {
  const stats = useFinanceOverview();

  if (stats.loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5 animate-pulse">
            <div className="h-4 w-20 bg-white/5 rounded mb-3" />
            <div className="h-8 w-12 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    { label: 'Draft Invoices', value: stats.draftCount, color: '#94A3B8', Icon: FileText },
    { label: 'Awaiting Approval', value: stats.awaitingApprovalCount, color: '#60A5FA', Icon: Clock },
    { label: 'Issued', value: stats.issuedCount, color: '#22D3EE', Icon: Send },
    { label: 'Overdue', value: stats.overdueCount, color: '#F87171', Icon: AlertTriangle, sub: stats.overdueAmountGb > 0 ? `£${stats.overdueAmountGb.toLocaleString()}` : undefined },
    { label: 'Outstanding', value: `£${Math.round(stats.outstandingAmountGb).toLocaleString()}`, color: '#FBBF24', Icon: AlertCircle },
    { label: 'Payments Received', value: stats.paymentsReceivedCount, color: '#34D399', Icon: CheckCircle, sub: stats.paymentsReceivedAmount > 0 ? `£${Math.round(stats.paymentsReceivedAmount).toLocaleString()}` : undefined },
    { label: 'Failed Payments', value: stats.failedPaymentCount, color: '#F87171', Icon: XCircle },
    { label: 'Expenses to Review', value: stats.expensesAwaitingReview, color: '#A78BFA', Icon: Receipt },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5 hover:border-white/15 transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: card.color + '15' }}>
              <card.Icon className="w-4 h-4" style={{ color: card.color }} />
            </div>
            <span className="text-xs text-slate-400">{card.label}</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
          {card.sub && <p className="text-xs text-slate-400 mt-1">{card.sub}</p>}
        </motion.div>
      ))}
    </div>
  );
}