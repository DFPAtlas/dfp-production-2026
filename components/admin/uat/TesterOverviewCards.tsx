'use client';

import { motion } from '@/components/motion';
import { useWorkforceMetrics } from '@/hooks/useUatTesterData';
import { Users, UserCheck, Clock, UserPlus, AlertTriangle, DollarSign, XCircle, ShieldAlert } from 'lucide-react';

interface Props {
  onFilterClick: (filter: string) => void;
}

export default function TesterOverviewCards({ onFilterClick }: Props) {
  const metrics = useWorkforceMetrics();

  const cards = [
    { key: 'active', label: 'Active Testers', value: metrics.activeTesters, icon: UserCheck, color: '#10B981', filter: 'status:active' },
    { key: 'available', label: 'Available Now', value: metrics.availableTesters, icon: Users, color: '#06B6D4', filter: 'availability:available' },
    { key: 'applicants', label: 'Applications Review', value: metrics.applicantsAwaitingReview, icon: UserPlus, color: '#8B5CF6', filter: 'onboarding:under_review' },
    { key: 'assignments', label: 'Active Assignments', value: metrics.activeAssignments, icon: Clock, color: '#3B82F6', filter: 'assignments:active' },
    { key: 'capacity', label: 'At Capacity', value: metrics.capacityReached, icon: AlertTriangle, color: '#F59E0B', filter: 'capacity:reached' },
    { key: 'restricted', label: 'Restricted/Suspended', value: metrics.restrictedTesters, icon: ShieldAlert, color: '#F97316', filter: 'status:restricted' },
    { key: 'approval', label: 'Payments Awaiting', value: metrics.paymentsAwaitingApproval, icon: DollarSign, color: '#EC4899', filter: 'payments:pending' },
    { key: 'failed', label: 'Payment Failures', value: metrics.paymentFailures, icon: XCircle, color: '#EF4444', filter: 'payments:failed' },
    { key: 'disputes', label: 'Open Disputes', value: metrics.paymentDisputes, icon: ShieldAlert, color: '#DC2626', filter: 'disputes:open' },
  ];

  if (metrics.loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-white/5 rounded w-2/3 mb-3" />
            <div className="h-7 bg-white/5 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {cards.map((card, i) => (
        <motion.button
          key={card.key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onFilterClick(card.filter)}
          className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)] rounded-xl p-4 text-left transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-2 mb-2">
            <card.icon className="w-4 h-4" style={{ color: card.color }} />
            <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">{card.label}</p>
          </div>
          <p className="text-2xl font-bold text-white">{card.value}</p>
        </motion.button>
      ))}
    </div>
  );
}