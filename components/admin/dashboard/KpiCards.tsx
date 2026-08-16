'use client';

import { motion } from '@/components/motion';
import Link from 'next/link';
import type { DashboardKpi } from '@/hooks/useDashboardData';

interface KpiCardsProps {
  kpis: DashboardKpi[];
}

const KPI_ICONS: Record<string, string> = {
  paidRevenue: 'ri-money-pound-circle-line',
  outstandingInvoices: 'ri-bill-line',
  activeProjects: 'ri-folder-chart-line',
  projectsAtRisk: 'ri-alert-line',
  newLeads: 'ri-user-add-line',
  openCriticalAlerts: 'ri-spam-2-line',
};

const KPI_COLORS: Record<string, string> = {
  paidRevenue: '#10B981',
  outstandingInvoices: '#F59E0B',
  activeProjects: '#06B6D4',
  projectsAtRisk: '#EF4444',
  newLeads: '#8B5CF6',
  openCriticalAlerts: '#F97316',
};

export default function KpiCards({ kpis }: KpiCardsProps) {
  if (kpis.length === 0) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 animate-pulse">
            <div className="w-9 h-9 rounded-xl bg-white/5 mb-3" />
            <div className="h-5 bg-white/5 rounded w-16 mb-1" />
            <div className="h-3 bg-white/5 rounded w-24" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {kpis.map((kpi, i) => {
        const color = KPI_COLORS[kpi.key] || '#06B6D4';
        const icon = KPI_ICONS[kpi.key] || 'ri-bar-chart-line';
        return (
          <motion.div
            key={kpi.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Link
              href={kpi.linkHref}
              className="block bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5 hover:border-[#06B6D4]/20 hover:shadow-md transition-all duration-300 cursor-pointer h-full"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '15' }}>
                  <i className={`${icon} text-lg`} style={{ color }} />
                </div>
              </div>
              <div className="text-2xl font-bold text-white mb-0.5">
                {kpi.isCurrency ? `£${kpi.value.toLocaleString()}` : kpi.value}
              </div>
              <div className="text-xs text-slate-400">{kpi.label}</div>
              <div className="text-[10px] text-slate-500 mt-1">{kpi.context}</div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}