'use client';

import { motion } from '@/components/motion';
import { Target, Clock, CheckCircle, PoundSterling } from 'lucide-react';

interface MilestonesStatsProps {
  total: number;
  pending: number;
  completed: number;
  totalValue: number;
  paidValue: number;
}

export default function MilestonesStats({ total, pending, completed, totalValue, paidValue }: MilestonesStatsProps) {
  const stats = [
    { label: 'Total Milestones', value: total, icon: Target, color: '#06B6D4', bg: 'bg-[#06B6D4]/8', border: 'border-[#06B6D4]/15' },
    { label: 'Pending', value: pending, icon: Clock, color: '#F59E0B', bg: 'bg-amber-500/10', border: 'border-amber-500/15' },
    { label: 'Completed', value: completed, icon: CheckCircle, color: '#10B981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/15' },
    { label: 'Total Value', value: `£${totalValue.toLocaleString()}`, icon: PoundSterling, color: '#8B5CF6', bg: 'bg-purple-500/10', border: 'border-purple-500/15' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`bg-[#1E293B] border rounded-2xl p-5 hover:border-white/15 transition-all duration-300 ${stat.border}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
              <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
            </div>
          </div>
          <p className="text-xl font-bold text-white mb-0.5">{stat.value}</p>
          <p className="text-xs text-slate-400">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
}