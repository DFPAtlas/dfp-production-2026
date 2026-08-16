'use client';

import { motion } from '@/components/motion';
import { Shield, Mail, UserPlus, UserX, ShieldAlert, Timer, FileSearch, Users } from 'lucide-react';
import { useStaffMetrics } from '@/hooks/useStaffData';

export default function StaffStatsCards() {
  const { data, loading } = useStaffMetrics();

  const cards = [
    { key: 'activeStaff', label: 'Active Staff', value: data.activeStaff, icon: Users, color: '#06B6D4', bg: 'bg-[#06B6D4]/10', border: 'border-[#06B6D4]/20' },
    { key: 'pendingInvites', label: 'Pending Invites', value: data.pendingInvites, icon: Mail, color: '#3B82F6', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { key: 'pendingActivation', label: 'Awaiting Activation', value: data.pendingActivation, icon: UserPlus, color: '#F59E0B', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { key: 'suspended', label: 'Suspended', value: data.suspended, icon: UserX, color: '#EF4444', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    { key: 'privileged', label: 'Privileged Users', value: data.privileged, icon: ShieldAlert, color: '#8B5CF6', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { key: 'expiringTemp', label: 'Temp Access Expiring', value: data.expiringTemp, icon: Timer, color: '#F97316', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { key: 'reviewsDue', label: 'Reviews Due', value: data.reviewsDue, icon: FileSearch, color: '#EC4899', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {cards.map((card, index) => (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04 }}
          className={`bg-[#1E293B] border rounded-2xl p-4 hover:border-white/15 transition-all duration-300 ${card.border}`}
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div className={`w-8 h-8 rounded-xl ${card.bg} flex items-center justify-center`}>
              <card.icon className="w-3.5 h-3.5" style={{ color: card.color }} />
            </div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{card.label}</span>
          </div>
          <p className="text-2xl font-bold text-white" style={{ color: card.key === 'suspended' && data.suspended > 0 ? '#EF4444' : undefined }}>
            {loading ? <span className="animate-pulse text-slate-500">—</span> : card.value}
          </p>
        </motion.div>
      ))}
    </div>
  );
}