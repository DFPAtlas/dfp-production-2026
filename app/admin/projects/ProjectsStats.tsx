'use client';

import { motion } from '@/components/motion';
import { Layers, Activity, CheckCircle, PoundSterling, TrendingUp } from 'lucide-react';

interface ProjectsStatsProps {
  total: number;
  active: number;
  completed: number;
  totalBudget: number;
  totalPaid: number;
}

export default function ProjectsStats({ total, active, completed, totalBudget, totalPaid }: ProjectsStatsProps) {
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const paymentRate = totalBudget > 0 ? Math.round((totalPaid / totalBudget) * 100) : 0;

  const stats = [
    { label: 'Total Projects', value: total, icon: Layers, color: '#06B6D4', bg: 'bg-[#06B6D4]/8', border: 'border-[#06B6D4]/15' },
    { label: 'Active Projects', value: active, icon: Activity, color: '#10B981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/15' },
    { label: 'Completed', value: completed, icon: CheckCircle, color: '#3B82F6', bg: 'bg-blue-500/10', border: 'border-blue-500/15', subtitle: `${completionRate}% completion rate` },
    { label: 'Total Budget', value: `£${totalBudget.toLocaleString()}`, icon: PoundSterling, color: '#F59E0B', bg: 'bg-amber-500/10', border: 'border-amber-500/15' },
    { label: 'Total Paid', value: `£${totalPaid.toLocaleString()}`, icon: TrendingUp, color: '#10B981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/15', subtitle: `${paymentRate}% collected` },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`bg-[#1E293B] border rounded-2xl p-5 hover:border-white/15 transition-all duration-300 ${stat.border}`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
              <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
            </div>
          </div>
          <div>
            <p className="text-xl font-bold text-white mb-0.5">{stat.value}</p>
            <p className="text-xs text-slate-400">{stat.label}</p>
            {stat.subtitle && (
              <p className="text-[10px] text-slate-500 mt-1">{stat.subtitle}</p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}