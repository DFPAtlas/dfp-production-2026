'use client';

import { motion } from '@/components/motion';
import { Users, Mail, CheckCircle, TrendingUp } from 'lucide-react';

interface AdminLeadsStatsProps {
  total: number;
  newCount: number;
  contactedCount: number;
  qualifiedCount: number;
}

export default function AdminLeadsStats({ total, newCount, contactedCount, qualifiedCount }: AdminLeadsStatsProps) {
  const stats = [
    { label: 'Total Leads', value: total, icon: Users, color: '#06B6D4', bg: 'bg-[#06B6D4]/8', border: 'border-[#06B6D4]/15' },
    { label: 'New', value: newCount, icon: TrendingUp, color: '#3B82F6', bg: 'bg-blue-500/10', border: 'border-blue-500/15' },
    { label: 'Contacted', value: contactedCount, icon: Mail, color: '#F59E0B', bg: 'bg-amber-500/10', border: 'border-amber-500/15' },
    { label: 'Qualified', value: qualifiedCount, icon: CheckCircle, color: '#10B981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/15' },
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
            <span className="text-xs text-slate-400">{stat.label}</span>
            <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
              <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{stat.value}</p>
        </motion.div>
      ))}
    </div>
  );
}