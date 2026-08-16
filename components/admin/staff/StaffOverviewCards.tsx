'use client';

import { useStaffMetrics } from '@/hooks/useStaffData';

export default function StaffOverviewCards() {
  const { data, loading } = useStaffMetrics();

  const cards = [
    { key: 'activeStaff', label: 'Active Staff', icon: 'ri-user-star-line', color: 'text-emerald-400', gradient: 'from-emerald-500/10 to-emerald-500/5', value: data.activeStaff },
    { key: 'pendingInvites', label: 'Pending Invitations', icon: 'ri-mail-send-line', color: 'text-blue-400', gradient: 'from-blue-500/10 to-blue-500/5', value: data.pendingInvites },
    { key: 'pendingActivation', label: 'Awaiting Activation', icon: 'ri-user-add-line', color: 'text-amber-400', gradient: 'from-amber-500/10 to-amber-500/5', value: data.pendingActivation },
    { key: 'suspended', label: 'Suspended Accounts', icon: 'ri-user-unfollow-line', color: 'text-red-400', gradient: 'from-red-500/10 to-red-500/5', value: data.suspended },
    { key: 'privileged', label: 'Privileged Users', icon: 'ri-shield-keyhole-line', color: 'text-purple-400', gradient: 'from-purple-500/10 to-purple-500/5', value: data.privileged },
    { key: 'expiringTemp', label: 'Temp Access Expiring', icon: 'ri-timer-line', color: 'text-orange-400', gradient: 'from-orange-500/10 to-orange-500/5', value: data.expiringTemp },
    { key: 'reviewsDue', label: 'Reviews Due', icon: 'ri-file-search-line', color: 'text-amber-400', gradient: 'from-amber-500/10 to-amber-500/5', value: data.reviewsDue },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
      {cards.map((card) => (
        <div
          key={card.key}
          className={`relative bg-gradient-to-br ${card.gradient} border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all cursor-pointer`}
        >
          <div className="flex items-center gap-2 mb-2">
            <i className={`${card.icon} ${card.color} text-sm w-4 h-4 flex items-center justify-center`}></i>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{card.label}</span>
          </div>
          <div className={`text-2xl font-bold ${card.color}`}>
            {loading ? <span className="animate-pulse">—</span> : card.value}
          </div>
        </div>
      ))}
    </div>
  );
}