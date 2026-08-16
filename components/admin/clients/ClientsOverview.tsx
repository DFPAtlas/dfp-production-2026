'use client';

import { motion } from '@/components/motion';
import { Users, UserCheck, UserPlus, AlertTriangle, Clock, ShieldAlert, FileText, UserX } from 'lucide-react';

interface ClientsOverviewProps {
  total: number;
  activeCount: number;
  onboardingCount: number;
  attentionCount: number;
  withoutManager: number;
  overdueTasksCount: number;
  openIssuesCount: number;
  unpaidInvoicesCount: number;
  recentCount: number;
  archivedCount: number;
}

export default function ClientsOverview({
  total, activeCount, onboardingCount, attentionCount,
  withoutManager, overdueTasksCount, openIssuesCount,
  unpaidInvoicesCount, recentCount, archivedCount,
}: ClientsOverviewProps) {
  const stats = [
    { label: 'Total Clients', value: total, icon: Users, color: '#06B6D4', bg: 'bg-[#06B6D4]/10', border: 'border-[#06B6D4]/20' },
    { label: 'Active', value: activeCount, icon: UserCheck, color: '#10B981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'Onboarding', value: onboardingCount, icon: UserPlus, color: '#3B82F6', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { label: 'Need Attention', value: attentionCount, icon: AlertTriangle, color: '#EF4444', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    { label: 'No Account Mgr', value: withoutManager, icon: ShieldAlert, color: '#F59E0B', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { label: 'Overdue Tasks', value: overdueTasksCount, icon: Clock, color: '#F97316', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { label: 'Open Issues', value: openIssuesCount, icon: FileText, color: '#8B5CF6', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { label: 'Archived', value: archivedCount, icon: UserX, color: '#94A3B8', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`bg-[#1E293B] border rounded-2xl p-5 hover:border-white/15 transition-all duration-300 ${stat.border}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
              <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mb-0.5">{stat.value}</p>
          <p className="text-xs text-slate-400">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
}